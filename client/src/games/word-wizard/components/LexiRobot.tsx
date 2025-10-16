import React from 'react';
import { motion } from 'framer-motion';
import './LexiRobot.css';

interface LexiRobotProps {
  mood: 'happy' | 'thinking' | 'confused' | 'excited';
  message?: string;
}

const LexiRobot: React.FC<LexiRobotProps> = ({ mood, message }) => {
  const robotEmojis = {
    happy: '😊',
    thinking: '🤔',
    confused: '😵',
    excited: '🤩',
  };

  const animations = {
    happy: {
      scale: [1, 1.1, 1],
      rotate: [0, 5, -5, 0],
      transition: { duration: 0.5, repeat: Infinity, repeatDelay: 2 },
    },
    thinking: {
      rotate: [-5, 5, -5],
      transition: { duration: 1, repeat: Infinity },
    },
    confused: {
      rotate: [-15, 15, -15, 15, 0],
      transition: { duration: 0.5 },
    },
    excited: {
      y: [0, -20, 0],
      scale: [1, 1.2, 1],
      transition: { duration: 0.6, repeat: 3 },
    },
  };

  return (
    <div className="lexi-robot-container">
      <motion.div
        className="lexi-robot"
        animate={animations[mood]}
      >
        <div className="robot-head">
          <div className="robot-face">
            <span className="robot-emoji">{robotEmojis[mood]}</span>
          </div>
          <div className="robot-antenna">
            <motion.div
              className="antenna-ball"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [1, 0.5, 1],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
              }}
            />
          </div>
        </div>
        <div className="robot-body">
          <div className="robot-light"></div>
        </div>
      </motion.div>

      {message && (
        <motion.div
          className="speech-bubble"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
        >
          {message}
        </motion.div>
      )}
    </div>
  );
};

export default LexiRobot;
