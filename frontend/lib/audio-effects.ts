import * as Tone from 'tone';

export class AudioEffects {
    private player: Tone.Player | null = null;
    private reverb: Tone.Reverb | null = null;
    private eq: Tone.EQ3 | null = null;
    private gain: Tone.Gain | null = null;

    async initialize(audioUrl: string) {
        this.player = new Tone.Player(audioUrl);

        this.reverb = new Tone.Reverb({
            decay: 2,
            preDelay: 0.01,
        })

        this.eq = new Tone.EQ3({
            low: 0,
            mid: 0,
            high: 0,
        })

        this.gain = new Tone.Gain(1)
        this.player.chain(this.eq, this.reverb, this.gain, Tone.Destination);
        await Tone.loaded()
    }

    async play() {
        await Tone.start()
        this.player?.start()
    }

    pause() {
        this.player?.stop()
    }

    setVolume(volume: number) {
        if (this.gain)
            this.gain.gain.value = volume;
    }

    setReverb(decay: number) {
        if (this.reverb)
            this.reverb.decay = decay;
    }

    setEQ(low: number, mid: number, high: number) {
        if (this.eq) {
            this.eq.low.value = low
            this.eq.mid.value = mid
            this.eq.high.value = high;
        }
    }

    applyFadeIn(duration: number) {
        if (this.gain)
            this.gain.gain.linearRampTo(1, duration);
    }

    applyFadeOut(duration: number) {
        if (this.gain)
            this.gain.gain.linearRampTo(0, duration);
    }

    dispose() {
        this.player?.dispose()
        this.reverb?.dispose()
        this.eq?.dispose()
        this.gain?.dispose()
    }
}