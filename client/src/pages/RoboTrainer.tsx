import React from 'react';
import { BottomNav } from "@/components/BottomNav";
import { NavBar } from "@/components/NavBar";

const RoboTrainerApp = React.lazy(() => import('@/games/robo-trainer/App'));

export default function RoboTrainer() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#060b14' }}>
      <NavBar />

      <div className="flex-1">
        <React.Suspense fallback={
          <div
            className="flex items-center justify-center min-h-[80vh]"
            style={{ background: '#060b14', imageRendering: 'pixelated' }}
          >
            <div
              className="p-8 text-center"
              style={{
                background: '#0d1117',
                border: '4px solid #f59e0b',
                boxShadow: '0 0 24px rgba(245,158,11,0.3)',
              }}
            >
              <div className="text-5xl mb-4">🤖</div>
              <p className="font-pixel text-amber-300 text-xs animate-pulse tracking-widest">
                LOADING ROBO TRAINER...
              </p>
            </div>
          </div>
        }>
          <RoboTrainerApp />
        </React.Suspense>
      </div>

      <BottomNav />
    </div>
  );
}
