import React from 'react';
import '@/games/word-wizard/App.css';
import '@/games/word-wizard/index.css';

// Lazy load the Word Wizard app to isolate it
const WordWizardApp = React.lazy(() => import('@/games/word-wizard/App'));

export default function WordWizard() {
  return (
    <div className="word-wizard-page">
      <React.Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl mb-4">🧙‍♂️</div>
            <div className="text-xl">Loading Word Wizard...</div>
          </div>
        </div>
      }>
        <WordWizardApp />
      </React.Suspense>
    </div>
  );
}
