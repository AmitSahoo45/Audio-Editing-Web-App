import { encodeWav } from './pcm';

function resampleLinear(src: Float32Array, fromRate: number, toRate: number): Float32Array {
    if (fromRate === toRate || src.length === 0) {
        return src;
    }
    const ratio = fromRate / toRate;
    const outLen = Math.max(1, Math.round(src.length * toRate / fromRate));
    const out = new Float32Array(outLen);
    const last = src.length - 1;
    for (let i = 0; i < outLen; i++) {
        const pos = i * ratio;
        const i0 = Math.min(Math.floor(pos), last);
        const i1 = Math.min(i0 + 1, last);
        const frac = pos - Math.floor(pos);
        out[i] = src[i0] * (1 - frac) + src[i1] * frac;
    }
    return out;
}

function toTargetChannels(
    buffer: AudioBuffer,
    targetChannels: number,
    sampleRate: number
): Float32Array[] {
    const channels: Float32Array[] = [];
    const n = buffer.numberOfChannels;

    if (targetChannels === 1) {
        if (n === 1) {
            channels.push(resampleLinear(buffer.getChannelData(0), buffer.sampleRate, sampleRate));
        } else {
            const len = buffer.length;
            const mono = new Float32Array(len);
            for (let i = 0; i < len; i++) {
                let sum = 0;
                for (let ch = 0; ch < n; ch++) {
                    sum += buffer.getChannelData(ch)[i];
                }
                mono[i] = sum / n;
            }
            channels.push(resampleLinear(mono, buffer.sampleRate, sampleRate));
        }
    } else {
        // stereo (cap at 2)
        if (n === 1) {
            const L = resampleLinear(buffer.getChannelData(0), buffer.sampleRate, sampleRate);
            channels.push(L, L);
        } else {
            const L = resampleLinear(buffer.getChannelData(0), buffer.sampleRate, sampleRate);
            if (n === 2) {
                channels.push(
                    L,
                    resampleLinear(buffer.getChannelData(1), buffer.sampleRate, sampleRate)
                );
            } else {
                const len = buffer.length;
                const R = new Float32Array(len);
                for (let i = 0; i < len; i++) {
                    let sum = 0;
                    for (let ch = 1; ch < n; ch++) {
                        sum += buffer.getChannelData(ch)[i];
                    }
                    R[i] = sum / (n - 1);
                }
                channels.push(L, resampleLinear(R, buffer.sampleRate, sampleRate));
            }
        }
    }

    return channels;
}

export class AudioProcessor {
    private audioContext: AudioContext

    constructor(audioContext: AudioContext) {
        this.audioContext = audioContext
    }

    async loadAudioFile(file: File): Promise<AudioBuffer> {
        if (!file || file.size === 0) {
            throw new Error('The selected file is empty or invalid.');
        }

        let arrayBuffer: ArrayBuffer;
        try {
            arrayBuffer = await file.arrayBuffer();
        } catch {
            throw new Error('Failed to read the audio file. It may be corrupted.');
        }

        try {
            return await this.audioContext.decodeAudioData(arrayBuffer);
        } catch {
            throw new Error(
                `Unable to decode "${file.name}". The file may be corrupted or in an unsupported format.`
            );
        }
    }

    trimAudio(
        audioBuffer: AudioBuffer,
        startTime: number,
        endTime: number
    ): AudioBuffer {
        const sampleRate = audioBuffer.sampleRate
        const duration = audioBuffer.duration
        const start = Math.max(0, Math.min(startTime, duration))
        const end = Math.max(0, Math.min(endTime, duration))
        let startSample = Math.floor(start * sampleRate)
        let endSample = Math.floor(end * sampleRate)
        startSample = Math.max(0, Math.min(startSample, audioBuffer.length))
        endSample = Math.max(0, Math.min(endSample, audioBuffer.length))

        if (endSample <= startSample) {
            throw new Error('Invalid trim range')
        }

        const length = endSample - startSample

        const trimmedBuffer = this.audioContext.createBuffer(
            audioBuffer.numberOfChannels,
            length,
            sampleRate
        )

        for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
            const sourceData = audioBuffer.getChannelData(channel);
            const targetData = trimmedBuffer.getChannelData(channel)

            for (let i = 0; i < length; i++)
                targetData[i] = sourceData[startSample + i];
        }

        return trimmedBuffer
    }

    mergeAudioBuffers(buffers: AudioBuffer[]): AudioBuffer {
        if (buffers.length === 0)
            throw new Error('No buffers to merge');

        const sampleRate = Math.max(...buffers.map((b) => b.sampleRate));
        const maxChannels = Math.max(...buffers.map((b) => b.numberOfChannels));
        const numberOfChannels = maxChannels >= 2 ? 2 : 1;

        const prepared = buffers.map((buffer) =>
            toTargetChannels(buffer, numberOfChannels, sampleRate)
        );

        const totalLength = prepared.reduce((sum, chs) => sum + chs[0].length, 0);

        const mergedBuffer = this.audioContext.createBuffer(
            numberOfChannels,
            totalLength,
            sampleRate
        );

        let offset = 0;
        for (const channelData of prepared) {
            for (let channel = 0; channel < numberOfChannels; channel++) {
                mergedBuffer.getChannelData(channel).set(channelData[channel], offset);
            }
            offset += channelData[0].length;
        }

        return mergedBuffer;
    }

    normalizeAudio(audioBuffer: AudioBuffer): AudioBuffer {
        const normalized = this.audioContext.createBuffer(
            audioBuffer.numberOfChannels,
            audioBuffer.length,
            audioBuffer.sampleRate
        );

        for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
            const sourceData = audioBuffer.getChannelData(channel);
            const targetData = normalized.getChannelData(channel);

            let peak = 0;
            for (let i = 0; i < sourceData.length; i++)
                peak = Math.max(peak, Math.abs(sourceData[i]));

            const factor = peak > 0 ? 1 / peak : 1;
            for (let i = 0; i < sourceData.length; i++)
                targetData[i] = sourceData[i] * factor;
        }

        return normalized;
    }

    async audioBufferToWav(audioBuffer: AudioBuffer): Promise<Blob> {
        const channels: Float32Array[] = [];
        for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
            channels.push(audioBuffer.getChannelData(channel));
        }
        return encodeWav(channels, audioBuffer.sampleRate);
    }
}
