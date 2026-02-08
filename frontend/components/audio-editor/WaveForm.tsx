'use client';

import React, { useEffect, useRef } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionPlugins from 'wavesurfer.js/dist/plugins/regions';

interface WaveFormProps {
    audioUrl: string;
    onReady: (waveSurfer: WaveSurfer) => void;
}

const WaveForm: React.FC<WaveFormProps> = ({ audioUrl, onReady }: WaveFormProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const waveSurferRef = useRef<WaveSurfer | null>(null);

    useEffect(() => {
        if (!containerRef.current)
            return;

        const waveSurfer = WaveSurfer.create({
            container: containerRef.current,
            waveColor: '#3B82F6',
            progressColor: '#1D4ED8',
            cursorColor: '#60A5FA',
            barWidth: 2,
            barGap: 1,
            height: 128,
            normalize: true,
            plugins: [RegionPlugins.create()]
        });

        waveSurfer.load(audioUrl);

        waveSurfer.on('ready', () => {
            onReady?.(waveSurfer);
        });

        waveSurferRef.current = waveSurfer;

        return () => {
            waveSurfer.destroy();
        };
    }, [audioUrl, onReady]);

    return (
        <div className="w-full rounded-lg border border-border bg-surface p-[1px] shadow-[0_0_20px_rgba(59,130,246,0.06)]">
            <div className="rounded-[7px] bg-background/80 p-4">
                <div ref={containerRef} />
            </div>
        </div>
    );
};

export default WaveForm;