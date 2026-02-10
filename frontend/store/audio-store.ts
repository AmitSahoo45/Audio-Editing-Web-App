import { create } from 'zustand';
import { temporal } from 'zundo';
import type { NoiseReductionMode } from '@/lib/noise-reduction';

/* ── Types ──────────────────────────────────────────────────────────── */

export interface AudioState {
    /* File / buffer */
    audioFile: File | null;
    audioUrl: string | null;
    audioBuffer: AudioBuffer | null;
    fileName: string;

    /* Processing flag */
    isProcessing: boolean;

    /* Playback */
    isPlaying: boolean;

    /* Effects */
    volume: number;
    reverb: number;
    eqLow: number;
    eqMid: number;
    eqHigh: number;

    /* Noise-reduction */
    noiseReductionProcessing: NoiseReductionMode | null;

    /* Export */
    isExporting: boolean;
    exportFormat: 'mp3' | 'wav';
    exportBitrate: number;
    exportSampleRate: number;
}

export interface AudioActions {
    /* File / buffer */
    setAudioFile: (file: File | null) => void;
    setAudioUrl: (url: string | null) => void;
    setAudioBuffer: (buffer: AudioBuffer | null) => void;
    setFileName: (name: string) => void;

    /* Processing */
    setIsProcessing: (v: boolean) => void;

    /* Playback */
    setIsPlaying: (v: boolean) => void;

    /* Effects */
    setVolume: (v: number) => void;
    setReverb: (v: number) => void;
    setEqLow: (v: number) => void;
    setEqMid: (v: number) => void;
    setEqHigh: (v: number) => void;

    /* Noise-reduction */
    setNoiseReductionProcessing: (mode: NoiseReductionMode | null) => void;

    /* Export */
    setIsExporting: (v: boolean) => void;
    setExportFormat: (fmt: 'mp3' | 'wav') => void;
    setExportBitrate: (br: number) => void;
    setExportSampleRate: (sr: number) => void;

    /* Reset */
    resetEditor: () => void;
}

/* ── Initial state ─────────────────────────────────────────────────── */

const initialState: AudioState = {
    audioFile: null,
    audioUrl: null,
    audioBuffer: null,
    fileName: 'audio',

    isProcessing: false,
    isPlaying: false,

    volume: 100,
    reverb: 0,
    eqLow: 0,
    eqMid: 0,
    eqHigh: 0,

    noiseReductionProcessing: null,

    isExporting: false,
    exportFormat: 'mp3',
    exportBitrate: 128,
    exportSampleRate: 44100,
};

/* ── Store (with undo/redo via zundo) ──────────────────────────────── */

export const useAudioStore = create<AudioState & AudioActions>()(
    temporal(
        (set) => ({
            ...initialState,

            /* File / buffer */
            setAudioFile: (file) => set({ audioFile: file }),
            setAudioUrl: (url) => set({ audioUrl: url }),
            setAudioBuffer: (buffer) => set({ audioBuffer: buffer }),
            setFileName: (name) => set({ fileName: name }),

            /* Processing */
            setIsProcessing: (v) => set({ isProcessing: v }),

            /* Playback */
            setIsPlaying: (v) => set({ isPlaying: v }),

            /* Effects */
            setVolume: (v) => set({ volume: v }),
            setReverb: (v) => set({ reverb: v }),
            setEqLow: (v) => set({ eqLow: v }),
            setEqMid: (v) => set({ eqMid: v }),
            setEqHigh: (v) => set({ eqHigh: v }),

            /* Noise-reduction */
            setNoiseReductionProcessing: (mode) => set({ noiseReductionProcessing: mode }),

            /* Export */
            setIsExporting: (v) => set({ isExporting: v }),
            setExportFormat: (fmt) => set({ exportFormat: fmt }),
            setExportBitrate: (br) => set({ exportBitrate: br }),
            setExportSampleRate: (sr) => set({ exportSampleRate: sr }),

            /* Reset */
            resetEditor: () => set({ ...initialState }),
        }),
        {
            // Only track meaningful state changes for undo/redo, not transient UI flags.
            partialize: (state) => ({
                audioBuffer: state.audioBuffer,
                audioUrl: state.audioUrl,
                fileName: state.fileName,
                volume: state.volume,
                reverb: state.reverb,
                eqLow: state.eqLow,
                eqMid: state.eqMid,
                eqHigh: state.eqHigh,
            }),
            limit: 50,
        }
    )
);
