import React from 'react';
import WordWizardApp from '@/games/word-wizard/App';
import '@/games/word-wizard/App.css';
import '@/games/word-wizard/index.css';

export default function WordWizard() {
  return (
    <div className="word-wizard-page">
      <WordWizardApp />
    </div>
  );
}
