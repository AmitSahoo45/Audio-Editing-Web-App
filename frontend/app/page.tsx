import { Button } from "@/components/ui/Button";
import Link from "next/link";

const features = [
  {
    title: "AI-Powered Cleanup",
    description:
      "Remove background noise, clicks, and hum with smart presets that adapt to your audio.",
  },
  {
    title: "Precision Editing",
    description:
      "Trim, split, and rearrange clips on a timeline built for musicians, podcasters, and creators.",
  },
  {
    title: "Instant Sharing",
    description:
      "Export mixes optimized for every platform or collaborate in real time with teammates.",
  },
];

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-100 px-6 py-16 text-slate-900 sm:px-10 lg:px-16">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center gap-20">
        <section className="text-center">
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 shadow-sm backdrop-blur">
            Next-gen audio editing
          </span>
          <h1 className="mt-6 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Craft studio-quality sound without the studio.
          </h1>
          <p className="mt-6 max-w-2xl text-base text-slate-600 sm:text-lg mx-auto">
            AudioCraft gives creators a seamless, browser-based workstation. Clean up raw recordings,
            collaborate with your team, and publish mixes that sparkle—all in minutes, no downloads required.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/editor">
              <Button size="lg" className="w-full sm:w-auto">
                Start editing free
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              Watch demo
            </Button>
          </div>
        </section>

        <section className="grid w-full gap-6 rounded-3xl border border-slate-200/80 bg-white/80 p-8 shadow-xl shadow-slate-200/50 backdrop-blur md:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="flex flex-col gap-3 text-left">
              <h3 className="text-lg font-semibold text-slate-900 sm:text-xl">
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
                {feature.description}
              </p>
            </div>
          ))}
        </section>
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-32 -z-10 h-[420px] bg-[radial-gradient(circle_at_top,rgba(79,70,229,0.15),transparent_65%)]" />
    </main>
  );
}
