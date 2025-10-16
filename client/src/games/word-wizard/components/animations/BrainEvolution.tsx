import React from 'react';
import { motion } from 'framer-motion';
import { useAnimation } from './AnimationManager';
import './BrainEvolution.css';

const BrainEvolution: React.FC = () => {
  const { brainLevel, totalPredictions } = useAnimation();

  const getEvolutionStage = () => {
    if (totalPredictions < 5) return "Random Words";
    if (totalPredictions < 15) return "Learning Patterns";
    if (totalPredictions < 30) return "Forming Sentences";
    if (totalPredictions < 50) return "Understanding Context";
    return "AI Assistant Ready!";
  };

  const getBrainEmoji = () => {
    if (totalPredictions < 5) return "👶";
    if (totalPredictions < 15) return "🧠";
    if (totalPredictions < 30) return "🤖";
    if (totalPredictions < 50) return "✨";
    return "🚀";
  };

  return (
    <motion.div
      className="brain-evolution-container"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="brain-visual">
        <motion.div
          className="brain-icon"
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatType: "reverse"
          }}
          style={{
            filter: `brightness(${0.8 + (brainLevel * 0.05)})
                     drop-shadow(0 0 ${5 + brainLevel * 2}px rgba(102, 126, 234, ${0.3 + brainLevel * 0.05}))`
          }}
        >
          <span className="brain-emoji">{getBrainEmoji()}</span>
        </motion.div>

        {/* Progress ring */}
        <svg className="progress-ring" viewBox="0 0 100 100">
          <circle
            className="progress-ring-circle-bg"
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="8"
          />
          <motion.circle
            className="progress-ring-circle"
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="url(#gradient)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 45}`}
            initial={{ strokeDashoffset: 2 * Math.PI * 45 }}
            animate={{
              strokeDashoffset: 2 * Math.PI * 45 * (1 - brainLevel / 10)
            }}
            transition={{ duration: 0.5 }}
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#667eea" />
              <stop offset="100%" stopColor="#764ba2" />
            </linearGradient>
          </defs>
        </svg>

        <div className="brain-level-badge">
          Level {brainLevel}
        </div>
      </div>

      <motion.div
        className="evolution-label"
        key={getEvolutionStage()}
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -10, opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h3 className="evolution-stage">{getEvolutionStage()}</h3>
        <p className="predictions-count">
          <span className="count-number">{totalPredictions}</span> words learned
        </p>
      </motion.div>
    </motion.div>
  );
};

export default BrainEvolution;
