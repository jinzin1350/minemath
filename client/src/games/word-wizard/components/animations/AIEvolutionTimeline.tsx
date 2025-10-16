import React from 'react';
import { motion } from 'framer-motion';
import { useAnimation } from './AnimationManager';
import './AIEvolutionTimeline.css';

interface Milestone {
  predictions: number;
  label: string;
  icon: string;
  description: string;
}

const AIEvolutionTimeline: React.FC = () => {
  const { totalPredictions } = useAnimation();

  const milestones: Milestone[] = [
    { predictions: 0, label: "Baby AI", icon: "👶", description: "Just random words" },
    { predictions: 10, label: "Toddler AI", icon: "🧒", description: "Learning word pairs" },
    { predictions: 25, label: "Kid AI", icon: "👦", description: "Making sentences" },
    { predictions: 50, label: "Teen AI", icon: "🧑", description: "Understanding context" },
    { predictions: 100, label: "Adult AI", icon: "🤖", description: "Full conversations!" },
    { predictions: 1000, label: "ChatGPT", icon: "🚀", description: "Professional AI" }
  ];

  const getCurrentMilestoneIndex = () => {
    for (let i = milestones.length - 1; i >= 0; i--) {
      if (totalPredictions >= milestones[i].predictions) {
        return i;
      }
    }
    return 0;
  };

  const currentMilestoneIndex = getCurrentMilestoneIndex();

  const getMotivationalMessage = () => {
    if (totalPredictions < 10) return "Keep going! Every word teaches Lexi!";
    if (totalPredictions < 50) return "Amazing! Lexi is getting smarter!";
    if (totalPredictions < 100) return "Incredible! You're a true AI trainer!";
    return "You're an AI training master!";
  };

  return (
    <div className="ai-evolution-timeline">
      <h3 className="timeline-title">Lexi's Journey to ChatGPT</h3>

      <div className="timeline-track">
        {milestones.map((milestone, index) => {
          const isAchieved = index <= currentMilestoneIndex;
          const isCurrent = index === currentMilestoneIndex;

          return (
            <motion.div
              key={index}
              className={`milestone-item ${isAchieved ? 'achieved' : 'locked'} ${isCurrent ? 'current' : ''}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="milestone-connector">
                {index < milestones.length - 1 && (
                  <div className={`connector-line ${index < currentMilestoneIndex ? 'active' : ''}`} />
                )}
              </div>

              <motion.div
                className="milestone-icon-wrapper"
                animate={isCurrent ? {
                  scale: [1, 1.1, 1],
                } : {}}
                transition={{
                  duration: 1.5,
                  repeat: isCurrent ? Infinity : 0
                }}
              >
                <div className="milestone-icon">
                  {isAchieved ? (
                    <motion.span
                      initial={{ rotate: 0 }}
                      animate={{ rotate: isCurrent ? [0, 10, -10, 0] : 0 }}
                      transition={{ duration: 0.5, repeat: isCurrent ? Infinity : 0, repeatType: "reverse" }}
                    >
                      {milestone.icon}
                    </motion.span>
                  ) : (
                    <span className="locked-icon">🔒</span>
                  )}
                </div>
              </motion.div>

              <div className="milestone-content">
                <h4 className="milestone-label">{milestone.label}</h4>
                <p className="milestone-predictions">{milestone.predictions} words</p>
                <p className="milestone-description">{milestone.description}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="progress-summary">
        <div className="current-progress-bar">
          <motion.div
            className="progress-fill-timeline"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min((totalPredictions / milestones[milestones.length - 1].predictions) * 100, 100)}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        <div className="progress-text-container">
          <p className="progress-count">
            <strong>{totalPredictions}</strong> predictions completed
          </p>
          <p className="motivational-text">{getMotivationalMessage()}</p>
        </div>
      </div>
    </div>
  );
};

export default AIEvolutionTimeline;
