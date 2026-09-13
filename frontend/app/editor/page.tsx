'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import FileUpload from '@/components/audio-editor/FileUpload';
import AudioPlayer, { type AudioPlayerHandle } from '@/components/audio-editor/AudioPlayer';
import EffectsPanel from '@/components/audio-editor/EffectsPanel';
import { ExportPanel } from '@/components/audio-editor/ExportPanel';
import NoiseReductionPanel from '@/components/audio-editor/NoiseReductionPanel';
import { useAudioContext } from '@/hooks/useAudioContext';
import { AudioProcessor } from '@/lib/audio-processor';
import { useAudioStore } from '@/store/audio-store';
import { useAudioWorker } from '@/hooks/useAudioWorker';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { usePlaybackGraph } from '@/hooks/usePlaybackGraph';
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
        audioUrl,
        audioBuffer,
        fileName,
        isProcessing,
        isPlaying,
        volume,
        reverb,
        eqLow,
        eqMid,
        eqHigh,
        setAudioState,
        setIsProcessing,
        setIsPlaying,
        resetEditor,
    } = useAudioStore();

    const { undo, redo } = useAudioStore.temporal.getState();

    const playerRef = useRef<AudioPlayerHandle | null>(null);
    const opIdRef = useRef(0);
    const pendingFileRef = useRef<File | null>(null);
    const [mediaElement, setMediaElement] = useState<HTMLMediaElement | null>(null);

    const { analyser } = usePlaybackGraph({
        audioContext,
        mediaElement,
        params: { volume, reverb, eqLow, eqMid, eqHigh },
        enabled: !!audioUrl && !!mediaElement,
    });

    const loadFile = useCallback(async (file: File, context: AudioContext) => {
        const opId = ++opIdRef.current;
        setIsProcessing(true);
        try {
            const processor = new AudioProcessor(context);
            const buffer = await processor.loadAudioFile(file);
            if (opId !== opIdRef.current) return;

            const url = URL.createObjectURL(file);
            setAudioState({
                audioFile: file,
                audioUrl: url,
                audioBuffer: buffer,
                fileName: file.name,
            });
        } catch (error) {
            if (opId !== opIdRef.current) return;
            toast.error((error as Error).message || 'Failed to load audio file.');
            resetEditor();
        } finally {
            if (opId === opIdRef.current) setIsProcessing(false);
        }
    }, [setAudioState, setIsProcessing, resetEditor]);

    const handleFileSelect = useCallback(async (file: File) => {
        if (!audioContext) {
            pendingFileRef.current = file;
            return;
        }
        pendingFileRef.current = null;
        await loadFile(file, audioContext);
    }, [audioContext, loadFile]);

    useEffect(() => {
        if (!audioContext || !pendingFileRef.current) return;
        const file = pendingFileRef.current;
        pendingFileRef.current = null;
        void loadFile(file, audioContext);
    }, [audioContext, loadFile]);

    const handleRecordingToggle = useCallback(async () => {
        if (isRecording) {
            stopRecording();
            return;
        }
        clearRecording();
        try {
            await startRecording();
        } catch (error) {
            toast.error((error as Error).message || 'Failed to start recording.');
        }
    }, [isRecording, startRecording, stopRecording, clearRecording]);

    const handleUseRecording = useCallback(async () => {
        if (!recordedBlob) return;
        if (!audioContext) {
            toast.error('Web Audio is not available.');
            return;
        }

        const opId = ++opIdRef.current;
        setIsProcessing(true);
        const file = new File(
            [recordedBlob],
            'recording.webm',
            { type: recordedBlob.type || 'audio/webm' }
        );

        try {
            const arrayBuffer = await recordedBlob.arrayBuffer();
            const buffer = await audioContext.decodeAudioData(arrayBuffer);
            if (opId !== opIdRef.current) return;

            const url = URL.createObjectURL(recordedBlob);
            setAudioState({
                audioFile: file,
                audioUrl: url,
                audioBuffer: buffer,
                fileName: 'recording.webm',
            });
        } catch {
            if (opId !== opIdRef.current) return;
            toast.error('Failed to decode recorded audio. The recording may be corrupted or in an unsupported format.');
        } finally {
            if (opId === opIdRef.current) setIsProcessing(false);
        }
    }, [recordedBlob, audioContext, setAudioState, setIsProcessing]);

    const handleNormalize = useCallback(async () => {
        if (!audioBuffer || !audioContext) return;
        const opId = ++opIdRef.current;
        setIsProcessing(true);
        try {
            const normalized = await normalizeAudio(audioBuffer, audioContext);
            if (opId !== opIdRef.current) return;

            const blob = await audioBufferToWav(normalized);
            const url = URL.createObjectURL(blob);
            setAudioState({ audioBuffer: normalized, audioUrl: url });
            toast.success('Audio normalized.');
        } catch (error) {
            if (opId !== opIdRef.current) return;
            console.error('Normalization failed:', error);
            toast.error('Normalization failed.');
        } finally {
            if (opId === opIdRef.current) setIsProcessing(false);
        }
    }, [audioBuffer, audioContext, setIsProcessing, setAudioState, normalizeAudio, audioBufferToWav]);

    const handleTrim = useCallback(async () => {
        if (!audioBuffer || !audioContext) return;
        const range = playerRef.current?.getTrimRange() ?? null;
        if (!range) {
            toast.error('Drag on the waveform to select a region');
            return;
        }

        const opId = ++opIdRef.current;
        setIsProcessing(true);
        try {
            const trimmed = await trimAudio(
                audioBuffer,
                range.start,
                range.end,
                audioContext
            );
            if (opId !== opIdRef.current) return;

            const blob = await audioBufferToWav(trimmed);
            const url = URL.createObjectURL(blob);
            setAudioState({ audioBuffer: trimmed, audioUrl: url });
            toast.success('Audio trimmed.');
        } catch (error) {
            if (opId !== opIdRef.current) return;
            console.error('Trim failed:', error);
            toast.error('Trim failed.');
        } finally {
            if (opId === opIdRef.current) setIsProcessing(false);
        }
    }, [audioBuffer, audioContext, setIsProcessing, setAudioState, trimAudio, audioBufferToWav]);

    const handleNoiseReductionProcessed = useCallback((processed: AudioBuffer, url: string) => {
        const { audioUrl: currentUrl } = useAudioStore.getState();
        if (!currentUrl || opIdRef.current === 0) {
            URL.revokeObjectURL(url);
            return;
        }
        setAudioState({ audioBuffer: processed, audioUrl: url });
        toast.success('Noise reduction applied.');
    }, [setAudioState]);

    const handleLoadNewFile = useCallback(() => {
        opIdRef.current = 0;
        pendingFileRef.current = null;
        setMediaElement(null);
        resetEditor();
        useAudioStore.temporal.getState().clear();
    }, [resetEditor]);

    const handlePlayPause = useCallback(() => {
        if (isPlaying) {
            playerRef.current?.pause();
        } else {
            playerRef.current?.play();
        }
    }, [isPlaying]);

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

            <header className="flex h-11 shrink-0 items-center justify-between border-b border-border bg-surface px-4">
                <div className="flex items-center gap-3">
                    <Button asChild variant="ghost" size="icon" className="h-7 w-7">
                        <Link href="/">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div className="h-4 w-px bg-border" />
                    <h1 className="text-sm font-semibold text-foreground">Audio Editor</h1>
                    <span className="text-xs text-text-dim">
                        {audioUrl ? fileName : 'No file loaded'}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <Button asChild variant="ghost" size="sm" className="h-7 text-xs gap-1">
                        <Link href="/merger">
                            <Merge className="h-3.5 w-3.5" />
                            Merger
                        </Link>
                    </Button>
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
                <div className="flex flex-1 overflow-hidden">
                    <div className="flex flex-1 flex-col overflow-y-auto p-4 gap-4">
                        <AudioPlayer
                            audioUrl={audioUrl}
                            onPlaybackChange={setIsPlaying}
                            onMediaReady={setMediaElement}
                            playerRef={playerRef}
                        />

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
                                    Trim Region
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
                                    onClick={handleLoadNewFile}
                                    variant="ghost"
                                    size="sm"
                                >
                                    Load New File
                                </Button>
                            </div>
                        </Card>
                    </div>

                    <aside className="w-80 shrink-0 overflow-y-auto border-l border-border bg-surface p-4 space-y-4">
                        <EffectsPanel />

                        <NoiseReductionPanel
                            audioBuffer={audioBuffer}
                            audioContext={audioContext}
                            onProcessed={handleNoiseReductionProcessed}
                        />

                        <FrequencyVisualizer analyser={analyser} isPlaying={isPlaying} />

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
