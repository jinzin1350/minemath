# Minecraft Math Game Design Guidelines

## Design Approach
**Reference-Based Approach**: Drawing inspiration from Minecraft's iconic pixel art aesthetic combined with modern educational game interfaces like Khan Academy Kids and Duolingo. The design balances nostalgic gaming elements with clean, accessible educational interfaces.

## Core Design Elements

### A. Color Palette
**Primary Colors (Dark Mode Focus):**
- Background: 25 15% 8% (deep forest green-black)
- Primary UI: 120 25% 15% (dark minecraft green)
- Text: 0 0% 95% (near white)
- Success: 100 60% 50% (bright emerald green)
- Danger: 0 70% 55% (minecraft red)
- Warning: 45 90% 60% (gold/yellow for diamonds)

**Light Mode Adaptation:**
- Background: 120 20% 95% (light sage)
- Primary UI: 120 30% 25% (deep green)
- Text: 0 0% 15% (dark gray)

### B. Typography
- **Primary Font**: 'Press Start 2P' (Google Fonts) - authentic pixel game aesthetic
- **Secondary Font**: 'Inter' (Google Fonts) - for readable body text and UI
- **Sizes**: Limited to 8px, 12px, 16px, 24px, 32px to maintain pixel-perfect scaling

### C. Layout System
**Tailwind Spacing**: Consistent use of units 2, 4, 8, 12, 16 (p-2, m-4, h-8, etc.)
- Grid-based layout mimicking Minecraft's block system
- Card-based components with subtle borders and shadows
- Responsive breakpoints optimized for mobile gameplay

### D. Component Library

**Navigation:**
- Pixel-art style header with username display
- Tab-based navigation between Game, Dashboard, and Profile
- Minecraft-style button designs with blocky, 3D appearance

**Game Interface:**
- Centered game viewport with character sprites
- Bottom-aligned answer input panel
- Side-mounted health hearts and score display
- Modal overlays for level completion and game over

**Dashboard Components:**
- 7-day points graph with block-style data visualization
- Daily statistics cards with Minecraft item icons
- Achievement badges using minecraft symbols (diamonds, emeralds, etc.)

**Forms:**
- Registration/login forms with pixel-art styling
- Input fields with thick borders and retro styling
- Minecraft-themed loading states and error messages

### E. Visual Treatments

**Minecraft Aesthetic Elements:**
- Pixelated borders and shadows throughout
- Block-style cards and containers
- 8-bit style icons and UI elements
- Subtle texture overlays reminiscent of minecraft blocks

**Animations:**
- Minimal, performance-focused animations
- Character sprite movements during combat
- Point collection animations with particle effects
- Simple fade transitions between game states

## Images Section

**Character Sprites:**
- Pixelated player character (16x16 or 32x32 sprites)
- Various enemy types with increasing difficulty appearance
- Health heart icons and collectible item sprites

**Background Elements:**
- Subtle minecraft-style texture patterns for cards
- Block-pattern borders and dividers
- No large hero image - focus on gameplay viewport

**UI Icons:**
- Minecraft-style icons for navigation (sword, shield, book, etc.)
- Achievement badges using recognizable minecraft items
- Graph visualization using block/bar aesthetics

**Note**: All images should maintain the pixelated, low-resolution aesthetic consistent with Minecraft's visual style while ensuring readability on modern displays.