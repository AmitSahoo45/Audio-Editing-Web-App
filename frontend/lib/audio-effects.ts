import * as Tone from 'tone';

export type EffectType = 'reverb' | 'eq' | 'distortion' | 'delay' | 'chorus';

interface EffectNode {
    type: EffectType;
    node: Tone.ToneAudioNode;
    enabled: boolean;
}

export class AudioEffects {
    private player: Tone.Player | null = null;
    private gain: Tone.Gain | null = null;
    private effectRack: EffectNode[] = [];

    async initialize(audioUrl: string) {
        this.player = new Tone.Player(audioUrl);
        this.gain = new Tone.Gain(1);

        // Default chain: EQ → Reverb (matching original behaviour)
        this.addEffect('eq');
        this.addEffect('reverb');

        this.rebuildChain();
        await Tone.loaded();
    }

    async play() {
        await Tone.start();
        this.player?.start();
    }

    pause() {
        this.player?.stop();
    }

    /* ── Dynamic effect rack ─────────────────────────────────────────── */

    addEffect(type: EffectType): void {
        // Prevent duplicates
        if (this.effectRack.some(e => e.type === type)) return;

        const node = this.createEffectNode(type);
        this.effectRack.push({ type, node, enabled: true });
        this.rebuildChain();
    }

    removeEffect(type: EffectType): void {
        const idx = this.effectRack.findIndex(e => e.type === type);
        if (idx === -1) return;
        this.effectRack[idx].node.dispose();
        this.effectRack.splice(idx, 1);
        this.rebuildChain();
    }

    toggleEffect(type: EffectType, enabled: boolean): void {
        const entry = this.effectRack.find(e => e.type === type);
        if (!entry) return;
        entry.enabled = enabled;
        this.rebuildChain();
    }

    getEnabledEffects(): EffectType[] {
        return this.effectRack.filter(e => e.enabled).map(e => e.type);
    }

    getAllEffects(): { type: EffectType; enabled: boolean }[] {
        return this.effectRack.map(e => ({ type: e.type, enabled: e.enabled }));
    }

    /* ── Effect-specific setters ─────────────────────────────────────── */

    setVolume(volume: number) {
        if (this.gain) this.gain.gain.value = volume;
    }

    setReverb(decay: number) {
        const entry = this.effectRack.find(e => e.type === 'reverb');
        if (entry && entry.node instanceof Tone.Reverb) {
            entry.node.decay = decay;
        }
    }

    setEQ(low: number, mid: number, high: number) {
        const entry = this.effectRack.find(e => e.type === 'eq');
        if (entry && entry.node instanceof Tone.EQ3) {
            entry.node.low.value = low;
            entry.node.mid.value = mid;
            entry.node.high.value = high;
        }
    }

    setDistortion(amount: number) {
        const entry = this.effectRack.find(e => e.type === 'distortion');
        if (entry && entry.node instanceof Tone.Distortion) {
            entry.node.distortion = amount;
        }
    }

    setDelay(time: number, feedback: number) {
        const entry = this.effectRack.find(e => e.type === 'delay');
        if (entry && entry.node instanceof Tone.FeedbackDelay) {
            entry.node.delayTime.value = time;
            entry.node.feedback.value = feedback;
        }
    }

    applyFadeIn(duration: number) {
        if (this.gain) this.gain.gain.linearRampTo(1, duration);
    }

    applyFadeOut(duration: number) {
        if (this.gain) this.gain.gain.linearRampTo(0, duration);
    }

    dispose() {
        this.player?.dispose();
        this.gain?.dispose();
        this.effectRack.forEach(e => e.node.dispose());
        this.effectRack = [];
    }

    /* ── Internal helpers ────────────────────────────────────────────── */

    private createEffectNode(type: EffectType): Tone.ToneAudioNode {
        switch (type) {
            case 'reverb':
                return new Tone.Reverb({ decay: 2, preDelay: 0.01 });
            case 'eq':
                return new Tone.EQ3({ low: 0, mid: 0, high: 0 });
            case 'distortion':
                return new Tone.Distortion(0.4);
            case 'delay':
                return new Tone.FeedbackDelay('8n', 0.3);
            case 'chorus':
                return new Tone.Chorus(4, 2.5, 0.5).start();
            default:
                return new Tone.Gain(1);
        }
    }

    /** Disconnect everything and rewire: player → [enabled effects] → gain → destination */
    private rebuildChain() {
        if (!this.player || !this.gain) return;

        // Disconnect all
        this.player.disconnect();
        this.effectRack.forEach(e => e.node.disconnect());
        this.gain.disconnect();

        // Build new chain
        const enabledNodes = this.effectRack.filter(e => e.enabled).map(e => e.node);
        const chain: Tone.ToneAudioNode[] = [this.player, ...enabledNodes, this.gain, Tone.Destination];

        for (let i = 0; i < chain.length - 1; i++) {
            chain[i].connect(chain[i + 1] as Tone.InputNode);
        }
    }
}