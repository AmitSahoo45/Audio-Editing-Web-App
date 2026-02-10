import { useRef, useCallback } from 'react';
import type { WorkerResponse } from '@/workers/audio-worker';

type WorkerMessage =
    | { type: 'trim'; channels: Float32Array[]; sampleRate: number; startTime: number; endTime: number }
    | { type: 'normalize'; channels: Float32Array[]; sampleRate: number }
    | { type: 'toWav'; channels: Float32Array[]; sampleRate: number };

/**
 * Helper: extract raw Float32Array channels from an AudioBuffer.
 */
function bufferToChannels(audioBuffer: AudioBuffer): Float32Array[] {
    const channels: Float32Array[] = [];
    for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
        channels.push(audioBuffer.getChannelData(ch).slice());
    }
    return channels;
}

/**
 * Helper: rebuild an AudioBuffer from raw channel data.
 */
function channelsToBuffer(
    channels: Float32Array[],
    sampleRate: number,
    audioContext: AudioContext
): AudioBuffer {
    const buf = audioContext.createBuffer(channels.length, channels[0].length, sampleRate);
    for (let ch = 0; ch < channels.length; ch++) {
        buf.copyToChannel(new Float32Array(channels[ch]), ch);
    }
    return buf;
}

/**
 * React hook that lazily creates a Web Worker for heavy audio processing,
 * keeping the main thread responsive.
 */
export function useAudioWorker() {
    const workerRef = useRef<Worker | null>(null);
    const nextIdRef = useRef(0);

    const getWorker = useCallback(() => {
        if (!workerRef.current) {
            workerRef.current = new Worker(
                new URL('../workers/audio-worker.ts', import.meta.url)
            );
        }
        return workerRef.current;
    }, []);

    const postMessage = useCallback(
        (msg: WorkerMessage): Promise<WorkerResponse> =>
            new Promise((resolve, reject) => {
                const worker = getWorker();
                const id = nextIdRef.current++;
                const handler = (e: MessageEvent<WorkerResponse>) => {
                    if (e.data.id !== id) return;
                    worker.removeEventListener('message', handler);
                    if (e.data.type === 'error') {
                        reject(new Error(e.data.message));
                    } else {
                        resolve(e.data);
                    }
                };
                worker.addEventListener('message', handler);
                worker.postMessage({ ...msg, id });
            }),
        [getWorker]
    );

    const trimAudio = useCallback(
        async (audioBuffer: AudioBuffer, startTime: number, endTime: number, audioContext: AudioContext): Promise<AudioBuffer> => {
            const channels = bufferToChannels(audioBuffer);
            const res = await postMessage({
                type: 'trim',
                channels,
                sampleRate: audioBuffer.sampleRate,
                startTime,
                endTime,
            });
            if (res.type !== 'result') throw new Error('Unexpected worker response');
            return channelsToBuffer(res.channels, res.sampleRate, audioContext);
        },
        [postMessage]
    );

    const normalizeAudio = useCallback(
        async (audioBuffer: AudioBuffer, audioContext: AudioContext): Promise<AudioBuffer> => {
            const channels = bufferToChannels(audioBuffer);
            const res = await postMessage({
                type: 'normalize',
                channels,
                sampleRate: audioBuffer.sampleRate,
            });
            if (res.type !== 'result') throw new Error('Unexpected worker response');
            return channelsToBuffer(res.channels, res.sampleRate, audioContext);
        },
        [postMessage]
    );

    const audioBufferToWav = useCallback(
        async (audioBuffer: AudioBuffer): Promise<Blob> => {
            const channels = bufferToChannels(audioBuffer);
            const res = await postMessage({
                type: 'toWav',
                channels,
                sampleRate: audioBuffer.sampleRate,
            });
            if (res.type !== 'wavResult') throw new Error('Unexpected worker response');
            return res.blob;
        },
        [postMessage]
    );

    const terminate = useCallback(() => {
        workerRef.current?.terminate();
        workerRef.current = null;
    }, []);

    return { trimAudio, normalizeAudio, audioBufferToWav, terminate };
}
