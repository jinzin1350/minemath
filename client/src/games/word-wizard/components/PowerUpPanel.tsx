import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../contexts/GameContext';
import { powerUps } from '../data/powerUps';
import './PowerUpPanel.css';

interface PowerUpPanelProps {
  onPowerUpUse?: (powerUpType: string) => void;
}

const PowerUpPanel: React.FC<PowerUpPanelProps> = ({ onPowerUpUse }) => {
  const { gameState, usePowerUp } = useGame();
  const [expandedPowerUp, setExpandedPowerUp] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setExpandedPowerUp(null);
      }
    };

    if (expandedPowerUp) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [expandedPowerUp]);

  const handleClick = (powerUpType: any) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const success = usePowerUp(powerUpType);
    if (success && onPowerUpUse) {
      onPowerUpUse(powerUpType);
      setExpandedPowerUp(null);
    }
  };

  return (
    <div className="powerup-panel" ref={panelRef}>
      <h3 className="powerup-title">Power-Ups ⚡</h3>
      <div className="powerup-icons-row">
        {powerUps.map((powerUp) => {
          const inventory = gameState.powerUpInventory[powerUp.type];
          const canAfford = gameState.totalPoints >= powerUp.cost || powerUp.cost === 0;
          const isAvailable = inventory > 0;
          const isExpanded = expandedPowerUp === powerUp.type;

          return (
            <div key={powerUp.type} className="powerup-icon-container">
              <motion.div
                className={`powerup-icon-button ${!isAvailable || !canAfford ? 'disabled' : ''}`}
                whileHover={isAvailable && canAfford ? { scale: 1.1 } : {}}
                whileTap={isAvailable && canAfford ? { scale: 0.95 } : {}}
                onClick={() => setExpandedPowerUp(isExpanded ? null : powerUp.type)}
              >
                <span className="icon">{powerUp.icon}</span>
                {inventory > 0 && (
                  <span className="badge">{inventory}</span>
                )}
              </motion.div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    className="powerup-tooltip"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <div className="tooltip-name">{powerUp.name}</div>
                    <div className="tooltip-description">{powerUp.description}</div>
                    <div className="tooltip-cost">
                      {powerUp.cost === 0 ? 'FREE' : `Costs ${powerUp.cost} pts`}
                    </div>
                    {isAvailable && canAfford && (
                      <button
                        className="use-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClick(powerUp.type);
                        }}
                      >
                        Use Now
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PowerUpPanel;
