import lamejs from 'lamejs';
import { saveAs } from 'file-saver';
import { encodeWav, floatToInt16Sample } from './pcm';

export interface ExportOptions {
    /** MP3 bitrate in kbps (default 128) */
    bitrate?: number;
    /** Target sample rate in Hz (default: source sample rate) */
    sampleRate?: number;
}

export class AudioEncoder {
    static async exportToMP3(
        audioBuffer: AudioBuffer,
        fileName: string = 'audio.mp3',
        options: ExportOptions = {}
    ): Promise<void> {
        const bitrate = options.bitrate ?? 128;
        const targetSR = options.sampleRate ?? audioBuffer.sampleRate;
        const resampled =
            targetSR !== audioBuffer.sampleRate
                ? await this.resample(audioBuffer, targetSR)
                : audioBuffer;

        const { left, right, channels } = this.downmixForMp3(resampled);

        const mp3encoder = new lamejs.Mp3Encoder(
            channels,
            resampled.sampleRate,
            bitrate
        )

        const mp3Data: Int8Array[] = [];
        const sampleBlockSize = 1152;

        if (channels === 1) {
            const samples = this.convertFloat32ToInt16(left);

            for (let i = 0; i < samples.length; i += sampleBlockSize) {
                const sampleChunk = samples.subarray(i, i + sampleBlockSize);
                const mp3buf = mp3encoder.encodeBuffer(sampleChunk);
                if (mp3buf.length > 0) {
                    mp3Data.push(mp3buf);
                }
            }
        } else {
            const leftI16 = this.convertFloat32ToInt16(left);
            const rightI16 = this.convertFloat32ToInt16(right!);

            for (let i = 0; i < leftI16.length; i += sampleBlockSize) {
                const leftChunk = leftI16.subarray(i, i + sampleBlockSize);
                const rightChunk = rightI16.subarray(i, i + sampleBlockSize);
                const mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
                if (mp3buf.length > 0) {
                    mp3Data.push(mp3buf);
                }
            }
        }
        const mp3buf = mp3encoder.flush();
        if (mp3buf.length > 0) {
            mp3Data.push(mp3buf);
        }

        const blob = new Blob(mp3Data as unknown as BlobPart[], {
            type: 'audio/mpeg',
        });
        saveAs(blob, fileName);
    }

    static async exportToWAV(
        audioBuffer: AudioBuffer,
        fileName: string = 'audio.wav',
        options: ExportOptions = {}
    ): Promise<void> {
        const targetSR = options.sampleRate ?? audioBuffer.sampleRate;
        const resampled =
            targetSR !== audioBuffer.sampleRate
                ? await this.resample(audioBuffer, targetSR)
                : audioBuffer;

        const channels: Float32Array[] = [];
        for (let ch = 0; ch < resampled.numberOfChannels; ch++) {
            channels.push(resampled.getChannelData(ch));
        }
        const blob = encodeWav(channels, resampled.sampleRate);
        saveAs(blob, fileName);
    }

    /** Resample an AudioBuffer to a different sample rate using OfflineAudioContext. */
    private static async resample(buffer: AudioBuffer, targetSR: number): Promise<AudioBuffer> {
        const ratio = targetSR / buffer.sampleRate;
        const newLength = Math.round(buffer.length * ratio);

        const offline = new OfflineAudioContext(
            buffer.numberOfChannels,
            newLength,
            targetSR
        );

        const source = offline.createBufferSource();
        source.buffer = buffer;
        source.connect(offline.destination);
        source.start(0);

        return offline.startRendering();
    }

    /**
     * Downmix to mono (1 ch) or stereo (2 ch) for lamejs.
     * 1 → mono; else L = ch0, R = ch1 if stereo else average of remaining channels.
     */
    private static downmixForMp3(buffer: AudioBuffer): {
        left: Float32Array;
        right: Float32Array | null;
        channels: 1 | 2;
    } {
        const n = buffer.numberOfChannels;
        if (n === 1) {
            return { left: buffer.getChannelData(0), right: null, channels: 1 };
        }

        const left = buffer.getChannelData(0);
        if (n === 2) {
            return { left, right: buffer.getChannelData(1), channels: 2 };
        }

        const len = buffer.length;
        const right = new Float32Array(len);
        for (let i = 0; i < len; i++) {
            let sum = 0;
            for (let ch = 1; ch < n; ch++) {
                sum += buffer.getChannelData(ch)[i];
            }
            right[i] = sum / (n - 1);
        }
        return { left, right, channels: 2 };
    }

    private static convertFloat32ToInt16(buffer: Float32Array): Int16Array {
        const l = buffer.length;
        const buf = new Int16Array(l);
        for (let i = 0; i < l; i++) {
            buf[i] = floatToInt16Sample(buffer[i]);
        }
        return buf;
    }
}
