# NeuralSnake AI 🐍🧠

NeuralSnake AI is a high-performance, visually stunning Reinforcement Learning environment where a Deep Q-Network (DQN) agent learns to master the classic Snake game directly in your browser.

![Snake AI Dashboard](https://raw.githubusercontent.com/Sappymukherjee214/Snake-Game-AI/main/src/assets/hero.png) *(Note: Replace with your actual hero image link or use the screenshot path)*

## 🚀 Key Features

- **Deep Q-Learning (DQN) Brain**: Powered by **TensorFlow.js**, the agent uses experience replay and target networks to stabilize learning and maximize its survival rate.
- **AI Vision Overlay**: Real-time visualization of the snake's sensor data. See the "line-of-sight" to food and proximity sensors detecting immediate danger.
- **Premium Dashboard**: A sleek, dark-mode interface built with **React** and **Vite**, featuring glassmorphism aesthetics and neon-glow visuals.
- **Brain Management System**:
  - **Save/Load**: Persist your trained models to LocalStorage.
  - **Export/Import**: Download brain files to share or backup your agent's progress.
- **Live Metrics**: Real-time tracking of Epsilon decay (exploration rate), episode history, and simulation speed control.

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **AI Engine**: TensorFlow.js
- **Icons**: Lucide-React
- **Styling**: Vanilla CSS (Modern Design System)

## 🧠 How the AI Works

The snake perceives the world through a 12-feature state vector:

1. **Food Proximity**: Relative direction of food (North, South, East, West).
2. **Wall/Body Danger**: Immediate danger detection in 4 directions.
3. **Movement State**: Current direction of travel.

### Reward Structure

- **🍎 Eat Food**: `+10`
- **💀 Collision**: `-100`
- **⏳ Each Step**: `-0.1` (Encourages efficiency and pathfinding)

## 🏃 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Sappymukherjee214/Snake-Game-AI.git
   cd Snake-Game-AI
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:5173](http://localhost:5173) in your browser.

## 🕹️ Usage

1. Click **Resume** to start the simulation.
2. Toggle **Training ON** to enable the DQN learning loop.
3. Adjust the **Simulation Speed** slider to accelerate training episodes (up to 200 steps/sec).
4. Once you have a high score, click **Save to Local** to keep the brain's progress.

## 🗺️ Roadmap

- [ ] Multi-snake parallel training.
- [ ] Neural network activation visualizer.
- [ ] Custom obstacle editor.
- [ ] Genetic Algorithm (GA) comparison mode.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---
Built with ❤️ by [Saptarshi Mukherjee](https://github.com/Sappymukherjee214)
