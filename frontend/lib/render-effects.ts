export interface EffectParams {
  volume: number;
  reverb: number;
  eqLow: number;
  eqMid: number;
  eqHigh: number;
}

function createImpulseResponse(
  ctx: BaseAudioContext,
  durationSec: number
): AudioBuffer {
  const length = Math.max(1, Math.floor(ctx.sampleRate * durationSec));
  const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = impulse.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      const t = i / length;
      data[i] = (Math.random() * 2 - 1) * Math.exp(-6 * t);
    }
  }
  return impulse;
}

export function applyEffectNodes(
  ctx: BaseAudioContext,
  source: AudioNode,
  params: EffectParams
): {
  output: AudioNode;
  analyser: AnalyserNode;
  update(params: EffectParams): void;
  dispose(): void;
} {
  const eqLow = ctx.createBiquadFilter();
  eqLow.type = 'lowshelf';
  eqLow.frequency.value = 250;

  const eqMid = ctx.createBiquadFilter();
  eqMid.type = 'peaking';
  eqMid.frequency.value = 1000;
  eqMid.Q.value = 1;

  const eqHigh = ctx.createBiquadFilter();
  eqHigh.type = 'highshelf';
  eqHigh.frequency.value = 4000;

  const dryGain = ctx.createGain();
  const wetGain = ctx.createGain();
  const convolver = ctx.createConvolver();
  const volumeGain = ctx.createGain();
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 256;

  source.connect(eqLow);
  eqLow.connect(eqMid);
  eqMid.connect(eqHigh);
  eqHigh.connect(dryGain);
  eqHigh.connect(convolver);
  convolver.connect(wetGain);
  dryGain.connect(volumeGain);
  wetGain.connect(volumeGain);
  volumeGain.connect(analyser);

  let disposed = false;

  const applyParams = (p: EffectParams) => {
    if (disposed) return;
    eqLow.gain.value = p.eqLow;
    eqMid.gain.value = p.eqMid;
    eqHigh.gain.value = p.eqHigh;
    volumeGain.gain.value = p.volume / 100;

    const decay = Math.max(0, Math.min(10, p.reverb));
    if (decay < 0.05) {
      dryGain.gain.value = 1;
      wetGain.gain.value = 0;
    } else {
      const wet = (decay / 10) * 0.35;
      dryGain.gain.value = 1 - wet;
      wetGain.gain.value = wet;
      convolver.buffer = createImpulseResponse(ctx, decay);
    }
  };

  applyParams(params);

  return {
    output: analyser,
    analyser,
    update: applyParams,
    dispose() {
      if (disposed) return;
      disposed = true;
      try {
        source.disconnect(eqLow);
      } catch {
        /* already disconnected */
      }
      eqLow.disconnect();
      eqMid.disconnect();
      eqHigh.disconnect();
      dryGain.disconnect();
      wetGain.disconnect();
      convolver.disconnect();
      volumeGain.disconnect();
      analyser.disconnect();
    },
  };
}

export async function renderEffects(
  buffer: AudioBuffer,
  params: EffectParams
): Promise<AudioBuffer> {
  const tail =
    params.reverb >= 0.05 ? Math.min(params.reverb, 10) : 0;
  const length = buffer.length + Math.ceil(tail * buffer.sampleRate);
  const offline = new OfflineAudioContext(
    buffer.numberOfChannels,
    length,
    buffer.sampleRate
  );

  const source = offline.createBufferSource();
  source.buffer = buffer;

  const chain = applyEffectNodes(offline, source, params);
  chain.analyser.connect(offline.destination);

  source.start(0);
  const rendered = await offline.startRendering();
  chain.dispose();
  return rendered;
}
