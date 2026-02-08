export interface FileUploadProps {
    onFileSelect: (file: File) => void;
}

export interface ControlProps {
    isPlaying: boolean;
    onPlay: () => void;
    onPause: () => void;
    onStop: () => void;
    onSkipForward: () => void;
    onSkipBackward: () => void;
}

export interface ExportPanelProps {
    audioBuffer: AudioBuffer | null;
    fileName: string;
}