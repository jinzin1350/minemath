import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Volume2, Heart, ArrowLeft, Loader2 } from "lucide-react";
import { useDictation } from "@/hooks/useDictation";
import type { DictationGameProps, QuestionState, DictationWord } from "@/types/dictation";

export function DictationGame({ mode, level, onGameComplete, onExit }: DictationGameProps) {
  const { speak, isPlaying, fetchWords } = useDictation();

  // Slow speech function
  const speakSlow = useCallback((text: string) => {
    if (!window.speechSynthesis) return;

    window.speechSynthesis.cancel();

    const speakSlowWithVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(voice => 
        voice.lang === 'en-US' && (
          voice.name.includes('Google') || 
          voice.name.includes('Microsoft') ||
          voice.localService
        )
      ) || voices.find(voice => voice.lang === 'en-US');

      const utterance = new SpeechSynthesisUtterance(text);

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.lang = "en-US";
      utterance.rate = 0.4; // Very slow for pronunciation practice
      utterance.pitch = 1;
      utterance.volume = 1;

      window.speechSynthesis.speak(utterance);
    };

    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.addEventListener('voiceschanged', speakSlowWithVoice, { once: true });
    } else {
      speakSlowWithVoice();
    }
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

  // Save progress before exiting
  const saveProgressOnExit = useCallback(() => {
    const gameStats = {
      score: score,
      accuracy: Math.round((answers.filter(Boolean).length / (currentIndex || 1)) * 100), // Avoid division by zero
      correctWords: answers.filter(Boolean).length,
      totalWords: currentIndex,
      level,
      mode,
      incomplete: true, // Mark as incomplete
    };
    onGameComplete(gameStats);
    onExit();
  }, [score, answers, currentIndex, level, mode, onGameComplete, onExit]);


  // Load words on mount
  useEffect(() => {
    let mounted = true;

    const loadWords = async () => {
      setIsLoading(true);
      const maxRetries = 4;
      const retryDelay = 1500;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        if (!mounted) return;
        try {
          const fetchedWords = await fetchWords(level, 10);
          if (!mounted) return;

          if (fetchedWords && fetchedWords.length > 0) {
            setWords(fetchedWords);
            initializeQuestion(fetchedWords[0], fetchedWords);
            setIsLoading(false);
            return;
          }
        } catch (error) {
          console.warn(`Attempt ${attempt}/${maxRetries} failed:`, error);
        }

        if (attempt < maxRetries) {
          if (mounted) setLoadingAttempt(attempt + 1);
          await new Promise(res => setTimeout(res, retryDelay));
        }
      }

      // All retries exhausted
      if (mounted) setIsLoading(false);
    };

    loadWords();

    return () => {
      mounted = false;
    };
  }, [level]); // Remove fetchWords dependency to prevent excessive calls

  // Initialize question with choices for multiple choice or fill-blanks
  const initializeQuestion = (word: DictationWord, wordList: DictationWord[]) => {
    if (mode === "multiple-choice") {
      // Generate wrong choices from the word list
      const wrongChoices = wordList
        .filter(w => w.id !== word.id)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(w => w.word);

      // Ensure we have at least 3 wrong choices, if not repeat some
      while (wrongChoices.length < 3) {
        const randomWord = wordList[Math.floor(Math.random() * wordList.length)];
        if (randomWord.id !== word.id && !wrongChoices.includes(randomWord.word)) {
          wrongChoices.push(randomWord.word);
        }
      }

      const choices = [word.word, ...wrongChoices.slice(0, 3)].sort(() => Math.random() - 0.5);

      setQuestionState({
        word,
        userAnswer: "",
        isCorrect: null,
        choices,
      });
    } else if (mode === "fill-blanks") {
      // For fill-blanks mode: remove one letter and give 4 letter choices
      const wordLetters = word.word.toLowerCase().split('');
      const missingIndex = Math.floor(Math.random() * wordLetters.length);
      const correctLetter = wordLetters[missingIndex];

      // Create display word with underscore
      const displayWord = wordLetters.map((letter, index) => 
        index === missingIndex ? '_' : letter
      ).join('');

      // Generate wrong letter choices
      const alphabet = 'abcdefghijklmnopqrstuvwxyz';
      const wrongLetters = [];

      // Add some similar letters or random letters
      for (let i = 0; i < 3; i++) {
        let wrongLetter;
        do {
          wrongLetter = alphabet[Math.floor(Math.random() * alphabet.length)];
        } while (wrongLetter === correctLetter || wrongLetters.includes(wrongLetter));
        wrongLetters.push(wrongLetter);
      }

      const letterChoices = [correctLetter, ...wrongLetters].sort(() => Math.random() - 0.5);

      setQuestionState({
        word,
        userAnswer: "",
        isCorrect: null,
        missingLetterIndex: missingIndex,
        letterChoices,
        displayWord,
      });
    } else {
      setQuestionState({
        word,
        userAnswer: "",
        isCorrect: null,
      });
    }

    // Auto-play pronunciation
    setTimeout(() => speak(word.word), 500);
  };

  // Handle answer submission
  const handleSubmit = useCallback(() => {
    if (!questionState || showFeedback) return;

    let isCorrect = false;

    if (mode === "fill-blanks") {
      // Check if selected letter is correct
      const correctLetter = questionState.word.word[questionState.missingLetterIndex!].toLowerCase();
      isCorrect = userInput.toLowerCase() === correctLetter;
      console.log(`🎯 Fill-blanks check: Expected '${correctLetter}', Got '${userInput.toLowerCase()}', Correct: ${isCorrect}`);
    } else {
      // For typing and multiple-choice modes
      isCorrect = userInput.toLowerCase().trim() === questionState.word.word.toLowerCase();
    }

    setQuestionState(prev => prev ? { ...prev, isCorrect, userAnswer: userInput } : null);
    setAnswers(prev => [...prev, isCorrect]);
    setShowFeedback(true);

    if (isCorrect) {
      setScore(prev => prev + 10);
    } else {
      setLives(prev => prev - 1);
    }

    console.log(`📊 Current game stats - Mode: ${mode}, Score: ${isCorrect ? score + 10 : score}, Question: ${currentIndex + 1}/${words.length}`);

    // Move to next question after delay
    setTimeout(() => {
      const newLives = isCorrect ? lives : lives - 1;

      if (currentIndex < words.length - 1 && (isCorrect || (!isCorrect && newLives > 0))) {
        setCurrentIndex(prev => prev + 1);
        setUserInput("");
        setShowFeedback(false);
        initializeQuestion(words[currentIndex + 1], words);
      } else {
        // Game over - calculate final stats
        const totalWords = currentIndex + 1;
        const correctWords = [...answers, isCorrect].filter(Boolean).length;
        const finalScore = isCorrect ? score + 10 : score;

        console.log(`🎮 Dictation Game Complete - Mode: ${mode}, Level: ${level}`);
        console.log(`📊 Final Stats: ${correctWords}/${totalWords} correct, Score: ${finalScore}`);
        console.log(`🎯 Game mode verification: ${mode}`);

        if (mode === "fill-blanks") {
          console.log(`🎯 IMPORTANT: Fill-blanks game completed! This should appear in reports.`);
        }

        const gameStats = {
          score: finalScore,
          accuracy: Math.round((correctWords / totalWords) * 100),
          correctWords,
          totalWords,
          level,
          mode,
        };

        console.log(`📋 Sending game stats to parent:`, gameStats);
        onGameComplete(gameStats);
      }
    }, 1500);
  }, [questionState, userInput, currentIndex, words, lives, score, answers, showFeedback, onGameComplete, level, mode]);

  // Handle multiple choice selection
  const handleChoiceSelect = (choice: string) => {
    if (showFeedback) return;
    setUserInput(choice);
  };

  // Handle Enter key
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "Enter" && userInput && !showFeedback) {
        handleSubmit();
      }
    };
    window.addEventListener("keypress", handleKeyPress);
    return () => window.removeEventListener("keypress", handleKeyPress);
  }, [userInput, showFeedback, handleSubmit]);

  const modeLabel = mode === "typing" ? "TYPING MODE" : mode === "multiple-choice" ? "MULTIPLE CHOICE" : "FILL THE BLANK";

  if (isLoading) {
    return (
      <div className="flex-1 bg-gradient-to-b from-blue-900 to-emerald-900 flex items-center justify-center p-4" style={{ imageRendering: 'pixelated' }}>
        <div className="border-4 border-amber-600 bg-black/80 p-8 text-center rounded-lg shadow-2xl">
          <Loader2 className="w-12 h-12 animate-spin text-amber-400 mx-auto mb-4" />
          <p className="font-pixel text-amber-200 text-sm">LOADING LEVEL {level}...</p>
          {loadingAttempt > 1 && (
            <p className="font-pixel text-yellow-500 text-[10px] mt-2">WAKING UP SERVER... ({loadingAttempt}/4)</p>
          )}
        </div>
      </div>
    );
  }

  if (words.length === 0) {
    return (
      <div className="flex-1 bg-gradient-to-b from-blue-900 to-emerald-900 flex items-center justify-center p-4" style={{ imageRendering: 'pixelated' }}>
        <div className="border-4 border-amber-600 bg-black/80 p-8 text-center rounded-lg shadow-2xl">
          <p className="font-pixel text-amber-200 text-sm mb-6">NO WORDS FOR LEVEL {level}</p>
          <button onClick={saveProgressOnExit} className="font-pixel border-2 border-amber-600 bg-amber-700 hover:bg-amber-600 text-white hover:scale-105 transition-all px-4 py-2 rounded-md text-xs">
            ← BACK
          </button>
        </div>
      </div>
    );
  }

  if (!questionState) {
    return (
      <div className="flex-1 bg-gradient-to-b from-blue-900 to-emerald-900 flex items-center justify-center p-4" style={{ imageRendering: 'pixelated' }}>
        <div className="border-4 border-red-600 bg-black/80 p-8 text-center rounded-lg shadow-2xl">
          <p className="font-pixel text-red-400 text-sm mb-6">ERROR LOADING GAME</p>
          <button onClick={saveProgressOnExit} className="font-pixel border-2 border-amber-600 bg-amber-700 hover:bg-amber-600 text-white hover:scale-105 transition-all px-4 py-2 rounded-md text-xs">
            ← BACK
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gradient-to-b from-blue-900 to-emerald-900 p-3 pb-20 md:pb-4" style={{ imageRendering: 'pixelated' }}>
      <div className="max-w-2xl mx-auto">

        {/* HUD Header */}
        <div className="flex items-center justify-between mb-4">
          {/* Exit button */}
          <button
            onClick={saveProgressOnExit}
            data-testid="button-exit-game"
            className="font-pixel text-xs border-2 border-red-700 bg-red-800 hover:bg-red-700 text-white hover:scale-105 transition-all duration-200 shadow-lg flex items-center px-3 py-2 rounded-md"
          >
            <ArrowLeft className="w-3 h-3 mr-1" />
            EXIT
          </button>

          {/* Lives */}
          <div className="flex items-center gap-1 bg-black/60 border-2 border-red-800 px-3 py-1 rounded-md">
            {Array.from({ length: 3 }).map((_, i) => (
              <Heart
                key={i}
                className={`w-5 h-5 ${i < lives ? "fill-red-500 text-red-500" : "fill-gray-700 text-gray-700"}`}
                data-testid={`heart-${i}`}
              />
            ))}
          </div>

          {/* Score */}
          <div className="bg-black/60 border-2 border-yellow-600 px-3 py-1 rounded-md" data-testid="text-score">
            <span className="font-pixel text-yellow-400 text-xs">⭐ {score}</span>
          </div>
        </div>

        {/* Mode + Progress bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="font-pixel text-[9px] text-emerald-400">{modeLabel}</span>
            <span className="font-pixel text-[9px] text-gray-400">{currentIndex + 1} / {words.length}</span>
          </div>
          <div className="w-full bg-black/40 border border-gray-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-2 rounded-full transition-all duration-500"
              style={{ width: `${((currentIndex + 1) / words.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Main Game Card */}
        <div className="border-4 border-amber-600 bg-gradient-to-b from-slate-900/95 to-emerald-950/95 rounded-lg shadow-2xl p-5">

          {/* Audio Buttons */}
          <div className="flex items-center justify-center gap-3 mb-5">
            <button
              onClick={() => speak(questionState.word.word)}
              disabled={isPlaying}
              data-testid="button-play-audio"
              title="Play pronunciation"
              className="flex flex-col items-center justify-center w-16 h-16 border-4 border-blue-600 bg-blue-800 hover:bg-blue-700 text-white rounded-lg hover:scale-110 transition-all duration-200 shadow-lg disabled:opacity-50"
            >
              {isPlaying ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <Volume2 className="w-6 h-6" />
              )}
              <span className="font-pixel text-[7px] mt-1">LISTEN</span>
            </button>

            <button
              onClick={() => speakSlow(questionState.word.word)}
              disabled={isPlaying}
              data-testid="button-play-slow"
              title="Play slowly"
              className="flex flex-col items-center justify-center w-16 h-16 border-4 border-cyan-700 bg-cyan-900 hover:bg-cyan-800 text-white rounded-lg hover:scale-110 transition-all duration-200 shadow-lg disabled:opacity-50"
            >
              <span className="text-xl">🐌</span>
              <span className="font-pixel text-[7px] mt-1">SLOW</span>
            </button>
          </div>

          {/* Category hint */}
          {questionState.word.category && (
            <div className="text-center mb-4">
              <span className="font-pixel text-[9px] text-cyan-400 bg-black/40 border border-cyan-800 px-3 py-1 rounded-md">
                📦 {questionState.word.category.toUpperCase()}
              </span>
            </div>
          )}

          {/* Input Area */}
          {mode === "typing" ? (
            <div className="mb-5">
              <Input
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Type the word..."
                disabled={showFeedback}
                data-testid="input-answer"
                className="text-center text-xl py-5 font-pixel bg-black/60 border-2 border-gray-600 focus:border-blue-400 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-blue-400/20"
                autoFocus
              />
            </div>
          ) : mode === "fill-blanks" ? (
            <div className="mb-5">
              {/* Word display with blank */}
              <div className="text-center mb-5 bg-black/40 border-2 border-gray-700 rounded-lg p-4">
                <p className="text-3xl font-mono tracking-widest mb-2">
                  {questionState.displayWord?.split('').map((letter, index) => (
                    <span
                      key={index}
                      className={letter === '_'
                        ? 'text-amber-400 bg-amber-900/60 border-b-2 border-amber-400 px-2 mx-1'
                        : 'text-white'
                      }
                    >
                      {letter === '_' ? '_' : letter}
                    </span>
                  ))}
                </p>
                <p className="font-pixel text-[9px] text-gray-400">CHOOSE THE MISSING LETTER</p>
              </div>

              {/* Letter choices */}
              <div className="grid grid-cols-4 gap-3">
                {questionState.letterChoices?.map((letter, index) => (
                  <button
                    key={index}
                    onClick={() => handleChoiceSelect(letter)}
                    disabled={showFeedback}
                    data-testid={`button-letter-${index}`}
                    className={`py-4 text-xl font-mono font-bold border-4 rounded-lg hover:scale-105 transition-all duration-200 shadow-lg disabled:opacity-50 ${
                      userInput === letter
                        ? 'border-amber-400 bg-amber-700 text-white'
                        : 'border-gray-600 bg-gray-800 text-gray-200 hover:border-amber-600 hover:bg-gray-700'
                    }`}
                  >
                    {letter.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Multiple Choice */
            <div className="grid grid-cols-2 gap-3 mb-5">
              {questionState.choices?.map((choice, index) => (
                <button
                  key={index}
                  onClick={() => handleChoiceSelect(choice)}
                  disabled={showFeedback}
                  data-testid={`button-choice-${index}`}
                  className={`py-5 px-3 text-sm font-pixel border-4 rounded-lg hover:scale-105 transition-all duration-200 shadow-lg disabled:opacity-50 leading-tight ${
                    userInput === choice
                      ? 'border-emerald-400 bg-emerald-700 text-white'
                      : 'border-gray-600 bg-gray-800 text-gray-200 hover:border-emerald-600 hover:bg-gray-700'
                  }`}
                >
                  {choice}
                </button>
              ))}
            </div>
          )}

          {/* Feedback Banner */}
          {showFeedback && (
            <div
              data-testid="text-feedback"
              className={`text-center font-pixel text-sm py-3 px-4 rounded-lg border-2 mb-4 animate-pulse ${
                questionState.isCorrect
                  ? 'text-green-300 bg-green-900/60 border-green-600'
                  : 'text-red-300 bg-red-900/60 border-red-600'
              }`}
            >
              {questionState.isCorrect
                ? '✅ CORRECT! +10 XP'
                : `❌ WRONG! ANSWER: "${questionState.word.word.toUpperCase()}"`}
            </div>
          )}

          {/* Submit Button */}
          {mode === "typing" && (
            <button
              onClick={handleSubmit}
              disabled={!userInput || showFeedback}
              data-testid="button-submit"
              className="w-full py-4 font-pixel text-sm border-4 border-green-700 bg-green-800 hover:bg-green-700 text-white rounded-lg hover:scale-105 transition-all duration-200 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ▶ SUBMIT ANSWER
            </button>
          )}

          {(mode === "multiple-choice" || mode === "fill-blanks") && userInput && !showFeedback && (
            <button
              onClick={handleSubmit}
              data-testid="button-submit"
              className="w-full py-4 font-pixel text-sm border-4 border-green-700 bg-green-800 hover:bg-green-700 text-white rounded-lg hover:scale-105 transition-all duration-200 shadow-lg"
            >
              ▶ SUBMIT ANSWER
            </button>
          )}
        </div>
      </div>
    </div>
  );
}