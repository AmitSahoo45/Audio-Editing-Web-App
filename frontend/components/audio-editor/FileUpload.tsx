'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';

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
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input {...getInputProps()} />
            <Upload className='mx-auto h-12 w-12 text-slate-400 mb-4' />
            <p>
                {isDragActive
                    ? "Drop the audio file here..."
                    : "Drag and drop an audio file here, or click to select a file."}
            </p>
            <p>
                or click to browse (MP3, WAV, OGG, AAC, M4A)
            </p>
        </div>
    );
};

export default FileUpload;