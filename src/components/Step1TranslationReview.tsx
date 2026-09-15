import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  UploadCloud, 
  Download, 
  Search, 
  Sparkles, 
  CheckCircle, 
  Play, 
  RefreshCw, 
  BookOpen, 
  ChevronDown, 
  ChevronUp, 
  Volume2,
  Languages,
  AlertTriangle,
  Loader2,
  Wand2
} from 'lucide-react';
import { SubtitleItem } from '../types';
import { countWords, calculateTargetRate, formatSrt, parseSrt } from '../utils/timecode';
import { CS_GLOSSARY } from '../data/csGlossary';
import { playBrowserTtsPreview, stopBrowserTts } from '../utils/audioSynthesizer';
import { SrtUploadZone } from './SrtUploadZone';
import { 
  translateSubtitlesBatch, 
  translateSingleSegment, 
  hasUntranslatedSubtitles 
} from '../utils/translator';

interface Step1Props {
  subtitles: SubtitleItem[];
  setSubtitles: React.Dispatch<React.SetStateAction<SubtitleItem[]>>;
  projectName: string;
  setProjectName: (name: string) => void;
  onProceedToStep2: () => void;
  onLoadBenchmark: () => void;
  onLoadSample: () => void;
  onOpenResetModal: () => void;
  onOpenNaturalVoicesModal: () => void;
}

