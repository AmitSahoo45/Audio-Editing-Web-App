/**
 * Web Worker for offloading heavy audio processing from the main thread.
 *
 * Supported operations:
 *  - trim:      Extract a time range from raw audio channel data.
 *  - normalize: Peak-normalize each channel to 0 dBFS.
 *  - toWav:     Encode raw channel data as a WAV Blob.
 */

export type WorkerRequest =
    | { type: 'trim'; channels: Float32Array[]; sampleRate: number; startTime: number; endTime: number }
    | { type: 'normalize'; channels: Float32Array[]; sampleRate: number }
    | { type: 'toWav'; channels: Float32Array[]; sampleRate: number };

export type WorkerResponse =
    | { type: 'result'; channels: Float32Array[]; sampleRate: number }
    | { type: 'wavResult'; blob: Blob }
    | { type: 'error'; message: string };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ctx = self as any;

ctx.onmessage = (e: MessageEvent<WorkerRequest>) => {
    try {
        const msg = e.data;

        switch (msg.type) {
            case 'trim': {
                const { channels, sampleRate, startTime, endTime } = msg;
                const startSample = Math.floor(startTime * sampleRate);
                const endSample = Math.floor(endTime * sampleRate);
                const length = endSample - startSample;

                const trimmed: Float32Array[] = channels.map((ch) => {
                    const out = new Float32Array(length);
                    for (let i = 0; i < length; i++) {
                        out[i] = ch[startSample + i];
                    }
                    return out;
                });

                ctx.postMessage(
                    { type: 'result', channels: trimmed, sampleRate } as WorkerResponse,
                    trimmed.map(c => c.buffer) as unknown as Transferable[]
                );
                break;
            }

            case 'normalize': {
                const { channels, sampleRate } = msg;

                const normalized: Float32Array[] = channels.map((ch) => {
                    let peak = 0;
                    for (let i = 0; i < ch.length; i++) {
                        peak = Math.max(peak, Math.abs(ch[i]));
                    }
                    const factor = peak > 0 ? 1 / peak : 1;
                    const out = new Float32Array(ch.length);
                    for (let i = 0; i < ch.length; i++) {
                        out[i] = ch[i] * factor;
                    }
                    return out;
                });

                ctx.postMessage(
                    { type: 'result', channels: normalized, sampleRate } as WorkerResponse,
                    normalized.map(c => c.buffer) as unknown as Transferable[]
                );
                break;
            }

            case 'toWav': {
                const { channels, sampleRate } = msg;
                const numberOfChannels = channels.length;
                const length = channels[0].length;
                const bitDepth = 16;
                const bytesPerSample = bitDepth / 8;
                const blockAlign = numberOfChannels * bytesPerSample;

                const interleaved = new Float32Array(length * numberOfChannels);
                for (let ch = 0; ch < numberOfChannels; ch++) {
                    const channelData = channels[ch];
                    for (let i = 0; i < length; i++) {
                        interleaved[i * numberOfChannels + ch] = channelData[i];
                    }
                }

                const dataLength = interleaved.length * bytesPerSample;
                const buffer = new ArrayBuffer(44 + dataLength);
                const view = new DataView(buffer);

                writeString(view, 0, 'RIFF');
                view.setUint32(4, 36 + dataLength, true);
                writeString(view, 8, 'WAVE');
                writeString(view, 12, 'fmt ');
                view.setUint32(16, 16, true);
                view.setUint16(20, 1, true); // PCM
                view.setUint16(22, numberOfChannels, true);
                view.setUint32(24, sampleRate, true);
                view.setUint32(28, sampleRate * blockAlign, true);
                view.setUint16(32, blockAlign, true);
                view.setUint16(34, bitDepth, true);
                writeString(view, 36, 'data');
                view.setUint32(40, dataLength, true);

                let offset = 44;
                for (let i = 0; i < interleaved.length; i++) {
                    const sample = Math.max(-1, Math.min(1, interleaved[i]));
                    view.setInt16(offset, sample * 0x7FFF, true);
                    offset += 2;
                }

                const blob = new Blob([buffer], { type: 'audio/wav' });
                ctx.postMessage({ type: 'wavResult', blob } as WorkerResponse);
                break;
            }
        }
    } catch (err) {
        ctx.postMessage({ type: 'error', message: (err as Error).message } as WorkerResponse);
    }
};

function writeString(view: DataView, offset: number, str: string) {
    for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
    }
}
