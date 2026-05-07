import React, { useEffect, useRef, useState } from 'react';
import { SnakeGame, Direction } from './logic/SnakeGame';
import { DQNAgent } from './logic/DQNAgent';
import { Play, Pause, RotateCcw, Brain, Activity, Target, Zap, Save, Download, Upload } from 'lucide-react';

const GRID_SIZE = 15;
const ACTION_MAP: Direction[] = [Direction.UP, Direction.DOWN, Direction.LEFT, Direction.RIGHT];

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [game] = useState(() => new SnakeGame(GRID_SIZE, GRID_SIZE));
  const [agent] = useState(() => new DQNAgent(12)); // 12 features in state vector
  const [gameState, setGameState] = useState(game.getGameState());
  const [isPaused, setIsPaused] = useState(true);
  const [isTraining, setIsTraining] = useState(false);
  const [episode, setEpisode] = useState(0);
  const [totalReward, setTotalReward] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [epsilon, setEpsilon] = useState(1.0);
  const [speed, setSpeed] = useState(100);

  const requestRef = useRef<number | undefined>(undefined);
  const lastTimeRef = useRef<number>(0);

  // Training metrics
  const [history, setHistory] = useState<{ episode: number; score: number; reward: number }[]>([]);

  useEffect(() => {
    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const { snake, food, width } = game.getGameState();
      const cellSize = canvas.width / width;

      // Clear
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Vision (AI Sensors)
      const head = snake[0];
      const headCenterX = head.x * cellSize + cellSize / 2;
      const headCenterY = head.y * cellSize + cellSize / 2;

      // Line to Food
      ctx.beginPath();
      ctx.moveTo(headCenterX, headCenterY);
      ctx.lineTo(food.x * cellSize + cellSize / 2, food.y * cellSize + cellSize / 2);
      ctx.strokeStyle = 'rgba(244, 63, 94, 0.2)'; // Faint red
      ctx.lineWidth = 1;
      ctx.stroke();

      // Proximity Sensors (Danger)
      const directions = [
        { x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }
      ];
      directions.forEach(dir => {
        ctx.beginPath();
        ctx.moveTo(headCenterX, headCenterY);
        ctx.lineTo(
          headCenterX + dir.x * cellSize * 2, 
          headCenterY + dir.y * cellSize * 2
        );
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
        ctx.stroke();
      });

      // Draw Grid (Subtle)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= width; i++) {
        ctx.beginPath();
        ctx.moveTo(i * cellSize, 0);
        ctx.lineTo(i * cellSize, canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * cellSize);
        ctx.lineTo(canvas.width, i * cellSize);
        ctx.stroke();
      }

      // Draw Food
      ctx.fillStyle = '#f43f5e';
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#f43f5e';
      ctx.beginPath();
      ctx.arc(
        food.x * cellSize + cellSize / 2,
        food.y * cellSize + cellSize / 2,
        cellSize / 3,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.shadowBlur = 0;

      // Draw Snake
      snake.forEach((p, i) => {
        const isHead = i === 0;
        ctx.fillStyle = isHead ? '#38bdf8' : '#10b981';
        if (isHead) {
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#38bdf8';
        } else {
          ctx.shadowBlur = 0;
        }

        const padding = isHead ? 1 : 2;
        ctx.fillRect(
          p.x * cellSize + padding,
          p.y * cellSize + padding,
          cellSize - padding * 2,
          cellSize - padding * 2
        );
      });
      ctx.shadowBlur = 0;
    };

    const loop = async (time: number) => {
      if (!isPaused) {
        if (time - lastTimeRef.current >= speed) {
          const stateVector = game.getStateVector();
          const actionIdx = agent.act(stateVector);
          const action = ACTION_MAP[actionIdx];

          const { state, reward, done } = game.step(action);
          const nextStateVector = game.getStateVector();

          if (isTraining) {
            agent.remember(stateVector, actionIdx, reward, nextStateVector, done);
            await agent.train();
          }

          setTotalReward(prev => prev + reward);
          setGameState(state);

          if (done) {
            setEpisode(prev => prev + 1);
            setHistory(prev => [...prev.slice(-19), { episode, score: state.score, reward: totalReward }].slice(-20));
            if (state.score > bestScore) setBestScore(state.score);
            
            game.reset();
            setTotalReward(0);
            setEpsilon(agent.getEpsilon());
            
            if (episode % 10 === 0) {
              agent.updateTargetModel();
            }
          }
          
          lastTimeRef.current = time;
        }
      }
      draw();
      requestRef.current = requestAnimationFrame(loop);
    };

    requestRef.current = requestAnimationFrame(loop);

    // Imperative style update for progress bar to avoid inline styles
    if (progressBarRef.current) {
      progressBarRef.current.style.width = `${(1 - epsilon) * 100}%`;
    }

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [game, agent, isPaused, isTraining, speed, episode, totalReward, bestScore, epsilon]);

  const togglePause = () => setIsPaused(!isPaused);
  const toggleTraining = () => setIsTraining(!isTraining);
  const resetGame = () => {
    game.reset();
    setGameState(game.getGameState());
    setTotalReward(0);
  };

  return (
    <div className="dashboard">
      <div className="game-container">
        <div className="game-header">
          <h1>NeuralSnake AI</h1>
          <div className="score-badge">Score: {gameState.score}</div>
        </div>

        <div className="canvas-wrapper">
          <canvas ref={canvasRef} width={400} height={400} />
          {isPaused && (
            <div className="pause-overlay">
              <span className="pause-text">PAUSED</span>
            </div>
          )}
        </div>

        <div className="controls controls-main">
          <div className="controls-group">
            <button className="primary" onClick={togglePause}>
              {isPaused ? <Play size={20} /> : <Pause size={20} />}
              {isPaused ? 'Resume' : 'Pause'}
            </button>
            <button className="secondary" onClick={resetGame}>
              <RotateCcw size={20} />
              Reset
            </button>
          </div>

          <button className={`secondary training-btn ${isTraining ? 'active' : ''}`} 
                  onClick={toggleTraining}>
            <Brain size={20} />
            {isTraining ? 'Training ON' : 'Training OFF'}
          </button>
        </div>
      </div>

      <div className="stats-sidebar">
        <div className="stat-card">
          <div className="stat-label stat-header"><Activity size={14} /> Training Metrics</div>
          <div className="stat-value stat-metrics">
            <span>Ep. {episode}</span>
            <span className="epsilon-label">ε: {epsilon.toFixed(3)}</span>
          </div>
          <div className="progress-bar-container">
            <div 
              ref={progressBarRef}
              className="progress-bar" 
            ></div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label stat-header"><Target size={14} /> Best Score</div>
          <div className="stat-value">{bestScore}</div>
        </div>

        <div className="stat-card">
          <label htmlFor="speed-slider" className="stat-label stat-header">
            <Zap size={14} /> Simulation Speed
          </label>
          <input 
            id="speed-slider"
            type="range" 
            min="1" 
            max="200" 
            value={201 - speed} 
            onChange={(e) => setSpeed(201 - parseInt(e.target.value))}
            className="speed-slider"
          />
          <div className="speed-value-text">
            {speed === 1 ? 'MAX' : `${Math.round(1000 / speed)} steps/sec`}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label stat-header"><Save size={14} /> Brain Management</div>
          <div className="history-list">
            <button className="secondary brain-btn" onClick={() => agent.save()}>
              <Save size={14} /> Save to Local
            </button>
            <button className="secondary brain-btn" onClick={async () => {
              const success = await agent.load();
              if (success) {
                setEpsilon(agent.getEpsilon());
                alert('Brain Loaded!');
              } else {
                alert('No saved brain found.');
              }
            }}>
              <Upload size={14} /> Load from Local
            </button>
            <button className="secondary brain-btn" onClick={() => agent.export()}>
              <Download size={14} /> Export Files
            </button>
          </div>
        </div>

        <div className="stat-card history-container">
          <div className="stat-label">Recent History</div>
          <div className="history-list">
            {history.length === 0 && <div className="history-empty">No data yet...</div>}
            {history.slice(-5).reverse().map((h, i) => (
              <div key={i} className="history-item">
                <span>Ep {h.episode}</span>
                <span className={h.score > 0 ? 'score-positive' : 'score-neutral'}>
                  Score: {h.score}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
