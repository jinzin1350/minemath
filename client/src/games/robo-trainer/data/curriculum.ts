
import { Chapter } from "../types";

export const CURRICULUM: Chapter[] = [
  {
    id: 1,
    title: "Chapter 1: World of Objects",
    description: "Teach your robot the basics: What are things called?",
    bossBattlePrompt: "Show the robot a basket of mixed items (Apple, Ball, Banana). Ask it to name them and separate food from toys.",
    missions: [
      { id: 1, title: "Mission 1: Naming Basics", description: "Teach the robot the names of 3 fruits.", type: "teach", promptContext: "Show images of Apple, Banana, Orange. Ask user to name them." },
      { id: 2, title: "Mission 2: Fruit vs. Object", description: "Teach the difference between things you eat and things you use.", type: "teach", promptContext: "Show Ball vs Apple. Ask which one is food." },
      { id: 3, title: "Mission 3: Adjectives", description: "Add colors to names (e.g., Red Apple).", type: "teach", promptContext: "Show a Red Apple and Yellow Banana. Ask user to describe them fully." },
      { id: 4, title: "Mission 4: Rare Items", description: "Teach harder words like Kiwi or Watermelon.", type: "teach", promptContext: "Show Watermelon and Calculator. Ask user to label them." },
      { id: 5, title: "Mission 5: Speed Quiz", description: "Fast identification test.", type: "quiz", promptContext: "Rapidly ask what objects are based on previous training." }
    ]
  },
  {
    id: 2,
    title: "Chapter 2: Colors & Shapes",
    description: "Visual processing upgrade. Recognition of geometry.",
    bossBattlePrompt: "Identify specific shapes and colors in a complex abstract painting.",
    missions: [
      { id: 6, title: "Mission 6: Primary Colors", description: "Red, Blue, Yellow, Green.", type: "teach", promptContext: "Show generic blobs of color. Ask user to label." },
      { id: 7, title: "Mission 7: Basic Shapes", description: "Circle, Square, Triangle.", type: "teach", promptContext: "Show outlines of shapes. Ask user to label." },
      { id: 8, title: "Mission 8: Shape + Color", description: "Blue Circle, Red Square.", type: "teach", promptContext: "Combine color and shape. Ask user to define the combination." },
      { id: 9, title: "Mission 9: Find the Error", description: "Spot the mismatch (e.g. A green square labeled red).", type: "quiz", promptContext: "Show a 'Green Square' but label it 'Red'. Ask user to correct the robot." },
      { id: 10, title: "Mission 10: Sorting Challenge", description: "Sort items into colored baskets.", type: "logic", promptContext: "List of shapes/colors. Ask user to create a rule for sorting them." }
    ]
  },
  {
    id: 3,
    title: "Chapter 3: Animals & Sounds",
    description: "Audio processing simulation and biological classification.",
    bossBattlePrompt: "Listen to a barnyard scene soundscape and identify all animals present.",
    missions: [
      { id: 11, title: "Mission 11: Animal Names", description: "Cat, Dog, Cow, Sheep.", type: "teach", promptContext: "Show animals. Ask for names." },
      { id: 12, title: "Mission 12: Animal Sounds", description: "Moo, Meow, Woof.", type: "teach", promptContext: "Show text 'Moo'. Ask user which animal makes this sound." },
      { id: 13, title: "Mission 13: Sound Matching", description: "Match the sound to the picture.", type: "quiz", promptContext: "Robot hears a sound. User must tell it the correct picture." },
      { id: 14, title: "Mission 14: Wild vs Domestic", description: "Lion vs Cat.", type: "logic", promptContext: "Classify animals into House or Jungle." },
      { id: 15, title: "Mission 15: Guess the Sound", description: "Complex sound identification.", type: "quiz", promptContext: "A mix of sounds. Robot guesses, user gives feedback." }
    ]
  },
  {
    id: 4,
    title: "Chapter 4: Actions (Verbs)",
    description: "Teaching the robot about movement and doing things.",
    bossBattlePrompt: "Describe a scene of a park where many people are doing different things.",
    missions: [
      { id: 16, title: "Mission 16: Basic Verbs", description: "Run, Jump, Eat.", type: "teach", promptContext: "Show stick figures doing actions. Ask for the verb." },
      { id: 17, title: "Mission 17: Still to Action", description: "Infer action from a photo.", type: "teach", promptContext: "Show a frozen frame of a runner. Ask what they are doing." },
      { id: 18, title: "Mission 18: Motion Detect", description: "Distinguish jumping from falling.", type: "quiz", promptContext: "Describe a motion. Ask user to label it." },
      { id: 19, title: "Mission 19: Subject + Verb", description: "'The Boy Runs'.", type: "teach", promptContext: "Show a Girl Eating. Ask for a full sentence." },
      { id: 20, title: "Mission 20: Action Quiz", description: "Pick the right verb.", type: "quiz", promptContext: "Multiple choice actions for a scene." }
    ]
  },
  {
    id: 5,
    title: "Chapter 5: Q & A Logic",
    description: "Conversational abilities and answering questions.",
    bossBattlePrompt: "A press conference interview with the robot.",
    missions: [
      { id: 21, title: "Mission 21: 'What is this?'", description: "Answering identification questions.", type: "quiz", promptContext: "Robot asks 'What is this?'. User provides pattern." },
      { id: 22, title: "Mission 22: Color Queries", description: "'What color is the apple?'", type: "quiz", promptContext: "Robot asks about properties of objects." },
      { id: 23, title: "Mission 23: Counting", description: "'How many bananas?'", type: "teach", promptContext: "Show 3 items. Teach robot to count to 3." },
      { id: 24, title: "Mission 24: Complex Qs", description: "What + Color combined.", type: "quiz", promptContext: "Ask multi-part questions." },
      { id: 25, title: "Mission 25: User Interview", description: "User asks robot questions.", type: "creative", promptContext: "Free form Q&A session." }
    ]
  },
  {
    id: 6,
    title: "Chapter 6: Rules (If/Then)",
    description: "Introduction to coding logic and conditions.",
    bossBattlePrompt: "Sort a conveyor belt of trash, recyclables, and compost based on complex rules.",
    missions: [
      { id: 26, title: "Mission 26: First Rule", description: "If Fruit -> Left.", type: "logic", promptContext: "Set a rule: If X then Y." },
      { id: 27, title: "Mission 27: Dual Rules", description: "If Animal -> Up, Object -> Down.", type: "logic", promptContext: "Set two conflicting rules." },
      { id: 28, title: "Mission 28: Color Rules", description: "If Red -> Red Basket.", type: "logic", promptContext: "Conditional sorting based on properties." },
      { id: 29, title: "Mission 29: Debugging", description: "Fix a bad rule.", type: "logic", promptContext: "Robot has a bad rule (If Red -> Eat). User must fix it." },
      { id: 30, title: "Mission 30: Combo Challenge", description: "Multiple rules at once.", type: "quiz", promptContext: "Apply 3 rules to a set of items." }
    ]
  },
  {
    id: 7,
    title: "Chapter 7: Sequences",
    description: "Understanding time and order of events.",
    bossBattlePrompt: "Explain how to bake a cake in the correct order.",
    missions: [
      { id: 31, title: "Mission 31: 3-Step Order", description: "Wake -> Eat -> School.", type: "logic", promptContext: "Order these 3 events." },
      { id: 32, title: "Mission 32: Reorder", description: "Fix a mixed up story.", type: "logic", promptContext: "Scrambled sequence provided. User fixes." },
      { id: 33, title: "Mission 33: Before/After", description: "Concept of pre/post.", type: "teach", promptContext: "Teach 'Before' and 'After' concepts." },
      { id: 34, title: "Mission 34: Mini Story", description: "3 pictures -> Story.", type: "creative", promptContext: "Generate a sentence for a sequence." },
      { id: 35, title: "Mission 35: Best Order", description: "Optimize a route.", type: "logic", promptContext: "Choose the logical flow of actions." }
    ]
  },
  {
    id: 8,
    title: "Chapter 8: Preferences",
    description: "Giving the robot a personality and opinions.",
    bossBattlePrompt: "A debate about the best food and hobbies.",
    missions: [
      { id: 36, title: "Mission 36: Like/Dislike", description: "Teach preferences.", type: "teach", promptContext: "Tell robot it likes Pizza but hates Broccoli." },
      { id: 37, title: "Mission 37: Guessing", description: "Robot guesses user likes.", type: "quiz", promptContext: "Robot tries to predict user preference." },
      { id: 38, title: "Mission 38: Exceptions", description: "Like sweets, except dark chocolate.", type: "logic", promptContext: "Teach nuanced preference." },
      { id: 39, title: "Mission 39: Imaginary Friend", description: "Define a friend's taste.", type: "creative", promptContext: "Create a profile for a friend." },
      { id: 40, title: "Mission 40: Recommendation", description: "Robot suggests a game.", type: "creative", promptContext: "Robot recommends something based on training." }
    ]
  },
  {
    id: 9,
    title: "Chapter 9: Problem Solving",
    description: "Mazes, navigation, and overcoming obstacles.",
    bossBattlePrompt: "Navigate a maze with locked doors and keys.",
    missions: [
      { id: 41, title: "Mission 41: Simple Maze", description: "Go straight to target.", type: "logic", promptContext: "Simple directional instruction." },
      { id: 42, title: "Mission 42: Obstacles", description: "Avoid the wall.", type: "logic", promptContext: "If Wall -> Turn." },
      { id: 43, title: "Mission 43: Shortest Path", description: "Choose path A or B.", type: "logic", promptContext: "Compare two routes." },
      { id: 44, title: "Mission 44: Step Limit", description: "Reach target in 3 steps.", type: "logic", promptContext: "Efficiency challenge." },
      { id: 45, title: "Mission 45: Maze Race", description: "Speed solve.", type: "quiz", promptContext: "Solve a text-based maze puzzle." }
    ]
  },
  {
    id: 10,
    title: "Chapter 10: Creativity",
    description: "Generative AI simulation. Creating new things.",
    bossBattlePrompt: "Write a poem about a robot who loves to paint.",
    missions: [
      { id: 46, title: "Mission 46: Funny Sentence", description: "Combine words humorously.", type: "creative", promptContext: "Create a silly sentence with learned words." },
      { id: 47, title: "Mission 47: New Creature", description: "Invent an animal.", type: "creative", promptContext: "Combine animal parts to make a monster." },
      { id: 48, title: "Mission 48: Tiny Story", description: "3 sentence story.", type: "creative", promptContext: "Write a short fiction." },
      { id: 49, title: "Mission 49: Design Flag", description: "Create a team logo.", type: "creative", promptContext: "Describe a visual symbol." },
      { id: 50, title: "Mission 50: Final Creation", description: "Free creation.", type: "creative", promptContext: "The ultimate creative test." }
    ]
  }
];
