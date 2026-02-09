import { create } from 'zustand';

interface AudioState {
    /* ── Audio data ─────────────────────────────────────── */
    audioFile: File | null;
    audioUrl: string | null;
    audioBuffer: AudioBuffer | null;
    fileName: string;

    /* ── Processing flag ────────────────────────────────── */
    isProcessing: boolean;

    /* ── Effects state ──────────────────────────────────── */
    volume: number;
    reverb: number;
    eqLow: number;
    eqMid: number;
    eqHigh: number;

    /* ── Actions ────────────────────────────────────────── */
    setAudioFile: (file: File | null) => void;
    setAudioUrl: (url: string | null) => void;
    setAudioBuffer: (buffer: AudioBuffer | null) => void;
    setFileName: (name: string) => void;
    setIsProcessing: (processing: boolean) => void;

    setVolume: (volume: number) => void;
    setReverb: (reverb: number) => void;
    setEQ: (low: number, mid: number, high: number) => void;

    /** Load a file: set file metadata, decode buffer, and create a playable URL. */
    loadFile: (file: File, audioContext: AudioContext, processor: { loadAudioFile: (f: File) => Promise<AudioBuffer> }) => Promise<void>;

    /** Replace the current buffer & URL (e.g. after processing). */
    replaceAudio: (buffer: AudioBuffer, url: string) => void;

    /** Reset all audio state back to defaults. */
    reset: () => void;
}

const initialState = {
    audioFile: null as File | null,
    audioUrl: null as string | null,
    audioBuffer: null as AudioBuffer | null,
    fileName: 'audio',
    isProcessing: false,
    volume: 100,
    reverb: 0,
    eqLow: 0,
    eqMid: 0,
    eqHigh: 0,
};

export const useAudioStore = create<AudioState>((set) => ({
    ...initialState,

    /* ── Simple setters ─────────────────────────────────── */
    setAudioFile: (file) => set({ audioFile: file }),
    setAudioUrl: (url) => set({ audioUrl: url }),
    setAudioBuffer: (buffer) => set({ audioBuffer: buffer }),
    setFileName: (name) => set({ fileName: name }),
    setIsProcessing: (processing) => set({ isProcessing: processing }),

    setVolume: (volume) => set({ volume }),
    setReverb: (reverb) => set({ reverb }),
    setEQ: (low, mid, high) => set({ eqLow: low, eqMid: mid, eqHigh: high }),

    /* ── Compound actions ───────────────────────────────── */
    loadFile: async (file, audioContext, processor) => {
        const url = URL.createObjectURL(file);
        const buffer = await processor.loadAudioFile(file);

        set({
            audioFile: file,
            audioUrl: url,
            audioBuffer: buffer,
            fileName: file.name,
        });
    },

    replaceAudio: (buffer, url) => set({ audioBuffer: buffer, audioUrl: url }),

    reset: () => set({ ...initialState }),
}));
