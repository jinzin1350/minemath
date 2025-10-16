import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../contexts/GameContext';
import './ScorePanel.css';

const ScorePanel: React.FC = () => {
  const { gameState } = useGame();

  const getLevelInfo = () => {
    const points = gameState.totalPoints;
    if (points < 100) return { title: 'Apprentice Word Wizard', progress: points, max: 100, level: 1 };
    if (points < 300) return { title: 'Junior Predictor', progress: points - 100, max: 200, level: 2 };
    if (points < 600) return { title: 'Pattern Master', progress: points - 300, max: 300, level: 3 };
    if (points < 1000) return { title: 'Context Champion', progress: points - 600, max: 400, level: 4 };
    return { title: 'AI Grand Master', progress: points - 1000, max: 1000, level: 5 };
  };

  const levelInfo = getLevelInfo();
  const progressPercentage = (levelInfo.progress / levelInfo.max) * 100;

  return (
    <div className="score-panel">
      <div className="score-row">
        <div className="score-item">
          <div className="score-label">Points</div>
          <AnimatePresence mode="wait">
            <motion.div
              key={gameState.totalPoints}
              className="score-value"
              initial={{ scale: 1.3 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              {gameState.totalPoints}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="score-item">
          <div className="score-label">Streak {gameState.currentStreak >= 3 && '🔥'}</div>
          <AnimatePresence mode="wait">
            <motion.div
              key={gameState.currentStreak}
              className="score-value"
              initial={{ scale: 1.3 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              {gameState.currentStreak}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="level-section">
        <div className="level-title">{levelInfo.title}</div>
        <div className="progress-bar-container">
          <motion.div
            className="progress-bar"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <div className="progress-text">
          {levelInfo.progress}/{levelInfo.max} to next
        </div>
      </div>
    </div>
  );
};

export default ScorePanel;
