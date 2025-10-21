import { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js'
import RegionsPlugin, { Region } from 'wavesurfer.js/dist/plugins/regions'

interface UseWaveformOptions {
    onReady?: () => void;
    onPlay?: () => void;
    onPause?: () => void;
    onFinish?: () => void;
}

interface UseWaveformProps {
    containerRef: React.RefObject<HTMLDivElement>;
    audioUrl: string | null;
    options?: UseWaveformOptions;
}

export const useWaveform = ({ containerRef, audioUrl, options }: UseWaveformProps) => {
    const waveSurferRef = useRef<WaveSurfer | null>(null);
    const regionsPluginRef = useRef<RegionsPlugin | null>(null);

    const [isReady, setIsReady] = useState<boolean>(false);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);

    const [duration, setDuration] = useState<number>(0);
    const [currentTime, setCurrentTime] = useState<number>(0);

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
            plugins: [regions]
        });
        waveSurferRef.current = wavesurfer;

        wavesurfer.on('ready', () => {
            setIsReady(true);
            setDuration(wavesurfer.getDuration());
            options?.onReady?.();
        });

        wavesurfer.on('play', () => {
            setIsPlaying(true);
            options?.onPlay?.();
        });

        wavesurfer.on('pause', () => {
            setIsPlaying(false);
            options?.onPause?.();
        });

        wavesurfer.on('finish', () => {
            setIsPlaying(false);
            options?.onFinish?.();
        });

        wavesurfer.on('timeupdate', (time) => {
            setCurrentTime(time);
        });


        wavesurfer.load(audioUrl);


        return () => {
            wavesurfer.destroy();
        };

    }, [audioUrl, containerRef, options]);

    const play = () => waveSurferRef.current?.play();
    const pause = () => waveSurferRef.current?.pause();
    const stop = () => {
        waveSurferRef.current?.stop();
        setCurrentTime(0);
    };
    const seekTo = (progress: number) => waveSurferRef.current?.seekTo(progress);
    const addRegion = (start: number, end: number, color?: string) => {
        return regionsPluginRef.current?.addRegion({
            start,
            end,
            color: color || 'rgba(0, 123, 255, 0.1)',
            drag: true,
            resize: true,
        });
    };
    const clearRegions = () => regionsPluginRef.current?.clearRegions();

    return {
        wavesurfer: waveSurferRef.current,
        isReady,
        isPlaying,
        duration,
        currentTime,
        play,
        pause,
        stop,
        seekTo,
        addRegion,
        clearRegions,
    };
}