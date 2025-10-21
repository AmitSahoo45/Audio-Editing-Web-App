interface FileUploadProps {
    onFileSelect: (file: File) => void;
}

interface ControlProps {
    isPlaying: boolean;
    onPlay: () => void;
    onPause: () => void;
    onStop: () => void;
    onSkipForward: () => void;
    onSkipBackward: () => void;
}