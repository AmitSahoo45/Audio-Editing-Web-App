import { useEffect, useState, useRef } from "react";

export const useAudioContext = () => {
    const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
    const contextRef = useRef<AudioContext | null>(null);

    useEffect(() => {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;

        if (!AudioContextClass) {
            console.warn("Web Audio API is not supported in this browser");
            return;
        }

        const ctx = new AudioContextClass();
        contextRef.current = ctx;
        setAudioContext(ctx);

        const resumeContext = async () => {
            if (ctx.state === 'suspended')
                await ctx.resume();
        };

        document.addEventListener('click', resumeContext, { once: true });

        return () => {
            ctx.close();
        };
    }, []);

    return audioContext; 
}

