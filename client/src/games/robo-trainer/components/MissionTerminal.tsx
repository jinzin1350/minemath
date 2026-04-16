import React, { useState } from 'react';
import { Mission, RobotProfile, TrainingMemory } from '../types';
import { RobotAvatar } from './RobotAvatar';

interface MissionTerminalProps {
  mission: Mission;
  robot: RobotProfile;
  onMissionComplete: (memories: TrainingMemory[]) => void;
  onExit: () => void;
}

// Mission-specific scenarios based on curriculum
const getMissionScenarios = (missionId: number) => {
  const missionScenarios: Record<number, any[]> = {
    // Chapter 1: World of Objects
    1: [
      { visuals: Array(24).fill('🍎'), question: 'The robot detects these red objects. What are they called?', concept: 'Apple' },
      { visuals: Array(24).fill('🍌'), question: 'New yellow curved objects found! Name them for the robot.', concept: 'Banana' },
      { visuals: Array(24).fill('🍊'), question: 'Round orange objects detected. What should we call these?', concept: 'Orange' }
    ],
    2: [
      { visuals: Array(24).fill('🍎'), question: 'The robot sees these. Are they food or toys?', concept: 'Food' },
      { visuals: Array(24).fill('⚽'), question: 'The robot sees these round objects. Food or toy?', concept: 'Toy' },
      { visuals: [...Array(12).fill('🍎'), ...Array(12).fill('⚽')], question: 'Mixed items! Help robot separate food from toys.', concept: 'Classification' }
    ],
    3: [
      { visuals: Array(24).fill('🍎'), question: 'Describe this fruit with its color. What is it?', concept: 'Red Apple' },
      { visuals: Array(24).fill('🍌'), question: 'What color is this fruit? Describe it fully.', concept: 'Yellow Banana' },
      { visuals: Array(24).fill('🍇'), question: 'Name this fruit with its color.', concept: 'Purple Grapes' }
    ],
    4: [
      { visuals: Array(24).fill('🥝'), question: 'Unusual fuzzy brown fruit detected. What is it?', concept: 'Kiwi' },
      { visuals: Array(24).fill('🍉'), question: 'Large green striped fruit found. Name it!', concept: 'Watermelon' },
      { visuals: Array(24).fill('🧮'), question: 'Computing device with beads detected. What is this tool?', concept: 'Calculator' }
    ],
    5: [
      { visuals: Array(24).fill('🍎'), question: 'Quick! What is this?', concept: 'Apple' },
      { visuals: Array(24).fill('🍌'), question: 'Fast identification needed!', concept: 'Banana' },
      { visuals: [...Array(12).fill('🍊'), ...Array(12).fill('🥝')], question: 'Name all items you see!', concept: 'Mixed Fruits' }
    ],
    6: [
      { visuals: Array(24).fill('🔴'), question: 'What color is this?', concept: 'Red' },
      { visuals: Array(24).fill('🔵'), question: 'Identify this color.', concept: 'Blue' },
      { visuals: Array(24).fill('🟡'), question: 'What color do you see?', concept: 'Yellow' }
    ],
    7: [
      { visuals: Array(24).fill('⭕'), question: 'What shape is this?', concept: 'Circle' },
      { visuals: Array(24).fill('⬛'), question: 'Name this shape.', concept: 'Square' },
      { visuals: Array(24).fill('🔺'), question: 'Identify this geometric shape.', concept: 'Triangle' }
    ],
    8: [
      { visuals: Array(24).fill('🔵'), question: 'Describe: What shape and what color?', concept: 'Blue Circle' },
      { visuals: Array(24).fill('🟥'), question: 'Full description needed: shape and color.', concept: 'Red Square' },
      { visuals: Array(24).fill('🟨'), question: 'Combine the shape and color in your answer.', concept: 'Yellow Square' }
    ],
    9: [
      { visuals: Array(24).fill('🟢'), question: 'The robot thinks this is RED. Is that correct?', concept: 'Green (Correction)' },
      { visuals: Array(24).fill('⬛'), question: 'The robot calls this a CIRCLE. Fix the error!', concept: 'Square (Correction)' },
      { visuals: Array(24).fill('🔵'), question: "Robot says YELLOW CIRCLE. What's wrong?", concept: 'Blue Circle (Correction)' }
    ],
    10: [
      { visuals: [...Array(12).fill('🔴'), ...Array(12).fill('🔵')], question: 'Create a rule to sort these by color.', concept: 'Color Sorting' },
      { visuals: [...Array(12).fill('⭕'), ...Array(12).fill('⬛')], question: 'How should we separate these shapes?', concept: 'Shape Sorting' },
      { visuals: [...Array(8).fill('🔴'), ...Array(8).fill('🔵'), ...Array(8).fill('🟡')], question: "Sort these into 3 groups. What's your rule?", concept: 'Multi-group Sorting' }
    ],
    11: [
      { visuals: Array(24).fill('🐱'), question: 'What animal is this?', concept: 'Cat' },
      { visuals: Array(24).fill('🐶'), question: 'Name this animal.', concept: 'Dog' },
      { visuals: Array(24).fill('🐮'), question: 'What do we call this farm animal?', concept: 'Cow' }
    ],
    12: [
      { visuals: Array(24).fill('🐮'), question: 'This animal says "Moo". What is it?', concept: 'Cow (Moo)' },
      { visuals: Array(24).fill('🐱'), question: 'Which animal makes "Meow" sound?', concept: 'Cat (Meow)' },
      { visuals: Array(24).fill('🐶'), question: 'What animal barks "Woof"?', concept: 'Dog (Woof)' }
    ],
    13: [
      { visuals: Array(24).fill('🐑'), question: 'The robot hears "Baa". Which animal makes this sound?', concept: 'Sheep' },
      { visuals: Array(24).fill('🐷'), question: 'Sound detected: "Oink". Match it to the animal!', concept: 'Pig' },
      { visuals: Array(24).fill('🐔'), question: 'Robot picks up "Cluck cluck". What is it?', concept: 'Chicken' }
    ],
    14: [
      { visuals: Array(24).fill('🐱'), question: 'Does this live in a house or jungle?', concept: 'House (Domestic)' },
      { visuals: Array(24).fill('🦁'), question: 'Where does this animal live: house or wild?', concept: 'Jungle (Wild)' },
      { visuals: [...Array(12).fill('🐶'), ...Array(12).fill('🐺')], question: 'Separate domestic from wild animals.', concept: 'Classification' }
    ],
    15: [
      { visuals: [...Array(8).fill('🐱'), ...Array(8).fill('🐶'), ...Array(8).fill('🐮')], question: 'Robot hears mixed sounds. Identify all animals!', concept: 'Multiple Animals' },
      { visuals: Array(24).fill('🐴'), question: 'Strange "Neigh" sound detected! What animal?', concept: 'Horse' },
      { visuals: Array(24).fill('🦆'), question: 'Quack quack! Name the animal.', concept: 'Duck' }
    ],
    16: [
      { visuals: Array(24).fill('🏃'), question: 'What action is happening here?', concept: 'Run' },
      { visuals: Array(24).fill('🤸'), question: 'Name this action.', concept: 'Jump' },
      { visuals: Array(24).fill('🍽️'), question: 'What is this person doing?', concept: 'Eat' }
    ],
    17: [
      { visuals: Array(24).fill('🏃'), question: 'This frozen image shows someone... doing what?', concept: 'Running' },
      { visuals: Array(24).fill('🏊'), question: 'Infer the action from this scene.', concept: 'Swimming' },
      { visuals: Array(24).fill('📖'), question: 'What activity is shown here?', concept: 'Reading' }
    ],
    18: [
      { visuals: Array(24).fill('⬆️'), question: 'Is this jumping up or falling down?', concept: 'Jumping' },
      { visuals: Array(24).fill('⬇️'), question: 'Distinguish: jumping or falling?', concept: 'Falling' },
      { visuals: Array(24).fill('➡️'), question: 'What direction of movement?', concept: 'Moving Right' }
    ],
    19: [
      { visuals: Array(24).fill('🏃‍♂️'), question: 'Create a sentence: WHO is doing WHAT?', concept: 'The boy runs' },
      { visuals: Array(24).fill('👧🍽️'), question: 'Make a full sentence with subject and verb.', concept: 'The girl eats' },
      { visuals: Array(24).fill('🐶🏃'), question: 'Combine subject and action in one sentence.', concept: 'The dog runs' }
    ],
    20: [
      { visuals: Array(24).fill('💤'), question: 'Quick! What action is this?', concept: 'Sleep' },
      { visuals: Array(24).fill('🎮'), question: 'Name this activity!', concept: 'Play' },
      { visuals: Array(24).fill('✍️'), question: 'What is happening here?', concept: 'Write' }
    ],
    21: [
      { visuals: Array(24).fill('🍎'), question: 'Robot asks: What is this?', concept: 'Identification Pattern' },
      { visuals: Array(24).fill('⚽'), question: 'Train robot to ask: What is this object?', concept: 'Question Format' },
      { visuals: Array(24).fill('🐱'), question: 'Robot practices: What is this animal?', concept: 'Asking Questions' }
    ],
    22: [
      { visuals: Array(24).fill('🍎'), question: 'Teach robot to ask: What color is the apple?', concept: 'Color Question' },
      { visuals: Array(24).fill('🍌'), question: 'Robot asks about properties: What color?', concept: 'Property Query' },
      { visuals: Array(24).fill('🍊'), question: 'Practice color questions with robot.', concept: 'Color Inquiry' }
    ],
    23: [
      { visuals: [...Array(3).fill('🍌'), ...Array(21).fill('⬜')], question: 'Teach robot to count: How many bananas?', concept: 'Counting to 3' },
      { visuals: [...Array(5).fill('🍎'), ...Array(19).fill('⬜')], question: 'Count together: How many apples?', concept: 'Counting to 5' },
      { visuals: [...Array(2).fill('⚽'), ...Array(22).fill('⬜')], question: 'Simple counting: How many balls?', concept: 'Counting to 2' }
    ],
    24: [
      { visuals: Array(24).fill('🍎'), question: 'Multi-part question: What is it AND what color?', concept: 'Complex Query' },
      { visuals: [...Array(3).fill('🍌'), ...Array(21).fill('⬜')], question: 'Ask: What are these AND how many?', concept: 'Combined Question' },
      { visuals: Array(24).fill('🔵'), question: 'Robot needs: shape AND color answer.', concept: 'Double Property' }
    ],
    25: [
      { visuals: Array(24).fill('💬'), question: 'Free form: Robot asks YOU questions now!', concept: 'Role Reversal' },
      { visuals: Array(24).fill('🤝'), question: 'Interactive Q&A session begins.', concept: 'Conversation' },
      { visuals: Array(24).fill('✨'), question: 'Final interview test!', concept: 'Interview Skills' }
    ],
    26: [
      { visuals: [...Array(12).fill('🍎'), ...Array(12).fill('⚽')], question: 'Create rule: If Fruit → Left basket', concept: 'First Rule' },
      { visuals: [...Array(12).fill('🍌'), ...Array(12).fill('🧸')], question: 'Set sorting rule: If Food → Box A', concept: 'Basic If/Then' },
      { visuals: [...Array(12).fill('🐱'), ...Array(12).fill('🌳')], question: 'Make a rule: If Animal → Group 1', concept: 'Conditional Logic' }
    ],
    27: [
      { visuals: [...Array(8).fill('🐱'), ...Array(8).fill('⚽'), ...Array(8).fill('🍎')], question: 'Two rules: If Animal→Up, If Object→Down', concept: 'Dual Rules' },
      { visuals: [...Array(12).fill('🔴'), ...Array(12).fill('🔵')], question: 'Set: If Red→Left, If Blue→Right', concept: 'Two Conditions' },
      { visuals: [...Array(12).fill('🌞'), ...Array(12).fill('🌙')], question: 'Day vs Night rules.', concept: 'Binary Classification' }
    ],
    28: [
      { visuals: [...Array(8).fill('🔴'), ...Array(8).fill('🔵'), ...Array(8).fill('🟡')], question: 'If Red → Red Basket. Create rule!', concept: 'Color Sorting Rule' },
      { visuals: [...Array(12).fill('🟢'), ...Array(12).fill('🟣')], question: 'Sort by color rule.', concept: 'Color Conditionals' },
      { visuals: [...Array(8).fill('🔴'), ...Array(8).fill('🔵'), ...Array(8).fill('🟡')], question: '3-color sorting rule.', concept: 'Multi-color Logic' }
    ],
    29: [
      { visuals: Array(24).fill('🔴'), question: 'Robot says: If Red → Eat. Fix this bad rule!', concept: 'Debug Logic' },
      { visuals: Array(24).fill('🐱'), question: 'Wrong rule: If Cat → Throw. Correct it!', concept: 'Error Correction' },
      { visuals: Array(24).fill('⚽'), question: 'Bad rule detected! Fix robot logic.', concept: 'Logic Repair' }
    ],
    30: [
      { visuals: [...Array(6).fill('🍎'), ...Array(6).fill('⚽'), ...Array(6).fill('🐱'), ...Array(6).fill('🔴')], question: 'Apply 3 rules at once!', concept: 'Multiple Rules' },
      { visuals: [...Array(8).fill('🔴'), ...Array(8).fill('🔵'), ...Array(8).fill('🍎')], question: 'Complex multi-rule sorting.', concept: 'Combined Logic' },
      { visuals: [...Array(6).fill('🌞'), ...Array(6).fill('🌙'), ...Array(6).fill('🌧️'), ...Array(6).fill('❄️')], question: 'Weather sorting with rules.', concept: 'Advanced Conditionals' }
    ],
    31: [
      { visuals: [...Array(8).fill('🛏️'), ...Array(8).fill('🍽️'), ...Array(8).fill('🏫')], question: 'Order these: Wake → Eat → School', concept: 'Morning Sequence' },
      { visuals: [...Array(8).fill('🌞'), ...Array(8).fill('🌆'), ...Array(8).fill('🌙')], question: 'Time order: Morning → Evening → Night', concept: 'Time Sequence' },
      { visuals: [...Array(8).fill('🥚'), ...Array(8).fill('🐣'), ...Array(8).fill('🐔')], question: 'Life cycle order!', concept: 'Growth Sequence' }
    ],
    32: [
      { visuals: [...Array(8).fill('🏫'), ...Array(8).fill('🍽️'), ...Array(8).fill('🛏️')], question: 'Story is mixed! Put in correct order.', concept: 'Sequence Fix' },
      { visuals: [...Array(8).fill('🌙'), ...Array(8).fill('🌞'), ...Array(8).fill('🌆')], question: 'Scrambled! Fix the time order.', concept: 'Reordering' },
      { visuals: [...Array(8).fill('3️⃣'), ...Array(8).fill('1️⃣'), ...Array(8).fill('2️⃣')], question: 'Numbers are mixed. Sort them!', concept: 'Number Order' }
    ],
    33: [
      { visuals: [...Array(12).fill('🌅'), ...Array(12).fill('🌇')], question: 'What comes BEFORE sunset?', concept: 'Before Concept' },
      { visuals: [...Array(12).fill('🍽️'), ...Array(12).fill('🍰')], question: 'What happens AFTER dinner?', concept: 'After Concept' },
      { visuals: [...Array(12).fill('🚶'), ...Array(12).fill('🏃')], question: 'Teach: Before and After actions.', concept: 'Sequential Thinking' }
    ],
    34: [
      { visuals: [...Array(8).fill('🌧️'), ...Array(8).fill('☔'), ...Array(8).fill('🌈')], question: 'Create a sentence from this 3-picture story.', concept: 'Story Creation' },
      { visuals: [...Array(8).fill('😴'), ...Array(8).fill('⏰'), ...Array(8).fill('🏃')], question: 'Tell the story in one sentence.', concept: 'Narrative Sequence' },
      { visuals: [...Array(8).fill('🍎'), ...Array(8).fill('🔪'), ...Array(8).fill('🥧')], question: 'Describe this process story.', concept: 'Process Description' }
    ],
    35: [
      { visuals: [...Array(8).fill('🏠'), ...Array(8).fill('🏫'), ...Array(8).fill('🏪')], question: 'Choose best route order.', concept: 'Route Optimization' },
      { visuals: [...Array(8).fill('🧼'), ...Array(8).fill('💧'), ...Array(8).fill('🤲')], question: 'Logical washing order?', concept: 'Process Order' },
      { visuals: [...Array(8).fill('🥚'), ...Array(8).fill('🍳'), ...Array(8).fill('🍽️')], question: 'Cooking steps in order.', concept: 'Action Sequence' }
    ],
    36: [
      { visuals: Array(24).fill('🍕'), question: 'Teach robot: I LIKE pizza!', concept: 'Preference Like' },
      { visuals: Array(24).fill('🥦'), question: 'Tell robot: I DISLIKE broccoli.', concept: 'Preference Dislike' },
      { visuals: [...Array(12).fill('🍕'), ...Array(12).fill('🥦')], question: 'Set preferences for both.', concept: 'Like vs Dislike' }
    ],
    37: [
      { visuals: Array(24).fill('🎮'), question: 'Robot guesses: Do you like games?', concept: 'Prediction' },
      { visuals: Array(24).fill('📚'), question: 'Robot predicts your preferences.', concept: 'Inference' },
      { visuals: Array(24).fill('🏃'), question: 'Let robot guess what you enjoy!', concept: 'Preference Guess' }
    ],
    38: [
      { visuals: [...Array(16).fill('🍬'), ...Array(8).fill('🍫')], question: 'Like sweets, EXCEPT dark chocolate.', concept: 'Exception Rule' },
      { visuals: [...Array(16).fill('🐶'), ...Array(8).fill('🕷️')], question: 'Like animals, except spiders!', concept: 'Nuanced Preference' },
      { visuals: [...Array(16).fill('🎮'), ...Array(8).fill('📱')], question: 'Set preference with exception.', concept: 'Conditional Like' }
    ],
    39: [
      { visuals: Array(24).fill('👦'), question: "Create a profile: What does Bob like?", concept: 'Character Profile' },
      { visuals: Array(24).fill('👧'), question: "Define friend Sarah's tastes.", concept: 'Personality Design' },
      { visuals: Array(24).fill('🤖'), question: 'Invent a friend for the robot!', concept: 'Social Modeling' }
    ],
    40: [
      { visuals: Array(24).fill('🎮'), question: 'Based on training, robot recommends a game!', concept: 'Recommendation' },
      { visuals: Array(24).fill('📚'), question: 'Robot suggests a book for you.', concept: 'Personalized Suggestion' },
      { visuals: Array(24).fill('🎬'), question: 'Final test: Robot makes smart suggestion!', concept: 'Smart Recommendation' }
    ],
    41: [
      { visuals: [...Array(12).fill('➡️'), ...Array(12).fill('🎯')], question: 'Direct path: Go straight to target!', concept: 'Direct Path' },
      { visuals: [...Array(12).fill('⬆️'), ...Array(12).fill('🏁')], question: 'Simple navigation to goal.', concept: 'Basic Navigation' },
      { visuals: [...Array(12).fill('➡️'), ...Array(12).fill('✅')], question: 'Straight line to destination.', concept: 'Linear Path' }
    ],
    42: [
      { visuals: [...Array(12).fill('🧱'), ...Array(12).fill('↩️')], question: 'If Wall → Turn. Create rule!', concept: 'Obstacle Avoidance' },
      { visuals: [...Array(12).fill('🚫'), ...Array(12).fill('↪️')], question: 'Navigate around barriers.', concept: 'Path Finding' },
      { visuals: [...Array(12).fill('⛔'), ...Array(12).fill('🔄')], question: 'Avoid obstacles!', concept: 'Smart Navigation' }
    ],
    43: [
      { visuals: [...Array(12).fill('🛤️'), ...Array(12).fill('🚶')], question: 'Choose: Path A or Path B?', concept: 'Path Comparison' },
      { visuals: [...Array(12).fill('🔀'), ...Array(12).fill('⚖️')], question: 'Compare two routes.', concept: 'Route Selection' },
      { visuals: [...Array(12).fill('📍'), ...Array(12).fill('🎯')], question: 'Find shortest way!', concept: 'Optimization' }
    ],
    44: [
      { visuals: [...Array(3).fill('👣'), ...Array(21).fill('🎯')], question: 'Reach target in exactly 3 steps!', concept: 'Constraint Problem' },
      { visuals: [...Array(5).fill('👣'), ...Array(19).fill('🏁')], question: 'Efficiency: Use only 5 steps.', concept: 'Limited Resources' },
      { visuals: [...Array(4).fill('👣'), ...Array(20).fill('✅')], question: 'Step budget challenge!', concept: 'Resource Management' }
    ],
    45: [
      { visuals: [...Array(12).fill('🏃'), ...Array(12).fill('🏁')], question: 'Speed solve this maze puzzle!', concept: 'Fast Problem Solving' },
      { visuals: [...Array(12).fill('⚡'), ...Array(12).fill('🎯')], question: 'Quick navigation challenge.', concept: 'Speed Challenge' },
      { visuals: [...Array(12).fill('🔥'), ...Array(12).fill('✅')], question: 'Race to the finish!', concept: 'Timed Puzzle' }
    ],
    46: [
      { visuals: [...Array(8).fill('🐱'), ...Array(8).fill('🍕'), ...Array(8).fill('🚀')], question: 'Combine words into something silly!', concept: 'Creative Combination' },
      { visuals: [...Array(8).fill('🦒'), ...Array(8).fill('🎩'), ...Array(8).fill('🎸')], question: 'Make a humorous sentence.', concept: 'Humor Creation' },
      { visuals: [...Array(8).fill('🌙'), ...Array(8).fill('🧀'), ...Array(8).fill('🐭')], question: 'Create funny word combo!', concept: 'Playful Language' }
    ],
    47: [
      { visuals: [...Array(8).fill('🦁'), ...Array(8).fill('🦅'), ...Array(8).fill('🐠')], question: 'Invent an animal! Mix these parts.', concept: 'Creature Design' },
      { visuals: [...Array(8).fill('🦖'), ...Array(8).fill('🦋'), ...Array(8).fill('🦒')], question: 'Create a new monster!', concept: 'Creative Synthesis' },
      { visuals: [...Array(8).fill('🐉'), ...Array(8).fill('🦄'), ...Array(8).fill('🦜')], question: 'Design a fantasy creature.', concept: 'Imagination' }
    ],
    48: [
      { visuals: [...Array(8).fill('👦'), ...Array(8).fill('🌲'), ...Array(8).fill('🏰')], question: 'Write a 3-sentence adventure story.', concept: 'Short Fiction' },
      { visuals: [...Array(8).fill('🚀'), ...Array(8).fill('👽'), ...Array(8).fill('🌟')], question: 'Create a mini space tale.', concept: 'Story Writing' },
      { visuals: [...Array(8).fill('🐉'), ...Array(8).fill('⚔️'), ...Array(8).fill('👑')], question: 'Tell a short epic!', concept: 'Narrative Creation' }
    ],
    49: [
      { visuals: [...Array(8).fill('🏴'), ...Array(8).fill('🎨'), ...Array(8).fill('⭐')], question: 'Design a team logo/flag!', concept: 'Visual Design' },
      { visuals: [...Array(8).fill('🛡️'), ...Array(8).fill('🦁'), ...Array(8).fill('⚔️')], question: 'Create a symbol for your team.', concept: 'Symbolic Design' },
      { visuals: [...Array(8).fill('🎌'), ...Array(8).fill('🌈'), ...Array(8).fill('✨')], question: 'Describe your perfect flag!', concept: 'Creative Vision' }
    ],
    50: [
      { visuals: Array(24).fill('✨'), question: 'Free creation! Make anything amazing!', concept: 'Ultimate Creativity' },
      { visuals: Array(24).fill('🎭'), question: 'Final test: Create your masterpiece!', concept: 'Creative Freedom' },
      { visuals: Array(24).fill('🏆'), question: 'Show everything you taught the robot!', concept: 'Grand Finale' }
    ],
  };

  const defaultScenarios = [
    { visuals: Array(24).fill('❓'), question: 'Help the robot understand this concept.', concept: 'Unknown' },
    { visuals: Array(24).fill('🤔'), question: 'Teach the robot about this.', concept: 'Learning' },
    { visuals: Array(24).fill('✨'), question: 'Final test! What did we learn?', concept: 'Summary' }
  ];

  return missionScenarios[missionId] || defaultScenarios;
};

