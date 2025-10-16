import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../contexts/GameContext';
import { achievementsList } from '../data/achievements';
import './AchievementsModal.css';

interface AchievementsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AchievementsModal: React.FC<AchievementsModalProps> = ({ isOpen, onClose }) => {
  const { gameState } = useGame();

  const unlockedAchievements = gameState.achievements;
  const totalAchievements = achievementsList.length;
  const unlockedCount = unlockedAchievements.length;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="achievements-modal"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <div className="modal-header">
              <h2>🏆 Achievements</h2>
              <button className="close-button" onClick={onClose}>
                ✕
              </button>
            </div>

            <div className="achievements-progress">
              <div className="progress-text">
                {unlockedCount} / {totalAchievements} Unlocked
              </div>
              <div className="progress-bar-container">
                <motion.div
                  className="progress-bar"
                  initial={{ width: 0 }}
                  animate={{ width: `${(unlockedCount / totalAchievements) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            <div className="achievements-grid">
              {achievementsList.map((achievement) => {
                const isUnlocked = unlockedAchievements.some((a) => a.id === achievement.id);
                return (
                  <motion.div
                    key={achievement.id}
                    className={`achievement-card ${isUnlocked ? 'unlocked' : 'locked'}`}
                    whileHover={isUnlocked ? { scale: 1.05 } : {}}
                  >
                    <div className="achievement-icon">
                      {isUnlocked ? achievement.icon : '🔒'}
                    </div>
                    <div className="achievement-name">{achievement.name}</div>
                    <div className="achievement-description">
                      {achievement.description}
                    </div>
                    {isUnlocked && (
                      <div className="achievement-unlocked">
                        ✓ Unlocked
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AchievementsModal;
