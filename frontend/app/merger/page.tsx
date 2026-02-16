'use client';

import { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Upload, X, Play, Pause, GripVertical, Merge, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { toast, Toaster } from 'sonner';
import { useAudioContext } from '@/hooks/useAudioContext';
import { AudioProcessor } from '@/lib/audio-processor';
import { saveAs } from 'file-saver';

interface AudioFileItem {
    id: string;
    file: File;
    buffer: AudioBuffer | null;
    duration: number;
    isPlaying: boolean;
}

const MergerPage = () => {
    const [audioFiles, setAudioFiles] = useState<AudioFileItem[]>([]);
    const [outputFileName, setOutputFileName] = useState('merged-audio');
    const [isProcessing, setIsProcessing] = useState(false);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const audioContext = useAudioContext();
    const audioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map());

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (!audioContext) {
            toast.error('Audio context not initialized');
            return;
        }

        const processor = new AudioProcessor(audioContext);
        const newFiles: AudioFileItem[] = [];

        for (const file of acceptedFiles) {
            try {
                const buffer = await processor.loadAudioFile(file);
                newFiles.push({
                    id: `${Date.now()}-${Math.random()}`,
                    file,
                    buffer,
                    duration: buffer.duration,
                    isPlaying: false,
                });
            } catch (error) {
                toast.error(`Failed to load ${file.name}`);
                console.error(error);
            }
        }

        setAudioFiles((prev) => [...prev, ...newFiles]);
        if (newFiles.length > 0) {
            toast.success(`Added ${newFiles.length} file(s)`);
        }
    }, [audioContext]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'audio/*': ['.mp3', '.wav', '.ogg', '.aac', '.m4a'] },
        multiple: true,
    });

    const removeFile = useCallback((id: string) => {
        // Stop and cleanup audio element
        const audioElement = audioElementsRef.current.get(id);
        if (audioElement) {
            audioElement.pause();
            audioElement.src = '';
            audioElementsRef.current.delete(id);
        }
        
        setAudioFiles((prev) => prev.filter((f) => f.id !== id));
    }, []);

    const togglePlay = useCallback((id: string) => {
        const fileItem = audioFiles.find((f) => f.id === id);
        if (!fileItem) return;

        let audioElement = audioElementsRef.current.get(id);
        
        if (!audioElement) {
            audioElement = new Audio(URL.createObjectURL(fileItem.file));
            audioElement.onended = () => {
                setAudioFiles((prev) =>
                    prev.map((f) => (f.id === id ? { ...f, isPlaying: false } : f))
                );
            };
            audioElementsRef.current.set(id, audioElement);
        }

        if (fileItem.isPlaying) {
            audioElement.pause();
            audioElement.currentTime = 0;
            setAudioFiles((prev) =>
                prev.map((f) => (f.id === id ? { ...f, isPlaying: false } : f))
            );
        } else {
            audioElement.play();
            setAudioFiles((prev) =>
                prev.map((f) => (f.id === id ? { ...f, isPlaying: true } : f))
            );
        }
    }, [audioFiles]);

    const handleDragStart = (index: number) => {
        setDraggedIndex(index);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;

        const newFiles = [...audioFiles];
        const draggedFile = newFiles[draggedIndex];
        newFiles.splice(draggedIndex, 1);
        newFiles.splice(index, 0, draggedFile);

        setAudioFiles(newFiles);
        setDraggedIndex(index);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
    };

    const handleMerge = async () => {
        if (audioFiles.length < 2) {
            toast.error('Please add at least 2 audio files to merge');
            return;
        }

        if (!audioContext) {
            toast.error('Audio context not initialized');
            return;
        }

        setIsProcessing(true);
        try {
            const processor = new AudioProcessor(audioContext);
            const buffers = audioFiles
                .map((f) => f.buffer)
                .filter((b): b is AudioBuffer => b !== null);

            if (buffers.length !== audioFiles.length) {
                toast.error('Some files failed to load properly');
                setIsProcessing(false);
                return;
            }

            // Merge the buffers
            const mergedBuffer = processor.mergeAudioBuffers(buffers);
            
            // Convert to WAV blob
            const wavBlob = await processor.audioBufferToWav(mergedBuffer);
            
            // Save the file
            const fileName = outputFileName.trim() || 'merged-audio';
            saveAs(wavBlob, `${fileName}.wav`);
            
            toast.success('Audio files merged successfully!');
        } catch (error) {
            console.error('Merge failed:', error);
            toast.error('Failed to merge audio files');
        } finally {
            setIsProcessing(false);
        }
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const totalDuration = audioFiles.reduce((sum, f) => sum + f.duration, 0);

    return (
        <div className="flex h-screen flex-col overflow-hidden bg-background">
            <Toaster position="top-right" richColors />

            {/* Header */}
            <header className="flex h-11 shrink-0 items-center justify-between border-b border-border bg-surface px-4">
                <div className="flex items-center gap-3">
                    <Link href="/">
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div className="h-4 w-px bg-border" />
                    <h1 className="text-sm font-semibold text-foreground">Audio Merger</h1>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex flex-1 overflow-hidden p-6 gap-6">
                {/* Left Panel - File Upload & List */}
                <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                    {/* Upload Zone */}
                    {audioFiles.length === 0 && (
                        <div
                            {...getRootProps()}
                            className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${
                                isDragActive
                                    ? 'border-blue-500 bg-blue-500/10'
                                    : 'border-slate-600 hover:border-slate-400'
                            }`}
                        >
                            <input {...getInputProps()} />
                            <Upload className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                            <p className="text-slate-300 text-lg font-medium mb-2">
                                {isDragActive
                                    ? 'Drop the audio files here...'
                                    : 'Drag and drop audio files here'}
                            </p>
                            <p className="text-sm text-slate-500">
                                or click to select multiple files
                            </p>
                            <p className="text-xs text-slate-600 mt-2">
                                Supported formats: MP3, WAV, OGG, AAC, M4A
                            </p>
                        </div>
                    )}

                    {/* Compact Upload Button when files exist */}
                    {audioFiles.length > 0 && (
                        <div
                            {...getRootProps()}
                            className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                                isDragActive
                                    ? 'border-blue-500 bg-blue-500/10'
                                    : 'border-slate-600 hover:border-slate-400'
                            }`}
                        >
                            <input {...getInputProps()} />
                            <div className="flex items-center justify-center gap-2">
                                <Upload className="h-4 w-4 text-slate-400" />
                                <p className="text-sm text-slate-300">
                                    {isDragActive ? 'Drop files here...' : 'Add more files'}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Files List */}
                    {audioFiles.length > 0 && (
                        <Card className="flex-1 overflow-hidden flex flex-col">
                            <CardHeader>
                                <CardTitle className="text-sm">
                                    Audio Files ({audioFiles.length})
                                </CardTitle>
                            </CardHeader>
                            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
                                {audioFiles.map((fileItem, index) => (
                                    <div
                                        key={fileItem.id}
                                        draggable
                                        onDragStart={() => handleDragStart(index)}
                                        onDragOver={(e) => handleDragOver(e, index)}
                                        onDragEnd={handleDragEnd}
                                        className={`flex items-center gap-2 p-3 rounded-lg border border-border bg-surface cursor-move transition-colors ${
                                            draggedIndex === index ? 'opacity-50' : ''
                                        } hover:border-slate-500`}
                                    >
                                        <GripVertical className="h-4 w-4 text-slate-500 shrink-0" />
                                        
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-foreground truncate">
                                                {index + 1}. {fileItem.file.name}
                                            </p>
                                            <p className="text-xs text-text-dim">
                                                {formatDuration(fileItem.duration)} • {(fileItem.file.size / 1024 / 1024).toFixed(2)} MB
                                            </p>
                                        </div>

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 shrink-0"
                                            onClick={() => togglePlay(fileItem.id)}
                                        >
                                            {fileItem.isPlaying ? (
                                                <Pause className="h-4 w-4" />
                                            ) : (
                                                <Play className="h-4 w-4" />
                                            )}
                                        </Button>

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 shrink-0 text-red-400 hover:text-red-300"
                                            onClick={() => removeFile(fileItem.id)}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}
                </div>

                {/* Right Panel - Merge Settings */}
                <aside className="w-80 shrink-0 space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">Merge Settings</CardTitle>
                        </CardHeader>
                        <div className="px-4 pb-4 space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-2">
                                    Output File Name
                                </label>
                                <input
                                    type="text"
                                    value={outputFileName}
                                    onChange={(e) => setOutputFileName(e.target.value)}
                                    placeholder="merged-audio"
                                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <p className="text-xs text-slate-500 mt-1">
                                    Will be saved as .wav file
                                </p>
                            </div>

                            {audioFiles.length > 0 && (
                                <div className="pt-3 border-t border-border">
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-slate-400">Total Files:</span>
                                        <span className="text-foreground font-medium">{audioFiles.length}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-400">Total Duration:</span>
                                        <span className="text-foreground font-medium">{formatDuration(totalDuration)}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">Instructions</CardTitle>
                        </CardHeader>
                        <div className="px-4 pb-4 text-xs text-slate-400 space-y-2">
                            <p>1. Upload multiple audio files</p>
                            <p>2. Drag files to reorder them</p>
                            <p>3. Preview each file with play button</p>
                            <p>4. Set output filename</p>
                            <p>5. Click merge to combine all files</p>
                        </div>
                    </Card>

                    <Button
                        onClick={handleMerge}
                        disabled={audioFiles.length < 2 || isProcessing}
                        className="w-full"
                        size="lg"
                    >
                        {isProcessing ? (
                            <>Processing...</>
                        ) : (
                            <>
                                <Merge className="mr-2 h-4 w-4" />
                                Merge {audioFiles.length} Files
                            </>
                        )}
                    </Button>
                </aside>
            </div>
        </div>
    );
};

export default MergerPage;
