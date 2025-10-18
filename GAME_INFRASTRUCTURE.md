# MineMath Game Infrastructure Guide

Complete guide for creating and adding new games to the MineMath platform.

## 🎯 Overview

MineMath provides a ready-to-use game template system that allows you to quickly create Minecraft-themed educational games. The infrastructure includes:

- **Pre-built Components**: Reusable game components with Minecraft theming
- **State Management**: React Context API for game state
- **Type Safety**: TypeScript interfaces for all game data
- **Routing System**: Easy integration with the app navigation
- **Game Registry**: Centralized game management

## 📦 What's Included

### 1. Game Template (`/client/src/games/puzzle-template/`)

A complete, working game template with:
- Score tracking (points, diamonds, lives)
- Enemy system with health bars
- Timer with countdown
- Multiple choice and text input questions
- Power-up system
- Game over/level complete screens
- Full Minecraft theming

### 2. Game Registry (`/client/src/lib/gameRegistry.ts`)

Centralized game management system:
- Register games with metadata
- Filter games by category, age, difficulty
- Easy game discovery

### 3. Reusable Components

All template components can be imported and reused:
- `ScorePanel` - Display score, lives, diamonds
- `MinecraftEnemy` - Animated enemy character
- `PowerUpPanel` - Power-up buttons
- `GameBoard` - Main game area

## 🚀 Quick Start: Create Your First Game in 5 Minutes

### Step 1: Copy the Template (30 seconds)

```bash
# Navigate to games directory
cd client/src/games

# Copy template with your game name
cp -r puzzle-template riddle-master

# Or on Windows:
# xcopy puzzle-template riddle-master /E /I
```

### Step 2: Customize Questions (2 minutes)

Edit `client/src/games/riddle-master/data/sampleQuestions.ts`:

```typescript
export const sampleQuestions: PuzzleQuestion[] = [
  {
    id: '1',
    question: 'I speak without a mouth and hear without ears. What am I?',
    correctAnswer: 'echo',
    points: 15,
    hint: 'Think about sound',
    difficulty: 'medium',
  },
  {
    id: '2',
    question: 'What has keys but no locks?',
    options: ['Door', 'Piano', 'Map', 'Computer'],
    correctAnswer: 'Piano',
    points: 10,
    difficulty: 'easy',
  },
  // Add more questions...
];
```

### Step 3: Create Page Component (1 minute)

Create `client/src/pages/RiddleMaster.tsx`:

```typescript
import React from 'react';
import '@/games/riddle-master/App.css';

const RiddleMasterApp = React.lazy(() => import('@/games/riddle-master/App'));

export default function RiddleMaster() {
  return (
    <div className="riddle-master-page">
      <React.Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-900 to-purple-900">
          <div className="text-center">
            <div className="text-2xl font-pixel text-white mb-4">Loading Riddle Master...</div>
            <div className="text-6xl animate-bounce">🧩</div>
          </div>
        </div>
      }>
        <RiddleMasterApp />
      </React.Suspense>
    </div>
  );
}
```

### Step 4: Add Routing (1 minute)

Edit `client/src/App.tsx`:

```typescript
import RiddleMaster from "@/pages/RiddleMaster";

// Inside the Router, add to protected routes:
<Route path="/riddle-master" component={RiddleMaster} />
```

### Step 5: Add Navigation Button (30 seconds)

Edit `client/src/pages/Home.tsx`:

```typescript
import { Brain } from 'lucide-react';

// Add to navigation buttons:
<Link href="/riddle-master">
  <Button variant="ghost" size="sm" className="font-pixel text-xs">
    <Brain className="h-4 w-4 mr-1" />
    RIDDLES
  </Button>
</Link>
```

### Step 6: Test! (30 seconds)

```bash
npm run dev
# Open http://localhost:5000/riddle-master
```

Done! 🎉 You now have a working game!

## 📋 Game Template Features

### Built-in Features

| Feature | Description |
|---------|-------------|
| **Lives System** | 3 hearts, lose life on wrong answer or timeout |
| **Scoring** | Points based on question difficulty |
| **Diamonds** | Collect diamonds for correct answers |
| **Timer** | 30-second countdown per question |
| **Enemy System** | 5 different Minecraft enemies |
| **Power-ups** | Hint, Skip, Extra Time, Shield |
| **Streak Tracking** | Consecutive correct answers |
| **Game Over Screen** | Shows final stats and replay button |

### Question Types Supported

1. **Text Input**: User types answer
2. **Multiple Choice**: User selects from options

### Difficulty Levels

- **Easy**: 10 points
- **Medium**: 15 points
- **Hard**: 20 points

## 🎨 Customization Guide

### Change Game Title

In `your-game/App.tsx`:

```typescript
<h1 className="text-4xl font-pixel text-yellow-300 text-center mb-6">
  🧙 YOUR GAME TITLE
</h1>
```

### Modify Timer Duration

In `your-game/components/GameBoard.tsx`:

```typescript
const [timeLeft, setTimeLeft] = useState(45); // Changed from 30 to 45 seconds
```

### Add Custom Power-up

In `your-game/contexts/GameContext.tsx`:

```typescript
const [powerUps] = useState<PowerUp[]>([
  { type: 'freeze', name: 'Freeze Time', emoji: '❄️', count: 2 },
  // ... other power-ups
]);
```

Then implement logic in `usePowerUp`:

