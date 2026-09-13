'use client';

import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { AudioEncoder } from '@/lib/audio-encoder';
import { renderEffects } from '@/lib/render-effects';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { useAudioStore } from '@/store/audio-store';
import { ExportPanelProps } from '@/types';

const BITRATE_OPTIONS = [64, 128, 192, 256, 320];
const SAMPLE_RATE_OPTIONS = [22050, 44100, 48000];

export function ExportPanel({ audioBuffer, fileName }: ExportPanelProps) {
    const {
        isExporting, exportFormat: format, exportBitrate: bitrate, exportSampleRate: sampleRate,
        volume, reverb, eqLow, eqMid, eqHigh,
        setIsExporting, setExportFormat: setFormat, setExportBitrate: setBitrate, setExportSampleRate: setSampleRate,
    } = useAudioStore();

    const handleExport = async () => {
        if (!audioBuffer) return;

        setIsExporting(true);

        try {
            const rendered = await renderEffects(audioBuffer, {
                volume,
                reverb,
                eqLow,
                eqMid,
                eqHigh,
            });

            const outputFileName = `${fileName.replace(/\.[^./\\]+$/, '')}.${format}`;
            const options = {
                bitrate,
                ...(sampleRate != null ? { sampleRate } : {}),
            };

            if (format === 'mp3')
                await AudioEncoder.exportToMP3(rendered, outputFileName, options);
            else
                await AudioEncoder.exportToWAV(rendered, outputFileName, options);

            toast.success(`Exported as ${format.toUpperCase()}.`);
        } catch (error) {
            console.error('Export failed:', error);
            toast.error('Export failed.');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Export Audio</CardTitle>
            </CardHeader>

            <div className="space-y-4">
                <div>
                    <label className="text-xs font-medium text-text-muted">Format</label>
                    <div className="mt-2 flex gap-2">
                        <button
                            type="button"
                            onClick={() => setFormat('mp3')}
                            aria-pressed={format === 'mp3'}
                            className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
                                format === 'mp3'
                                    ? 'bg-accent text-white'
                                    : 'bg-surface-raised text-text-muted border border-border hover:bg-border/50'
                            }`}
                        >
                            MP3
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormat('wav')}
                            aria-pressed={format === 'wav'}
                            className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
                                format === 'wav'
                                    ? 'bg-accent text-white'
                                    : 'bg-surface-raised text-text-muted border border-border hover:bg-border/50'
                            }`}
                        >
                            WAV
                        </button>
                    </div>
                </div>

                {format === 'mp3' && (
                    <div>
                        <label className="text-xs font-medium text-text-muted">Bitrate (kbps)</label>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                            {BITRATE_OPTIONS.map((br) => (
                                <button
                                    key={br}
                                    type="button"
                                    onClick={() => setBitrate(br)}
                                    aria-pressed={bitrate === br}
                                    className={`px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-colors ${
                                        bitrate === br
                                            ? 'bg-accent text-white'
                                            : 'bg-surface-raised text-text-muted border border-border hover:bg-border/50'
                                    }`}
                                >
                                    {br}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div>
                    <label className="text-xs font-medium text-text-muted">Sample Rate (Hz)</label>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                        <button
                            type="button"
                            onClick={() => setSampleRate(null)}
                            aria-pressed={sampleRate === null}
                            className={`px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-colors ${
                                sampleRate === null
                                    ? 'bg-accent text-white'
                                    : 'bg-surface-raised text-text-muted border border-border hover:bg-border/50'
                            }`}
                        >
                            Original
                        </button>
                        {SAMPLE_RATE_OPTIONS.map((sr) => (
                            <button
                                key={sr}
                                type="button"
                                onClick={() => setSampleRate(sr)}
                                aria-pressed={sampleRate === sr}
                                className={`px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-colors ${
                                    sampleRate === sr
                                        ? 'bg-accent text-white'
                                        : 'bg-surface-raised text-text-muted border border-border hover:bg-border/50'
                                }`}
                            >
                                {sr.toLocaleString()}
                            </button>
                        ))}
                    </div>
                </div>

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
        </Card>
    );
}
