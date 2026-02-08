'use client';

import { useState, useCallback, useRef } from 'react';
import FileUpload from '@/components/audio-editor/FileUpload';
import AudioPlayer from '@/components/audio-editor/AudioPlayer';
import EffectsPanel from '@/components/audio-editor/EffectsPanel';
import { ExportPanel } from '@/components/audio-editor/ExportPanel';
import { useAudioContext } from '@/hooks/useAudioContext';
import { AudioProcessor } from '@/lib/audio-processor';
import { AudioEffects } from '@/lib/audio-effects';
import { Button } from '@/components/ui/Button';
import { Mic, MicOff, Scissors, Volume2, ArrowLeft } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import Link from 'next/link';

const EditorPage = () => {
    const audioContext = useAudioContext();
    const { isRecording, recordedBlob, startRecording, stopRecording, clearRecording } = useAudioRecorder();

    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
    const [fileName, setFileName] = useState<string>('audio');
    const [isProcessing, setIsProcessing] = useState(false);

    const audioEffectsRef = useRef<AudioEffects | null>(null);

    const handleFileSelect = useCallback(async (file: File) => {
        setAudioFile(file);
        setFileName(file.name);

        const url = URL.createObjectURL(file);
        setAudioUrl(url);

        if (audioContext) {
            const processor = new AudioProcessor(audioContext);
            const buffer = await processor.loadAudioFile(file);
            setAudioBuffer(buffer);

            const effects = new AudioEffects();
            await effects.initialize(url);
            audioEffectsRef.current = effects;
        }
    }, [audioContext]);

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

            const arrayBuffer = await recordedBlob.arrayBuffer();
            const buffer = await audioContext.decodeAudioData(arrayBuffer);
            setAudioBuffer(buffer);

            const effects = new AudioEffects();
            await effects.initialize(url);
            audioEffectsRef.current = effects;
        }
    }, [recordedBlob, audioContext]);

    const handleNormalize = useCallback(async () => {
        if (!audioBuffer || !audioContext) return;
        setIsProcessing(true);
        try {
            const processor = new AudioProcessor(audioContext);
            const normalized = processor.normalizeAudio(audioBuffer);
            setAudioBuffer(normalized);

            const blob = await processor.audioBufferToWav(normalized);
            const url = URL.createObjectURL(blob);
            setAudioUrl(url);
        } catch (error) {
            console.error('Normalization failed:', error);
        } finally {
            setIsProcessing(false);
        }
    }, [audioBuffer, audioContext]);

    const handleTrim = useCallback(async () => {
        if (!audioBuffer || !audioContext) return;
        setIsProcessing(true);
        try {
            const processor = new AudioProcessor(audioContext);
            const duration = audioBuffer.duration;
            // Trim 10% from start and end as a default trim
            const trimmed = processor.trimAudio(
                audioBuffer,
                duration * 0.1,
                duration * 0.9
            );
            setAudioBuffer(trimmed);

            const blob = await processor.audioBufferToWav(trimmed);
            const url = URL.createObjectURL(blob);
            setAudioUrl(url);
        } catch (error) {
            console.error('Trim failed:', error);
        } finally {
            setIsProcessing(false);
        }
    }, [audioBuffer, audioContext]);

    const handleVolumeChange = useCallback((volume: number) => {
        audioEffectsRef.current?.setVolume(volume);
    }, []);

    const handleReverbChange = useCallback((decay: number) => {
        audioEffectsRef.current?.setReverb(decay);
    }, []);

    const handleEQChange = useCallback((low: number, mid: number, high: number) => {
        audioEffectsRef.current?.setEQ(low, mid, high);
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black p-4 md:p-8">
            <div className="mx-auto max-w-7xl">
                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/">
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Audio Editor</h1>
                            <p className="text-sm text-slate-400">
                                {audioFile ? fileName : 'Upload or record audio to get started'}
                            </p>
                        </div>
                    </div>
                </div>

                {!audioUrl ? (
                    /* Upload / Record Section */
                    <div className="space-y-6">
                        <FileUpload onFileSelect={handleFileSelect} />

                        <div className="flex items-center gap-4">
                            <div className="h-px flex-1 bg-slate-700" />
                            <span className="text-sm text-slate-500">or record audio</span>
                            <div className="h-px flex-1 bg-slate-700" />
                        </div>

                        <div className="flex flex-col items-center gap-4">
                            <Button
                                onClick={handleRecordingToggle}
                                variant={isRecording ? 'destructive' : 'default'}
                                size="lg"
                            >
                                {isRecording ? (
                                    <>
                                        <MicOff className="mr-2 h-5 w-5" />
                                        Stop Recording
                                    </>
                                ) : (
                                    <>
                                        <Mic className="mr-2 h-5 w-5" />
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
                ) : (
                    /* Editor Section */
                    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
                        {/* Main Editor Area */}
                        <div className="space-y-6">
                            <AudioPlayer audioUrl={audioUrl} />

                            {/* Processing Tools */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Processing</CardTitle>
                                </CardHeader>
                                <div className="flex flex-wrap gap-3">
                                    <Button
                                        onClick={handleTrim}
                                        disabled={isProcessing || !audioBuffer}
                                        variant="secondary"
                                    >
                                        <Scissors className="mr-2 h-4 w-4" />
                                        Trim Edges
                                    </Button>
                                    <Button
                                        onClick={handleNormalize}
                                        disabled={isProcessing || !audioBuffer}
                                        variant="secondary"
                                    >
                                        <Volume2 className="mr-2 h-4 w-4" />
                                        Normalize
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            setAudioUrl(null);
                                            setAudioBuffer(null);
                                            setAudioFile(null);
                                            audioEffectsRef.current?.dispose();
                                            audioEffectsRef.current = null;
                                        }}
                                        variant="ghost"
                                    >
                                        Load New File
                                    </Button>
                                </div>
                            </Card>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            <EffectsPanel
                                audioUrl={audioUrl}
                                onVolumeChange={handleVolumeChange}
                                onReverbChange={handleReverbChange}
                                onEQChange={handleEQChange}
                            />

                            <ExportPanel
                                audioBuffer={audioBuffer}
                                fileName={fileName}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EditorPage;