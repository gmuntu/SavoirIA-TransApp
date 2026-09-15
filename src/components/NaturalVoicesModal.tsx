import React, { useState, useEffect } from 'react';
import { 
  Volume2, 
  Download, 
  Play, 
  Check, 
  Copy, 
  Terminal, 
  Sparkles, 
  Apple, 
  Monitor, 
  X, 
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  FileAudio,
  Zap,
  Radio,
  Square
} from 'lucide-react';
import { 
  MACOS_VOICE_COMMAND_SCRIPT, 
  POPULAR_FRENCH_NATURAL_VOICES, 
  PIPER_OFFLINE_TTS_SCRIPT,
  QWEN3_TTS_COMMAND_SCRIPT,
  QWEN3_TTS_PYTHON_DUBBER_SCRIPT,
  NaturalVoiceOption
} from '../data/voiceGuides';
import { 
  getAvailableBrowserFrenchVoices, 
  getPreferredVoice, 
  setPreferredVoice, 
  playBrowserTtsPreview, 
  stopBrowserTts,
  downloadAudioVoiceSample,
  DetectedVoice
} from '../utils/audioSynthesizer';

interface NaturalVoicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'qwen3' | 'detected' | 'macos' | 'samples' | 'piper';
}

export const NaturalVoicesModal: React.FC<NaturalVoicesModalProps> = ({ isOpen, onClose, initialTab = 'qwen3' }) => {
  const [activeTab, setActiveTab] = useState<'qwen3' | 'detected' | 'macos' | 'samples' | 'piper'>(initialTab);
  const [detectedVoices, setDetectedVoices] = useState<DetectedVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string | null>(getPreferredVoice());
  const [playingVoiceName, setPlayingVoiceName] = useState<string | null>(null);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [downloadSuccessMsg, setDownloadSuccessMsg] = useState<string | null>(null);

  // Update active tab if initialTab changes
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Scan voices on mount and when voices change
  useEffect(() => {
    if (!isOpen) return;

    const loadVoices = () => {
      const v = getAvailableBrowserFrenchVoices();
      setDetectedVoices(v);
    };

    loadVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle preview playback
  const handleTestVoice = (voiceName: string, text?: string) => {
    if (playingVoiceName === voiceName) {
      stopBrowserTts();
      setPlayingVoiceName(null);
      return;
    }

    setPlayingVoiceName(voiceName);
    const phrase = text || "Bonjour. Bienvenue dans ce cours d'informatique. La synchronisation temporelle est exacte à la milliseconde près.";
    playBrowserTtsPreview(phrase, 170, () => {
      setPlayingVoiceName(null);
    }, voiceName);
  };

  // Set user preferred voice
  const handleSelectDefaultVoice = (voiceName: string) => {
    setPreferredVoice(voiceName);
    setSelectedVoice(voiceName);
  };

  // Copy command helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  // Download Qwen3-TTS installer .command script
  const handleDownloadQwen3CommandScript = () => {
    const blob = new Blob([QWEN3_TTS_COMMAND_SCRIPT], { type: 'application/x-sh;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'setup_qwen3_tts.command';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloadSuccessMsg('Script "setup_qwen3_tts.command" téléchargé ! Double-cliquez dessus sur votre Mac.');
    setTimeout(() => setDownloadSuccessMsg(null), 6000);
  };

  // Download Qwen3 Python Dubber script
  const handleDownloadQwen3DubberScript = () => {
    const blob = new Blob([QWEN3_TTS_PYTHON_DUBBER_SCRIPT], { type: 'text/x-python;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'qwen3_tts_dubber.py';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloadSuccessMsg('Script Python "qwen3_tts_dubber.py" téléchargé ! Prêt pour exécuter le doublage.');
    setTimeout(() => setDownloadSuccessMsg(null), 6000);
  };

  // Download macOS .command script
  const handleDownloadMacScript = () => {
    const blob = new Blob([MACOS_VOICE_COMMAND_SCRIPT], { type: 'application/x-sh;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'telecharger_voix_naturelles_mac.command';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloadSuccessMsg('Script "telecharger_voix_naturelles_mac.command" téléchargé ! Double-cliquez dessus sur votre Mac.');
    setTimeout(() => setDownloadSuccessMsg(null), 5000);
  };

  // Download Python Piper TTS helper
  const handleDownloadPiperScript = () => {
    const blob = new Blob([PIPER_OFFLINE_TTS_SCRIPT], { type: 'text/x-python;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'setup_piper_tts_offline.py';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloadSuccessMsg('Script Python "setup_piper_tts_offline.py" téléchargé !');
    setTimeout(() => setDownloadSuccessMsg(null), 5000);
  };

  // Download WAV Sample
  const handleDownloadSampleWav = (name: string) => {
    downloadAudioVoiceSample(name);
    setDownloadSuccessMsg(`Échantillon audio "${name} 44.1kHz Stéréo" téléchargé (.WAV) !`);
    setTimeout(() => setDownloadSuccessMsg(null), 5000);
  };

  const hasThomasInstalled = detectedVoices.some(v => v.name.toLowerCase().includes('thomas'));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-cyan-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Voix Naturelles Studio & Qwen3-TTS (0% Robotique)
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-rose-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono font-bold uppercase tracking-wider">
                  Modèle IA 2026
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Éliminez les voix robotiques et mécaniques en utilisant <strong className="text-amber-300">Qwen3-TTS</strong> ou les voix neuronales haute fidélité pour vos cours Filmora.
              </p>
            </div>
          </div>

          <button
            id="close-voices-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notifications */}
        {downloadSuccessMsg && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-800/80 text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">{downloadSuccessMsg}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 px-5 pt-3 border-b border-slate-800/80 bg-slate-950/40 text-xs overflow-x-auto">
          <button
            id="tab-qwen3-tts"
            onClick={() => setActiveTab('qwen3')}
            className={`flex items-center gap-1.5 px-3.5 py-2 border-b-2 font-medium transition-colors whitespace-nowrap ${
              activeTab === 'qwen3'
                ? 'border-amber-400 text-amber-400 font-bold bg-amber-950/20 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400 fill-current" />
            <span>🔥 Qwen3-TTS & Neural AI (Sans Robot)</span>
          </button>

          <button
            id="tab-detected-voices"
            onClick={() => setActiveTab('detected')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition-colors whitespace-nowrap ${
              activeTab === 'detected'
                ? 'border-cyan-400 text-cyan-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Voix système détectées ({detectedVoices.length})</span>
          </button>

          <button
            id="tab-macos-guide"
            onClick={() => setActiveTab('macos')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition-colors whitespace-nowrap ${
              activeTab === 'macos'
                ? 'border-cyan-400 text-cyan-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Apple className="w-3.5 h-3.5" />
            <span>Thomas (macOS Améliorée)</span>
          </button>

          <button
            id="tab-samples-wav"
            onClick={() => setActiveTab('samples')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition-colors whitespace-nowrap ${
              activeTab === 'samples'
                ? 'border-cyan-400 text-cyan-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileAudio className="w-3.5 h-3.5" />
            <span>Échantillons Audio WAV</span>
          </button>

          <button
            id="tab-piper-offline"
            onClick={() => setActiveTab('piper')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition-colors whitespace-nowrap ${
              activeTab === 'piper'
                ? 'border-cyan-400 text-cyan-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Piper TTS Offline</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* TAB 0: QWEN3-TTS & NEURAL AI STUDIO (0% ROBOTIQUE) */}
          {activeTab === 'qwen3' && (
            <div className="space-y-4">
              {/* Explication du problème de voix robotique */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-cyan-950/40 border border-amber-500/30 space-y-3">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                  <Zap className="w-4 h-4 fill-current" />
                  <span>Pourquoi les voix actuelles sonnent-elles robotiques ?</span>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed">
                  Les voix par défaut de votre navigateur et les voix de base non téléchargées de macOS utilisent des algorithmes anciens à formants ("synthèse mécanique"). Elles sonnent plates, nasillardes et monotones.
                </p>
                <div className="p-3 rounded-lg bg-slate-950/90 border border-slate-800 text-xs space-y-1.5">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>La solution : Modèles IA Neuronaux (Qwen3-TTS & Neural Engine)</span>
                  </div>
                  <p className="text-slate-400 text-[11px] pl-6">
                    <strong className="text-white">Qwen3-TTS</strong> (développé par Alibaba AI / Hugging Face) intègre une architecture LLM dual-track avec respiration humaine, prosodie expressive et intonation naturelle sans saccade.
                  </p>
                </div>
              </div>

              {/* Boutons d'action Téléchargement 1-Clic */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Carte 1 : Script d'installation automatique Qwen3-TTS */}
                <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/30 flex flex-col justify-between space-y-3 relative overflow-hidden">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold font-mono">
                        INSTALLATION 1-CLIC MAC
                      </span>
                      <Apple className="w-4 h-4 text-slate-400" />
                    </div>
                    <h4 className="text-white font-bold text-sm">Pack Installateur Qwen3-TTS</h4>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      Crée un environnement Python virtuel, configure l'accélération matérielle Apple Silicon M1 (Metal MPS), installe PyTorch et génère immédiatement un test vocal sans robot.
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <button
                      id="download-qwen3-setup-btn"
                      onClick={handleDownloadQwen3CommandScript}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs shadow-lg shadow-amber-950/40 transition-all cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Télécharger setup_qwen3_tts.command</span>
                    </button>
                    <p className="text-[10px] text-center text-slate-500">
                      Double-cliquez sur le fichier dans votre dossier Téléchargements.
                    </p>
                  </div>
                </div>

                {/* Carte 2 : Script de Doublage Stitch & Pad Qwen3-TTS */}
                <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/30 flex flex-col justify-between space-y-3 relative overflow-hidden">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold font-mono">
                        DOUBLAGE FILMORA
                      </span>
                      <FileAudio className="w-4 h-4 text-slate-400" />
                    </div>
                    <h4 className="text-white font-bold text-sm">Script qwen3_tts_dubber.py</h4>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      Script Python complet qui prend votre fichier <strong className="text-slate-200">.SRT</strong>, traduit en français et génère le Master Audio 44.1kHz avec la voix IA Qwen3 sans aucun décalage temporel.
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <button
                      id="download-qwen3-dubber-btn"
                      onClick={handleDownloadQwen3DubberScript}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-950/40 transition-all cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Télécharger qwen3_tts_dubber.py</span>
                    </button>
                    <p className="text-[10px] text-center text-slate-500">
                      Prêt pour exécution CLI ou dans Visual Studio Code.
                    </p>
                  </div>
                </div>
              </div>

              {/* Alternative immédiate ultra-rapide sans téléchargement lourd */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-white text-xs">
                      Alternative Immédiate 0% Robotique : Microsoft Henri & Denise Neural
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[9px] font-bold font-mono">
                    Sans GPU • Gratuit
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Si vous ne souhaitez pas installer les modèles lourds de plusieurs gigaoctets de Qwen3 sur votre disque, le script inclut automatiquement <strong className="text-slate-200">Microsoft Henri Neural</strong>. C'est la voix de synthèse utilisée par les professionnels : timbre de présentateur radio, intonations fluides et 100% humaine.
                </p>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2 font-mono text-[11px]">
                  <div className="flex items-center justify-between text-slate-400">
                    <span># Installation ultra-légère en 3 secondes dans votre terminal :</span>
                    <button
                      id="copy-pip-edge-btn"
                      onClick={() => handleCopy('pip install edge-tts pysrt pydub audioop-lts', 'pip-edge')}
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                      title="Copier la commande"
                    >
                      {copiedCmd === 'pip-edge' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
                    </button>
                  </div>
                  <div className="text-emerald-300 font-bold">
                    pip install edge-tts pysrt pydub audioop-lts
                  </div>
                  <div className="text-slate-400 pt-1">
                    <span># Test vocal instantané en direct :</span>
                  </div>
                  <div className="text-cyan-300">
                    edge-tts --voice fr-FR-HenriNeural --text "Bonjour, voici une voix française 100% humaine sans accent robotique." --write-media test.mp3 && afplay test.mp3
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400">
                    Tester la voix en prévisualisation web :
                  </span>
                  <button
                    id="test-henri-preview-btn"
                    onClick={() => handleTestVoice('Microsoft Henri Online (Natural)', "Bonjour, voici une voix de haute définition sans aucune tonalité robotique.")}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold text-xs border border-slate-700 cursor-pointer"
                  >
                    {playingVoiceName === 'Microsoft Henri Online (Natural)' ? (
                      <>
                        <Square className="w-3.5 h-3.5 fill-current" />
                        <span>Arrêter</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Écouter Henri Neural</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: VOIX DÉTECTÉES SUR LE SYSTÈME */}
          {activeTab === 'detected' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className={`w-3 h-3 rounded-full ${hasThomasInstalled ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></div>
                  <div>
                    <div className="font-semibold text-white">
                      {hasThomasInstalled 
                        ? '✅ Voix Thomas détectée sur votre système !' 
                        : '⚠️ Voix Thomas non encore téléchargée dans macOS'}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {detectedVoices.length > 0 
                        ? `${detectedVoices.length} voix françaises prêtes pour la synthèse.`
                        : 'Recherche des voix du système en cours ou voix françaises par défaut actives.'}
                    </p>
                  </div>
                </div>

                {!hasThomasInstalled && (
                  <button
                    id="btn-switch-to-macos-guide"
                    onClick={() => setActiveTab('macos')}
                    className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-[11px] shrink-0 cursor-pointer"
                  >
                    Télécharger Thomas (Mac) →
                  </button>
                )}
              </div>

              {/* Liste des voix françaises */}
              <div className="space-y-2">
                <h4 className="font-semibold text-slate-300 uppercase tracking-wider text-[10px] font-mono">
                  Voix françaises utilisables immédiatement dans votre navigateur :
                </h4>

                {detectedVoices.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-center text-slate-400 space-y-2">
                    <p>La synthèse vocale utilise la voix par défaut de votre système.</p>
                    <p className="text-[11px] text-slate-500">
                      Sur macOS, rendez-vous dans Réglages Système ➔ Accessibilité ➔ Contenu énoncé pour télécharger "Thomas (Améliorée)".
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2 max-h-[320px] overflow-y-auto">
                    {detectedVoices.map((voice, idx) => {
                      const isChosen = selectedVoice === voice.name;
                      const isPlaying = playingVoiceName === voice.name;

                      return (
                        <div
                          key={idx}
                          className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                            isChosen 
                              ? 'bg-cyan-950/30 border-cyan-500/80 text-white' 
                              : 'bg-slate-950 border-slate-800/80 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <button
                              id={`test-detected-voice-${idx}`}
                              onClick={() => handleTestVoice(voice.name)}
                              className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                                isPlaying 
                                  ? 'bg-cyan-500 text-slate-950 border-cyan-400' 
                                  : 'bg-slate-900 hover:bg-slate-800 text-cyan-400 border-slate-800'
                              }`}
                              title="Tester la voix"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                            </button>

                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold font-mono text-white">{voice.name}</span>
                                {voice.isNatural && (
                                  <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[9px] font-bold">
                                    Naturelle / Neural
                                  </span>
                                )}
                                {isChosen && (
                                  <span className="px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 text-[9px] font-bold">
                                    Voix Active
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono">
                                Langue : {voice.lang} {voice.isDefault ? '• Voix système par défaut' : ''}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              id={`select-default-voice-${idx}`}
                              onClick={() => handleSelectDefaultVoice(voice.name)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                                isChosen
                                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                              }`}
                            >
                              {isChosen ? 'Sélectionnée' : 'Choisir'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: GUIDE MACOS M1 THOMAS AMÉLIORÉE */}
          {activeTab === 'macos' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white font-bold">
                    <Apple className="w-4 h-4 text-cyan-400" />
                    <span>Procédure Gratuite sur Mac (Apple Silicon M1 / M2 / M3 / M4)</span>
                  </div>
                  <button
                    id="download-mac-cmd-script-btn"
                    onClick={handleDownloadMacScript}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Télécharger script .command</span>
                  </button>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Apple fournit gratuitement des voix neuronales haute fidélité enregistrées en studio. Par défaut, macOS n'installe que la version compressée de 2 Mo qui sonne mécanique. Il suffit de télécharger la version complète de 150 Mo.
                </p>

                <ol className="list-decimal list-inside space-y-2 text-slate-300 text-[11px] bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                  <li>
                    Ouvrez les <strong className="text-white">Réglages Système</strong> de votre Mac.
                  </li>
                  <li>
                    Dans la barre latérale, cliquez sur <strong className="text-white">Accessibilité</strong> puis sur <strong className="text-white">Contenu énoncé</strong> (Spoken Content).
                  </li>
                  <li>
                    En face de <strong className="text-white">Voix du système</strong>, ouvrez le menu déroulant et cliquez sur <strong className="text-cyan-400">Gérer les voix...</strong>.
                  </li>
                  <li>
                    Déroulez <strong className="text-white">Français (France)</strong>.
                  </li>
                  <li>
                    Cliquez sur le petit nuage <strong className="text-cyan-400">☁️</strong> à côté de <strong className="text-white">Thomas (Améliorée)</strong> (~150 Mo) ou <strong className="text-white">Audrey (Améliorée)</strong>.
                  </li>
                  <li>
                    Une fois le téléchargement terminé, la voix naturelle est instantanément disponible dans le script Python 3.13, dans Stitch & Pad, dans Filmora et sans aucune connexion internet !
                  </li>
                </ol>

                <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 text-[11px]">
                  <span className="text-slate-400 font-mono">Commande Terminal pour tester Thomas :</span>
                  <div className="flex items-center gap-2">
                    <code className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-cyan-300 font-mono text-[10px]">
                      say -v Thomas "Bonjour, test voix naturelle."
                    </code>
                    <button
                      id="copy-terminal-test-cmd"
                      onClick={() => handleCopy('say -v Thomas "Bonjour, test voix naturelle."', 'say-test')}
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                      title="Copier la commande"
                    >
                      {copiedCmd === 'say-test' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ÉCHANTILLONS AUDIO WAV (TÉLÉCHARGEABLES) */}
          {activeTab === 'samples' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                <FileAudio className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Téléchargez des échantillons audio de démonstration encodés en <strong className="text-white">44 100 Hz Stéréo 16-bit PCM</strong>. Vous pouvez les glisser directement dans Filmora pour tester l'alignement temporel avant de lancer la génération complète.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {POPULAR_FRENCH_NATURAL_VOICES.map((v) => (
                  <div key={v.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-bold text-white text-xs">{v.name}</div>
                        <div className="text-[10px] text-amber-400 font-mono">{v.quality} • {v.gender}</div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[9px] font-mono text-slate-400">
                        {v.accent}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {v.description}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                      <button
                        id={`test-sample-voice-${v.id}`}
                        onClick={() => handleTestVoice(v.name)}
                        className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 cursor-pointer"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Écouter un extrait</span>
                      </button>

                      <button
                        id={`download-wav-${v.id}`}
                        onClick={() => handleDownloadSampleWav(v.name)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-medium border border-slate-700 transition-colors cursor-pointer"
                      >
                        <Download className="w-3 h-3 text-emerald-400" />
                        <span>Télécharger .WAV</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: MOTEUR PIPER TTS / HAUTE FIDÉLITÉ OFFLINE */}
          {activeTab === 'piper' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white font-bold">
                    <Terminal className="w-4 h-4 text-cyan-400" />
                    <span>Moteur Neural Hors-Ligne Gratuit (Piper TTS)</span>
                  </div>
                  <button
                    id="download-piper-py-script-btn"
                    onClick={handleDownloadPiperScript}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Télécharger setup_piper.py</span>
                  </button>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Si vous travaillez sur une machine Linux ou souhaitez une alternative studio à macOS, vous pouvez utiliser <strong className="text-slate-200">Piper TTS</strong>, un modèle de synthèse neuronale open-source ultra-rapide qui fonctionne 100% hors-ligne en local.
                </p>

                <div className="p-3 rounded-lg bg-slate-900 font-mono text-[11px] text-slate-300 border border-slate-800 space-y-1">
                  <div className="text-slate-500"># Installation en 1 ligne via pip :</div>
                  <div className="text-cyan-400">pip install piper-tts</div>
                  <div className="text-slate-500 mt-2"># Synthèse vocale française ultra-naturelle :</div>
                  <div className="text-emerald-400">echo "Bonjour tout le monde" | piper --model fr_FR-siwis-medium --output_file test.wav</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Qwen3-TTS & les modèles neuronaux sont 100% sans ton robotique.</span>
          </div>

          <button
            id="close-voices-modal-footer-btn"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
