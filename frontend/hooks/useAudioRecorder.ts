import { useState, useRef, useCallback, useEffect } from 'react';

export const useAudioRecorder = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const startingRef = useRef(false);
    const cancelledRef = useRef(false);
    const startIdRef = useRef(0);

    const stopTracks = useCallback(() => {
        streamRef.current?.getTracks().forEach(track => track.stop());
        streamRef.current = null;
    }, []);

    const stopRecorderAndTracks = useCallback(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
        mediaRecorderRef.current = null;
        stopTracks();
        setIsRecording(false);
    }, [stopTracks]);

    const startRecording = useCallback(async () => {
        if (mediaRecorderRef.current || startingRef.current) {
            stopRecorderAndTracks();
        }

        const startId = ++startIdRef.current;
        startingRef.current = true;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true
            });

            if (cancelledRef.current || startId !== startIdRef.current) {
                stream.getTracks().forEach(track => track.stop());
                startingRef.current = false;
                return;
            }

            streamRef.current = stream;
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };
            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                setRecordedBlob(blob);
                streamRef.current?.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            };
            mediaRecorder.start();
            setIsRecording(true);
            startingRef.current = false;
        } catch (error) {
            startingRef.current = false;
            console.error('Error starting recording:', error);
            throw error;
        }
    }, [stopRecorderAndTracks]);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    }, []);

    const clearRecording = useCallback(() => {
        setRecordedBlob(null);
        chunksRef.current = [];
    }, []);

    useEffect(() => {
        cancelledRef.current = false;
        return () => {
            cancelledRef.current = true;
            startIdRef.current += 1;
            if (mediaRecorderRef.current?.state === 'recording') {
                mediaRecorderRef.current.stop();
            }
            mediaRecorderRef.current = null;
            streamRef.current?.getTracks().forEach(track => track.stop());
            streamRef.current = null;
            chunksRef.current = [];
        };
    }, []);

    return {
        isRecording,
        recordedBlob,
        startRecording,
        stopRecording,
        clearRecording,
    };
}
