'use client';

import { useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Activity } from 'lucide-react';

interface FrequencyVisualizerProps {
    analyser: AnalyserNode | null;
    isPlaying?: boolean;
}

export default function FrequencyVisualizer({ analyser, isPlaying = false }: FrequencyVisualizerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animFrameRef = useRef<number>(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx2d = canvas.getContext('2d');
        if (!ctx2d) return;

        const drawIdle = () => {
            ctx2d.fillStyle = 'rgba(15, 23, 42, 0.85)';
            ctx2d.fillRect(0, 0, canvas.width, canvas.height);
        };

        if (!analyser || !isPlaying) {
            cancelAnimationFrame(animFrameRef.current);
            drawIdle();
            return;
        }

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

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

        draw();
        return () => cancelAnimationFrame(animFrameRef.current);
    }, [analyser, isPlaying]);

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
                {!analyser && (
                    <p className="text-[10px] text-text-dim text-center">Play audio to see frequencies</p>
                )}
            </div>
        </Card>
    );
}
