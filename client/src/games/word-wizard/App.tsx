import React, { useState } from 'react';
import { GameProvider } from './contexts/GameContext';
import { AnimationProvider } from './components/animations/AnimationManager';
import GameBoard from './components/GameBoard';
import ScorePanel from './components/ScorePanel';
import LexiRobot from './components/LexiRobot';
import PowerUpPanel from './components/PowerUpPanel';
import AchievementsModal from './components/AchievementsModal';
import BrainEvolution from './components/animations/BrainEvolution';
import ExplanationPopup from './components/animations/ExplanationPopup';
import AIEvolutionTimeline from './components/animations/AIEvolutionTimeline';
import './App.css';

function App() {
  const [lexiMood, setLexiMood] = useState<'happy' | 'thinking' | 'confused' | 'excited'>('happy');
  const [lexiMessage, setLexiMessage] = useState<string>('Hi! I\'m Lexi! Let\'s learn about AI together!');
  const [showAchievements, setShowAchievements] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [activePowerUp, setActivePowerUp] = useState<string | null>(null);

  const handleLexiMoodChange = (mood: 'happy' | 'thinking' | 'confused' | 'excited', message?: string) => {
    setLexiMood(mood);
    if (message) {
      setLexiMessage(message);
    }
  };

  const handleAnswer = (correct: boolean, speed: number) => {
    // Additional logic can be added here if needed
  };

  const handleRestartGame = () => {
    // Clear the saved game state from localStorage
    localStorage.removeItem('aiWordWizardGameState');
    // Reload the page to restart with fresh state
    window.location.reload();
  };

  const handlePowerUpUse = (powerUpType: string) => {
    setActivePowerUp(powerUpType);

    // Show Lexi's reaction
    const powerUpMessages: Record<string, string> = {
      hintBubble: '💡 Here\'s a hint to help you!',
      fiftyFiftyEliminator: '✂️ I removed two wrong answers!',
      contextClue: '📖 Check out this example!',
      timeFreeze: '❄️ Time is frozen for 10 seconds!',
      wordFamilyHelper: '👨‍👩‍👧‍👦 Here are some related words!',
    };

    setLexiMood('excited');
    setLexiMessage(powerUpMessages[powerUpType] || 'Power-up activated!');

    // Clear the power-up after a short delay to allow GameBoard to process it
    setTimeout(() => {
      setActivePowerUp(null);
    }, 100);
  };

  return (
    <GameProvider>
      <AnimationProvider>
        <div className="app">
          <header className="app-header">
            <h1 className="app-title">
              <span className="title-icon">🧙‍♂️</span>
              AI Word Wizard Adventure
            </h1>
            <div className="header-buttons">
              <button
                className="header-button achievements-button"
                onClick={() => setShowAchievements(true)}
              >
                🏆 Achievements
              </button>
              <button
                className="header-button menu-button"
                onClick={() => setShowMenu(!showMenu)}
              >
                ☰
              </button>
            </div>
          </header>

          {showMenu && (
            <div className="menu-dropdown">
              <button onClick={() => setShowAchievements(true)}>
                🏆 View Achievements
              </button>
              <button onClick={handleRestartGame}>
                🔄 Restart Game
              </button>
            </div>
          )}

          <div className="app-container">
            <div className="main-content">
              <ScorePanel />
              <BrainEvolution />
              <div className="mobile-timeline">
                <AIEvolutionTimeline />
              </div>
              <LexiRobot mood={lexiMood} message={lexiMessage} />
              <GameBoard
                onAnswer={handleAnswer}
                onLexiMoodChange={handleLexiMoodChange}
                activePowerUp={activePowerUp}
              />
              <PowerUpPanel onPowerUpUse={handlePowerUpUse} />
            </div>

            <aside className="sidebar">
              <ScorePanel />
              <AIEvolutionTimeline />
            </aside>
          </div>

          <AchievementsModal
            isOpen={showAchievements}
            onClose={() => setShowAchievements(false)}
          />

          <ExplanationPopup />

          <footer className="app-footer">
            <p>
              🌟 Learn how AI predicts words by playing! 🤖
            </p>
          </footer>
        </div>
      </AnimationProvider>
    </GameProvider>
  );
}

export default App;
