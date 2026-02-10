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
        const startSample = Math.floor(startTime * sampleRate)
        const endSample = Math.floor(endTime * sampleRate)
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

        const sampleRate = buffers[0].sampleRate;
        const numberOfChannels = buffers[0].numberOfChannels;

        const totalLength = buffers.reduce((sum, buffer) =>
            sum + buffer.length, 0
        );

        const mergedBuffer = this.audioContext.createBuffer(
            numberOfChannels,
            totalLength,
            sampleRate
        );

        let offset = 0;
        buffers.forEach(buffer => {
            for (let channel = 0; channel < numberOfChannels; channel++) {
                const sourceData = buffer.getChannelData(channel);
                const targetData = mergedBuffer.getChannelData(channel);
                targetData.set(sourceData, offset);
            }
            offset += buffer.length;
        });

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

            const factor = 1 / peak;
            for (let i = 0; i < sourceData.length; i++)
                targetData[i] = sourceData[i] * factor;
        }

        return normalized;
    }

    async audioBufferToWav(audioBuffer: AudioBuffer): Promise<Blob> {
        const numberOfChannels = audioBuffer.numberOfChannels;
        const sampleRate = audioBuffer.sampleRate;
        const format = 1; // PCM
        const bitDepth = 16;

        const bytesPerSample = bitDepth / 8;
        const blockAlign = numberOfChannels * bytesPerSample;

        const data = new Float32Array(audioBuffer.length * numberOfChannels);
        for (let channel = 0; channel < numberOfChannels; channel++) {
            const channelData = audioBuffer.getChannelData(channel);

            for (let i = 0; i < audioBuffer.length; i++)
                data[i * numberOfChannels + channel] = channelData[i];
        }

        const dataLength = data.length * bytesPerSample
        const buffer = new ArrayBuffer(44 + dataLength)
        const view = new DataView(buffer)

        // Write WAV header
        this.writeString(view, 0, 'RIFF');
        view.setUint32(4, 36 + dataLength, true);
        this.writeString(view, 8, 'WAVE');
        this.writeString(view, 12, 'fmt ');
        view.setUint32(16, 16, true); // fmt chunk size
        view.setUint16(20, format, true);
        view.setUint16(22, numberOfChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * blockAlign, true);
        view.setUint16(32, blockAlign, true);
        view.setUint16(34, bitDepth, true);
        this.writeString(view, 36, 'data');
        view.setUint32(40, dataLength, true);

        // Write audio data
        let offset = 44;
        for (let i = 0; i < data.length; i++) {
            const sample = Math.max(-1, Math.min(1, data[i]));
            view.setInt16(offset, sample * 0x7FFF, true);
            offset += 2;
        }

        return new Blob([buffer], { type: 'audio/wav' })
    }

    private writeString(view: DataView, offset: number, string: string) {
        for (let i = 0; i < string.length; i++)
            view.setUint8(offset + i, string.charCodeAt(i));
    }
}