export interface EffectsPanelProps {
    audioUrl: string | null;
    onVolumeChange: (volume: number) => void;
    onReverbChange: (decay: number) => void;
    onEQChange: (low: number, mid: number, high: number) => void;
}

export interface TimelineProps {
    currentTime: number;
    duration: number;
    onSeek: (progress: number) => void;
}