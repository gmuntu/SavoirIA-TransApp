import React from 'react';
import { 
  Sliders, 
  FileText, 
  Volume2,
  Film,
  Terminal,
  RotateCcw,
  Sparkles,
  Zap
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'step1' | 'step2' | 'step3' | 'step4';
  setActiveTab: (tab: 'step1' | 'step2' | 'step3' | 'step4') => void;
  totalSubtitles: number;
  totalDurationFormatted: string;
  hasAudioStitched: boolean;
  onOpenResetModal: () => void;
  onOpenNaturalVoicesModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  totalSubtitles,
  totalDurationFormatted,
  hasAudioStitched,
  onOpenResetModal,
  onOpenNaturalVoicesModal
}) => {
  return (
    <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo Minimaliste */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Volume2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white tracking-tight">Stitch & Pad</span>
                <span className="hidden sm:inline-block text-[10px] px-2 py-0.2 rounded-full bg-slate-800 text-slate-400 font-mono">
                  Python 3.13 • Mac M1
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Épurée */}
          <nav className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            <button
              id="nav-step1-btn"
              onClick={() => setActiveTab('step1')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'step1'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>1. Sous-titres (.SRT)</span>
            </button>

            <button
              id="nav-step2-btn"
              onClick={() => setActiveTab('step2')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'step2'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>2. Doublage Audio</span>
              {hasAudioStitched && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              )}
            </button>

            <button
              id="nav-step3-btn"
              onClick={() => setActiveTab('step3')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'step3'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>3. Filmora (0ms)</span>
            </button>

            <button
              id="nav-step4-btn"
              onClick={() => setActiveTab('step4')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'step4'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>4. Script Python</span>
            </button>
          </nav>

          {/* Actions Droite : Voix Naturelles & Reset & Compteur */}
          <div className="flex items-center gap-2 text-xs">
            <button
              id="nav-natural-voices-btn"
              onClick={onOpenNaturalVoicesModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 hover:text-amber-200 border border-amber-800/80 transition-colors font-semibold shadow-sm cursor-pointer"
              title="Télécharger Qwen3-TTS et les voix naturelles non-robotiques"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400 fill-current" />
              <span className="hidden sm:inline">Qwen3-TTS (Voix Naturelles)</span>
              <span className="sm:hidden">Qwen3</span>
            </button>

            <button
              id="nav-reset-project-btn"
              onClick={onOpenResetModal}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 hover:text-rose-100 border border-rose-800/60 transition-colors font-medium"
              title="Remettre le projet à zéro pour démarrer un nouveau cours"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">Nouveau Projet</span>
            </button>

            <div className="hidden xl:flex items-center gap-1 pl-2 border-l border-slate-800 text-slate-400 font-mono text-[11px]">
              <span className="text-cyan-400 font-bold">{totalSubtitles}</span> sous-titres
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
