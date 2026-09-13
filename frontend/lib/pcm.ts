export function floatToInt16Sample(sample: number): number {
    const s = Math.max(-1, Math.min(1, sample));
    const n = Math.round(s < 0 ? s * 0x8000 : s * 0x7fff);
    return Math.max(-0x8000, Math.min(0x7fff, n));
}

function writeString(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}

export function encodeWav(channels: Float32Array[], sampleRate: number): Blob {
    const numberOfChannels = channels.length;
    const length = channels[0]?.length ?? 0;
    const format = 1; // PCM
    const bitDepth = 16;
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numberOfChannels * bytesPerSample;

    const dataLength = length * numberOfChannels * bytesPerSample;
    const buffer = new ArrayBuffer(44 + dataLength);
    const view = new DataView(buffer);

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(view, 36, 'data');
    view.setUint32(40, dataLength, true);

    let offset = 44;
    for (let i = 0; i < length; i++) {
        for (let ch = 0; ch < numberOfChannels; ch++) {
            view.setInt16(offset, floatToInt16Sample(channels[ch][i]), true);
            offset += 2;
        }
    }

    return new Blob([buffer], { type: 'audio/wav' });
}
