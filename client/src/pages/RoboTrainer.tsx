import React from 'react';

// Lazy load the Robo Trainer app to isolate it
const RoboTrainerApp = React.lazy(() => import('@/games/robo-trainer/App'));

export default function RoboTrainer() {
  return (
    <div className="robo-trainer-page">
      <React.Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-sky-100">
          <div className="text-center">
            <div className="text-4xl mb-4">🤖</div>
            <div className="text-xl font-bold">Loading Robo Trainer Academy...</div>
          </div>
        </div>
      }>
        <RoboTrainerApp />
      </React.Suspense>
    </div>
  );
}