```typescript
const usePowerUp = useCallback((type: PowerUp['type']) => {
  if (type === 'freeze') {
    // Pause timer for 10 seconds
    setTimeLeft(prev => prev + 10);
  }
}, []);
```

### Change Enemy Types

Edit `your-game/data/enemies.ts`:

```typescript
export const enemies: MinecraftEnemy[] = [
  {
    type: 'custom',
    name: 'Math Monster',
    emoji: '🧮',
    defeatSound: '📐 CALCULATED!',
    health: 100,
  },
];
```

### Customize Colors

Edit `your-game/App.css`:

```css
/* Add custom background */
.bg-my-custom-theme {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

Use in your component:

```typescript
<div className="bg-my-custom-theme ...">
```

## 🗂️ Project Structure

```
minemath/
├── client/src/
│   ├── games/
│   │   ├── puzzle-template/        ← Template for new games
│   │   │   ├── App.tsx
│   │   │   ├── App.css
│   │   │   ├── components/
│   │   │   ├── contexts/
│   │   │   ├── types/
│   │   │   ├── data/
│   │   │   └── README.md
│   │   ├── word-wizard/            ← Example: Complete game
│   │   └── your-new-game/          ← Your games go here
│   ├── pages/
│   │   ├── Home.tsx                ← Add navigation buttons here
│   │   ├── YourGame.tsx            ← Create page for each game
│   │   └── ...
│   ├── lib/
│   │   └── gameRegistry.ts         ← Register games here
│   └── App.tsx                     ← Add routes here
└── GAME_INFRASTRUCTURE.md          ← This file
```

## 🎮 Game Categories

Organize your games by category:

- **Math**: Arithmetic, algebra, geometry
- **Language**: Spelling, vocabulary, grammar
- **Logic**: Puzzles, riddles, critical thinking
- **Science**: Physics, chemistry, biology
- **Mixed**: Multi-subject games

## 📊 Progress Tracking

To save game results to the database, add to your page component:

```typescript
const handleGameComplete = async (stats: GameStats) => {
  try {
    const response = await fetch('/api/progress/temporary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        pointsEarned: stats.score,
        questionsAnswered: stats.totalQuestions,
        correctAnswers: stats.correctAnswers,
        level: stats.level,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }),
    });

    if (!response.ok) throw new Error('Failed to save');

    // Refresh dashboard
    await queryClient.invalidateQueries({
      predicate: (query) => query.queryKey[0]?.toString().startsWith('/api/progress')
    });
  } catch (error) {
    console.error('Failed to save game progress:', error);
  }
};
```

Then pass to your game:

```typescript
<GameBoard onGameComplete={handleGameComplete} />
```

## 🧪 Testing Checklist

Before pushing to git:

- [ ] Game loads without errors
- [ ] Questions display correctly
- [ ] Answer submission works
- [ ] Correct/incorrect feedback shows
- [ ] Timer counts down properly
- [ ] Lives decrease on wrong answer
- [ ] Score increases on correct answer
- [ ] Game over screen appears when lives = 0
- [ ] Navigation button works from home page
- [ ] Game looks good on mobile and desktop

## 🐛 Common Issues & Solutions

### Game won't load
**Problem**: Blank screen or loading forever
**Solution**:
- Check browser console for errors
- Verify all imports are correct
- Make sure App.css is imported
- Check that lazy loading is set up correctly

### Questions not appearing
**Problem**: Game loads but no questions
**Solution**:
- Check `sampleQuestions.ts` export
- Verify `generateQuestion()` is called
- Add console.log to debug state

### Routing not working
**Problem**: 404 or page not found
**Solution**:
- Verify route is added in `App.tsx`
- Check route path matches Link href
- Ensure component is imported correctly

### Styling broken
**Problem**: Game looks wrong or unstyled
**Solution**:
- Import App.css in page component
- Check Tailwind classes are correct
- Verify custom CSS classes exist

## 💡 Best Practices

1. **Start with Template**: Don't build from scratch, copy the template
2. **Test Early**: Run `npm run dev` after each step
3. **Keep it Simple**: Start with basic questions, add complexity later
4. **Reuse Components**: Use existing components when possible
5. **Follow Patterns**: Look at existing games for examples
6. **Document Changes**: Add comments for custom logic
7. **Mobile First**: Test on mobile viewport
8. **Performance**: Lazy load games to keep bundle size small

## 📚 Next Steps

1. **Create Your First Game**: Follow the Quick Start guide
2. **Explore Template**: Read `/client/src/games/puzzle-template/README.md`
3. **Study Examples**: Look at existing games for inspiration
4. **Customize**: Make it your own with custom logic and styling
5. **Test Thoroughly**: Use the testing checklist
6. **Share**: Push to git when ready

## 🆘 Need Help?

- Check `/client/src/games/puzzle-template/README.md` for detailed template docs
- Look at existing games like `word-wizard` for examples
- Review error messages in browser console
- Test components individually to isolate issues

## 🎉 Example Games to Build

- **Math Riddles**: Word problems that require math
- **Logic Puzzles**: Sudoku, pattern matching
- **Trivia Quiz**: Multiple choice questions on any topic
- **Word Games**: Anagrams, word scrambles
- **Memory Challenge**: Remember sequences or patterns
- **Speed Math**: Quick arithmetic with time pressure
- **Story Problems**: Reading comprehension + math

Happy game building! 🚀
