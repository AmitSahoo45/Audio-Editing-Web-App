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
            waveColor: '#4F4A85',
            progressColor: '#383351',
            cursorColor: '#FFFFFF',
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
        <div className="w-full rounded-xl bg-slate-800/50 p-4">
            <div ref={containerRef} />
        </div>
    );
};

export default WaveForm;