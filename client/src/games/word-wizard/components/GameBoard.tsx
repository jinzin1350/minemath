import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useGame } from '../contexts/GameContext';
import { useAnimation } from './animations/AnimationManager';
import { Question } from '../types/game.types';
import { getQuestionsByLevel } from '../data/questions';
import { achievementsList } from '../data/achievements';
import WordConnectionVisualizer from './animations/WordConnectionVisualizer';
import './GameBoard.css';

interface GameBoardProps {
  onAnswer: (correct: boolean, speed: number) => void;
  onLexiMoodChange: (mood: 'happy' | 'thinking' | 'confused' | 'excited', message?: string) => void;
  activePowerUp: string | null;
}

const GameBoard: React.FC<GameBoardProps> = ({ onAnswer, onLexiMoodChange, activePowerUp }) => {
  const { gameState, addPoints, incrementStreak, resetStreak, updateStatistics, unlockAchievement, unlockPowerUp } = useGame();
  const { incrementLearning } = useAnimation();
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [timer, setTimer] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [eliminatedOptions, setEliminatedOptions] = useState<string[]>([]);
  const [askedQuestionIds, setAskedQuestionIds] = useState<string[]>([]);
  const [questionLevel, setQuestionLevel] = useState(1); // Track question difficulty level
  const [showHint, setShowHint] = useState(false);
  const [showContext, setShowContext] = useState(false);
  const [timerFrozen, setTimerFrozen] = useState(false);
  const [showWordFamily, setShowWordFamily] = useState(false);
  const [showConnection, setShowConnection] = useState(false);
  const [connectionWords, setConnectionWords] = useState({ from: '', to: '' });

  const correctMessages = [
    'Brilliant prediction!',
    "You're thinking like an AI!",
    'Word Wizard in action!',
    'Your brain is on fire! 🔥',
    'Lexi is impressed!',
  ];

  const wrongMessages = [
    'Nice try! Let\'s try another!',
    'Learning is all about trying!',
    'That was tricky, wasn\'t it?',
    'Even AI makes mistakes sometimes!',
    "You're getting warmer!",
  ];

  useEffect(() => {
    loadNewQuestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (currentQuestion && !selectedAnswer && !timerFrozen) {
      const interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [currentQuestion, selectedAnswer, timerFrozen]);

  // Handle power-up activation
  useEffect(() => {
    if (!activePowerUp || !currentQuestion) return;

    switch (activePowerUp) {
      case 'hintBubble':
        setShowHint(true);
        break;

      case 'fiftyFiftyEliminator':
        // Eliminate 2 wrong options
        const wrongOptions = currentQuestion.options.filter(
          (opt) => !currentQuestion.correctAnswers.includes(opt) &&
                   !(currentQuestion.closeAnswers?.includes(opt))
        );
        if (wrongOptions.length >= 2) {
          const toEliminate = wrongOptions.slice(0, 2);
          setEliminatedOptions((prev) => [...prev, ...toEliminate]);
        }
        break;

      case 'contextClue':
        setShowContext(true);
        break;

      case 'timeFreeze':
        setTimerFrozen(true);
        setTimeout(() => {
          setTimerFrozen(false);
        }, 10000); // 10 seconds
        break;

      case 'wordFamilyHelper':
        setShowWordFamily(true);
        break;
    }
  }, [activePowerUp, currentQuestion]);

  // Shuffle array helper function
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const loadNewQuestion = () => {
    const levelQuestions = getQuestionsByLevel(questionLevel);

    // Filter out already asked questions
    const availableQuestions = levelQuestions.filter(q => !askedQuestionIds.includes(q.id));

    // If all questions have been asked, move to next level
    if (availableQuestions.length === 0) {
      setAskedQuestionIds([]);
      if (questionLevel < 12) {
        setQuestionLevel(prev => prev + 1);
        onLexiMoodChange('excited', `Level ${questionLevel + 1} unlocked! Harder questions ahead!`);
      }
      // Reload with new level
      const newLevelQuestions = getQuestionsByLevel(Math.min(questionLevel + 1, 12));
      if (newLevelQuestions.length > 0) {
        const question = newLevelQuestions[Math.floor(Math.random() * newLevelQuestions.length)];
        // Shuffle options
        const shuffledQuestion = { ...question, options: shuffleArray(question.options) };
        setCurrentQuestion(shuffledQuestion);
        setAskedQuestionIds([question.id]);
        setSelectedAnswer(null);
        setIsCorrect(null);
        setTimer(0);
        setStartTime(Date.now());
        setShowFeedback(false);
        setEliminatedOptions([]);
        setShowHint(false);
        setShowContext(false);
        setTimerFrozen(false);
        setShowWordFamily(false);
      }
      return;
    }

    // Pick a random question from available ones
    const question = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];

    if (question) {
      // Shuffle options
      const shuffledQuestion = { ...question, options: shuffleArray(question.options) };
      setCurrentQuestion(shuffledQuestion);
      setAskedQuestionIds(prev => [...prev, question.id]);
      setSelectedAnswer(null);
      setIsCorrect(null);
      setTimer(0);
      setStartTime(Date.now());
      setShowFeedback(false);
      setEliminatedOptions([]);
      setShowHint(false);
      setShowContext(false);
      setTimerFrozen(false);
      setShowWordFamily(false);
      onLexiMoodChange('thinking', "Let's predict the next word!");
    }
  };

  const handleAnswerClick = (answer: string) => {
    if (selectedAnswer) return;

    const speed = Math.floor((Date.now() - startTime) / 1000);
    setSelectedAnswer(answer);

    const correct = currentQuestion?.correctAnswers.includes(answer) || false;
    const closeAnswer = currentQuestion?.closeAnswers?.includes(answer) || false;

    setIsCorrect(correct || closeAnswer);
    updateStatistics(correct, speed);

    let pointsEarned = 0;

    if (correct) {
      pointsEarned = 10;

      // Speed bonus
      if (speed <= 5) {
        pointsEarned += 5;
      }

      incrementStreak();
      incrementLearning(); // Update animation state

      // Show word connection animation
      if (currentQuestion) {
        const previousWord = currentQuestion.sentence.split(' ').slice(0, currentQuestion.blankPosition - 1).join(' ') || 'context';
        setConnectionWords({ from: previousWord.slice(-15), to: answer });
        setShowConnection(true);
        setTimeout(() => setShowConnection(false), 3000);
      }

      // Perfect streak bonus
      if ((gameState.currentStreak + 1) % 3 === 0) {
        pointsEarned += 20;

        // Reward power-ups on perfect streaks
        const powerUpRewards = ['hintBubble', 'contextClue', 'fiftyFiftyEliminator', 'timeFreeze'] as const;
        const randomPowerUp = powerUpRewards[Math.floor(Math.random() * powerUpRewards.length)];
        unlockPowerUp(randomPowerUp);

        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
        onLexiMoodChange('excited', `Perfect streak! +${pointsEarned} points + Power-up!`);
      } else {
        const randomMessage = correctMessages[Math.floor(Math.random() * correctMessages.length)];
        onLexiMoodChange('happy', randomMessage);
      }

      addPoints(pointsEarned);

      // Check achievements
      checkAchievements(true, speed);
    } else if (closeAnswer) {
      pointsEarned = 5;
      addPoints(pointsEarned);
      incrementStreak();
      onLexiMoodChange('happy', 'Good try! Close enough!');
    } else {
      addPoints(-3);
      resetStreak();
      const randomMessage = wrongMessages[Math.floor(Math.random() * wrongMessages.length)];
      onLexiMoodChange('confused', randomMessage);
    }

    setShowFeedback(true);
    onAnswer(correct || closeAnswer, speed);

    // Load next question after delay
    setTimeout(() => {
      loadNewQuestion();
    }, 2500);
  };

  const checkAchievements = (correct: boolean, speed: number) => {
    // First Word Wizard
    if (gameState.statistics.totalCorrect === 0 && correct) {
      const achievement = achievementsList.find((a) => a.id === 'first-word-wizard');
      if (achievement) unlockAchievement(achievement);
    }

    // Streak Master
    if (gameState.currentStreak + 1 >= 10) {
      const achievement = achievementsList.find((a) => a.id === 'streak-master');
      if (achievement && !gameState.achievements.some((a) => a.id === 'streak-master')) {
        unlockAchievement(achievement);
      }
    }

    // Level achievements and power-up rewards
    const points = gameState.totalPoints;
    const levelAchievements = [
      { id: 'apprentice', threshold: 100, powerUps: 2 },
      { id: 'junior-predictor', threshold: 300, powerUps: 3 },
      { id: 'pattern-master', threshold: 600, powerUps: 3 },
      { id: 'context-champion', threshold: 1000, powerUps: 4 },
      { id: 'ai-grand-master', threshold: 2000, powerUps: 5 },
    ];

    levelAchievements.forEach(({ id, threshold, powerUps }) => {
      if (points >= threshold && !gameState.achievements.some((a) => a.id === id)) {
        const achievement = achievementsList.find((a) => a.id === id);
        if (achievement) {
          unlockAchievement(achievement);

          // Reward multiple power-ups for level up
          for (let i = 0; i < powerUps; i++) {
            const powerUpRewards = ['hintBubble', 'contextClue', 'fiftyFiftyEliminator', 'timeFreeze'] as const;
            const randomPowerUp = powerUpRewards[Math.floor(Math.random() * powerUpRewards.length)];
            unlockPowerUp(randomPowerUp);
          }

          confetti({
            particleCount: 150,
            spread: 100,
            origin: { y: 0.5 },
          });
        }
      }
    });
  };

  const renderSentenceWithBlank = () => {
    if (!currentQuestion) return null;

    const words = currentQuestion.sentence.split(' ');
    return (
      <div className="sentence-display">
        {words.map((word, index) => (
          <span key={index} className="word">
            {word === '___' ? (
              <motion.span
                className="blank-space"
                animate={{
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                }}
              >
                {selectedAnswer || '___'}
              </motion.span>
            ) : (
              word
            )}{' '}
          </span>
        ))}
      </div>
    );
  };

  if (!currentQuestion) {
    return <div className="game-board">Loading...</div>;
  }

  const availableOptions = currentQuestion.options.filter(
    (option) => !eliminatedOptions.includes(option)
  );

  return (
    <div className="game-board">
      <div className="question-header">
        <div className="timer" style={timerFrozen ? { color: '#10b981', fontWeight: 'bold' } : {}}>
          {timerFrozen ? '❄️' : '⏱️'} {timer}s {timerFrozen ? '(FROZEN)' : ''}
        </div>
        <div className="question-level">Level {currentQuestion.level}</div>
      </div>

      {renderSentenceWithBlank()}

      <div className="options-container">
        <AnimatePresence>
          {availableOptions.map((option, index) => {
            const isSelected = selectedAnswer === option;
            const isCorrectAnswer = currentQuestion.correctAnswers.includes(option);
            const isCloseAnswer = currentQuestion.closeAnswers?.includes(option);

            let buttonClass = 'option-button';
            if (isSelected && showFeedback) {
              if (isCorrectAnswer) {
                buttonClass += ' correct';
              } else if (isCloseAnswer) {
                buttonClass += ' close';
              } else {
                buttonClass += ' wrong';
              }
            }

            return (
              <motion.button
                key={option}
                className={buttonClass}
                onClick={() => handleAnswerClick(option)}
                disabled={selectedAnswer !== null}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {option}
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>

      {showFeedback && currentQuestion.hint && !isCorrect && (
        <motion.div
          className="hint-box"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          💡 Hint: {currentQuestion.hint}
        </motion.div>
      )}

      {/* Power-up effects display */}
      {showHint && currentQuestion.hint && !selectedAnswer && (
        <motion.div
          className="hint-box powerup-active"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          💡 Hint: {currentQuestion.hint}
          <br />
          <small style={{ color: '#667eea', fontWeight: 'bold' }}>
            First letter: {currentQuestion.correctAnswers[0].charAt(0).toUpperCase()}
          </small>
        </motion.div>
      )}

      {showContext && !selectedAnswer && (
        <motion.div
          className="hint-box powerup-active"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ background: 'linear-gradient(135deg, #667eea20 0%, #764ba220 100%)', border: '2px solid #667eea' }}
        >
          📖 Context Example:
          {currentQuestion.contextExample ? (
            <div style={{ marginTop: '8px', fontWeight: 'bold', color: '#667eea' }}>
              "{currentQuestion.contextExample}"
            </div>
          ) : (
            <div style={{ marginTop: '8px' }}>
              <div style={{ fontWeight: 'bold', color: '#667eea' }}>
                The correct word is: <span style={{ fontSize: '18px' }}>{currentQuestion.correctAnswers[0]}</span>
              </div>
              <div style={{ marginTop: '6px', fontSize: '14px', color: '#6b7280' }}>
                Try using it in the sentence!
              </div>
            </div>
          )}
        </motion.div>
      )}

      {timerFrozen && !selectedAnswer && (
        <motion.div
          className="hint-box powerup-active"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ background: 'linear-gradient(135deg, #a7f3d0 0%, #6ee7b7 100%)', border: '2px solid #10b981' }}
        >
          ❄️ Time Frozen! Take your time to think...
        </motion.div>
      )}

      {showWordFamily && !selectedAnswer && (
        <motion.div
          className="hint-box powerup-active"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', border: '2px solid #f59e0b' }}
        >
          👨‍👩‍👧‍👦 Related words: {currentQuestion.correctAnswers.join(', ')}
          {currentQuestion.closeAnswers && `, ${currentQuestion.closeAnswers.join(', ')}`}
        </motion.div>
      )}

      {/* Word Connection Animation */}
      <WordConnectionVisualizer
        fromWord={connectionWords.from}
        toWord={connectionWords.to}
        isVisible={showConnection}
      />
    </div>
  );
};

export default GameBoard;
