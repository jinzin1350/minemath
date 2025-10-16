import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAnimation } from './AnimationManager';
import './ExplanationPopup.css';

interface Explanation {
  level: number;
  title: string;
  text: string;
  emoji: string;
}

const ExplanationPopup: React.FC = () => {
  const { showExplanation, totalPredictions, brainLevel, setShowExplanation } = useAnimation();

  const explanations: Explanation[] = [
    {
      level: 1,
      title: "🎉 First Steps!",
      text: "Every word you predict teaches Lexi how words connect! Just like teaching a baby to talk.",
      emoji: "👶"
    },
    {
      level: 2,
      title: "🧠 Pattern Recognition!",
      text: "Lexi is starting to see patterns! 'Cat' often comes before 'meow'. This is how AI learns!",
      emoji: "🔗"
    },
    {
      level: 3,
      title: "📚 Building Knowledge!",
      text: "With 15 predictions, Lexi can now guess simple sentences! Real AI learned from BILLIONS of these!",
      emoji: "📖"
    },
    {
      level: 4,
      title: "🎯 Getting Smarter!",
      text: "Lexi is connecting more words together! Soon she'll understand full conversations!",
      emoji: "🎯"
    },
    {
      level: 5,
      title: "💬 Conversation Time!",
      text: "Lexi can now have simple conversations! This is exactly how ChatGPT learned to chat!",
      emoji: "💬"
    },
    {
      level: 6,
      title: "🌟 Context Master!",
      text: "Amazing! Lexi understands context now! She knows 'bat' the animal vs 'bat' for baseball!",
      emoji: "🌟"
    },
    {
      level: 7,
      title: "✍️ Story Creator!",
      text: "Incredible! Lexi can now write short stories! You're training an AI just like the experts do!",
      emoji: "✍️"
    },
    {
      level: 8,
      title: "🎨 Creative Thinker!",
      text: "Lexi is becoming creative! She can come up with new ideas by combining what she learned!",
      emoji: "🎨"
    },
    {
      level: 9,
      title: "🧙‍♂️ Word Wizard!",
      text: "You've taught Lexi so much! She's almost as smart as real AI assistants!",
      emoji: "🧙‍♂️"
    },
    {
      level: 10,
      title: "🚀 AI Master!",
      text: "Incredible! You've shown Lexi how language works! This is how real AI assistants like ChatGPT learned!",
      emoji: "🚀"
    }
  ];

  const currentExplanation = explanations.find(e => e.level === brainLevel) || explanations[0];

  return (
    <AnimatePresence>
      {showExplanation && (
        <>
          <motion.div
            className="explanation-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowExplanation(false)}
          />
          <motion.div
            className="explanation-popup"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", duration: 0.5 }}
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              className="popup-emoji"
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0]
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                repeatType: "reverse"
              }}
            >
              {currentExplanation.emoji}
            </motion.div>

            <h2 className="popup-title">{currentExplanation.title}</h2>
            <p className="popup-text">{currentExplanation.text}</p>

            <div className="fun-fact">
              <span className="fact-icon">💡</span>
              <p className="fact-text">
                <strong>Fun Fact:</strong> ChatGPT learned from over 500 BILLION word predictions!
              </p>
            </div>

            <div className="progress-comparison">
              <div className="your-progress">
                <span className="progress-label">Your Predictions:</span>
                <div className="progress-bar-container">
                  <motion.div
                    className="progress-bar-fill your-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((totalPredictions / 100) * 100, 100)}%` }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                  />
                </div>
                <span className="progress-number">{totalPredictions}</span>
              </div>

              <div className="ai-progress">
                <span className="progress-label">ChatGPT Training:</span>
                <div className="progress-bar-container">
                  <div className="progress-bar-fill ai-fill" style={{ width: '100%' }} />
                </div>
                <span className="progress-number">500,000,000,000+</span>
              </div>
            </div>

            <motion.button
              className="continue-button"
              onClick={() => setShowExplanation(false)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Continue Learning! 🚀
            </motion.button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ExplanationPopup;
