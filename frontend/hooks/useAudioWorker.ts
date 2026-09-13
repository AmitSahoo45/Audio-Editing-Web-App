import { useRef, useCallback, useEffect } from 'react';
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
    const pendingRef = useRef(
        new Map<number, {
            resolve: (value: WorkerResponse) => void;
            reject: (reason?: unknown) => void;
        }>()
    );

    const getWorker = useCallback(() => {
        if (!workerRef.current) {
            const worker = new Worker(
                new URL('../workers/audio-worker.ts', import.meta.url)
            );
            worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
                const pending = pendingRef.current.get(e.data.id);
                if (!pending) return;
                pendingRef.current.delete(e.data.id);
                if (e.data.type === 'error') {
                    pending.reject(new Error(e.data.message));
                } else {
                    pending.resolve(e.data);
                }
            };
            workerRef.current = worker;
        }
        return workerRef.current;
    }, []);

    const postMessage = useCallback(
        (msg: WorkerMessage): Promise<WorkerResponse> =>
            new Promise((resolve, reject) => {
                const worker = getWorker();
                const id = nextIdRef.current++;
                pendingRef.current.set(id, { resolve, reject });
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
        for (const { reject } of pendingRef.current.values()) {
            reject(new Error('Worker terminated'));
        }
        pendingRef.current.clear();
        workerRef.current?.terminate();
        workerRef.current = null;
    }, []);

    useEffect(() => {
        return () => {
            terminate();
        };
    }, [terminate]);

    return { trimAudio, normalizeAudio, audioBufferToWav, terminate };
}
