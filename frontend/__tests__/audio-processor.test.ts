import { describe, it, expect, beforeEach } from 'vitest';
import { AudioProcessor } from '@/lib/audio-processor';

/**
 * Minimal AudioContext + AudioBuffer stubs for testing pure-logic methods
 * (trimAudio, normalizeAudio, mergeAudioBuffers) without a real browser environment.
 */

class FakeAudioBuffer {
    numberOfChannels: number;
    sampleRate: number;
    length: number;
    duration: number;
    private channels: Float32Array[];

    constructor(channels: number, length: number, sampleRate: number) {
        this.numberOfChannels = channels;
        this.sampleRate = sampleRate;
        this.length = length;
        this.duration = length / sampleRate;
        this.channels = Array.from({ length: channels }, () => new Float32Array(length));
    }

    getChannelData(ch: number): Float32Array {
        return this.channels[ch];
    }

    copyToChannel(source: Float32Array, ch: number) {
        this.channels[ch].set(source);
    }
}

class FakeAudioContext {
    createBuffer(channels: number, length: number, sampleRate: number) {
        return new FakeAudioBuffer(channels, length, sampleRate);
    }
}

describe('AudioProcessor', () => {
    let processor: AudioProcessor;

    beforeEach(() => {
        processor = new AudioProcessor(new FakeAudioContext() as unknown as AudioContext);
    });

    describe('trimAudio', () => {
        it('trims to the correct sample range', () => {
            const sampleRate = 100; // 100 samples/sec for easy math
            const buf = new FakeAudioBuffer(1, 1000, sampleRate) as unknown as AudioBuffer;
            const data = buf.getChannelData(0);
            for (let i = 0; i < 1000; i++) data[i] = i;

            const trimmed = processor.trimAudio(buf, 2, 5); // 200-500
            expect(trimmed.length).toBe(300);
            expect(trimmed.getChannelData(0)[0]).toBe(200);
            expect(trimmed.getChannelData(0)[299]).toBe(499);
        });

        it('handles multi-channel audio', () => {
            const buf = new FakeAudioBuffer(2, 100, 100) as unknown as AudioBuffer;
            buf.getChannelData(0).fill(0.5);
            buf.getChannelData(1).fill(-0.5);

            const trimmed = processor.trimAudio(buf, 0.2, 0.8);
            expect(trimmed.numberOfChannels).toBe(2);
            expect(trimmed.length).toBe(60);
            expect(trimmed.getChannelData(0)[0]).toBe(0.5);
            expect(trimmed.getChannelData(1)[0]).toBeCloseTo(-0.5);
        });

        it('returns empty buffer when start equals end', () => {
            const buf = new FakeAudioBuffer(1, 100, 100) as unknown as AudioBuffer;
            const trimmed = processor.trimAudio(buf, 0.5, 0.5);
            expect(trimmed.length).toBe(0);
        });
    });

    describe('normalizeAudio', () => {
        it('scales peak sample to 1.0', () => {
            const buf = new FakeAudioBuffer(1, 4, 44100) as unknown as AudioBuffer;
            const data = buf.getChannelData(0);
            data.set([0.25, -0.5, 0.1, -0.2]);

            const normalized = processor.normalizeAudio(buf);
            const out = normalized.getChannelData(0);

            // Peak was 0.5, so factor = 2
            expect(out[0]).toBeCloseTo(0.5);
            expect(out[1]).toBeCloseTo(-1.0);
            expect(out[2]).toBeCloseTo(0.2);
            expect(out[3]).toBeCloseTo(-0.4);
        });

        it('normalizes each channel independently', () => {
            const buf = new FakeAudioBuffer(2, 2, 44100) as unknown as AudioBuffer;
            buf.getChannelData(0).set([0.25, -0.25]);
            buf.getChannelData(1).set([0.1, -0.5]);

            const normalized = processor.normalizeAudio(buf);
            // Channel 0: peak 0.25, factor 4 → [1.0, -1.0]
            expect(normalized.getChannelData(0)[0]).toBeCloseTo(1.0);
            expect(normalized.getChannelData(0)[1]).toBeCloseTo(-1.0);
            // Channel 1: peak 0.5, factor 2 → [0.2, -1.0]
            expect(normalized.getChannelData(1)[0]).toBeCloseTo(0.2);
            expect(normalized.getChannelData(1)[1]).toBeCloseTo(-1.0);
        });
    });

    describe('mergeAudioBuffers', () => {
        it('merges buffers sequentially', () => {
            const a = new FakeAudioBuffer(1, 3, 44100) as unknown as AudioBuffer;
            a.getChannelData(0).set([1, 2, 3]);

            const b = new FakeAudioBuffer(1, 2, 44100) as unknown as AudioBuffer;
            b.getChannelData(0).set([4, 5]);

            const merged = processor.mergeAudioBuffers([a, b]);
            expect(merged.length).toBe(5);
            expect(Array.from(merged.getChannelData(0))).toEqual([1, 2, 3, 4, 5]);
        });

        it('throws on empty array', () => {
            expect(() => processor.mergeAudioBuffers([])).toThrow('No buffers to merge');
        });
    });
});
