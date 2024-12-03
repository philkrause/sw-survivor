# Bee-ware

A simplified Vampire Survivors-like game built with React and React-Konva.

## Description

This is a browser-based, top-down view game where the player character automatically attacks waves of enemies. The game features:

- Player character movement
- Enemy spawning in waves
- Automatic player attacks (firing projectiles)
- Basic level-up choices
- Score tracking
- Player and enemy health systems
- Game over state

## Development Setup

This project was bootstrapped with Vite.

### Prerequisites

- Node.js (version 18+ recommended)
- npm

### Installation

```bash
# Clone the repository
git clone [repository-url]

# Navigate to the project directory
cd bee-ware

# Install dependencies
npm install

# Start the development server
npm run dev
```

## Tech Stack

- React
- React-Konva (for HTML5 Canvas rendering)
- Vite (build tool)

## Project Structure

```
bee-ware/
├── public/             # Static assets
├── src/
│   ├── assets/         # Game assets (sprites, sounds)
│   │   └── sprites/    # Character and enemy sprites
│   ├── components/     # React components
│   │   └── Game.jsx    # Main game component
│   ├── game/           # Game logic
│   ├── App.jsx         # Main App component
│   └── main.jsx        # Entry point
└── package.json        # Dependencies and scripts
```

## Future Enhancements

- Additional enemy types
- More weapon types
- Power-ups
- Sound effects and music
- Save game functionality
