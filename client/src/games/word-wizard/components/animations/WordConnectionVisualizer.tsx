import React from 'react';
import { motion } from 'framer-motion';
import './WordConnectionVisualizer.css';

interface WordConnectionVisualizerProps {
  fromWord: string;
  toWord: string;
  isVisible: boolean;
}

const WordConnectionVisualizer: React.FC<WordConnectionVisualizerProps> = ({
  fromWord,
  toWord,
  isVisible
}) => {
  if (!isVisible) return null;

  return (
    <motion.div
      className="word-connection-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="word-connection-container"
        initial={{ scale: 0.8, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.8, y: 20 }}
        transition={{ type: "spring", duration: 0.5 }}
      >
        <div className="connection-visual">
          <motion.div
            className="word-bubble word-from"
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {fromWord}
          </motion.div>

          <motion.div
            className="connection-arrow"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.4, duration: 0.4 }}
          >
            <div className="arrow-line" />
            <div className="arrow-particles">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="particle"
                  animate={{
                    x: [0, 100],
                    opacity: [0, 1, 0]
                  }}
                  transition={{
                    duration: 1,
                    delay: i * 0.1,
                    repeat: Infinity
                  }}
                />
              ))}
            </div>
            <div className="arrow-head">→</div>
          </motion.div>

          <motion.div
            className="word-bubble word-to"
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            {toWord}
          </motion.div>
        </div>

        <motion.p
          className="connection-message"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          ✨ Lexi learned: <strong>"{fromWord}" → "{toWord}"</strong>
        </motion.p>
      </motion.div>
    </motion.div>
  );
};

export default WordConnectionVisualizer;
