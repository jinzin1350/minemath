import type { PuzzleQuestion } from '../types/game.types';

// Sample puzzle questions for demonstration
// Replace these with your actual game questions
export const sampleQuestions: PuzzleQuestion[] = [
  {
    id: '1',
    question: 'What comes next in the pattern? 2, 4, 6, 8, __',
    correctAnswer: '10',
    points: 10,
    hint: 'Count by 2s',
    difficulty: 'easy',
  },
  {
    id: '2',
    question: 'If all roses are flowers and some flowers fade quickly, can we conclude that some roses fade quickly?',
    options: ['Yes', 'No', 'Maybe', 'Not enough information'],
    correctAnswer: 'Not enough information',
    points: 15,
    hint: 'Think about logical fallacies',
    difficulty: 'medium',
  },
  {
    id: '3',
    question: 'A farmer has 17 sheep and all but 9 die. How many are left?',
    correctAnswer: '9',
    points: 10,
    hint: 'Read carefully!',
    difficulty: 'easy',
  },
  {
    id: '4',
    question: 'What is the missing number? 1, 1, 2, 3, 5, 8, __',
    correctAnswer: '13',
    points: 15,
    hint: 'Each number is the sum of the previous two',
    difficulty: 'medium',
  },
  {
    id: '5',
    question: 'Which word does not belong? Cat, Dog, Chair, Bird',
    options: ['Cat', 'Dog', 'Chair', 'Bird'],
    correctAnswer: 'Chair',
    points: 10,
    hint: 'One of these is not a living thing',
    difficulty: 'easy',
  },
  {
    id: '6',
    question: 'If you rearrange the letters "CIFAIPC", you would have the name of a(n):',
    options: ['Ocean', 'Country', 'State', 'City'],
    correctAnswer: 'Ocean',
    points: 20,
    hint: 'Think of large bodies of water',
    difficulty: 'hard',
  },
  {
    id: '7',
    question: 'What is always coming but never arrives?',
    options: ['Tomorrow', 'Yesterday', 'Today', 'Forever'],
    correctAnswer: 'Tomorrow',
    points: 15,
    hint: 'It\'s a riddle about time',
    difficulty: 'medium',
  },
  {
    id: '8',
    question: 'Complete the analogy: Book is to Reading as Fork is to __',
    options: ['Drawing', 'Writing', 'Eating', 'Stirring'],
    correctAnswer: 'Eating',
    points: 10,
    difficulty: 'easy',
  },
];

export function getRandomQuestion(difficulty?: 'easy' | 'medium' | 'hard'): PuzzleQuestion {
  const filteredQuestions = difficulty
    ? sampleQuestions.filter(q => q.difficulty === difficulty)
    : sampleQuestions;

  const randomIndex = Math.floor(Math.random() * filteredQuestions.length);
  return { ...filteredQuestions[randomIndex] };
}

export function getQuestionByLevel(level: number): PuzzleQuestion {
  if (level <= 2) return getRandomQuestion('easy');
  if (level <= 4) return getRandomQuestion('medium');
  return getRandomQuestion('hard');
}
