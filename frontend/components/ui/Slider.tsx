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
    return (
        <div className={`flex flex-col gap-2 ${className}`}>
            {label && (
                <div className="flex items-center justify-between">
                    <label className="text-sm text-slate-300">{label}</label>
                    <span className="text-sm text-slate-400">{value[0]}</span>
                </div>
            )}
            <SliderPrimitive.Root
                className="relative flex h-5 w-full touch-none items-center select-none"
                value={value}
                onValueChange={onValueChange}
                min={min}
                max={max}
                step={step}
            >
                <SliderPrimitive.Track className="relative h-1.5 w-full grow rounded-full bg-slate-700">
                    <SliderPrimitive.Range className="absolute h-full rounded-full bg-blue-500" />
                </SliderPrimitive.Track>
                <SliderPrimitive.Thumb className="block h-4 w-4 rounded-full bg-white shadow-md transition-colors hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </SliderPrimitive.Root>
        </div>
    );
}