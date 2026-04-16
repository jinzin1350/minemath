import { useState, useEffect, useCallback } from "react";
import { Volume2, Loader2 } from "lucide-react";
import { useDictation } from "@/hooks/useDictation";
import { MinecraftSteve } from "@/components/MinecraftCharacters";
import type { DictationGameProps, QuestionState, DictationWord } from "@/types/dictation";

export function DictationGame({ mode, level, onGameComplete, onExit }: DictationGameProps) {
  const { speak, isPlaying, fetchWords } = useDictation();

  const speakSlow = useCallback((text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const go = () => {
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find(v => v.lang === 'en-US' && (v.name.includes('Google') || v.name.includes('Microsoft') || v.localService))
        || voices.find(v => v.lang === 'en-US');
      const utt = new SpeechSynthesisUtterance(text);
      if (voice) utt.voice = voice;
      utt.lang = 'en-US'; utt.rate = 0.4; utt.pitch = 1; utt.volume = 1;
      window.speechSynthesis.speak(utt);
    };
    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.addEventListener('voiceschanged', go, { once: true });
    } else { go(); }
  }, []);

  const [words, setWords] = useState<DictationWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [questionState, setQuestionState] = useState<QuestionState | null>(null);
  const [userInput, setUserInput] = useState("");
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingAttempt, setLoadingAttempt] = useState(1);
  const [showFeedback, setShowFeedback] = useState(false);

  const saveProgressOnExit = useCallback(() => {
    onGameComplete({
      score, accuracy: Math.round((answers.filter(Boolean).length / (currentIndex || 1)) * 100),
      correctWords: answers.filter(Boolean).length, totalWords: currentIndex, level, mode, incomplete: true,
    });
    onExit();
  }, [score, answers, currentIndex, level, mode, onGameComplete, onExit]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setIsLoading(true);
      for (let attempt = 1; attempt <= 4; attempt++) {
        if (!mounted) return;
        try {
          const fetched = await fetchWords(level, 10);
          if (!mounted) return;
          if (fetched && fetched.length > 0) {
            setWords(fetched); initializeQuestion(fetched[0], fetched); setIsLoading(false); return;
          }
        } catch (_) {}
        if (attempt < 4) { if (mounted) setLoadingAttempt(attempt + 1); await new Promise(r => setTimeout(r, 1500)); }
      }
      if (mounted) setIsLoading(false);
    };
    load();
    return () => { mounted = false; };
  }, [level]);

  const initializeQuestion = (word: DictationWord, wordList: DictationWord[]) => {
    if (mode === "multiple-choice") {
      const wrong = wordList.filter(w => w.id !== word.id).sort(() => Math.random() - 0.5).slice(0, 3).map(w => w.word);
      while (wrong.length < 3) {
        const r = wordList[Math.floor(Math.random() * wordList.length)];
        if (r.id !== word.id && !wrong.includes(r.word)) wrong.push(r.word);
      }
      setQuestionState({ word, userAnswer: "", isCorrect: null, choices: [word.word, ...wrong.slice(0, 3)].sort(() => Math.random() - 0.5) });
    } else if (mode === "fill-blanks") {
      const letters = word.word.toLowerCase().split('');
      const mi = Math.floor(Math.random() * letters.length);
      const correct = letters[mi];
      const display = letters.map((l, i) => i === mi ? '_' : l).join('');
      const abc = 'abcdefghijklmnopqrstuvwxyz';
      const wrong: string[] = [];
      while (wrong.length < 3) {
        const l = abc[Math.floor(Math.random() * abc.length)];
        if (l !== correct && !wrong.includes(l)) wrong.push(l);
      }
      setQuestionState({ word, userAnswer: "", isCorrect: null, missingLetterIndex: mi, letterChoices: [correct, ...wrong].sort(() => Math.random() - 0.5), displayWord: display });
    } else {
      setQuestionState({ word, userAnswer: "", isCorrect: null });
    }
    setTimeout(() => speak(word.word), 500);
  };

  const handleSubmit = useCallback(() => {
    if (!questionState || showFeedback) return;
    const isCorrect = mode === "fill-blanks"
      ? userInput.toLowerCase() === questionState.word.word[questionState.missingLetterIndex!].toLowerCase()
      : userInput.toLowerCase().trim() === questionState.word.word.toLowerCase();

    setQuestionState(prev => prev ? { ...prev, isCorrect, userAnswer: userInput } : null);
    setAnswers(prev => [...prev, isCorrect]);
    setShowFeedback(true);
    if (isCorrect) setScore(prev => prev + 10); else setLives(prev => prev - 1);

    setTimeout(() => {
      const newLives = isCorrect ? lives : lives - 1;
      if (currentIndex < words.length - 1 && (isCorrect || newLives > 0)) {
        setCurrentIndex(prev => prev + 1); setUserInput(""); setShowFeedback(false);
        initializeQuestion(words[currentIndex + 1], words);
      } else {
        const total = currentIndex + 1;
        const correct = [...answers, isCorrect].filter(Boolean).length;
        const finalScore = isCorrect ? score + 10 : score;
        onGameComplete({ score: finalScore, accuracy: Math.round((correct / total) * 100), correctWords: correct, totalWords: total, level, mode });
      }
    }, 1500);
  }, [questionState, userInput, currentIndex, words, lives, score, answers, showFeedback, onGameComplete, level, mode]);

  const handleChoiceSelect = (choice: string) => { if (!showFeedback) setUserInput(choice); };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Enter" && userInput && !showFeedback) handleSubmit(); };
    window.addEventListener("keypress", onKey);
    return () => window.removeEventListener("keypress", onKey);
  }, [userInput, showFeedback, handleSubmit]);

  const modeLabel = mode === "typing" ? "TYPING MODE" : mode === "multiple-choice" ? "MULTIPLE CHOICE" : "FILL THE BLANK";
  const modeColor = mode === "typing" ? '#3b82f6' : mode === "multiple-choice" ? '#10b981' : '#a855f7';
  const modeGlow  = mode === "typing" ? 'rgba(59,130,246,0.25)' : mode === "multiple-choice" ? 'rgba(16,185,129,0.25)' : 'rgba(168,85,247,0.25)';

  // Loading
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-4"
        style={{ background: 'linear-gradient(180deg,#060b14 0%,#0a1a0f 100%)' }}>
        <div className="text-center">
          <div className="flex justify-center mb-4"><MinecraftSteve scale={1.5} /></div>
          <div className="bg-[#0d1117] border-2 border-blue-600 p-6"
            style={{ boxShadow: '0 0 20px rgba(59,130,246,0.2)' }}>
            <Loader2 className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-3" />
            <p className="font-pixel text-blue-400 text-[10px] mb-1">LOADING LEVEL {level}...</p>
            {loadingAttempt > 1 && <p className="font-pixel text-[8px] text-blue-800">WAKING UP SERVER... ({loadingAttempt}/4)</p>}
          </div>
        </div>
      </div>
    );
  }

  if (words.length === 0 || !questionState) {
    return (
      <div className="flex-1 flex items-center justify-center p-4"
        style={{ background: 'linear-gradient(180deg,#060b14 0%,#0a1a0f 100%)' }}>
        <div className="text-center bg-[#0d1117] border-2 border-red-700 p-8">
          <p className="font-pixel text-red-400 text-[10px] mb-5">
            {words.length === 0 ? `NO WORDS FOR LEVEL ${level}` : 'ERROR LOADING GAME'}
          </p>
          <button onClick={saveProgressOnExit}
            className="font-pixel text-[10px] text-white px-5 py-2.5
              bg-gray-700 border-b-4 border-gray-900 hover:bg-gray-600
              transition-all active:border-b-0 active:translate-y-1"
            style={{ borderRadius: 0 }}>← BACK</button>
        </div>
      </div>
    );
  }

  const progressPct = ((currentIndex + 1) / words.length) * 100;

  return (
    <div className="flex-1 pb-20 md:pb-6"
      style={{ background: 'linear-gradient(180deg,#060b14 0%,#0a1a0f 60%,#060b14 100%)', imageRendering: 'pixelated' }}>
      <div className="max-w-xl mx-auto px-3 pt-4">

        {/* ── Top HUD ── */}
        <div className="flex items-center justify-between mb-3">
          <button onClick={saveProgressOnExit} data-testid="button-exit-game"
            className="font-pixel text-[8px] text-gray-500 border border-gray-700 px-3 py-1.5 hover:text-red-400 hover:border-red-800 transition-colors"
            style={{ borderRadius: 0 }}>← EXIT</button>

          {/* Lives */}
          <div className="flex gap-1.5">
            {[0,1,2].map(i => (
              <span key={i} className="text-lg leading-none transition-all"
                style={{ opacity: i < lives ? 1 : 0.15, filter: i < lives ? 'none' : 'grayscale(1)' }}
                data-testid={`heart-${i}`}>❤️</span>
            ))}
          </div>

          <div className="bg-[#0d1117] border-2 border-amber-600 px-3 py-1"
            style={{ boxShadow: '0 0 6px rgba(217,119,6,0.2)' }}
            data-testid="text-score">
            <span className="font-pixel text-[10px] text-amber-400">⭐ {score}</span>
          </div>
        </div>

        {/* ── Progress ── */}
        <div className="mb-4">
          <div className="flex justify-between mb-1">
            <span className="font-pixel text-[8px]" style={{ color: modeColor }}>📖 {modeLabel}</span>
            <span className="font-pixel text-[8px] text-gray-600">{currentIndex + 1}/{words.length}</span>
          </div>
          <div className="w-full h-3 bg-black/50" style={{ border: `1px solid #1f2937` }}>
            <div className="h-full transition-all duration-500"
              style={{ width: `${progressPct}%`, background: `linear-gradient(90deg, ${modeColor}, ${modeColor}aa)`, boxShadow: `0 0 6px ${modeGlow}` }} />
          </div>
        </div>

        {/* ── Steve + speech bubble ── */}
        <div className="flex items-end gap-3 mb-4">
          <div className="flex-none flex flex-col items-center">
            <MinecraftSteve scale={1.2} />
            <span className="font-pixel text-[6px] text-emerald-500 mt-0.5">STEVE</span>
          </div>
          <div className="flex-1 bg-[#0d1117] border-2 border-blue-700 p-3 relative"
            style={{ boxShadow: `0 0 12px ${modeGlow}` }}>
            {/* triangle pointer */}
            <div className="absolute left-0 bottom-3 w-0 h-0"
              style={{ borderTop: '6px solid transparent', borderBottom: '6px solid transparent', borderRight: '8px solid #1d4ed8', transform: 'translateX(-8px)' }} />
            <p className="font-pixel text-[8px] text-blue-300 mb-1">WORD {currentIndex + 1}/{words.length}</p>
            {/* Audio buttons inside bubble */}
            <div className="flex gap-2">
              <button onClick={() => speak(questionState.word.word)} disabled={isPlaying}
                data-testid="button-play-audio"
                className="flex items-center gap-1.5 px-3 py-2 transition-all active:translate-y-0.5 disabled:opacity-50"
                style={{ borderRadius: 0, background: '#1e3a8a', border: '2px solid #3b82f6', borderBottom: '3px solid #1e3a8a' }}>
                {isPlaying ? <Loader2 className="w-4 h-4 animate-spin text-blue-300" /> : <Volume2 className="w-4 h-4 text-blue-300" />}
                <span className="font-pixel text-[8px] text-blue-300">LISTEN</span>
              </button>
              <button onClick={() => speakSlow(questionState.word.word)} disabled={isPlaying}
                data-testid="button-play-slow"
                className="flex items-center gap-1.5 px-3 py-2 transition-all active:translate-y-0.5 disabled:opacity-50"
                style={{ borderRadius: 0, background: '#134e4a', border: '2px solid #0d9488', borderBottom: '3px solid #134e4a' }}>
                <span className="text-sm">🐌</span>
                <span className="font-pixel text-[8px] text-teal-400">SLOW</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Main question card ── */}
        <div className="bg-[#0d1117] p-4 mb-3"
          style={{ border: `2px solid ${modeColor}`, boxShadow: `0 0 16px ${modeGlow}` }}>

          {/* Category */}
          {questionState.word.category && (
            <div className="flex justify-center mb-4">
              <span className="font-pixel text-[8px] px-3 py-1 bg-black/50"
                style={{ border: `1px solid ${modeColor}44`, color: modeColor }}>
                📦 {questionState.word.category.toUpperCase()}
              </span>
            </div>
          )}

          {/* ── Typing ── */}
          {mode === "typing" && (
            <div className="mb-3">
              <p className="font-pixel text-[8px] text-gray-600 text-center mb-2 tracking-widest">TYPE THE WORD YOU HEARD</p>
              <input
                value={userInput}
                onChange={e => setUserInput(e.target.value)}
                placeholder="type here..."
                disabled={showFeedback}
                data-testid="input-answer"
                autoFocus
                className="w-full text-center text-lg py-3 bg-black/60 text-white
                  placeholder:text-gray-700 focus:outline-none transition-colors"
                style={{ borderRadius: 0, border: `2px solid ${showFeedback ? modeColor : '#374151'}`, borderBottom: `4px solid #111827`, fontFamily: 'monospace' }}
              />
            </div>
          )}

          {/* ── Fill the blank ── */}
          {mode === "fill-blanks" && (
            <div className="mb-3">
              <p className="font-pixel text-[8px] text-gray-600 text-center mb-3 tracking-widest">CHOOSE THE MISSING LETTER</p>
              <div className="text-center mb-4 py-3 bg-black/40"
                style={{ border: '2px solid #1f2937' }}>
                <p className="text-3xl md:text-4xl font-mono tracking-[0.3em]">
                  {questionState.displayWord?.split('').map((l, i) => (
                    <span key={i}
                      className={l === '_' ? 'border-b-4 px-1 mx-0.5' : ''}
                      style={{ color: l === '_' ? '#f59e0b' : '#e5e7eb', borderColor: '#f59e0b' }}>
                      {l}
                    </span>
                  ))}
                </p>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {questionState.letterChoices?.map((letter, i) => (
                  <button key={i} onClick={() => handleChoiceSelect(letter)} disabled={showFeedback}
                    data-testid={`button-letter-${i}`}
                    className="py-3 text-xl font-mono font-bold transition-all active:translate-y-0.5 disabled:opacity-50"
                    style={{
                      borderRadius: 0,
                      background: userInput === letter ? '#78350f' : '#111827',
                      border: `2px solid ${userInput === letter ? '#f59e0b' : '#374151'}`,
                      borderBottom: `4px solid ${userInput === letter ? '#451a03' : '#0d1117'}`,
                      color: userInput === letter ? '#fbbf24' : '#9ca3af',
                    }}>
                    {letter.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Multiple choice ── */}
          {mode === "multiple-choice" && (
            <div className="mb-3">
              <p className="font-pixel text-[8px] text-gray-600 text-center mb-3 tracking-widest">PICK THE CORRECT SPELLING</p>
              <div className="grid grid-cols-2 gap-2">
                {questionState.choices?.map((choice, i) => (
                  <button key={i} onClick={() => handleChoiceSelect(choice)} disabled={showFeedback}
                    data-testid={`button-choice-${i}`}
                    className="py-4 px-2 font-pixel text-[10px] leading-tight transition-all active:translate-y-0.5 disabled:opacity-50"
                    style={{
                      borderRadius: 0,
                      background: userInput === choice ? '#064e3b' : '#111827',
                      border: `2px solid ${userInput === choice ? '#10b981' : '#374151'}`,
                      borderBottom: `4px solid ${userInput === choice ? '#022c22' : '#0d1117'}`,
                      color: userInput === choice ? '#6ee7b7' : '#d1d5db',
                    }}>
                    {choice}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Feedback banner */}
          {showFeedback && (
            <div data-testid="text-feedback"
              className="text-center font-pixel text-[9px] py-2.5 px-4 mb-3 animate-pulse"
              style={{
                border: `2px solid ${questionState.isCorrect ? '#16a34a' : '#dc2626'}`,
                background: questionState.isCorrect ? 'rgba(22,163,74,0.12)' : 'rgba(220,38,38,0.12)',
                color: questionState.isCorrect ? '#86efac' : '#fca5a5',
              }}>
              {questionState.isCorrect
                ? '✅ CORRECT! +10 XP ⭐'
                : `❌ WRONG! ANSWER: "${questionState.word.word.toUpperCase()}"`}
            </div>
          )}

          {/* Submit */}
          {!showFeedback && (mode === "typing" || userInput) && (
            <button onClick={handleSubmit} disabled={!userInput || showFeedback}
              data-testid="button-submit"
              className="w-full font-pixel text-[11px] text-white py-3 tracking-widest
                border-b-4 transition-all active:border-b-0 active:translate-y-1
                disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                borderRadius: 0,
                background: modeColor + 'cc',
                border: `2px solid ${modeColor}`,
                borderBottom: `4px solid ${modeColor}55`,
              }}>
              ▶ SUBMIT ANSWER
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