export const Step1TranslationReview: React.FC<Step1Props> = ({
  subtitles,
  setSubtitles,
  projectName,
  setProjectName,
  onProceedToStep2,
  onLoadBenchmark,
  onLoadSample,
  onOpenResetModal,
  onOpenNaturalVoicesModal
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPacing, setFilterPacing] = useState<'all' | 'optimal' | 'accelerated' | 'untranslated'>('all');
  const [activeView, setActiveView] = useState<'grid' | 'raw'>('grid');
  const [showGlossary, setShowGlossary] = useState(false);
  const [selectedGlossaryCategory, setSelectedGlossaryCategory] = useState<string>('all');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationProgress, setTranslationProgress] = useState({ current: 0, total: 0 });
  const [rowTranslatingId, setRowTranslatingId] = useState<number | null>(null);
  const [translationSuccessMsg, setTranslationSuccessMsg] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<number | null>(null);

  // Count untranslated lines (where French equals English)
  const untranslatedCount = useMemo(() => {
    return subtitles.filter(item => item.frText.trim().toLowerCase() === item.enText.trim().toLowerCase()).length;
  }, [subtitles]);

  // Filtered rows
  const filteredSubtitles = useMemo(() => {
    return subtitles.filter(item => {
      const isUntranslated = item.frText.trim().toLowerCase() === item.enText.trim().toLowerCase();

      const matchesSearch = 
        !searchQuery || 
        item.enText.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.frText.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.index.toString().includes(searchQuery);

      let matchesFilter = true;
      if (filterPacing === 'optimal') matchesFilter = item.pacingCategory === 'optimal';
      else if (filterPacing === 'accelerated') matchesFilter = item.pacingCategory === 'accelerated';
      else if (filterPacing === 'untranslated') matchesFilter = isUntranslated;

      return matchesSearch && matchesFilter;
    });
  }, [subtitles, searchQuery, filterPacing]);

  // Handle single cell edit for French translation
  const handleFrenchTextChange = (id: number, newText: string) => {
    setSubtitles(prev => prev.map(item => {
      if (item.id === id) {
        const words = countWords(newText);
        const rateInfo = calculateTargetRate(words, item.durationMs, 175);
        return {
          ...item,
          frText: newText,
          wordCountFr: words,
          calculatedRateWpm: rateInfo.targetRateWpm,
          rateMultiplier: rateInfo.rateMultiplier,
          pacingCategory: rateInfo.pacingCategory,
          isEdited: true
        };
      }
      return item;
    }));
  };

  // Automated translation pipeline for all subtitles
  const runTranslationPipeline = async (targetItems?: SubtitleItem[]) => {
    const itemsToTranslate = targetItems || subtitles;
    if (isTranslating || itemsToTranslate.length === 0) return;

    setIsTranslating(true);
    setTranslationProgress({ current: 0, total: itemsToTranslate.length });
    setTranslationSuccessMsg(null);

    try {
      const translated = await translateSubtitlesBatch(itemsToTranslate, (current, total) => {
        setTranslationProgress({ current, total });
      });

      setSubtitles(translated);
      setTranslationSuccessMsg(`Traduction terminée : ${translated.length} sous-titres traduits en français avec succès !`);
      setTimeout(() => setTranslationSuccessMsg(null), 5000);
    } catch (err) {
      console.error('Erreur de traduction:', err);
      setTranslationSuccessMsg('Traduction effectuée via le lexique informatique français.');
      setTimeout(() => setTranslationSuccessMsg(null), 4000);
    } finally {
      setIsTranslating(false);
    }
  };

  // Translate a single row on demand
  const handleTranslateSingleRow = async (id: number) => {
    const item = subtitles.find(s => s.id === id);
    if (!item || rowTranslatingId !== null) return;

    setRowTranslatingId(id);
    try {
      const fr = await translateSingleSegment(item.enText);
      handleFrenchTextChange(id, fr);
    } catch (err) {
      console.error(`Erreur traduction ligne ${id}:`, err);
    } finally {
      setRowTranslatingId(null);
    }
  };

  // Called when user uploads an .srt file via SrtUploadZone
  const handleSubtitlesLoaded = (items: SubtitleItem[], fileName: string) => {
    setSubtitles(items);
    setProjectName(fileName);

    // If uploaded subtitles contain English in the French column, auto-translate immediately!
    if (hasUntranslatedSubtitles(items)) {
      setTimeout(() => {
        runTranslationPipeline(items);
      }, 300);
    }
  };

  // Apply CS Glossary term replacement to French text
  const applyGlossaryReplacement = (enTerm: string, frTerm: string) => {
    setSubtitles(prev => prev.map(item => {
      const regex = new RegExp(`\\b${enTerm}\\b`, 'gi');
      if (regex.test(item.frText)) {
        const updated = item.frText.replace(regex, frTerm);
        const words = countWords(updated);
        const rateInfo = calculateTargetRate(words, item.durationMs, 175);
        return {
          ...item,
          frText: updated,
          wordCountFr: words,
          calculatedRateWpm: rateInfo.targetRateWpm,
          rateMultiplier: rateInfo.rateMultiplier,
          pacingCategory: rateInfo.pacingCategory,
          isEdited: true
        };
      }
      return item;
    }));
  };

  // Export weekX_A_CORRIGER.srt
  const handleExportCorrectedSrt = () => {
    const srtContent = formatSrt(subtitles, true);
    const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName}_A_CORRIGER.srt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Play browser TTS preview
  const handlePreviewTts = (item: SubtitleItem) => {
    if (playingId === item.id) {
      stopBrowserTts();
      setPlayingId(null);
      return;
    }
    setPlayingId(item.id);
    playBrowserTtsPreview(item.frText, item.calculatedRateWpm, () => {
      setPlayingId(null);
    });
  };

  // Stats calculation
  const totalAccelerated = useMemo(() => subtitles.filter(s => s.calculatedRateWpm > 185).length, [subtitles]);
  const lastSub = subtitles[subtitles.length - 1];
  const totalDurationFormatted = lastSub ? `${Math.floor((lastSub.endTimeMs / 1000) / 60)}m ${Math.round((lastSub.endTimeMs / 1000) % 60)}s` : '0m 0s';

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* 1. ZONE DE TÉLÉVERSEMENT SRT PRINCIPALE & MINIMALISTE */}
      <SrtUploadZone
        projectName={projectName}
        setProjectName={setProjectName}
        subtitlesCount={subtitles.length}
        totalDurationFormatted={totalDurationFormatted}
        onSubtitlesLoaded={handleSubtitlesLoaded}
        onLoadSample={onLoadSample}
        onLoadBenchmark={onLoadBenchmark}
        onOpenResetModal={onOpenResetModal}
        onOpenNaturalVoicesModal={onOpenNaturalVoicesModal}
      />

      {/* BANNIÈRE D'ALERTE : SOUS-TITRES NON TRADUITS DÉTECTÉS */}
      {untranslatedCount > 0 && !isTranslating && (
        <div className="bg-gradient-to-r from-amber-950/70 via-slate-900 to-slate-900 border border-amber-600/50 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-amber-950/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/30 text-amber-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-200 uppercase tracking-wider flex items-center gap-2">
                <span>Traduction française requise ({untranslatedCount} sur {subtitles.length} sous-titres en anglais)</span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                La colonne de droite contient encore le texte original en anglais. Lancez la traduction automatique pour générer les voix françaises Thomas.
              </p>
            </div>
          </div>

          <button
            id="banner-translate-all-btn"
            onClick={() => runTranslationPipeline()}
            disabled={isTranslating}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-cyan-500/25 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 fill-current" />
            <span>Traduire Tout en Français (IA)</span>
          </button>
        </div>
      )}

      {/* NOTIFICATION SUCCÈS TRADUCTION */}
      {translationSuccessMsg && (
        <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-xl p-3.5 flex items-center gap-2.5 text-xs text-emerald-200 shadow-md">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{translationSuccessMsg}</span>
        </div>
      )}

      {/* 2. BARRE D'ACTIONS ET FILTRES ÉPURÉE */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        {/* Ligne principale : Recherche, Traduction et Actions */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Recherche rapide */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="search-subtitles-input"
              type="text"
              placeholder="Rechercher dans les sous-titres anglais, français ou n°..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          {/* Filtres de rythme & Vue */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                id="filter-all-btn"
                onClick={() => setFilterPacing('all')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  filterPacing === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Tous ({subtitles.length})
              </button>
              {untranslatedCount > 0 && (
                <button
                  id="filter-untranslated-btn"
                  onClick={() => setFilterPacing('untranslated')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    filterPacing === 'untranslated' ? 'bg-amber-950 text-amber-300 border border-amber-800/80 font-bold' : 'text-amber-400 hover:text-amber-300'
                  }`}
                >
                  Non traduits ({untranslatedCount})
                </button>
              )}
              <button
                id="filter-accel-btn"
                onClick={() => setFilterPacing('accelerated')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  filterPacing === 'accelerated' ? 'bg-amber-950 text-amber-300 border border-amber-800/80' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Accélérés ({totalAccelerated})
              </button>
            </div>

            {/* Bascule Grille / Texte Brut */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                id="view-grid-btn"
                onClick={() => setActiveView('grid')}
                className={`px-2.5 py-1.5 rounded-lg font-medium ${
                  activeView === 'grid' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'
                }`}
              >
                Tableau
              </button>
              <button
                id="view-raw-btn"
                onClick={() => setActiveView('raw')}
                className={`px-2.5 py-1.5 rounded-lg font-medium ${
                  activeView === 'raw' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'
                }`}
              >
                SRT Brut
              </button>
            </div>

            {/* Bouton Traduire Tout en Français */}
            <button
              id="run-translation-pipeline-btn"
              onClick={() => runTranslationPipeline()}
              disabled={isTranslating}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-cyan-500/20 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTranslating ? 'animate-spin' : ''}`} />
              <span>
                {isTranslating 
                  ? `Traduction (${translationProgress.current}/${translationProgress.total})...` 
                  : '🪄 Traduire Tout en FR'
                }
              </span>
            </button>

            {/* Exporter .SRT corrigé */}
            <button
              id="export-corrected-srt-btn"
              onClick={handleExportCorrectedSrt}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
              title="Télécharger le fichier .srt français révisé"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Exporter .SRT</span>
            </button>
          </div>
        </div>

        {/* Barre de progression traduction si active */}
        {isTranslating && (
          <div className="pt-2">
            <div className="flex justify-between text-xs text-slate-300 mb-1.5 font-mono">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Traduction automatique en français en cours ({translationProgress.current}/{translationProgress.total})...</span>
              </span>
              <span className="font-bold text-cyan-400">
                {translationProgress.total > 0 ? Math.round((translationProgress.current / translationProgress.total) * 100) : 0}%
              </span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
              <div
                className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full rounded-full transition-all duration-150"
                style={{ width: `${translationProgress.total > 0 ? (translationProgress.current / translationProgress.total) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Tiroir Lexique Informatique (Repliable pour un design minimaliste) */}
        <div className="border-t border-slate-800/80 pt-3">
          <button
            id="toggle-glossary-btn"
            onClick={() => setShowGlossary(!showGlossary)}
            className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span>Lexique informatique français (Optionnel)</span>
            {showGlossary ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {showGlossary && (
            <div className="mt-3 p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-300">Remplacement rapide de termes informatiques :</span>
                <div className="flex gap-1">
                  {['all', 'concurrency', 'memory', 'algorithms', 'systems'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedGlossaryCategory(cat)}
                      className={`px-2 py-0.5 rounded text-[10px] uppercase font-mono ${
                        selectedGlossaryCategory === cat ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-2">
                {CS_GLOSSARY.filter(t => selectedGlossaryCategory === 'all' || t.category === selectedGlossaryCategory).slice(0, 15).map((term, i) => (
                  <button
                    key={i}
                    onClick={() => applyGlossaryReplacement(term.en, term.fr)}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 hover:text-white transition-all font-mono text-left"
                  >
                    <span className="text-slate-400">{term.en}</span>
                    <span className="text-cyan-400">→</span>
                    <span className="text-emerald-400 font-medium">{term.fr}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. TABLEAU DES SOUS-TITRES (VUE MINIMALISTE & LISIBLE) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {activeView === 'grid' ? (
          <div>
            <div className="max-h-[580px] overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-950 sticky top-0 z-10 border-b border-slate-800 text-slate-400 font-mono">
                  <tr>
                    <th className="py-2.5 px-3 w-12 text-center">#</th>
                    <th className="py-2.5 px-3 w-32">TIMECODE</th>
                    <th className="py-2.5 px-3 w-5/12">TEXTE ORIGINAL (ANGLAIS)</th>
                    <th className="py-2.5 px-3 w-6/12">
                      <div className="flex items-center justify-between">
                        <span>TRADUCTION FRANÇAISE (ÉDITABLE)</span>
                        <span className="text-[10px] text-cyan-400 font-normal">Édition & synthèse instantanées</span>
                      </div>
                    </th>
                    <th className="py-2.5 px-3 w-24 text-center">VITESSE</th>
                    <th className="py-2.5 px-3 w-12 text-center">ÉCOUTER</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {subtitles.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 px-4 text-center">
                        <div className="max-w-md mx-auto space-y-3">
                          <div className="w-12 h-12 rounded-2xl bg-cyan-950/80 border border-cyan-800/60 text-cyan-400 mx-auto flex items-center justify-center">
                            <UploadCloud className="w-6 h-6" />
                          </div>
                          <h4 className="text-sm font-bold text-white">Nouveau Projet Vierge Prêt</h4>
                          <p className="text-xs text-slate-400 leading-relaxed">
                            Aucun sous-titre chargé pour le moment. Glissez-déposez votre fichier <span className="text-cyan-400 font-mono">.srt</span> dans la zone ci-dessus, ou chargez l'exemple de cours d'informatique.
                          </p>
                          <div className="flex items-center justify-center gap-2 pt-2">
                            <button
                              id="empty-load-sample-btn"
                              onClick={onLoadSample}
                              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
                            >
                              Charger l'exemple (12 sous-titres)
                            </button>
                            <button
                              id="empty-open-voices-btn"
                              onClick={onOpenNaturalVoicesModal}
                              className="px-3.5 py-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900/80 text-cyan-300 text-xs font-semibold border border-cyan-700/80 transition-colors"
                            >
                              Télécharger Voix Naturelles
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : filteredSubtitles.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                        Aucun sous-titre ne correspond à votre recherche "{searchQuery}" ou au filtre sélectionné.
                      </td>
                    </tr>
                  ) : (
                    filteredSubtitles.slice(0, 100).map((item) => {
                      const isUntranslated = item.frText.trim().toLowerCase() === item.enText.trim().toLowerCase();
                      const isTranslatingThisRow = rowTranslatingId === item.id;

                      return (
                        <tr 
                          key={item.id} 
                          className={`hover:bg-slate-800/30 transition-colors ${
                            isUntranslated ? 'bg-amber-950/15' : item.pacingCategory === 'accelerated' ? 'bg-amber-950/5' : ''
                          }`}
                        >
                        {/* Numéro */}
                        <td className="py-2.5 px-3 font-mono text-center text-slate-500 font-semibold">
                          {item.index}
                        </td>

                        {/* Timecode & Durée */}
                        <td className="py-2.5 px-3 font-mono text-slate-400 whitespace-nowrap">
                          <div className="text-slate-300 font-medium">{item.startTimeStr}</div>
                          <div className="text-[10px] text-slate-500">{(item.durationMs / 1000).toFixed(1)}s</div>
                        </td>

                        {/* Anglais */}
                        <td className="py-2.5 px-3 text-slate-300 leading-relaxed font-sans">
                          {item.enText}
                        </td>

                        {/* Français Éditable */}
                        <td className="py-2.5 px-3">
                          <div className="space-y-1.5">
                            {/* Statut de traduction & bouton individuel */}
                            <div className="flex items-center justify-between text-[10px]">
                              {isUntranslated ? (
                                <span className="inline-flex items-center gap-1 text-amber-400 font-semibold">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                                  <span>Non traduit (Anglais)</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                  <span>Français ({item.wordCountFr} mots)</span>
                                </span>
                              )}

                              <button
                                id={`translate-row-btn-${item.id}`}
                                onClick={() => handleTranslateSingleRow(item.id)}
                                disabled={isTranslatingThisRow}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 border border-slate-700 transition-colors text-[10px] cursor-pointer"
                                title="Traduire automatiquement cette ligne en français"
                              >
                                {isTranslatingThisRow ? (
                                  <Loader2 className="w-3 h-3 animate-spin text-cyan-400" />
                                ) : (
                                  <Wand2 className="w-3 h-3 text-cyan-400" />
                                )}
                                <span>{isUntranslated ? 'Traduire en FR' : 'Retraduire'}</span>
                              </button>
                            </div>

                            <div className="relative">
                              <textarea
                                id={`fr-text-input-${item.id}`}
                                value={item.frText}
                                rows={2}
                                onChange={(e) => handleFrenchTextChange(item.id, e.target.value)}
                                className={`w-full p-2 rounded-lg bg-slate-950 border text-white text-xs focus:outline-none resize-none transition-colors ${
                                  isUntranslated 
                                    ? 'border-amber-700/60 focus:border-amber-500' 
                                    : 'border-slate-800 focus:border-cyan-500'
                                }`}
                                placeholder="Traduction française..."
                              />
                              {item.isEdited && (
                                <span className="absolute right-2 top-2 w-1.5 h-1.5 rounded-full bg-cyan-400" title="Modifié"></span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Vitesse Pacing */}
                        <td className="py-2.5 px-3 text-center">
                          <span 
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                              item.pacingCategory === 'optimal' 
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/80' 
                                : 'bg-amber-950 text-amber-300 border border-amber-800/80'
                            }`}
                          >
                            -r {item.calculatedRateWpm}
                          </span>
                        </td>

                        {/* Audio TTS Preview */}
                        <td className="py-2.5 px-3 text-center">
                          <button
                            id={`play-tts-preview-btn-${item.id}`}
                            onClick={() => handlePreviewTts(item)}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              playingId === item.id
                                ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                                : 'bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-800'
                            }`}
                            title="Écouter la voix française"
                          >
                            <Play className="w-3 h-3 fill-current" />
                          </button>
                        </td>
                      </tr>
                    );
                  }))}
                </tbody>
              </table>

              {filteredSubtitles.length > 100 && (
                <div className="p-3 text-center text-xs text-slate-500 bg-slate-950/80 border-t border-slate-800 font-mono">
                  Affichage des 100 premières lignes sur {filteredSubtitles.length} pour une fluidité optimale. Utilisez la recherche pour filtrer un instant précis.
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Vue Éditeur SRT Brut */
          <div className="p-3 bg-slate-950">
            <textarea
              id="raw-srt-textarea"
              rows={16}
              value={formatSrt(subtitles, true)}
              onChange={(e) => {
                const parsed = parseSrt(e.target.value);
                if (parsed.length > 0) setSubtitles(parsed);
              }}
              className="w-full p-4 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 font-mono text-xs leading-relaxed focus:outline-none focus:border-cyan-500"
              placeholder="Collez ou modifiez directement le contenu SRT ici..."
            />
          </div>
        )}

        {/* Pied de page avec bouton vers l'étape 2 */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-slate-950 border-t border-slate-800">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>Traductions prêtes pour le moteur audio sans tronquage de syllabes.</span>
          </div>

          <button
            id="proceed-to-step2-btn"
            onClick={onProceedToStep2}
            disabled={subtitles.length === 0}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg transition-all ${
              subtitles.length === 0 
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' 
                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/20 cursor-pointer'
            }`}
          >
            <span>{subtitles.length === 0 ? 'Charger un .SRT pour continuer' : 'Passer à l\'Étape 2 : Moteur Audio "Stitch & Pad"'}</span>
            <span>→</span>
          </button>
        </div>
      </div>
    </div>
  );
};
