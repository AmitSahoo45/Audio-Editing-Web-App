'use client';

import { Slider } from '@/components/ui/Slider';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { useAudioStore } from '@/store/audio-store';
import { EffectsPanelProps } from '@/types/audio';

export default function EffectsPanel({ onVolumeChange, onReverbChange, onEQChange }: EffectsPanelProps) {
    const {
        volume, reverb, eqLow, eqMid, eqHigh,
        setVolume, setReverb, setEqLow, setEqMid, setEqHigh,
    } = useAudioStore();

    const handleVolumeChange = (value: number[]) => {
        setVolume(value[0]);
        onVolumeChange(value[0] / 100);
    };

    const handleReverbChange = (value: number[]) => {
        setReverb(value[0]);
        onReverbChange(value[0]);
    };

    const handleEQLowChange = (value: number[]) => {
        setEqLow(value[0]);
        onEQChange(value[0], eqMid, eqHigh);
    };

    const handleEQMidChange = (value: number[]) => {
        setEqMid(value[0]);
        onEQChange(eqLow, value[0], eqHigh);
    };

    const handleEQHighChange = (value: number[]) => {
        setEqHigh(value[0]);
        onEQChange(eqLow, eqMid, value[0]);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Effects</CardTitle>
            </CardHeader>

            <div className="space-y-5">
                <Slider
                    label="Volume"
                    value={[volume]}
                    onValueChange={handleVolumeChange}
                    min={0}
                    max={150}
                    step={1}
                />

                <Slider
                    label="Reverb"
                    value={[reverb]}
                    onValueChange={handleReverbChange}
                    min={0}
                    max={10}
                    step={0.1}
                />

                <div className="space-y-3">
                    <p className="text-sm font-medium text-slate-300">Equalizer</p>
                    <Slider
                        label="Low"
                        value={[eqLow]}
                        onValueChange={handleEQLowChange}
                        min={-12}
                        max={12}
                        step={1}
                    />
                    <Slider
                        label="Mid"
                        value={[eqMid]}
                        onValueChange={handleEQMidChange}
                        min={-12}
                        max={12}
                        step={1}
                    />
                    <Slider
                        label="High"
                        value={[eqHigh]}
                        onValueChange={handleEQHighChange}
                        min={-12}
                        max={12}
                        step={1}
                    />
                </div>
            </div>
        </Card>
    );
}