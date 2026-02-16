'use client';

import { useCallback, useRef } from 'react';
import FileUpload from '@/components/audio-editor/FileUpload';
import AudioPlayer from '@/components/audio-editor/AudioPlayer';
import EffectsPanel from '@/components/audio-editor/EffectsPanel';
import { ExportPanel } from '@/components/audio-editor/ExportPanel';
import NoiseReductionPanel from '@/components/audio-editor/NoiseReductionPanel';
import { useAudioContext } from '@/hooks/useAudioContext';
import { AudioProcessor } from '@/lib/audio-processor';
import { AudioEffects } from '@/lib/audio-effects';
import { useAudioStore } from '@/store/audio-store';
import { useAudioWorker } from '@/hooks/useAudioWorker';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { Button } from '@/components/ui/Button';
import { Mic, MicOff, Scissors, Volume2, ArrowLeft, Undo2, Redo2, Merge } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { Toaster, toast } from 'sonner';
import FrequencyVisualizer from '@/components/audio-editor/FrequencyVisualizer';
import Link from 'next/link';

const EditorPage = () => {
    const audioContext = useAudioContext();
    const { isRecording, recordedBlob, startRecording, stopRecording, clearRecording } = useAudioRecorder();
    const { trimAudio, normalizeAudio, audioBufferToWav } = useAudioWorker();

    const {
        audioFile,
        audioUrl,
        audioBuffer,
        fileName,
        isProcessing,
        isPlaying,
        setAudioFile,
        setAudioUrl,
        setAudioBuffer,
        setFileName,
        setIsProcessing,
        setIsPlaying,
        resetEditor,
    } = useAudioStore();

    const { undo, redo } = useAudioStore.temporal.getState();

    const audioEffectsRef = useRef<AudioEffects | null>(null);
    const playerRef = useRef<{ play: () => void; pause: () => void } | null>(null);

    const handleFileSelect = useCallback(async (file: File) => {
        setAudioFile(file);
        setFileName(file.name);

        const url = URL.createObjectURL(file);
        setAudioUrl(url);

        if (audioContext) {
            try {
                const processor = new AudioProcessor(audioContext);
                const buffer = await processor.loadAudioFile(file);
                setAudioBuffer(buffer);

                const effects = new AudioEffects();
                await effects.initialize(url);
                audioEffectsRef.current = effects;
            } catch (error) {
                toast.error((error as Error).message || 'Failed to load audio file.');
                resetEditor();
            }
        }
    }, [audioContext, setAudioFile, setFileName, setAudioUrl, setAudioBuffer, resetEditor]);

    const handleRecordingToggle = useCallback(async () => {
        if (isRecording) {
            stopRecording();
        } else {
            clearRecording();
            await startRecording();
        }
    }, [isRecording, startRecording, stopRecording, clearRecording]);

    // Load recorded audio when recording stops
    const handleUseRecording = useCallback(async () => {
        if (recordedBlob && audioContext) {
            const url = URL.createObjectURL(recordedBlob);
            setAudioUrl(url);
            setFileName('recording.webm');

            try {
                const arrayBuffer = await recordedBlob.arrayBuffer();
                const buffer = await audioContext.decodeAudioData(arrayBuffer);
                setAudioBuffer(buffer);

                const effects = new AudioEffects();
                await effects.initialize(url);
                audioEffectsRef.current = effects;
            } catch {
                toast.error('Failed to decode recorded audio. The recording may be corrupted or in an unsupported format.');
            }
        }
    }, [recordedBlob, audioContext, setAudioUrl, setFileName, setAudioBuffer]);

    const handleNormalize = useCallback(async () => {
        if (!audioBuffer || !audioContext) return;
        setIsProcessing(true);
        try {
            const normalized = await normalizeAudio(audioBuffer, audioContext);
            setAudioBuffer(normalized);

            const blob = await audioBufferToWav(normalized);
            const url = URL.createObjectURL(blob);
            setAudioUrl(url);
            toast.success('Audio normalized.');
        } catch (error) {
            console.error('Normalization failed:', error);
            toast.error('Normalization failed.');
        } finally {
            setIsProcessing(false);
        }
    }, [audioBuffer, audioContext, setIsProcessing, setAudioBuffer, setAudioUrl, normalizeAudio, audioBufferToWav]);

    const handleTrim = useCallback(async () => {
        if (!audioBuffer || !audioContext) return;
        setIsProcessing(true);
        try {
            const duration = audioBuffer.duration;
            // Trim 10% from start and end as a default trim
            const trimmed = await trimAudio(
                audioBuffer,
                duration * 0.1,
                duration * 0.9,
                audioContext
            );
            setAudioBuffer(trimmed);

            const blob = await audioBufferToWav(trimmed);
            const url = URL.createObjectURL(blob);
            setAudioUrl(url);
            toast.success('Audio trimmed.');
        } catch (error) {
            console.error('Trim failed:', error);
            toast.error('Trim failed.');
        } finally {
            setIsProcessing(false);
        }
    }, [audioBuffer, audioContext, setIsProcessing, setAudioBuffer, setAudioUrl, trimAudio, audioBufferToWav]);

    const handleVolumeChange = useCallback((volume: number) => {
        audioEffectsRef.current?.setVolume(volume);
    }, []);

    const handleReverbChange = useCallback((decay: number) => {
        audioEffectsRef.current?.setReverb(decay);
    }, []);

    const handleEQChange = useCallback((low: number, mid: number, high: number) => {
        audioEffectsRef.current?.setEQ(low, mid, high);
    }, []);

    const handleNoiseReductionProcessed = useCallback(async (processed: AudioBuffer, url: string) => {
        setAudioBuffer(processed);
        setAudioUrl(url);

        // Re-initialize effects with the new URL
        audioEffectsRef.current?.dispose();
        const effects = new AudioEffects();
        await effects.initialize(url);
        audioEffectsRef.current = effects;
        toast.success('Noise reduction applied.');
    }, [setAudioBuffer, setAudioUrl]);

    const handlePlayPause = useCallback(() => {
        if (isPlaying) {
            playerRef.current?.pause();
        } else {
            playerRef.current?.play();
        }
    }, [isPlaying]);

    // Keyboard shortcuts
    useKeyboardShortcuts({
        onPlayPause: handlePlayPause,
        onTrim: handleTrim,
        onNormalize: handleNormalize,
        onUndo: undo,
        onRedo: redo,
    });

    return (
        <div className="flex h-screen flex-col overflow-hidden bg-background">
            <Toaster position="top-right" richColors />

            {/* Slim Toolbar Header */}
            <header className="flex h-11 shrink-0 items-center justify-between border-b border-border bg-surface px-4">
                <div className="flex items-center gap-3">
                    <Link href="/">
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div className="h-4 w-px bg-border" />
                    <h1 className="text-sm font-semibold text-foreground">Audio Editor</h1>
                    <span className="text-xs text-text-dim">
                        {audioFile ? fileName : 'No file loaded'}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <Link href="/merger">
                        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                            <Merge className="h-3.5 w-3.5" />
                            Merger
                        </Button>
                    </Link>
                    {audioUrl && (
                        <div className="flex items-center gap-1">
                            <div className="h-4 w-px bg-border mx-1" />
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => undo()} title="Undo (Ctrl+Z)">
                                <Undo2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => redo()} title="Redo (Ctrl+Shift+Z)">
                                <Redo2 className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    )}
                </div>
            </header>

            {!audioUrl ? (
                /* Upload / Record Section - centered on screen */
                <div className="flex flex-1 items-center justify-center p-8">
                    <div className="w-full max-w-lg space-y-6">
                        <FileUpload onFileSelect={handleFileSelect} />

                        <div className="flex items-center gap-4">
                            <div className="h-px flex-1 bg-border" aria-hidden="true" />
                            <span className="text-xs text-text-dim">or record audio</span>
                            <div className="h-px flex-1 bg-border" aria-hidden="true" />
                        </div>

                        <div className="flex flex-col items-center gap-4">
                            <Button
                                onClick={handleRecordingToggle}
                                variant={isRecording ? 'destructive' : 'default'}
                                size="lg"
                            >
                                {isRecording ? (
                                    <>
                                        <MicOff className="mr-2 h-4 w-4" />
                                        Stop Recording
                                    </>
                                ) : (
                                    <>
                                        <Mic className="mr-2 h-4 w-4" />
                                        Start Recording
                                    </>
                                )}
                            </Button>

                            {recordedBlob && !isRecording && (
                                <Button onClick={handleUseRecording} variant="secondary">
                                    Use Recording
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                /* Editor Section - Desktop App Layout */
                <div className="flex flex-1 overflow-hidden">
                    {/* Main Workspace */}
                    <div className="flex flex-1 flex-col overflow-y-auto p-4 gap-4">
                        {/* Waveform Canvas Area */}
                        <AudioPlayer
                            audioUrl={audioUrl}
                            onPlaybackChange={setIsPlaying}
                            playerRef={playerRef}
                        />

                        {/* Processing Tools */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Processing</CardTitle>
                            </CardHeader>
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    onClick={handleTrim}
                                    disabled={isProcessing || !audioBuffer}
                                    variant="secondary"
                                    size="sm"
                                >
                                    <Scissors className="mr-1.5 h-3.5 w-3.5" />
                                    Trim Edges
                                </Button>
                                <Button
                                    onClick={handleNormalize}
                                    disabled={isProcessing || !audioBuffer}
                                    variant="secondary"
                                    size="sm"
                                >
                                    <Volume2 className="mr-1.5 h-3.5 w-3.5" />
                                    Normalize
                                </Button>
                                <Button
                                    onClick={() => {
                                        audioEffectsRef.current?.dispose();
                                        audioEffectsRef.current = null;
                                        resetEditor();
                                    }}
                                    variant="ghost"
                                    size="sm"
                                >
                                    Load New File
                                </Button>
                            </div>
                        </Card>
                    </div>

                    {/* Fixed Sidebar */}
                    <aside className="w-80 shrink-0 overflow-y-auto border-l border-border bg-surface p-4 space-y-4">
                        <EffectsPanel
                            audioUrl={audioUrl}
                            onVolumeChange={handleVolumeChange}
                            onReverbChange={handleReverbChange}
                            onEQChange={handleEQChange}
                        />

                        <NoiseReductionPanel
                            audioBuffer={audioBuffer}
                            audioContext={audioContext}
                            onProcessed={handleNoiseReductionProcessed}
                        />

                        <FrequencyVisualizer audioUrl={audioUrl} />

                        <ExportPanel
                            audioBuffer={audioBuffer}
                            fileName={fileName}
                        />
                    </aside>
                </div>
            )}
        </div>
    );
};

export default EditorPage;