'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';
import { FileUploadProps } from '@/types';

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect }) => {
    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0)
            onFileSelect(acceptedFiles[0]);
    }, [onFileSelect]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'audio/*': ['.mp3', '.wav', '.ogg', '.aac', '.m4a'], },
        maxFiles: 1
    });

    return (
        <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${
                isDragActive
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-slate-600 hover:border-slate-400'
            }`}
        >
            <input {...getInputProps()} />
            <Upload className='mx-auto h-12 w-12 text-slate-400 mb-4' />
            <p className="text-slate-300">
                {isDragActive
                    ? "Drop the audio file here..."
                    : "Drag and drop an audio file here, or click to select a file."}
            </p>
            <p className="text-sm text-slate-500 mt-2">
                Supported formats: MP3, WAV, OGG, AAC, M4A
            </p>
        </div>
    );
};

export default FileUpload;