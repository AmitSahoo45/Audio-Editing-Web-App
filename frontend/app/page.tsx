import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { AudioWaveform, Sparkles, Download } from "lucide-react";

/* ── Navbar ─────────────────────────────────────────────────────────── */
function Navbar() {
  return (
    <nav className="fixed top-4 left-1/2 z-50 -translate-x-1/2">
      <div className="flex items-center gap-6 rounded-full border border-white/10 bg-white/5 px-6 py-2.5 shadow-lg shadow-black/20 backdrop-blur-xl">
        <Link href="/" className="text-sm font-bold tracking-tight text-white">
          Audio&nbsp;Editor&nbsp;Pro
        </Link>
        <div className="hidden items-center gap-5 sm:flex">
          <Link href="#features" className="text-xs text-white/50 transition hover:text-white/90">
            Features
          </Link>
          <Link href="/editor" className="text-xs text-white/50 transition hover:text-white/90">
            Editor
          </Link>
        </div>
        <Link href="/editor">
          <Button size="sm" className="rounded-full">
            Launch App
          </Button>
        </Link>
      </div>
    </nav>
  );
}

/* ── Deterministic pseudo-random based on index (avoids hydration mismatch) */
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function barHeight(i: number, count: number): number {
  const wave = Math.sin((i / count) * Math.PI) * 40;
  const variation = seededRandom(i) * 30;
  return 20 + wave + variation;
}

/* ── Abstract 3D Editor Visual ──────────────────────────────────────── */
function EditorVisual() {
  const barCount = 32;
  return (
    <div
      className="relative mx-auto mt-16 w-full max-w-2xl"
      style={{ animation: "float 6s ease-in-out infinite" }}
    >
      {/* Glow behind the visual */}
      <div
        className="pointer-events-none absolute -inset-10 rounded-3xl"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(59,130,246,0.15), transparent 70%)",
          animation: "glow-pulse 4s ease-in-out infinite",
        }}
      />

      {/* 3D tilted container */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl shadow-black/40 backdrop-blur-sm">
        {/* Fake title bar */}
        <div className="mb-4 flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
          <span className="ml-3 text-[10px] font-medium tracking-wide text-white/30">
            session_01.wav
          </span>
        </div>

        {/* Waveform bars */}
        <div className="flex h-28 items-end justify-center gap-[3px]">
          {Array.from({ length: barCount }).map((_, i) => (
            <span
              key={i}
              className="w-1.5 origin-bottom rounded-full bg-gradient-to-t from-blue-500 to-purple-500"
              style={{
                height: `${barHeight(i, barCount)}%`,
                animation: `waveform-pulse ${1.2 + (i % 5) * 0.3}s ease-in-out ${i * 0.05}s infinite`,
                opacity: 0.6 + seededRandom(i + 100) * 0.4,
              }}
            />
          ))}
        </div>

        {/* Fake timeline ruler */}
        <div className="mt-4 flex justify-between text-[9px] font-mono text-white/20">
          <span>0:00</span>
          <span>0:15</span>
          <span>0:30</span>
          <span>0:45</span>
          <span>1:00</span>
        </div>
      </div>
    </div>
  );
}

/* ── Bento Grid Feature Cards ───────────────────────────────────────── */
function BentoGrid() {
  return (
    <section id="features" className="mx-auto mt-32 w-full max-w-5xl px-6">
      <h2 className="mb-12 text-center text-3xl font-semibold tracking-[-0.02em] text-white sm:text-4xl">
        Everything you need, nothing you don&apos;t.
      </h2>

      <div className="grid gap-4 md:grid-cols-3 md:grid-rows-2">
        {/* Card 1 — Large (spans 2 cols) */}
        <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-md transition-transform duration-300 hover:scale-[1.02] md:col-span-2 md:row-span-2">
          <AudioWaveform className="mb-4 h-8 w-8 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Waveform Visualization</h3>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-white/50">
            See every transient, fade, and frequency in real time. Scroll, zoom,
            and select with pixel-perfect accuracy on an interactive canvas.
          </p>

          {/* Mini decorative waveform inside card */}
          <div className="mt-6 flex h-20 items-end gap-[2px]">
            {Array.from({ length: 48 }).map((_, i) => (
              <span
                key={i}
                className="w-1 origin-bottom rounded-full bg-gradient-to-t from-blue-500/60 to-purple-500/40"
                style={{
                  height: `${15 + Math.sin(i * 0.4) * 35 + Math.cos(i * 0.7) * 20}%`,
                  animation: `waveform-pulse ${1.4 + (i % 6) * 0.25}s ease-in-out ${i * 0.04}s infinite`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Card 2 — Tall */}
        <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-md transition-transform duration-300 hover:scale-[1.02] md:row-span-2">
          <Sparkles className="mb-4 h-8 w-8 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">DSP Noise Reduction</h3>
          <p className="mt-2 text-sm leading-relaxed text-white/50">
            One click to silence hum, hiss, and room noise. Built-in DSP
            filters preserve voice clarity while eliminating distractions—no
            manual EQ required.
          </p>
          <div className="mt-6 space-y-3">
            {["Hum removal", "Click repair", "De-essing", "Room tone"].map(
              (label) => (
                <div key={label} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
                  <span className="text-xs text-white/40">{label}</span>
                </div>
              )
            )}
          </div>
        </div>

        {/* Card 3 — Small (already positioned by grid flow) */}
        {/* This card is implicitly placed by removing it from the 2x2 area */}
      </div>

      {/* Separate row for the small export card */}
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <div className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-md transition-transform duration-300 hover:scale-[1.02] md:col-span-1">
          <Download className="mb-4 h-8 w-8 text-cyan-400" />
          <h3 className="text-lg font-semibold text-white">Export to WAV / MP3</h3>
          <p className="mt-2 text-sm leading-relaxed text-white/50">
            Bounce your mix to lossless WAV or compressed MP3 in seconds.
            Choose bit-rate, sample-rate, and format—all from the browser.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ── Page ────────────────────────────────────────────────────────────── */
export default function Home() {
  return (
    <>
      <Navbar />

      <div className="relative min-h-screen overflow-hidden bg-[#0A0A0A]">
        {/* Radial gradient glow behind hero */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_30%,rgba(99,102,241,0.12),transparent_70%)]" />
        {/* Grid pattern overlay */}
        <div className="bg-grid pointer-events-none absolute inset-0" />

        {/* Hero Section */}
        <section className="relative flex flex-col items-center px-6 pt-36 pb-10 text-center sm:pt-44">
          <span className="mb-6 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-white/50 backdrop-blur">
            Now in public beta
          </span>

          <h1
            className="max-w-3xl text-4xl font-bold leading-[1.08] sm:text-5xl lg:text-7xl"
            style={{ letterSpacing: "-0.02em" }}
          >
            <span className="bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
              Audio editing, reimagined for the web.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-white/40 sm:text-lg">
            The speed of a desktop DAW. The flexibility of the cloud. Edit,
            mix, and master directly in your browser.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
            <Link href="/editor">
              <Button size="lg" className="rounded-full px-6">
                Start editing free
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="rounded-full px-6">
              Watch demo
            </Button>
          </div>

          {/* Abstract 3D editor visual */}
          <EditorVisual />
        </section>

        {/* Bento Grid Features */}
        <BentoGrid />

        {/* Bottom spacer */}
        <div className="h-32" />
      </div>
    </>
  );
}
