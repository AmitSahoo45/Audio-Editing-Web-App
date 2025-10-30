'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { AudioEncoder } from '@/lib/audio-encoder';

export function ExportPanel({ audioBuffer, fileName }: ExportPanelProps) {
    const [isExporting, setIsExporting] = useState(false);
    const [format, setFormat] = useState<'mp3' | 'wav'>('mp3');

    const handleExport = async () => {
        if (!audioBuffer)
            return;

        setIsExporting(true);

        try {
            const outputFileName = `${fileName.replace(/\.[^./\\]+$/, '')}.${format}`;

            if (format === 'mp3')
                await AudioEncoder.exportToMP3(audioBuffer, outputFileName);
            else
                await AudioEncoder.exportToWAV(audioBuffer, outputFileName);
        } catch (error) {
            console.error('Export failed:', error);
        } finally {
            setIsExporting(false);
        }
    }

    return (
        <div>
            <h3>Export Audio</h3>

            <section>
                <label className="text-sm text-slate-300">Format</label>

                <div>
                    <button
                        type="button"
                        onClick={() => setFormat('mp3')}
                        aria-pressed={format === 'mp3'}
                        className={`
                        px-4 py-2 rounded-lg font-medium transition-colors
                        ${format === 'mp3'
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}
                            `}
                    >
                        MP3
                    </button>

                    <button
                        type="button"
                        onClick={() => setFormat('wav')}
                        aria-pressed={format === 'wav'}
                        className={`
                        px-4 py-2 rounded-lg font-medium transition-colors
                        ${format === 'wav'
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}
                        `}
                    >
                        WAV
                    </button>
                </div>

            </section>

            <Button 
                onClick={handleExport}
                disabled={!audioBuffer || isExporting}
                className="w-full"
                type="button"
            >
                <Download className="mr-2 h-4 w-4" />
                {isExporting ? 'Exporting...' : `Export as ${format.toUpperCase()}`}
            </Button>
        </div>
    )
}