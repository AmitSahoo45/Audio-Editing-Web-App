import lamejs from 'lamejs';
import { saveAs } from 'file-saver';
import { AudioProcessor } from './audio-processor';

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
        const resampled = targetSR !== audioBuffer.sampleRate
            ? await this.resample(audioBuffer, targetSR)
            : audioBuffer;

        const mp3encoder = new lamejs.Mp3Encoder(
            resampled.numberOfChannels,
            resampled.sampleRate,
            bitrate
        )

        const mp3Data: Int8Array[] = [];
        const sampleBlockSize = 1152;

        if (resampled.numberOfChannels === 1) {
            // Mono
            const samples = this.convertFloat32ToInt16(
                resampled.getChannelData(0)
            );

            for (let i = 0; i < samples.length; i += sampleBlockSize) {
                const sampleChunk = samples.subarray(i, i + sampleBlockSize);
                const mp3buf = mp3encoder.encodeBuffer(sampleChunk);
                if (mp3buf.length > 0) {
                    mp3Data.push(mp3buf);
                }
            }
        } else {
            // Stereo
            const left = this.convertFloat32ToInt16(resampled.getChannelData(0));
            const right = this.convertFloat32ToInt16(resampled.getChannelData(1));

            for (let i = 0; i < left.length; i += sampleBlockSize) {
                const leftChunk = left.subarray(i, i + sampleBlockSize);
                const rightChunk = right.subarray(i, i + sampleBlockSize);
                const mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
                if (mp3buf.length > 0) {
                    mp3Data.push(mp3buf);
                }
            }
        }
        // Flush remaining data
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
        const resampled = targetSR !== audioBuffer.sampleRate
            ? await this.resample(audioBuffer, targetSR)
            : audioBuffer;

        const processor = new AudioProcessor(new AudioContext());
        const blob = await processor.audioBufferToWav(resampled);
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

    private static convertFloat32ToInt16(buffer: Float32Array): Int16Array {
        const l = buffer.length;
        const buf = new Int16Array(l);
        for (let i = 0; i < l; i++) {
            const s = Math.max(-1, Math.min(1, buffer[i]));
            buf[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        return buf;
    }
}