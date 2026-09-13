/**
 * Web Worker for offloading heavy audio processing from the main thread.
 *
 * Supported operations:
 *  - trim:      Extract a time range from raw audio channel data.
 *  - normalize: Peak-normalize each channel to 0 dBFS.
 *  - toWav:     Encode raw channel data as a WAV Blob.
 */

import { encodeWav } from '../lib/pcm';

export type WorkerRequest =
    | { type: 'trim'; id: number; channels: Float32Array[]; sampleRate: number; startTime: number; endTime: number }
    | { type: 'normalize'; id: number; channels: Float32Array[]; sampleRate: number }
    | { type: 'toWav'; id: number; channels: Float32Array[]; sampleRate: number };

export type WorkerResponse =
    | { type: 'result'; id: number; channels: Float32Array[]; sampleRate: number }
    | { type: 'wavResult'; id: number; blob: Blob }
    | { type: 'error'; id: number; message: string };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ctx = self as any;

ctx.onmessage = (e: MessageEvent<WorkerRequest>) => {
    const id = e.data.id;
    try {
        const msg = e.data;

        switch (msg.type) {
            case 'trim': {
                const { channels, sampleRate, startTime, endTime } = msg;
                if (!channels.length) {
                    ctx.postMessage({ type: 'error', id, message: 'Invalid trim range' } as WorkerResponse);
                    break;
                }
                const chLen = channels[0].length;
                let startSample = Math.floor(startTime * sampleRate);
                let endSample = Math.floor(endTime * sampleRate);
                startSample = Math.max(0, Math.min(startSample, chLen));
                endSample = Math.max(0, Math.min(endSample, chLen));
                const length = endSample - startSample;

                if (length < 1) {
                    ctx.postMessage({ type: 'error', id, message: 'Invalid trim range' } as WorkerResponse);
                    break;
                }

                const trimmed: Float32Array[] = channels.map((ch) => {
                    const out = new Float32Array(length);
                    for (let i = 0; i < length; i++) {
                        out[i] = ch[startSample + i];
                    }
                    return out;
                });

                ctx.postMessage(
                    { type: 'result', id, channels: trimmed, sampleRate } as WorkerResponse,
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
                    { type: 'result', id, channels: normalized, sampleRate } as WorkerResponse,
                    normalized.map(c => c.buffer) as unknown as Transferable[]
                );
                break;
            }

            case 'toWav': {
                const { channels, sampleRate } = msg;
                const blob = encodeWav(channels, sampleRate);
                ctx.postMessage({ type: 'wavResult', id, blob } as WorkerResponse);
                break;
            }
        }
    } catch (err) {
        ctx.postMessage({ type: 'error', id, message: (err as Error).message } as WorkerResponse);
    }
};
