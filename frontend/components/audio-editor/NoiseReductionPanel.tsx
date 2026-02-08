'use client';

import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import type { NoiseReductionMode } from '@/lib/noise-reduction';

interface NoiseReductionPanelProps {
    audioBuffer: AudioBuffer | null;
    onProcessed: (buffer: AudioBuffer, url: string) => void;
    audioContext: AudioContext | null;
}

const MODES: { id: NoiseReductionMode; label: string; description: string }[] = [
    { id: 'hum', label: 'Hum Removal', description: 'Remove 50/60 Hz electrical hum and harmonics' },
    { id: 'click', label: 'Click Repair', description: 'Detect and interpolate over transient clicks' },
    { id: 'deess', label: 'De-essing', description: 'Reduce harsh sibilance in vocals' },
    { id: 'room', label: 'Room Tone', description: 'Gate low-level background room noise' },
];

export default function NoiseReductionPanel({ audioBuffer, onProcessed, audioContext }: NoiseReductionPanelProps) {
    const [processing, setProcessing] = useState<NoiseReductionMode | null>(null);

    const handleProcess = async (mode: NoiseReductionMode) => {
        if (!audioBuffer || !audioContext) return;

        setProcessing(mode);
        try {
            // Dynamic import to keep the bundle lean until needed
            const { NoiseReduction } = await import('@/lib/noise-reduction');
            const nr = new NoiseReduction(audioContext);
            const processed = await nr.process(audioBuffer, mode);

            // Create a playable URL from the processed buffer
            const { AudioProcessor } = await import('@/lib/audio-processor');
            const processor = new AudioProcessor(audioContext);
            const blob = await processor.audioBufferToWav(processed);
            const url = URL.createObjectURL(blob);

            onProcessed(processed, url);
        } catch (error) {
            console.error(`Noise reduction (${mode}) failed:`, error);
        } finally {
            setProcessing(null);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    <span className="flex items-center gap-2">
                        <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                        Noise Reduction
                    </span>
                </CardTitle>
            </CardHeader>

            <div className="space-y-2">
                {MODES.map(({ id, label, description }) => (
                    <Button
                        key={id}
                        variant="secondary"
                        size="sm"
                        className="w-full justify-start text-left"
                        disabled={!audioBuffer || processing !== null}
                        onClick={() => handleProcess(id)}
                    >
                        {processing === id ? (
                            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                        ) : (
                            <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-purple-400" />
                        )}
                        <span className="flex flex-col items-start">
                            <span className="text-xs font-medium">{label}</span>
                            <span className="text-[10px] text-text-dim font-normal">{description}</span>
                        </span>
                    </Button>
                ))}
            </div>
        </Card>
    );
}
