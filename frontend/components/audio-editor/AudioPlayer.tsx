'use client';

import { useRef, useMemo, useEffect, MutableRefObject } from 'react';
import { useWaveform } from '@/hooks/useWaveform';
import Controls from './Controls';
import Timeline from './Timeline';
import { ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface AudioPlayerHandle {
    play: () => void;
    pause: () => void;
    getTrimRange: () => { start: number; end: number } | null;
    getMediaElement: () => HTMLMediaElement | null;
    isReady: boolean;
}

interface AudioPlayerProps {
    audioUrl: string;
    onReady?: () => void;
    onPlaybackChange?: (isPlaying: boolean) => void;
    onMediaReady?: (el: HTMLMediaElement | null) => void;
    playerRef?: MutableRefObject<AudioPlayerHandle | null>;
}

export default function AudioPlayer({
    audioUrl,
    onReady,
    onPlaybackChange,
    onMediaReady,
    playerRef,
}: AudioPlayerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const onMediaReadyRef = useRef(onMediaReady);
    onMediaReadyRef.current = onMediaReady;
    const onReadyRef = useRef(onReady);
    onReadyRef.current = onReady;

    const options = useMemo(
        () => ({
            onReady: () => onReadyRef.current?.(),
            onPlay: () => onPlaybackChange?.(true),
            onPause: () => onPlaybackChange?.(false),
            onFinish: () => onPlaybackChange?.(false),
        }),
        [onPlaybackChange]
    );

    const {
        isReady,
        isPlaying,
        currentTime,
        duration,
        zoom,
        minZoom,
        maxZoom,
        play,
        pause,
        stop,
        seekTo,
        getMediaElement,
        getTrimRange,
        setVolume,
        zoomIn,
        zoomOut,
        zoomTo,
    } = useWaveform({ containerRef, audioUrl, options });

    useEffect(() => {
        if (isReady) {
            setVolume(1);
            onMediaReadyRef.current?.(getMediaElement());
        }
    }, [isReady, getMediaElement, setVolume]);

    useEffect(() => {
        if (playerRef) {
            playerRef.current = {
                play,
                pause,
                getTrimRange,
                getMediaElement,
                isReady,
            };
        }
        return () => {
            if (playerRef) {
                playerRef.current = null;
            }
        };
    }, [play, pause, getTrimRange, getMediaElement, isReady, playerRef]);

    useEffect(() => {
        return () => {
            onMediaReadyRef.current?.(null);
        };
    }, []);

    const handleSkipForward = () => {
        if (duration <= 0) return;
        const newTime = Math.min(currentTime + 5, duration);
        seekTo(newTime / duration);
    };

    const handleSkipBackward = () => {
        if (duration <= 0) return;
        const newTime = Math.max(currentTime - 5, 0);
        seekTo(newTime / duration);
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
            if (e.ctrlKey || e.metaKey) {
                if (e.key === '=' || e.key === '+') {
                    e.preventDefault();
                    zoomIn();
                } else if (e.key === '-') {
                    e.preventDefault();
                    zoomOut();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [zoomIn, zoomOut]);

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg border border-border bg-surface/80 px-3 py-1.5">
                <span className="text-xs font-medium text-text-muted">Zoom</span>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={zoomOut} disabled={zoom <= minZoom}>
                    <ZoomOut className="h-3.5 w-3.5" />
                </Button>
                <input
                    type="range"
                    min={minZoom}
                    max={maxZoom}
                    step={10}
                    value={zoom}
                    onChange={(e) => zoomTo(Number(e.target.value))}
                    className="h-1 w-32 cursor-pointer appearance-none rounded-full bg-border accent-accent"
                />
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={zoomIn} disabled={zoom >= maxZoom}>
                    <ZoomIn className="h-3.5 w-3.5" />
                </Button>
                <span className="text-[10px] tabular-nums text-text-dim">{zoom}px/s</span>
                <div className="ml-auto text-[10px] text-text-dim">Ctrl +/− to zoom</div>
            </div>

            <div className="w-full overflow-x-auto rounded-xl bg-slate-800/50 p-4">
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
