# Minecraft Puzzle Game Template

This is a complete, ready-to-use template for creating Minecraft-themed puzzle/logic games for the MineMath platform.

## 🎮 Features

- ✅ Complete game structure with Context API state management
- ✅ Minecraft-themed UI components
- ✅ Enemy system with health bars and animations
- ✅ Lives/Hearts system
- ✅ Score and diamond tracking
- ✅ Power-up system (Hint, Skip, Extra Time, Shield)
- ✅ Timer with countdown
- ✅ Multiple choice and text input question types
- ✅ Responsive design
- ✅ Game over and level complete screens

## 📁 Structure

```
puzzle-template/
├── App.tsx                 # Main game component
├── App.css                 # Minecraft-themed styles
├── components/
│   ├── GameBoard.tsx       # Main game board with questions
│   ├── ScorePanel.tsx      # Score, lives, diamonds display
│   ├── MinecraftEnemy.tsx  # Enemy character component
│   └── PowerUpPanel.tsx    # Power-ups display
├── contexts/
│   └── GameContext.tsx     # Game state management
├── types/
│   └── game.types.ts       # TypeScript interfaces
└── data/
    ├── enemies.ts          # Enemy definitions
    └── sampleQuestions.ts  # Sample puzzle questions
```

## 🚀 How to Use This Template

### Step 1: Copy the Template

```bash
# Copy the template folder with your game name
cp -r client/src/games/puzzle-template client/src/games/your-game-name
```

### Step 2: Customize Your Questions

Edit `data/sampleQuestions.ts` with your own questions:

```typescript
export const sampleQuestions: PuzzleQuestion[] = [
  {
    id: '1',
    question: 'Your question here?',
    correctAnswer: 'Answer',
    points: 10,
    hint: 'Optional hint',
    difficulty: 'easy',
  },
  // For multiple choice:
  {
    id: '2',
    question: 'Choose the correct answer:',
    options: ['Option A', 'Option B', 'Option C', 'Option D'],
    correctAnswer: 'Option A',
    points: 15,
    difficulty: 'medium',
  },
];
```

### Step 3: Update Game Logic (Optional)

Modify `contexts/GameContext.tsx` if you need custom game logic:

- Question generation
- Scoring system
- Power-up effects
- Level progression

### Step 4: Customize the UI

Edit `App.tsx` to change:
- Game title
- Welcome screen
- Colors and themes

Edit `components/GameBoard.tsx` to change:
- Timer duration (default: 30 seconds)
- Enemy movement speed
- Answer submission logic

### Step 5: Create the Game Page

Create a page file at `client/src/pages/YourGameName.tsx`:

```typescript
import React from 'react';
import '@/games/your-game-name/App.css';

const YourGameApp = React.lazy(() => import('@/games/your-game-name/App'));

export default function YourGameName() {
  return (
    <div className="your-game-page">
      <React.Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl mb-4">Loading...</div>
          </div>
        </div>
      }>
        <YourGameApp />
      </React.Suspense>
    </div>
  );
}
```

### Step 6: Add Routing

In `client/src/App.tsx`, add your game route:

```typescript
import YourGameName from "@/pages/YourGameName";

// Inside the Router component:
<Route path="/your-game-name" component={YourGameName} />
```

### Step 7: Add Navigation Button

In `client/src/pages/Home.tsx`, add a button to access your game:

```typescript
import { Gamepad2 } from 'lucide-react'; // or any icon

// In the navigation section:
<Link href="/your-game-name">
  <Button variant="ghost" size="sm" className="font-pixel text-xs">
    <Gamepad2 className="h-4 w-4 mr-1" />
    YOUR GAME
  </Button>
</Link>
```

### Step 8: Register in Game Registry (Optional)

Add your game to `client/src/lib/gameRegistry.ts`:

```typescript
{
  id: 'your-game-name',
  name: 'Your Game Title',
  description: 'Game description',
  route: '/your-game-name',
  icon: '🎮',
  category: 'logic',
  difficulty: 'medium',
  minAge: 10,
  isActive: true,
}
```

## 🎨 Customization Options

### Change Enemy Types

Edit `data/enemies.ts` to add/modify enemies:

```typescript
{
  type: 'custom',
  name: 'Custom Enemy',
  emoji: '👻',
  defeatSound: '💥 DEFEATED!',
  health: 100,
}
```

### Modify Power-Ups

In `contexts/GameContext.tsx`, update the `powerUps` array:

```typescript
const [powerUps] = useState<PowerUp[]>([
  { type: 'hint', name: 'Hint', emoji: '💡', count: 5 },
  // Add more power-ups
]);
```

### Change Colors/Theme

Edit `App.css` to customize Minecraft-style backgrounds:

```css
.bg-minecraft-custom {
  background: linear-gradient(135deg, #yourcolor 0%, #yourcolor2 100%);
  border: 2px solid #bordercolor;
}
```

## 🧪 Testing Locally

```bash
# Run the development server
npm run dev

# Navigate to your game
# http://localhost:5000/your-game-name
```

## 📊 Game Stats Integration

To save game progress to the backend, implement in your page component:

```typescript
const handleGameComplete = async (stats: GameStats) => {
  try {
    await fetch('/api/progress/temporary', {
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
  } catch (error) {
    console.error('Failed to save progress:', error);
  }
};
```

## 🎯 Question Types

### Text Input

```typescript
{
  id: '1',
  question: 'What is 2 + 2?',
  correctAnswer: '4',
  points: 10,
  difficulty: 'easy',
}
```

### Multiple Choice

```typescript
{
  id: '2',
  question: 'Which is the capital of France?',
  options: ['London', 'Paris', 'Berlin', 'Rome'],
  correctAnswer: 'Paris',
  points: 15,
  difficulty: 'medium',
}
```

## 🐛 Troubleshooting

### Game not loading
- Check that all imports are correct
- Verify the route is added in App.tsx
- Check browser console for errors

### Questions not appearing
- Verify `sampleQuestions.ts` exports are correct
- Check that `getQuestionByLevel()` is being called
- Ensure `currentQuestion` state is set in GameContext

### Styling issues
- Import App.css in your page component
- Check that Tailwind classes are available
- Verify font-pixel class is defined

## 📚 Additional Resources

- [React Context API](https://react.dev/reference/react/useContext)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)

## 💡 Tips

1. **Start Simple**: Begin with text input questions, add multiple choice later
2. **Test Incrementally**: Test each component as you build
3. **Customize Gradually**: Get the basic game working first, then customize
4. **Use Console Logs**: Debug state changes with console.log
5. **Reference Existing Games**: Look at GameInterface.tsx and WordWizard for examples

## 🎮 Example Games You Can Build

- **Logic Riddles**: Brain teasers and lateral thinking puzzles
- **Pattern Recognition**: Sequence completion and pattern matching
- **Math Puzzles**: Number sequences, math riddles
- **Word Puzzles**: Anagrams, word associations
- **Memory Games**: Pattern memory, sequence recall
- **Strategy Games**: Chess puzzles, tactical problems

Happy game building! 🎉
