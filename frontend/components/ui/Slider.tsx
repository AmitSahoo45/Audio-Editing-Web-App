'use client';

import * as React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';

interface SliderProps {
    value: number[];
    onValueChange: (value: number[]) => void;
    min?: number;
    max?: number;
    step?: number;
    label?: string;
    className?: string;
}

export function Slider({ value, onValueChange, min = 0, max = 100, step = 1, label, className = '' }: SliderProps) {
    const [showTooltip, setShowTooltip] = React.useState(false);

    return (
        <div className={`flex flex-col gap-1.5 ${className}`}>
            {label && (
                <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-text-muted">{label}</label>
                    <span className="text-xs tabular-nums text-text-dim">{value[0]}</span>
                </div>
            )}
            <SliderPrimitive.Root
                className="relative flex h-4 w-full touch-none items-center select-none"
                value={value}
                onValueChange={onValueChange}
                min={min}
                max={max}
                step={step}
                onPointerEnter={() => setShowTooltip(true)}
                onPointerLeave={() => setShowTooltip(false)}
            >
                <SliderPrimitive.Track className="relative h-[3px] w-full grow rounded-full bg-border">
                    <SliderPrimitive.Range className="absolute h-full rounded-full bg-accent" />
                </SliderPrimitive.Track>
                <SliderPrimitive.Thumb className="relative block h-3 w-3 rounded-full border border-accent bg-foreground shadow-[0_0_4px_rgba(59,130,246,0.3)] transition-transform hover:scale-125 focus:outline-none focus:ring-1 focus:ring-accent/50">
                    {showTooltip && (
                        <span role="tooltip" aria-live="polite" className="absolute -top-7 left-1/2 -translate-x-1/2 rounded bg-surface-raised border border-border px-1.5 py-0.5 text-[10px] tabular-nums text-foreground whitespace-nowrap">
                            {value[0]}
                        </span>
                    )}
                </SliderPrimitive.Thumb>
            </SliderPrimitive.Root>
        </div>
    );
}