import { useEffect, useRef, useState } from 'react';
import {
  applyEffectNodes,
  type EffectParams,
} from '@/lib/render-effects';

const mediaSourceMap = new WeakMap<HTMLMediaElement, MediaElementAudioSourceNode>();

interface UsePlaybackGraphOptions {
  audioContext: AudioContext | null;
  mediaElement: HTMLMediaElement | null;
  params: EffectParams;
  enabled: boolean;
}

export function usePlaybackGraph({
  audioContext,
  mediaElement,
  params,
  enabled,
}: UsePlaybackGraphOptions) {
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const chainRef = useRef<ReturnType<typeof applyEffectNodes> | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const paramsRef = useRef(params);
  paramsRef.current = params;

  useEffect(() => {
    if (!enabled || !audioContext || !mediaElement) {
      chainRef.current?.dispose();
      chainRef.current = null;
      sourceRef.current = null;
      setAnalyser(null);
      return;
    }

    let source = mediaSourceMap.get(mediaElement);
    if (!source) {
      try {
        source = audioContext.createMediaElementSource(mediaElement);
        mediaSourceMap.set(mediaElement, source);
      } catch {
        source = mediaSourceMap.get(mediaElement);
        if (!source) {
          setAnalyser(null);
          return;
        }
      }
    }
    sourceRef.current = source;

    chainRef.current?.dispose();
    const chain = applyEffectNodes(audioContext, source, paramsRef.current);
    chain.analyser.connect(audioContext.destination);
    chainRef.current = chain;
    setAnalyser(chain.analyser);

    return () => {
      chain.dispose();
      if (chainRef.current === chain) {
        chainRef.current = null;
      }
      setAnalyser(null);
    };
  }, [audioContext, mediaElement, enabled]);

    useEffect(() => {
        chainRef.current?.update({
            volume: params.volume,
            reverb: params.reverb,
            eqLow: params.eqLow,
            eqMid: params.eqMid,
            eqHigh: params.eqHigh,
        });
    }, [params.volume, params.reverb, params.eqLow, params.eqMid, params.eqHigh]);

  return { analyser };
}
