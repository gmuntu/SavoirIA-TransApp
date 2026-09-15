import React, { useState, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { Step1TranslationReview } from './components/Step1TranslationReview';
import { Step2StitchAndPad } from './components/Step2StitchAndPad';
import { Step3FilmoraIntegration } from './components/Step3FilmoraIntegration';
import { Step4PythonScriptHub } from './components/Step4PythonScriptHub';
import { ResetProjectModal } from './components/ResetProjectModal';
import { NaturalVoicesModal } from './components/NaturalVoicesModal';
import { SAMPLE_CS_LECTURE_SUBTITLES, generateBenchmarkSubtitles } from './data/sampleSubtitles';
import { SubtitleItem } from './types';
import { msToSrtTime } from './utils/timecode';

export default function App() {
  const [activeTab, setActiveTab] = useState<'step1' | 'step2' | 'step3' | 'step4'>('step1');
  const [subtitles, setSubtitles] = useState<SubtitleItem[]>(SAMPLE_CS_LECTURE_SUBTITLES);
  const [projectName, setProjectName] = useState<string>('week4_cs_concurrency');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [hasAudioStitched, setHasAudioStitched] = useState<boolean>(false);

  // Modals state
  const [isResetModalOpen, setIsResetModalOpen] = useState<boolean>(false);
  const [isVoicesModalOpen, setIsVoicesModalOpen] = useState<boolean>(false);

  // Computed total duration formatted
  const totalDurationFormatted = useMemo(() => {
    if (subtitles.length === 0) return '00:00:00,000';
    const lastSub = subtitles[subtitles.length - 1];
    return msToSrtTime(lastSub.endTimeMs + 2000);
  }, [subtitles]);

  const handleAudioGenerated = (blob: Blob, url: string) => {
    setAudioBlob(blob);
    setAudioUrl(url);
    setHasAudioStitched(true);
  };

  const handleLoadSample = () => {
    setSubtitles(SAMPLE_CS_LECTURE_SUBTITLES);
    setProjectName('week4_cs_concurrency');
  };

  const handleLoadBenchmark = () => {
    const benchmark = generateBenchmarkSubtitles(3529);
    setSubtitles(benchmark);
    setProjectName('week4_cs_3529_lecture');
  };

  const handleConfirmReset = (options: { mode: 'empty' | 'sample'; newProjectName?: string }) => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setHasAudioStitched(false);

    if (options.mode === 'empty') {
      setSubtitles([]);
      setProjectName(options.newProjectName || 'nouveau_cours_filmora');
    } else {
      setSubtitles(SAMPLE_CS_LECTURE_SUBTITLES);
      setProjectName(options.newProjectName || 'week4_cs_concurrency');
    }

    setActiveTab('step1');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        totalSubtitles={subtitles.length}
        totalDurationFormatted={totalDurationFormatted}
        hasAudioStitched={hasAudioStitched}
        onOpenResetModal={() => setIsResetModalOpen(true)}
        onOpenNaturalVoicesModal={() => setIsVoicesModalOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'step1' && (
          <Step1TranslationReview
            subtitles={subtitles}
            setSubtitles={setSubtitles}
            projectName={projectName}
            setProjectName={setProjectName}
            onProceedToStep2={() => setActiveTab('step2')}
            onLoadBenchmark={handleLoadBenchmark}
            onLoadSample={handleLoadSample}
            onOpenResetModal={() => setIsResetModalOpen(true)}
            onOpenNaturalVoicesModal={() => setIsVoicesModalOpen(true)}
          />
        )}

        {activeTab === 'step2' && (
          <Step2StitchAndPad
            subtitles={subtitles}
            projectName={projectName}
            onProceedToStep3={() => setActiveTab('step3')}
            onAudioGenerated={handleAudioGenerated}
            hasAudioStitched={hasAudioStitched}
            audioUrl={audioUrl}
            onOpenNaturalVoicesModal={() => setIsVoicesModalOpen(true)}
          />
        )}

        {activeTab === 'step3' && (
          <Step3FilmoraIntegration
            subtitles={subtitles}
            projectName={projectName}
            hasAudioStitched={hasAudioStitched}
            audioUrl={audioUrl}
            onProceedToStep4={() => setActiveTab('step4')}
          />
        )}

        {activeTab === 'step4' && (
          <Step4PythonScriptHub />
        )}
      </main>

      {/* Modale de réinitialisation de projet (Reset) */}
      <ResetProjectModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirmReset={handleConfirmReset}
        onConfirmResetEmpty={() => handleConfirmReset({ mode: 'empty' })}
        onConfirmResetSample={() => handleConfirmReset({ mode: 'sample' })}
        currentSubtitlesCount={subtitles.length}
        currentProjectName={projectName}
      />

      {/* Modale de téléchargement et activation des voix naturelles françaises */}
      <NaturalVoicesModal
        isOpen={isVoicesModalOpen}
        onClose={() => setIsVoicesModalOpen(false)}
      />

      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 mt-12 text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-400">Stitch & Pad Audio Synchronization Engine</span>
            <span>•</span>
            <span>Python 3.13 macOS M1 (16GB RAM)</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span>Voice: Thomas (Offline Neural)</span>
            <span>•</span>
            <span>Wondershare Filmora 00:00:00:00</span>
            <span>•</span>
            <span className="text-emerald-400">0ms Drift</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
