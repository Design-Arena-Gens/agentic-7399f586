import { TextToSpeechClient } from '@/components/TextToSpeechClient';

export default function Home() {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-blue-900 px-4 py-16 font-sans text-zinc-900 dark:text-zinc-100 sm:py-24">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-20 mix-blend-soft-light" />
      <div className="absolute left-1/2 top-16 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-500/40 blur-3xl sm:h-96 sm:w-96" />
      <div className="absolute bottom-16 left-12 h-48 w-48 rounded-full bg-purple-500/40 blur-3xl sm:h-72 sm:w-72" />
      <div className="absolute bottom-32 right-10 h-56 w-56 rounded-full bg-sky-500/40 blur-3xl sm:h-72 sm:w-72" />
      <main className="relative z-10 w-full">
        <TextToSpeechClient />
      </main>
    </div>
  );
}
