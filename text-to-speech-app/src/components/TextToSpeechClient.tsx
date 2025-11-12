'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type SynthStatus = 'idle' | 'speaking' | 'paused' | 'error';

type VoiceOption = {
  id: string;
  name: string;
  lang: string;
  voice: SpeechSynthesisVoice;
};

const formatVoiceLabel = (voice: SpeechSynthesisVoice) => {
  let language = voice.lang;

  if (typeof Intl !== 'undefined' && 'DisplayNames' in Intl) {
    try {
      language =
        new Intl.DisplayNames([voice.lang], { type: 'language' }).of(voice.lang) ??
        voice.lang;
    } catch {
      language = voice.lang;
    }
  }

  const parts = [voice.name, language].filter(Boolean);
  return parts.join(' • ');
};

const useSpeechVoices = () => {
  const isBrowser = typeof window !== 'undefined';
  const supported = isBrowser && 'speechSynthesis' in window;
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [loading, setLoading] = useState(supported);

  useEffect(() => {
    if (!supported) {
      return;
    }

    const synth = window.speechSynthesis;
    let cancelled = false;

    const updateVoices = () => {
      const available = synth
        .getVoices()
        .filter((voice) => !voice.localService || voice.name.trim().length > 0);

      if (!cancelled) {
        setVoices(
          available.sort((a, b) => {
            const langDiff = a.lang.localeCompare(b.lang);
            if (langDiff !== 0) return langDiff;
            return a.name.localeCompare(b.name);
          }),
        );
        setLoading(false);
      }
    };

    updateVoices();
    synth.addEventListener('voiceschanged', updateVoices);

    return () => {
      cancelled = true;
      synth.removeEventListener('voiceschanged', updateVoices);
    };
  }, [supported]);

  return { voices, loading, supported };
};

