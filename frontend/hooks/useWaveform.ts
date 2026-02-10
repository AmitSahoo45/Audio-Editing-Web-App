import { useEffect, useRef, useState, useCallback } from 'react';
import WaveSurfer from 'wavesurfer.js'
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions'

interface UseWaveformOptions {
    onReady?: () => void;
    onPlay?: () => void;
    onPause?: () => void;
    onFinish?: () => void;
}

interface UseWaveformProps {
    containerRef: React.RefObject<HTMLDivElement | null>;
    audioUrl: string | null;
    options?: UseWaveformOptions;
}

const MIN_PX_PER_SEC = 50;
const MAX_PX_PER_SEC = 1000;
const DEFAULT_PX_PER_SEC = 100;

export const useWaveform = ({ containerRef, audioUrl, options }: UseWaveformProps) => {
    const waveSurferRef = useRef<WaveSurfer | null>(null);
    const regionsPluginRef = useRef<RegionsPlugin | null>(null);
    const optionsRef = useRef(options);
    optionsRef.current = options;

    const [isReady, setIsReady] = useState<boolean>(false);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);

    const [duration, setDuration] = useState<number>(0);
    const [currentTime, setCurrentTime] = useState<number>(0);
    const [zoom, setZoom] = useState<number>(DEFAULT_PX_PER_SEC);

    useEffect(() => {
        if (!containerRef.current || !audioUrl)
            return;

        const regions = RegionsPlugin.create();
        regionsPluginRef.current = regions;

        const wavesurfer = WaveSurfer.create({
            container: containerRef.current,
            waveColor: '#4F4A85',
            progressColor: '#383351',
            cursorColor: '#ffffff',
            barWidth: 2,
            barGap: 1,
            height: 128,
            normalize: true,
            minPxPerSec: DEFAULT_PX_PER_SEC,
            autoScroll: true,
            autoCenter: true,
            plugins: [regions]
        });
        waveSurferRef.current = wavesurfer;

        wavesurfer.on('ready', () => {
            setIsReady(true);
            setDuration(wavesurfer.getDuration());
            optionsRef.current?.onReady?.();
        });

        wavesurfer.on('play', () => {
            setIsPlaying(true);
            optionsRef.current?.onPlay?.();
        });

        wavesurfer.on('pause', () => {
            setIsPlaying(false);
            optionsRef.current?.onPause?.();
        });

        wavesurfer.on('finish', () => {
            setIsPlaying(false);
            optionsRef.current?.onFinish?.();
        });

        wavesurfer.on('timeupdate', (time) => {
            setCurrentTime(time);
        });


        wavesurfer.load(audioUrl);


        return () => {
            wavesurfer.destroy();
        };

    }, [audioUrl, containerRef]);

    const play = useCallback(() => waveSurferRef.current?.play(), []);
    const pause = useCallback(() => waveSurferRef.current?.pause(), []);
    const stop = useCallback(() => {
        waveSurferRef.current?.stop();
        setCurrentTime(0);
    }, []);
    const seekTo = useCallback((progress: number) => waveSurferRef.current?.seekTo(progress), []);
    const addRegion = useCallback((start: number, end: number, color?: string) => {
        return regionsPluginRef.current?.addRegion({
            start,
            end,
            color: color || 'rgba(0, 123, 255, 0.1)',
            drag: true,
            resize: true,
        });
    }, []);
    const clearRegions = useCallback(() => regionsPluginRef.current?.clearRegions(), []);

    const zoomIn = useCallback(() => {
        setZoom(prev => {
            const next = Math.min(prev + 50, MAX_PX_PER_SEC);
            waveSurferRef.current?.zoom(next);
            return next;
        });
    }, []);

    const zoomOut = useCallback(() => {
        setZoom(prev => {
            const next = Math.max(prev - 50, MIN_PX_PER_SEC);
            waveSurferRef.current?.zoom(next);
            return next;
        });
    }, []);

    const zoomTo = useCallback((value: number) => {
        const clamped = Math.max(MIN_PX_PER_SEC, Math.min(MAX_PX_PER_SEC, value));
        setZoom(clamped);
        waveSurferRef.current?.zoom(clamped);
    }, []);

    // Mouse-wheel zoom (Ctrl + scroll)
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleWheel = (e: WheelEvent) => {
            if (!e.ctrlKey && !e.metaKey) return;
            e.preventDefault();
            const delta = e.deltaY > 0 ? -50 : 50;
            setZoom(prev => {
                const next = Math.max(MIN_PX_PER_SEC, Math.min(MAX_PX_PER_SEC, prev + delta));
                waveSurferRef.current?.zoom(next);
                return next;
            });
        };

        container.addEventListener('wheel', handleWheel, { passive: false });
        return () => container.removeEventListener('wheel', handleWheel);
    }, [containerRef]);

    return {
        wavesurfer: waveSurferRef.current,
        isReady,
        isPlaying,
        duration,
        currentTime,
        zoom,
        minZoom: MIN_PX_PER_SEC,
        maxZoom: MAX_PX_PER_SEC,
        play,
        pause,
        stop,
        seekTo,
        addRegion,
        clearRegions,
        zoomIn,
        zoomOut,
        zoomTo,
    };
}