import React, { useState, createContext, useContext, ReactNode } from 'react';
import confetti from 'canvas-confetti';

interface AnimationContextType {
  brainLevel: number;
  showExplanation: boolean;
  currentPhase: string;
  totalPredictions: number;
  incrementLearning: () => void;
  setCurrentPhase: (phase: string) => void;
  setShowExplanation: (show: boolean) => void;
}

export const AnimationContext = createContext<AnimationContextType | undefined>(undefined);

interface AnimationProviderProps {
  children: ReactNode;
}

export const AnimationProvider: React.FC<AnimationProviderProps> = ({ children }) => {
  const [brainLevel, setBrainLevel] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [currentPhase, setCurrentPhase] = useState('learning'); // learning, understanding, creating
  const [totalPredictions, setTotalPredictions] = useState(0);

  const incrementLearning = () => {
    setTotalPredictions(prev => prev + 1);

    // Update brain level every 5 predictions
    if ((totalPredictions + 1) % 5 === 0) {
      setBrainLevel(prev => Math.min(prev + 1, 10));
      setShowExplanation(true);

      // Auto-hide explanation after 15 seconds (slower for kids to read)
      setTimeout(() => setShowExplanation(false), 15000);
    }

    // Trigger celebration at milestones
    if ([10, 25, 50, 100].includes(totalPredictions + 1)) {
      triggerCelebration();
    }
  };

  const triggerCelebration = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  return (
    <AnimationContext.Provider value={{
      brainLevel,
      showExplanation,
      currentPhase,
      totalPredictions,
      incrementLearning,
      setCurrentPhase,
      setShowExplanation
    }}>
      {children}
    </AnimationContext.Provider>
  );
};

export const useAnimation = () => {
  const context = useContext(AnimationContext);
  if (context === undefined) {
    throw new Error('useAnimation must be used within an AnimationProvider');
  }
  return context;
};