export const TextToSpeechClient = () => {
  const { voices, loading, supported } = useSpeechVoices();
  const [text, setText] = useState('');
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [volume, setVolume] = useState(1);
  const [status, setStatus] = useState<SynthStatus>('idle');
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>('');
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const voiceOptions = useMemo<VoiceOption[]>(() => {
    return voices.map((voice) => ({
      id: `${voice.lang}-${voice.name}`,
      name: formatVoiceLabel(voice),
      lang: voice.lang,
      voice,
    }));
  }, [voices]);

  const activeVoiceId = selectedVoiceId || voiceOptions[0]?.id || '';
  const activeVoiceOption = voiceOptions.find((option) => option.id === activeVoiceId);

  const resetUtterance = () => {
    if (!utteranceRef.current) return;
    utteranceRef.current.onend = null;
    utteranceRef.current.onerror = null;
    utteranceRef.current = null;
  };

  const stop = () => {
    if (typeof window === 'undefined') return;
    window.speechSynthesis.cancel();
    resetUtterance();
    setStatus('idle');
  };

  const speak = () => {
    if (typeof window === 'undefined' || !text.trim()) return;
    const synth = window.speechSynthesis;

    if (synth.speaking) {
      synth.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text.trim());
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;

    if (activeVoiceOption) {
      utterance.voice = activeVoiceOption.voice;
    }

    utterance.onend = () => {
      setStatus('idle');
      resetUtterance();
    };

    utterance.onerror = () => {
      setStatus('error');
      resetUtterance();
    };

    utteranceRef.current = utterance;
    setStatus('speaking');
    synth.speak(utterance);
  };

  const pause = () => {
    if (typeof window === 'undefined') return;
    const synth = window.speechSynthesis;
    if (synth.speaking && !synth.paused) {
      synth.pause();
      setStatus('paused');
    }
  };

  const resume = () => {
    if (typeof window === 'undefined') return;
    const synth = window.speechSynthesis;
    if (synth.paused) {
      synth.resume();
      setStatus('speaking');
    }
  };

  const isSpeaking = status === 'speaking';
  const isPaused = status === 'paused';
  const statusIndicatorClass =
    status === 'speaking'
      ? 'bg-emerald-500 animate-pulse'
      : status === 'paused'
        ? 'bg-amber-500'
        : status === 'error'
          ? 'bg-rose-500'
          : 'bg-blue-500';

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-8 rounded-3xl border border-zinc-200/60 bg-white/80 p-8 shadow-lg backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80 sm:p-10">
      <header className="flex flex-col gap-2">
        <p className="text-sm font-medium uppercase tracking-wide text-blue-600 dark:text-blue-400">
          Real-time Voice
        </p>
        <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50 sm:text-4xl">
          Text to Speech Studio
        </h1>
        <p className="text-base text-zinc-600 dark:text-zinc-400">
          Enter or paste text, choose a voice, and control playback in your browser with
          zero setup.
        </p>
      </header>

      {!supported ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/60 dark:text-rose-200">
          <p className="font-semibold">Speech synthesis is not supported.</p>
          <p className="mt-2 text-sm">
            Try opening this page in a modern browser such as Chrome, Safari, or Edge to
            enable text-to-speech.
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-6">
            <label htmlFor="tts-text" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Text to narrate
            </label>
            <textarea
              id="tts-text"
              className="h-40 w-full resize-none rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-base leading-relaxed text-zinc-900 shadow-inner outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-200/60 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-blue-400 dark:focus:ring-blue-500/20"
              placeholder="Type something engaging, like a product announcement, a bedtime story, or this morning's stand-up notes…"
              value={text}
              onChange={(event) => setText(event.target.value)}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.15fr,0.85fr]">
            <div className="flex flex-col gap-4">
              <label
                htmlFor="voice"
                className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Voice
              </label>
              <div className="relative">
                <select
                  id="voice"
                  value={activeVoiceId}
                  onChange={(event) => setSelectedVoiceId(event.target.value)}
                  disabled={loading || voiceOptions.length === 0}
                  className="w-full appearance-none rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 pr-10 text-base text-zinc-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-200/60 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-blue-400 dark:focus:ring-blue-500/20"
                >
                  {loading ? (
                    <option>Loading voices…</option>
                  ) : voiceOptions.length > 0 ? (
                    voiceOptions.map((voice) => (
                      <option key={voice.id} value={voice.id}>
                        {voice.name}
                      </option>
                    ))
                  ) : (
                    <option>No voices available</option>
                  )}
                </select>
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500">
                  ⌄
                </span>
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Voices are provided by your browser and device. Availability varies per
                platform.
              </p>
            </div>

            <div className="flex flex-col gap-6 rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-800/60">
              <Slider
                label="Rate"
                min={0.5}
                max={2}
                step={0.1}
                value={rate}
                onChange={setRate}
                description={`${rate.toFixed(1)}x`}
              />
              <Slider
                label="Pitch"
                min={0}
                max={2}
                step={0.1}
                value={pitch}
                onChange={setPitch}
                description={pitch === 1 ? 'Natural' : pitch > 1 ? 'Higher' : 'Lower'}
              />
              <Slider
                label="Volume"
                min={0}
                max={1}
                step={0.05}
                value={volume}
                onChange={setVolume}
                description={`${Math.round(volume * 100)}%`}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={speak}
              disabled={!text.trim() || !supported}
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-blue-400/60 disabled:shadow-none dark:bg-blue-500 dark:hover:bg-blue-400"
            >
              {isSpeaking ? 'Restart' : 'Speak'}
            </button>
            <button
              type="button"
              onClick={pause}
              disabled={!isSpeaking}
              className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-5 py-3 text-sm font-semibold text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-700/60"
            >
              Pause
            </button>
            <button
              type="button"
              onClick={resume}
              disabled={!isPaused}
              className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-5 py-3 text-sm font-semibold text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-700/60"
            >
              Resume
            </button>
            <button
              type="button"
              onClick={stop}
              disabled={status === 'idle'}
              className="inline-flex items-center gap-2 rounded-full border border-rose-200 px-5 py-3 text-sm font-semibold text-rose-600 transition hover:border-rose-300 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-700 dark:text-rose-200 dark:hover:bg-rose-950/60"
            >
              Stop
            </button>
          </div>

          <footer className="flex flex-col gap-2 rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-400">
            <div className="flex items-center gap-2" role="status" aria-live="polite">
              <span className={`inline-flex h-2.5 w-2.5 rounded-full ${statusIndicatorClass}`} />
              <p className="font-medium text-zinc-700 dark:text-zinc-300">
                Status:{' '}
                {status === 'idle'
                  ? 'Ready'
                  : status === 'error'
                    ? 'Something went wrong. Please try again.'
                    : status.charAt(0).toUpperCase() + status.slice(1)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <SampleButton
                onClick={() =>
                  setText(
                    'Hi team! Here is your quick project update. The landing page refresh went live this morning and early analytics show a 14% lift in conversions. Next sprint we will shift focus to the onboarding funnel.',
                  )
                }
                label="Sprint update"
              />
              <SampleButton
                onClick={() =>
                  setText(
                    'Once upon a time, on the edge of a sleepy forest, lived a curious fox who painted constellations in the night sky and left little glowing paw prints for dreamers to follow.',
                  )
                }
                label="Bedtime story"
              />
              <SampleButton
                onClick={() =>
                  setText(
                    'Welcome aboard! Fasten your seatbelt, place your devices in airplane mode, and enjoy the calm cabin lighting as we prepare for takeoff.',
                  )
                }
                label="Announcement"
              />
            </div>
          </footer>
        </>
      )}
    </section>
  );
};

type SliderProps = {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
  description?: string;
};

const Slider = ({ label, min, max, step, value, onChange, description }: SliderProps) => (
  <div className="flex flex-col gap-2">
    <div className="flex items-center justify-between text-sm font-medium text-zinc-700 dark:text-zinc-200">
      <span>{label}</span>
      {description ? <span className="text-xs text-zinc-500 dark:text-zinc-400">{description}</span> : null}
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
      className="h-2 w-full cursor-pointer appearance-none rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 accent-blue-500"
    />
  </div>
);

type SampleButtonProps = {
  label: string;
  onClick: () => void;
};

const SampleButton = ({ label, onClick }: SampleButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    className="rounded-full border border-zinc-300 px-4 py-1.5 text-xs font-medium text-zinc-600 transition hover:border-zinc-500 hover:text-zinc-800 dark:border-zinc-600 dark:text-zinc-300 dark:hover:border-zinc-400 dark:hover:text-zinc-100"
  >
    {label}
  </button>
);
