/**
 * Client-side noise reduction using Web Audio API DSP.
 * Provides: hum removal, click repair, de-essing, and room-tone / noise-gate.
 */

export type NoiseReductionMode = 'hum' | 'click' | 'deess' | 'room';

export interface NoiseReductionOptions {
    /** Hum removal: base frequency in Hz (50 for EU, 60 for US) */
    humFrequency?: 50 | 60;
    /** Hum removal: number of harmonics to notch (default 4) */
    humHarmonics?: number;
    /** Click repair: sensitivity threshold 0-1 (default 0.5) */
    clickSensitivity?: number;
    /** De-essing: threshold in dB above which sibilance is reduced (default -20) */
    deessThreshold?: number;
    /** De-essing: frequency above which sibilance is attenuated (default 4000) */
    deessFrequency?: number;
    /** Room-tone / noise gate: gate threshold 0-1 (default 0.02) */
    gateThreshold?: number;
    /** Room-tone: attack time in seconds (default 0.005) */
    gateAttack?: number;
    /** Room-tone: release time in seconds (default 0.05) */
    gateRelease?: number;
}

const DEFAULT_OPTIONS: Required<NoiseReductionOptions> = {
    humFrequency: 60,
    humHarmonics: 4,
    clickSensitivity: 0.5,
    deessThreshold: -20,
    deessFrequency: 4000,
    gateThreshold: 0.02,
    gateAttack: 0.005,
    gateRelease: 0.05,
};

export class NoiseReduction {
    private ctx: AudioContext;

    constructor(audioContext: AudioContext) {
        this.ctx = audioContext;
    }

    /**
     * Run selected noise-reduction mode on an AudioBuffer and return a new buffer.
     */
    async process(
        buffer: AudioBuffer,
        mode: NoiseReductionMode,
        opts: NoiseReductionOptions = {}
    ): Promise<AudioBuffer> {
        const o = { ...DEFAULT_OPTIONS, ...opts };

        switch (mode) {
            case 'hum':
                return this.removeHum(buffer, o);
            case 'click':
                return this.repairClicks(buffer, o);
            case 'deess':
                return this.deess(buffer, o);
            case 'room':
                return this.removeRoomTone(buffer, o);
            default:
                return buffer;
        }
    }

    /* ── Hum removal ─────────────────────────────────────────────────── */
    /** Apply notch filters at the hum fundamental and its harmonics. */
    private async removeHum(
        buffer: AudioBuffer,
        opts: Required<NoiseReductionOptions>
    ): Promise<AudioBuffer> {
        const offline = new OfflineAudioContext(
            buffer.numberOfChannels,
            buffer.length,
            buffer.sampleRate
        );

        const source = offline.createBufferSource();
        source.buffer = buffer;

        // Chain notch filters for fundamental + harmonics
        let lastNode: AudioNode = source;
        for (let h = 1; h <= opts.humHarmonics; h++) {
            const notch = offline.createBiquadFilter();
            notch.type = 'notch';
            notch.frequency.value = opts.humFrequency * h;
            notch.Q.value = 30; // narrow notch
            lastNode.connect(notch);
            lastNode = notch;
        }

        lastNode.connect(offline.destination);
        source.start(0);
        return offline.startRendering();
    }

    /* ── Click repair ────────────────────────────────────────────────── */
    /** Detect clicks (sudden transients) and replace them with interpolated samples. */
    private async repairClicks(
        buffer: AudioBuffer,
        opts: Required<NoiseReductionOptions>
    ): Promise<AudioBuffer> {
        const out = this.ctx.createBuffer(
            buffer.numberOfChannels,
            buffer.length,
            buffer.sampleRate
        );

        // sensitivity maps to a multiplier on the local RMS threshold
        const thresholdMultiplier = 2 + (1 - opts.clickSensitivity) * 8;
        const windowSize = 64;

        for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
            const src = buffer.getChannelData(ch);
            const dst = out.getChannelData(ch);
            dst.set(src);

            for (let i = windowSize; i < src.length - windowSize; i++) {
                // Compute local RMS in surrounding window
                let sum = 0;
                for (let j = i - windowSize; j < i + windowSize; j++) {
                    sum += src[j] * src[j];
                }
                const rms = Math.sqrt(sum / (windowSize * 2));
                const threshold = rms * thresholdMultiplier;

                // If sample exceeds threshold, it's likely a click
                if (Math.abs(src[i]) > threshold && threshold > 0.001) {
                    // Linear interpolation from surrounding clean samples
                    const halfRepair = 4;
                    const before = src[Math.max(0, i - halfRepair)];
                    const after = src[Math.min(src.length - 1, i + halfRepair)];
                    dst[i] = (before + after) / 2;
                }
            }
        }

        return out;
    }

    /* ── De-essing ───────────────────────────────────────────────────── */
    /** Reduce harsh sibilance above a frequency threshold using offline rendering. */
    private async deess(
        buffer: AudioBuffer,
        opts: Required<NoiseReductionOptions>
    ): Promise<AudioBuffer> {
        const offline = new OfflineAudioContext(
            buffer.numberOfChannels,
            buffer.length,
            buffer.sampleRate
        );

        const source = offline.createBufferSource();
        source.buffer = buffer;

        // Create a high-shelf filter to attenuate high frequencies
        const highShelf = offline.createBiquadFilter();
        highShelf.type = 'highshelf';
        highShelf.frequency.value = opts.deessFrequency;
        // Convert threshold to a gain reduction: more negative threshold = less reduction
        const reductionDb = Math.min(0, opts.deessThreshold * 0.3);
        highShelf.gain.value = reductionDb;

        // Create a gentle low-pass to further smooth the harshness
        const lowPass = offline.createBiquadFilter();
        lowPass.type = 'lowpass';
        lowPass.frequency.value = opts.deessFrequency * 3;
        lowPass.Q.value = 0.5;

        source.connect(highShelf);
        highShelf.connect(lowPass);
        lowPass.connect(offline.destination);

        source.start(0);
        return offline.startRendering();
    }

    /* ── Room-tone / noise gate ──────────────────────────────────────── */
    /** Apply a noise gate to silence low-level room noise. */
    private async removeRoomTone(
        buffer: AudioBuffer,
        opts: Required<NoiseReductionOptions>
    ): Promise<AudioBuffer> {
        const out = this.ctx.createBuffer(
            buffer.numberOfChannels,
            buffer.length,
            buffer.sampleRate
        );

        const attackSamples = Math.floor(opts.gateAttack * buffer.sampleRate);
        const releaseSamples = Math.floor(opts.gateRelease * buffer.sampleRate);
        const threshold = opts.gateThreshold;

        for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
            const src = buffer.getChannelData(ch);
            const dst = out.getChannelData(ch);

            let gateOpen = false;
            let envelope = 0;
            const rmsWindow = 256;

            for (let i = 0; i < src.length; i++) {
                // Compute local RMS level
                let sum = 0;
                const start = Math.max(0, i - rmsWindow);
                const end = Math.min(src.length, i + rmsWindow);
                for (let j = start; j < end; j++) {
                    sum += src[j] * src[j];
                }
                const rms = Math.sqrt(sum / (end - start));

                // Gate logic
                if (rms > threshold) {
                    gateOpen = true;
                } else if (rms < threshold * 0.5) {
                    gateOpen = false;
                }

                // Smooth envelope
                if (gateOpen) {
                    envelope = Math.min(1, envelope + 1 / Math.max(1, attackSamples));
                } else {
                    envelope = Math.max(0, envelope - 1 / Math.max(1, releaseSamples));
                }

                dst[i] = src[i] * envelope;
            }
        }

        return out;
    }
}
