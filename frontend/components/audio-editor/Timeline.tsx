'use client';

import { formatTime } from '@/utils/format-time';
import { TimelineProps } from '@/types/audio';

export default function Timeline({ currentTime, duration, onSeek }: TimelineProps) {
    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const clickPosition = (e.clientX - rect.left) / rect.width;
        onSeek(Math.max(0, Math.min(1, clickPosition)));
    };

    return (
        <div className="w-full space-y-2">
            <div
                className="relative h-2 w-full cursor-pointer rounded-full bg-slate-700"
                onClick={handleClick}
            >
                <div
                    className="absolute left-0 top-0 h-full rounded-full bg-blue-500 transition-all"
                    style={{ width: `${progress}%` }}
                />
                <div
                    className="absolute top-1/2 h-3.5 w-3.5 rounded-full bg-white shadow-md transition-all"
                    style={{ left: `${progress}%`, transform: `translateX(-50%) translateY(-50%)` }}
                />
            </div>
            <div className="flex justify-between text-xs text-slate-400">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
            </div>
        </div>
    );
}