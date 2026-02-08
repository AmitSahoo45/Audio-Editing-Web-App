'use client';

import { useRef, useMemo } from 'react';
import { useWaveform } from '@/hooks/useWaveform';
import Controls from './Controls';
import Timeline from './Timeline';

interface AudioPlayerProps {
    audioUrl: string;
    onReady?: () => void;
}

export default function AudioPlayer({ audioUrl, onReady }: AudioPlayerProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    const options = useMemo(() => ({
        onReady,
    }), [onReady]);

    const {
        isPlaying,
        currentTime,
        duration,
        play,
        pause,
        stop,
        seekTo,
    } = useWaveform({ containerRef, audioUrl, options });

    const handleSkipForward = () => {
        const newTime = Math.min(currentTime + 5, duration);
        seekTo(newTime / duration);
    };

    const handleSkipBackward = () => {
        const newTime = Math.max(currentTime - 5, 0);
        seekTo(newTime / duration);
    };

    return (
        <div className="space-y-4">
            <div className="w-full rounded-xl bg-slate-800/50 p-4">
                <div ref={containerRef} />
            </div>

            <Timeline
                currentTime={currentTime}
                duration={duration}
                onSeek={seekTo}
            />

            <Controls
                isPlaying={isPlaying}
                onPlay={play}
                onPause={pause}
                onStop={stop}
                onSkipForward={handleSkipForward}
                onSkipBackward={handleSkipBackward}
            />
        </div>
    );
}