import lamejs from 'lamejs';
import { saveAs } from 'file-saver';
import { AudioProcessor } from './audio-processor';

export class AudioEncoder {
    static async exportToMP3(audioBuffer: AudioBuffer, fileName: string = 'audio.mp3'): Promise<void> {
        const mp3encoder = new lamejs.Mp3Encoder(
            audioBuffer.numberOfChannels,
            audioBuffer.sampleRate,
            128
        )

        const mp3Data: Int8Array[] = [];
        const sampleBlockSize = 1152;

        if (audioBuffer.numberOfChannels === 1) {
            // Mono
            const samples = this.convertFloat32ToInt16(
                audioBuffer.getChannelData(0)
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
            const left = this.convertFloat32ToInt16(audioBuffer.getChannelData(0));
            const right = this.convertFloat32ToInt16(audioBuffer.getChannelData(1));

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
        fileName: string = 'audio.wav'
    ): Promise<void> {
        const processor = new AudioProcessor(new AudioContext());
        const blob = await processor.audioBufferToWav(audioBuffer);
        saveAs(blob, fileName);
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