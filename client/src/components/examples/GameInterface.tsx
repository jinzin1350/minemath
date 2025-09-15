import { GameInterface } from '../GameInterface';

export default function GameInterfaceExample() {
  const handleGameComplete = (stats: any) => {
    console.log('Game completed with stats:', stats);
  };

  return (
    <div className="min-h-screen">
      <GameInterface 
        onGameComplete={handleGameComplete}
        mockMode={true}
      />
    </div>
  );
}