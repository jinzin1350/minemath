
import React, { useState, useEffect } from 'react';
import { RobotConfig, RobotColor } from '../types';
import { RobotAvatar } from './RobotAvatar';

interface TrainingPanelProps {
  onTrainingComplete: (config: RobotConfig) => void;
}

// Data options
const PERSONALITIES = [
  { id: 'Hero', label: 'Super Hero', emoji: '🦸' },
  { id: 'Villain', label: 'Super Villain', emoji: '🦹' },
  { id: 'Clown', label: 'Funny Clown', emoji: '🤡' },
  { id: 'Professor', label: 'Professor', emoji: '👨‍🏫' },
];

const OBSESSIONS = ['Pizza', 'Cats', 'Math', 'Video Games', 'Space', 'Dinosaurs'];
const EMOJI_POOL = ['😎', '🤖', '🔥', '✨', '💩', '🚀', '🎸', '🧠', '🍕', '💪'];

export const TrainingPanel: React.FC<TrainingPanelProps> = ({ onTrainingComplete }) => {
  const [phase, setPhase] = useState(1);
  const totalPhases = 10;

  // Form State
  const [name, setName] = useState('');
  const [color, setColor] = useState<RobotColor>(RobotColor.BLUE);
  const [personality, setPersonality] = useState(PERSONALITIES[0].id);
  const [powerWords, setPowerWords] = useState<string[]>(['', '', '']);
  const [style, setStyle] = useState<'Formal' | 'Cool'>('Cool');
  const [selectedEmojis, setSelectedEmojis] = useState<string[]>([]);
  const [obsession, setObsession] = useState(OBSESSIONS[0]);
  const [defensePhrase, setDefensePhrase] = useState('');
  const [victoryMove, setVictoryMove] = useState('');

  // Auto-advance for Phase 10 (Loading)
  useEffect(() => {
    if (phase === 10) {
      const timer = setTimeout(() => {
        handleFinish();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  const handleFinish = () => {
    onTrainingComplete({
      name,
      color,
      personality,
      powerWords: powerWords.filter(w => w.length > 0),
      style,
      emojis: selectedEmojis,
      obsession,
      defensePhrase: defensePhrase || "I am confused.",
      victoryMove: victoryMove || "Beeps happily",
      avatarSeed: Date.now()
    });
  };

  const nextPhase = () => {
    if (phase < totalPhases) setPhase(phase + 1);
  };

  const prevPhase = () => {
    if (phase > 1) setPhase(phase - 1);
  };

  const updatePowerWord = (index: number, val: string) => {
    const newWords = [...powerWords];
    newWords[index] = val;
    setPowerWords(newWords);
  };

  const toggleEmoji = (emoji: string) => {
    if (selectedEmojis.includes(emoji)) {
      setSelectedEmojis(selectedEmojis.filter(e => e !== emoji));
    } else {
      if (selectedEmojis.length < 3) setSelectedEmojis([...selectedEmojis, emoji]);
    }
  };

  const renderPhaseContent = () => {
    switch (phase) {
      case 1: // Chassis
        return (
          <div className="text-center animate-fade-in">
            <h3 className="text-2xl font-black text-indigo-900 mb-2">PHASE 1: CHASSIS FABRICATION</h3>
            <p className="text-slate-500 mb-6">Select the outer shell material.</p>
            <div className="flex justify-center gap-4 mb-8">
               {Object.values(RobotColor).map((c) => (
                 <button
                   key={c}
                   onClick={() => setColor(c)}
                   className={`w-16 h-16 rounded-2xl border-4 transition-all duration-300 ${color === c ? 'border-indigo-600 scale-110 shadow-xl' : 'border-transparent opacity-70 hover:opacity-100 hover:scale-105'}`}
                   style={{ backgroundColor: c }}
                 />
               ))}
            </div>
            <div className="flex justify-center">
                <RobotAvatar color={color} size="lg" />
            </div>
          </div>
        );
      case 2: // Identity
        return (
          <div className="text-center animate-fade-in">
            <h3 className="text-2xl font-black text-indigo-900 mb-2">PHASE 2: IDENTITY CORE</h3>
            <p className="text-slate-500 mb-6">Every legend needs a name.</p>
            <div className="max-w-xs mx-auto">
               <input
                 autoFocus
                 type="text"
                 value={name}
                 onChange={(e) => setName(e.target.value)}
                 className="w-full text-center text-3xl font-black p-4 rounded-xl border-b-4 border-indigo-200 bg-indigo-50 focus:border-indigo-600 focus:outline-none uppercase placeholder:text-indigo-200"
                 placeholder="ROBO-..."
               />
            </div>
          </div>
        );
      case 3: // Personality
        return (
          <div className="text-center animate-fade-in">
            <h3 className="text-2xl font-black text-indigo-900 mb-2">PHASE 3: PERSONALITY MATRIX</h3>
            <p className="text-slate-500 mb-6">Who is this robot inside?</p>
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
               {PERSONALITIES.map(p => (
                 <button
                   key={p.id}
                   onClick={() => setPersonality(p.id)}
                   className={`p-6 rounded-xl border-4 transition-all flex flex-col items-center gap-2 ${personality === p.id ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100 bg-white hover:border-indigo-200'}`}
                 >
                    <span className="text-4xl">{p.emoji}</span>
                    <span className="font-bold text-indigo-900">{p.label}</span>
                 </button>
               ))}
            </div>
          </div>
        );
      case 4: // Power Words
        return (
          <div className="text-center animate-fade-in">
            <h3 className="text-2xl font-black text-indigo-900 mb-2">PHASE 4: VOCABULARY UPLOAD</h3>
            <p className="text-slate-500 mb-6">Teach it 3 words it LOVES to say.</p>
            <div className="flex flex-col gap-3 max-w-xs mx-auto">
               {[0, 1, 2].map(i => (
                 <input
                   key={i}
                   value={powerWords[i]}
                   onChange={(e) => updatePowerWord(i, e.target.value)}
                   className="w-full text-center p-3 rounded-lg border-2 border-slate-200 focus:border-green-500 focus:outline-none font-bold text-slate-700"
                   placeholder={`Word #${i + 1} (e.g. Boom)`}
                 />
               ))}
            </div>
          </div>
        );
      case 5: // Style
        return (
          <div className="text-center animate-fade-in">
            <h3 className="text-2xl font-black text-indigo-900 mb-2">PHASE 5: TONE SETTING</h3>
            <p className="text-slate-500 mb-6">How does it speak to humans?</p>
            <div className="flex gap-4 justify-center">
               <button 
                 onClick={() => setStyle('Formal')}
                 className={`p-8 rounded-2xl border-4 w-40 font-bold ${style === 'Formal' ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 text-slate-500'}`}
               >
                 🎩 Formal
               </button>
               <button 
                 onClick={() => setStyle('Cool')}
                 className={`p-8 rounded-2xl border-4 w-40 font-bold ${style === 'Cool' ? 'border-pink-500 bg-pink-500 text-white' : 'border-slate-200 text-slate-500'}`}
               >
                 🕶️ Cool
               </button>
            </div>
          </div>
        );
      case 6: // Emojis
        return (
          <div className="text-center animate-fade-in">
            <h3 className="text-2xl font-black text-indigo-900 mb-2">PHASE 6: EMOTION CHIPS</h3>
            <p className="text-slate-500 mb-6">Select exactly 3 favorite emojis.</p>
            <div className="flex flex-wrap justify-center gap-3 max-w-md mx-auto">
               {EMOJI_POOL.map(emoji => (
                 <button
                   key={emoji}
                   onClick={() => toggleEmoji(emoji)}
                   className={`text-3xl w-14 h-14 flex items-center justify-center rounded-xl transition-all ${selectedEmojis.includes(emoji) ? 'bg-indigo-100 ring-4 ring-indigo-400 scale-110' : 'bg-white border hover:bg-slate-50'}`}
                 >
                   {emoji}
                 </button>
               ))}
            </div>
            <p className="mt-4 text-sm font-bold text-indigo-500">{selectedEmojis.length} / 3 Selected</p>
          </div>
        );
      case 7: // Obsession
        return (
          <div className="text-center animate-fade-in">
            <h3 className="text-2xl font-black text-indigo-900 mb-2">PHASE 7: DATA BIAS</h3>
            <p className="text-slate-500 mb-6">What topic is this robot OBSESSED with?</p>
            <div className="flex flex-wrap justify-center gap-3 max-w-lg mx-auto">
               {OBSESSIONS.map(obs => (
                 <button
                   key={obs}
                   onClick={() => setObsession(obs)}
                   className={`px-6 py-3 rounded-full font-bold text-lg border-b-4 transition-all ${obsession === obs ? 'bg-yellow-400 border-yellow-600 text-yellow-900 translate-y-1 border-b-0' : 'bg-white border-slate-200 text-slate-500 hover:bg-yellow-50'}`}
                 >
                   {obs}
                 </button>
               ))}
            </div>
          </div>
        );
      case 8: // Defense
        return (
          <div className="text-center animate-fade-in">
            <h3 className="text-2xl font-black text-indigo-900 mb-2">PHASE 8: PANIC PROTOCOL</h3>
            <p className="text-slate-500 mb-6">If it doesn't know the answer, what does it say?</p>
            <div className="max-w-md mx-auto relative">
                <div className="absolute -top-3 -left-3 text-4xl">😱</div>
                <input
                    value={defensePhrase}
                    onChange={(e) => setDefensePhrase(e.target.value)}
                    placeholder="e.g. My brain is melting!"
                    className="w-full p-6 rounded-2xl border-2 border-red-100 bg-red-50 text-red-900 font-bold focus:border-red-400 outline-none text-center"
                />
            </div>
          </div>
        );
      case 9: // Victory
        return (
          <div className="text-center animate-fade-in">
            <h3 className="text-2xl font-black text-indigo-900 mb-2">PHASE 9: VICTORY DANCE</h3>
            <p className="text-slate-500 mb-6">Describe how it celebrates a win.</p>
            <div className="max-w-md mx-auto relative">
                <div className="absolute -top-3 -right-3 text-4xl">🏆</div>
                <input
                    value={victoryMove}
                    onChange={(e) => setVictoryMove(e.target.value)}
                    placeholder="e.g. Spins around and beeps"
                    className="w-full p-6 rounded-2xl border-2 border-green-100 bg-green-50 text-green-900 font-bold focus:border-green-400 outline-none text-center"
                />
            </div>
          </div>
        );
      case 10: // Loading
        return (
          <div className="text-center animate-fade-in flex flex-col items-center justify-center h-64">
             <div className="w-24 h-24 mb-6 relative">
                 <div className="absolute inset-0 rounded-full border-4 border-slate-200"></div>
                 <div className="absolute inset-0 rounded-full border-4 border-t-indigo-600 border-r-indigo-600 border-b-transparent border-l-transparent animate-spin"></div>
                 <div className="absolute inset-0 flex items-center justify-center font-bold text-indigo-600 pixel-font">
                     100%
                 </div>
             </div>
             <h3 className="text-2xl font-black text-indigo-900 mb-2 animate-pulse">SYNCHRONIZING NEURAL NET...</h3>
             <p className="text-slate-400">Please wait while we upload your training data.</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white max-w-4xl mx-auto rounded-3xl shadow-2xl overflow-hidden border-b-8 border-indigo-200 flex flex-col min-h-[600px]">
      
      {/* Top Bar */}
      <div className="bg-slate-900 p-4 flex justify-between items-center text-white">
          <div className="font-bold pixel-font text-green-400">SYSTEM: ONLINE</div>
          <div className="text-xs text-slate-400">SESSION ID: {Date.now().toString().slice(-4)}</div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-200 h-4 flex">
        {Array.from({ length: totalPhases }).map((_, idx) => (
            <div 
                key={idx} 
                className={`flex-1 transition-all duration-500 border-r border-white/20 ${idx + 1 <= phase ? 'bg-gradient-to-r from-indigo-500 to-purple-500' : 'bg-slate-200'}`}
            />
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-grow p-8 flex flex-col justify-center bg-slate-50 relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
            <div className="absolute top-10 left-10 text-9xl">⚙️</div>
            <div className="absolute bottom-10 right-10 text-9xl">💾</div>
        </div>

        <div className="relative z-10">
            {renderPhaseContent()}
        </div>
      </div>

      {/* Footer Controls */}
      {phase < 10 && (
        <div className="p-6 border-t border-slate-100 bg-white flex justify-between items-center">
            <button 
                onClick={prevPhase} 
                disabled={phase === 1}
                className={`font-bold text-slate-400 hover:text-slate-600 px-6 py-3 rounded-xl transition ${phase === 1 ? 'opacity-0' : 'opacity-100'}`}
            >
                PREVIOUS
            </button>

            <div className="text-indigo-200 font-bold pixel-font text-xl">
                {phase} <span className="text-slate-300 text-sm">/ {totalPhases}</span>
            </div>

            <button
                onClick={nextPhase}
                disabled={phase === 2 && !name} // Basic validation example
                className={`px-8 py-4 rounded-xl font-bold text-lg shadow-[0_4px_0_rgba(0,0,0,0.2)] active:shadow-none active:translate-y-1 transition-all flex items-center gap-2
                    ${phase === 2 && !name ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'}
                `}
            >
                {phase === 9 ? 'INITIALIZE' : 'NEXT PHASE'}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
            </button>
        </div>
      )}
    </div>
  );
};
