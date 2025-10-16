import { PowerUp } from '../types/game.types';

export const powerUps: PowerUp[] = [
  {
    type: 'hintBubble',
    name: 'Hint Bubble',
    description: 'Shows the first letter of the correct word',
    cost: 5,
    icon: '💡',
  },
  {
    type: 'fiftyFiftyEliminator',
    name: '50/50 Eliminator',
    description: 'Removes two wrong options',
    cost: 10,
    icon: '✂️',
  },
  {
    type: 'contextClue',
    name: 'Context Clue',
    description: 'Shows the word used in another sentence',
    cost: 8,
    icon: '📖',
  },
  {
    type: 'timeFreeze',
    name: 'Time Freeze',
    description: 'Stops the timer for 10 seconds',
    cost: 15,
    icon: '❄️',
  },
  {
    type: 'wordFamilyHelper',
    name: 'Word Family Helper',
    description: 'Shows related words (Free, once per level)',
    cost: 0,
    icon: '👨‍👩‍👧‍👦',
  },
];
