'use client';

import { Play, Pause, Square, SkipForward, SkipBack } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ControlProps } from '@/types'

const Controls = ({ isPlaying, onPlay, onPause, onStop, onSkipForward, onSkipBackward }: ControlProps) => {
    return (
        <div className="flex items-center justify-center gap-2">
            <Button
                variant='ghost'
                size='icon'
                onClick={onSkipBackward}
                className='text-slate-300 hover:text-white'
            >
                <SkipBack className='h-5 w-5' />
            </Button>

            {isPlaying ? (
                <Button
                    variant='default'
                    size='icon'
                    onClick={onPause}
                    className='h-12 w-12'
                >
                    <Pause className='h-6 w-6' />
                </Button>    
            ) : (
                <Button
                    variant='default'
                    size='icon'
                    onClick={onPlay}
                    className='h-12 w-12'
                >
                    <Play className='h-6 w-6 ml-1' />
                </Button>
            )}

            <Button
                variant='ghost'
                size='icon'
                onClick={onStop}
                className='text-slate-300 hover:text-white'
            >
                <Square className='h-5 w-5' />
            </Button>

            <Button
                variant='ghost'
                size='icon'
                onClick={onSkipForward}
                className='text-slate-300 hover:text-white'
            >
                <SkipForward className='h-5 w-5' />
            </Button>
        </div>
    );
};

export default Controls;