export const MissionTerminal: React.FC<MissionTerminalProps> = ({
  mission, robot, onMissionComplete, onExit,
}) => {
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [input, setInput] = useState('');
  const [robotThought, setRobotThought] = useState('');
  const [sessionMemories, setSessionMemories] = useState<TrainingMemory[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const scenarios = getMissionScenarios(mission.id);
  const currentScenario = scenarios[currentRoundIndex];

  const handleSubmit = () => {
    if (!input.trim()) return;
    setIsProcessing(true);
    setTimeout(() => {
      setRobotThought(`🤖 Beep boop! I learned about "${input}"! Adding to my memory banks... 💾`);
      const newMemory: TrainingMemory = {
        chapterId: Math.ceil(mission.id / 5),
        missionId: mission.id,
        concept: currentScenario.concept,
        value: input,
        type: mission.type === 'logic' ? 'logic' : 'vocabulary',
      };
      setSessionMemories(prev => [...prev, newMemory]);
      setIsProcessing(false);
    }, 1000);
  };

  const handleNextRound = () => {
    setInput('');
    setRobotThought('');
    if (currentRoundIndex < scenarios.length - 1) {
      setCurrentRoundIndex(prev => prev + 1);
    } else {
      onMissionComplete(sessionMemories);
    }
  };

  return (
    <div
      className="max-w-2xl mx-auto shadow-2xl overflow-hidden min-h-[600px] flex flex-col"
      style={{
        background: '#080e14',
        border: '4px solid #b45309',
        boxShadow: '0 0 30px rgba(180,83,9,0.3)',
      }}
    >
      {/* ── Header ── */}
      <div style={{ background: '#050a0f', borderBottom: '2px solid #451a03' }}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="font-pixel text-[8px] text-gray-600 mb-0.5">MISSION {mission.id}</div>
              <h2 className="font-pixel text-xs text-amber-300">{mission.title.toUpperCase()}</h2>
              <p className="text-[10px] text-gray-500 mt-0.5">{mission.description}</p>
            </div>
            <button
              onClick={onExit}
              className="font-pixel text-xs px-3 py-2 transition-all duration-100 active:translate-y-0.5"
              style={{
                background: '#7f1d1d',
                border: '3px solid #991b1b',
                borderBottom: '4px solid #450a0a',
                color: '#fca5a5',
              }}
            >
              ✕ EXIT
            </button>
          </div>

          {/* Round progress dots */}
          <div className="flex gap-2">
            {scenarios.map((_, i) => (
              <div
                key={i}
                className="h-2 flex-1 transition-all duration-300"
                style={{
                  background: i < currentRoundIndex ? '#22c55e' : i === currentRoundIndex ? '#f59e0b' : '#1f2937',
                  border: `1px solid ${i <= currentRoundIndex ? 'transparent' : '#374151'}`,
                }}
              />
            ))}
          </div>
          <div className="font-pixel text-[8px] text-gray-600 mt-1 text-right">
            ROUND {currentRoundIndex + 1} / {scenarios.length}
          </div>
        </div>
      </div>

      {/* ── Robot display ── */}
      <div
        className="flex justify-center items-center py-5"
        style={{ background: '#050a0f', borderBottom: '1px solid #1a1f2a' }}
      >
        <div className="text-center">
          <RobotAvatar color={robot.color} isThinking={isProcessing} />
          <div className="font-pixel text-[9px] text-gray-600 mt-1">{robot.name}</div>
        </div>
      </div>

      {/* ── Visual grid ── */}
      <div className="px-4 pt-4">
        <div
          className="grid grid-cols-8 gap-1 p-3"
          style={{ background: '#050a0f', border: '2px solid #1f2937' }}
        >
          {currentScenario.visuals.map((emoji: string, i: number) => (
            <div
              key={i}
              className="text-lg text-center py-1"
              style={{ background: '#0a1118', border: '1px solid #1a2030' }}
            >
              {emoji}
            </div>
          ))}
        </div>
      </div>

      {/* ── Question ── */}
      <div className="px-4 py-4 flex-1">
        <div
          className="p-4"
          style={{ background: '#050d1a', borderLeft: '4px solid #1d4ed8', border: '1px solid #1e3a5f' }}
        >
          <div className="font-pixel text-[8px] text-blue-600 mb-1">📡 ROBOT ASKS:</div>
          <p className="font-pixel text-xs text-blue-200 leading-relaxed">
            {currentScenario.question}
          </p>
        </div>

        {/* Concept badge */}
        <div className="mt-2 flex items-center gap-2">
          <span
            className="font-pixel text-[8px] text-amber-300 px-2 py-1"
            style={{ background: '#451a03', border: '1px solid #713f12' }}
          >
            CONCEPT: {currentScenario.concept}
          </span>
        </div>

        {/* Robot response */}
        {robotThought && (
          <div
            className="mt-3 p-4"
            style={{ background: '#071a0a', borderLeft: '4px solid #15803d', border: '1px solid #166534' }}
          >
            <div className="font-pixel text-[8px] text-green-600 mb-1">💾 ROBOT LEARNS:</div>
            <p className="font-pixel text-xs text-green-300 leading-relaxed">{robotThought}</p>
          </div>
        )}
      </div>

      {/* ── Input area ── */}
      <div
        className="p-4"
        style={{ background: '#050a0f', borderTop: '2px solid #1f2937' }}
      >
        {!robotThought ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="Type your answer..."
              className="flex-1 px-4 py-3 font-pixel text-xs text-white placeholder:text-gray-700 outline-none transition-all"
              style={{
                background: '#050d14',
                border: '2px solid #374151',
              }}
              disabled={isProcessing}
              onFocus={e => (e.target.style.borderColor = '#f59e0b')}
              onBlur={e => (e.target.style.borderColor = '#374151')}
            />
            <button
              onClick={handleSubmit}
              disabled={!input.trim() || isProcessing}
              className="font-pixel text-xs px-5 py-3 transition-all duration-100 active:translate-y-0.5"
              style={{
                background: input.trim() && !isProcessing ? '#b45309' : '#1f2937',
                border: input.trim() && !isProcessing ? '3px solid #d97706' : '3px solid #374151',
                borderBottom: input.trim() && !isProcessing ? '5px solid #78350f' : '3px solid #374151',
                color: input.trim() && !isProcessing ? '#fef3c7' : '#4b5563',
                cursor: input.trim() && !isProcessing ? 'pointer' : 'not-allowed',
              }}
            >
              {isProcessing ? '⏳' : 'TEACH'}
            </button>
          </div>
        ) : (
          <button
            onClick={handleNextRound}
            className="w-full py-4 font-pixel text-xs transition-all duration-100 active:translate-y-0.5 hover:brightness-110"
            style={{
              background: currentRoundIndex < scenarios.length - 1 ? '#1e40af' : '#15803d',
              border: currentRoundIndex < scenarios.length - 1 ? '4px solid #1d4ed8' : '4px solid #166534',
              borderBottom: currentRoundIndex < scenarios.length - 1 ? '6px solid #1e3a8a' : '6px solid #14532d',
              color: '#fff',
              boxShadow: '0 0 16px rgba(59,130,246,0.2)',
            }}
          >
            {currentRoundIndex < scenarios.length - 1 ? '▶ NEXT ROUND' : '✓ COMPLETE MISSION'}
          </button>
        )}
      </div>
    </div>
  );
};
