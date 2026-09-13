import { useEffect, useState } from "react";

export const useAudioContext = () => {
    const [audioContext, setAudioContext] = useState<AudioContext | null>(null);

    useEffect(() => {
        const AudioContextClass =
            window.AudioContext ||
            (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

        if (!AudioContextClass) {
            console.warn("Web Audio API is not supported in this browser");
            return;
        }

        const ctx = new AudioContextClass();
        setAudioContext(ctx);

        const resumeContext = async () => {
            if (ctx.state === 'suspended')
                await ctx.resume();
        };

        document.addEventListener('click', resumeContext, { once: true });

        return () => {
            document.removeEventListener('click', resumeContext);
            ctx.close();
        };
    }, []);

    return audioContext;
}
