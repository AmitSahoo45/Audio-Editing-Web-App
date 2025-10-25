declare module 'lamejs' {
    // MP3 encoder class
    class Mp3Encoder {
        /**
         * @param channels   1 = mono, 2 = stereo
         * @param sampleRate in Hz, e.g. 44100
         * @param kbps       bitrate like 128
         */
        constructor(channels: number, sampleRate: number, kbps: number);

        /**
         * Encode PCM samples into MP3 data.
         * For mono, only pass left.
         * For stereo, pass left + right.
         */
        encodeBuffer(
            left: Int16Array,
            right?: Int16Array
        ): Int8Array;

        /**
         * Finish encoding and return the last MP3 chunk.
         */
        flush(): Int8Array;
    }

    // WAV header helper
    class WavHeader {
        channels: number;
        sampleRate: number;
        bitsPerSample: number;
        dataLen: number;

        /**
         * Parse header info from a DataView of a WAV file.
         */
        static readHeader(dataView: DataView): WavHeader;
    }

    // CommonJS-style default export that lamejs actually ships with
    const lamejsDefault: {
        Mp3Encoder: typeof Mp3Encoder;
        WavHeader: typeof WavHeader;
    };

    export { Mp3Encoder, WavHeader };
    export default lamejsDefault;
}
