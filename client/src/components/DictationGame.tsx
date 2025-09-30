import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
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
  const [showFeedback, setShowFeedback] = useState(false);

  // Load words on mount
  useEffect(() => {
    let mounted = true;
    
    const loadWords = async () => {
      try {
        setIsLoading(true);
        const fetchedWords = await fetchWords(level, 10);
        
        if (!mounted) return; // Component unmounted, don't update state
        
        if (fetchedWords && fetchedWords.length > 0) {
          setWords(fetchedWords);
          initializeQuestion(fetchedWords[0], fetchedWords);
        } else {
          console.error("No words found for level", level);
        }
      } catch (error) {
        console.error("Failed to load words:", error);
        if (mounted) {
          // Could show error message to user here
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
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
        
        console.log(`🎮 Game Complete - Mode: ${mode}, Level: ${level}`);
        console.log(`📊 Final Stats: ${correctWords}/${totalWords} correct, Score: ${finalScore}`);
        
        onGameComplete({
          score: finalScore,
          accuracy: Math.round((correctWords / totalWords) * 100),
          correctWords,
          totalWords,
          level,
          mode,
        });
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-400 to-sky-600 flex items-center justify-center p-4">
        <Card className="p-8 bg-white/95 text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg">Loading words for Level {level}...</p>
        </Card>
      </div>
    );
  }

  if (words.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-400 to-sky-600 flex items-center justify-center p-4">
        <Card className="p-8 bg-white/95 text-center">
          <p className="text-lg mb-4">No words available for Level {level}</p>
          <Button onClick={onExit} variant="outline">
            Back to Menu
          </Button>
        </Card>
      </div>
    );
  }

  if (!questionState) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-400 to-sky-600 flex items-center justify-center p-4">
        <Card className="p-8 bg-white/95 text-center">
          <p className="text-lg mb-4">Error loading game</p>
          <Button onClick={onExit} variant="outline">
            Back to Menu
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-400 to-sky-600 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={onExit}
            data-testid="button-exit-game"
            className="bg-white/90 hover-elevate"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Exit
          </Button>
          
          <div className="flex items-center gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Heart
                key={i}
                className={`w-6 h-6 ${
                  i < lives ? "fill-red-500 text-red-500" : "fill-gray-300 text-gray-300"
                }`}
                data-testid={`heart-${i}`}
              />
            ))}
          </div>
          
          <div className="bg-white/90 px-4 py-2 rounded-md font-bold" data-testid="text-score">
            Score: {score}
          </div>
        </div>

        {/* Main Game Area */}
        <Card className="p-8 bg-white/95">
          <div className="text-center mb-6">
            <div className="text-sm text-muted-foreground mb-2">
              Question {currentIndex + 1} / {words.length}
            </div>
            <div className="flex items-center justify-center gap-4 mb-6">
              <Button
                variant="outline"
                size="icon"
                onClick={() => speak(questionState.word.word)}
                disabled={isPlaying}
                data-testid="button-play-audio"
                className="w-16 h-16 rounded-full hover-elevate"
                title="Play pronunciation"
              >
                {isPlaying ? (
                  <Loader2 className="w-8 h-8 animate-spin" />
                ) : (
                  <Volume2 className="w-8 h-8" />
                )}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => speakSlow(questionState.word.word)}
                disabled={isPlaying}
                data-testid="button-play-slow"
                className="hover-elevate"
                title="Play slowly"
              >
                🐌 Slow
              </Button>
            </div>
            
            {/* Hint */}
            {questionState.word.category && (
              <div className="text-sm text-muted-foreground">
                Category: {questionState.word.category}
              </div>
            )}
          </div>

          {/* Input Area */}
          {mode === "typing" ? (
            <div className="mb-6">
              <Input
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Type the word you hear..."
                disabled={showFeedback}
                data-testid="input-answer"
                className="text-center text-2xl py-6"
                autoFocus
              />
            </div>
          ) : mode === "fill-blanks" ? (
            <div className="mb-6">
              {/* Display word with missing letter */}
              <div className="text-center mb-6">
                <p className="text-3xl font-mono mb-2">
                  {questionState.displayWord?.split('').map((letter, index) => (
                    <span key={index} className={letter === '_' ? 'text-red-500 bg-gray-200 px-2 py-1 mx-1 rounded' : ''}>
                      {letter === '_' ? '___' : letter}
                    </span>
                  ))}
                </p>
                <p className="text-sm text-muted-foreground">Choose the missing letter</p>
              </div>
              
              {/* Letter choices */}
              <div className="grid grid-cols-4 gap-3">
                {questionState.letterChoices?.map((letter, index) => (
                  <Button
                    key={index}
                    variant={userInput === letter ? "default" : "outline"}
                    onClick={() => handleChoiceSelect(letter)}
                    disabled={showFeedback}
                    data-testid={`button-letter-${index}`}
                    className="py-4 text-xl font-mono hover-elevate"
                  >
                    {letter.toUpperCase()}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 mb-6">
              {questionState.choices?.map((choice, index) => (
                <Button
                  key={index}
                  variant={userInput === choice ? "default" : "outline"}
                  onClick={() => handleChoiceSelect(choice)}
                  disabled={showFeedback}
                  data-testid={`button-choice-${index}`}
                  className="py-6 text-lg hover-elevate"
                >
                  {choice}
                </Button>
              ))}
            </div>
          )}

          {/* Feedback */}
          {showFeedback && (
            <div
              className={`text-center text-xl font-bold mb-4 ${
                questionState.isCorrect ? "text-green-600" : "text-red-600"
              }`}
              data-testid="text-feedback"
            >
              {questionState.isCorrect ? "Correct!" : `Wrong! The word was: ${questionState.word.word}`}
            </div>
          )}

          {/* Submit Button */}
          {mode === "typing" && (
            <Button
              onClick={handleSubmit}
              disabled={!userInput || showFeedback}
              data-testid="button-submit"
              className="w-full py-6 text-lg"
            >
              Submit Answer
            </Button>
          )}
          
          {(mode === "multiple-choice" || mode === "fill-blanks") && userInput && !showFeedback && (
            <Button
              onClick={handleSubmit}
              data-testid="button-submit"
              className="w-full py-6 text-lg"
            >
              Submit Answer
            </Button>
          )}
        </Card>
      </div>
    </div>
  );
}
