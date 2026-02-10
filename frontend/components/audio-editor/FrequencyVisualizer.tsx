'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Activity } from 'lucide-react';

interface FrequencyVisualizerProps {
    audioUrl: string | null;
}

/**
 * Real-time frequency-domain (FFT) visualizer powered by the Web Audio API.
 * Uses a canvas element to render a bar-graph of frequency bins.
 */
export default function FrequencyVisualizer({ audioUrl }: FrequencyVisualizerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animFrameRef = useRef<number>(0);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const ctxRef = useRef<AudioContext | null>(null);
    const [isActive, setIsActive] = useState(false);

    const cleanup = useCallback(() => {
        cancelAnimationFrame(animFrameRef.current);
        sourceRef.current?.disconnect();
        analyserRef.current?.disconnect();
        audioRef.current?.pause();
        sourceRef.current = null;
        analyserRef.current = null;
        audioRef.current = null;
        setIsActive(false);
    }, []);

    const startVisualizer = useCallback(() => {
        if (!audioUrl || !canvasRef.current) return;

        cleanup();

        const audioCtx = ctxRef.current ?? new AudioContext();
        ctxRef.current = audioCtx;

        const audio = new Audio(audioUrl);
        audio.crossOrigin = 'anonymous';
        audioRef.current = audio;

        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;

        const source = audioCtx.createMediaElementSource(audio);
        sourceRef.current = source;
        source.connect(analyser);
        analyser.connect(audioCtx.destination);

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        const canvas = canvasRef.current;
        const ctx2d = canvas.getContext('2d');
        if (!ctx2d) return;

        const draw = () => {
            animFrameRef.current = requestAnimationFrame(draw);
            analyser.getByteFrequencyData(dataArray);

            const w = canvas.width;
            const h = canvas.height;
            ctx2d.fillStyle = 'rgba(15, 23, 42, 0.85)';
            ctx2d.fillRect(0, 0, w, h);

            const barWidth = (w / bufferLength) * 2;
            let x = 0;
            for (let i = 0; i < bufferLength; i++) {
                const barHeight = (dataArray[i] / 255) * h;
                const hue = (i / bufferLength) * 240;
                ctx2d.fillStyle = `hsl(${hue}, 80%, 55%)`;
                ctx2d.fillRect(x, h - barHeight, barWidth - 1, barHeight);
                x += barWidth;
            }
        };

        audio.play().then(() => {
            setIsActive(true);
            draw();
        });

        audio.addEventListener('ended', () => {
            cancelAnimationFrame(animFrameRef.current);
            setIsActive(false);
        });
    }, [audioUrl, cleanup]);

    useEffect(() => {
        return cleanup;
    }, [cleanup]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    <span className="flex items-center gap-2">
                        <Activity className="h-3.5 w-3.5 text-cyan-400" />
                        Frequency Analyzer
                    </span>
                </CardTitle>
            </CardHeader>
            <div className="space-y-2">
                <canvas
                    ref={canvasRef}
                    width={260}
                    height={80}
                    className="w-full rounded-md bg-slate-900"
                />
                <button
                    type="button"
                    onClick={isActive ? cleanup : startVisualizer}
                    disabled={!audioUrl}
                    className="w-full rounded-md bg-surface-raised px-3 py-1.5 text-xs font-medium text-text-muted transition-colors hover:bg-border/50 disabled:opacity-50"
                >
                    {isActive ? 'Stop Analyzer' : 'Start Analyzer'}
                </button>
            </div>
        </Card>
    );
}
