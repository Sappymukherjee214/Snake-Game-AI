export type Point = { x: number; y: number };
export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
export const Direction = {
  UP: 'UP' as Direction,
  DOWN: 'DOWN' as Direction,
  LEFT: 'LEFT' as Direction,
  RIGHT: 'RIGHT' as Direction
} as const;

export interface GameState {
  snake: Point[];
  food: Point;
  direction: Direction;
  score: number;
  isGameOver: boolean;
  width: number;
  height: number;
}

export class SnakeGame {
  private width: number;
  private height: number;
  private snake: Point[];
  private food: Point;
  private direction: Direction;
  private score: number;
  private isGameOver: boolean;

  constructor(width: number = 20, height: number = 20) {
    this.width = width;
    this.height = height;
    this.reset();
  }

  reset() {
    this.snake = [
      { x: Math.floor(this.width / 2), y: Math.floor(this.height / 2) },
      { x: Math.floor(this.width / 2) - 1, y: Math.floor(this.height / 2) },
      { x: Math.floor(this.width / 2) - 2, y: Math.floor(this.height / 2) }
    ];
    this.direction = Direction.RIGHT;
    this.score = 0;
    this.isGameOver = false;
    this.spawnFood();
    return this.getGameState();
  }

  private spawnFood() {
    let newFood: Point;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * this.width),
        y: Math.floor(Math.random() * this.height)
      };
      // Check if food is on snake body
      const onBody = this.snake.some(p => p.x === newFood.x && p.y === newFood.y);
      if (!onBody) break;
    }
    this.food = newFood;
  }

  step(action: Direction): { state: GameState; reward: number; done: boolean } {
    if (this.isGameOver) return { state: this.getGameState(), reward: 0, done: true };

    // Prevent 180-degree turns
    const opposites: Record<string, Direction> = { 
      [Direction.UP]: Direction.DOWN, 
      [Direction.DOWN]: Direction.UP, 
      [Direction.LEFT]: Direction.RIGHT, 
      [Direction.RIGHT]: Direction.LEFT 
    };
    if (action !== opposites[this.direction]) {
      this.direction = action;
    }

    const head = { ...this.snake[0] };
    switch (this.direction) {
      case Direction.UP: head.y -= 1; break;
      case Direction.DOWN: head.y += 1; break;
      case Direction.LEFT: head.x -= 1; break;
      case Direction.RIGHT: head.x += 1; break;
    }

    // Check collisions
    if (
      head.x < 0 || head.x >= this.width ||
      head.y < 0 || head.y >= this.height ||
      this.snake.some(p => p.x === head.x && p.y === head.y)
    ) {
      this.isGameOver = true;
      return { state: this.getGameState(), reward: -100, done: true };
    }

    this.snake.unshift(head);

    let reward = -0.1; // Small penalty for each move
    const done = false;

    // Check if food eaten
    if (head.x === this.food.x && head.y === this.food.y) {
      this.score += 10;
      reward = 10;
      this.spawnFood();
    } else {
      this.snake.pop();
    }

    return { state: this.getGameState(), reward, done };
  }

  getGameState(): GameState {
    return {
      snake: [...this.snake],
      food: { ...this.food },
      direction: this.direction,
      score: this.score,
      isGameOver: this.isGameOver,
      width: this.width,
      height: this.height
    };
  }

  // Helper for RL: Get distance-based state vector
  getStateVector(): number[] {
    const head = this.snake[0];
    
    // Relative food position
    const foodUp = this.food.y < head.y ? 1 : 0;
    const foodDown = this.food.y > head.y ? 1 : 0;
    const foodLeft = this.food.x < head.x ? 1 : 0;
    const foodRight = this.food.x > head.x ? 1 : 0;

    // Danger proximity (immediate neighbors)
    const checkDanger = (x: number, y: number) => {
      if (x < 0 || x >= this.width || y < 0 || y >= this.height) return 1;
      return this.snake.some(p => p.x === x && p.y === y) ? 1 : 0;
    };

    const dangerUp = checkDanger(head.x, head.y - 1);
    const dangerDown = checkDanger(head.x, head.y + 1);
    const dangerLeft = checkDanger(head.x - 1, head.y);
    const dangerRight = checkDanger(head.x + 1, head.y);

    // Current direction
    const dirUp = this.direction === Direction.UP ? 1 : 0;
    const dirDown = this.direction === Direction.DOWN ? 1 : 0;
    const dirLeft = this.direction === Direction.LEFT ? 1 : 0;
    const dirRight = this.direction === Direction.RIGHT ? 1 : 0;

    return [
      foodUp, foodDown, foodLeft, foodRight,
      dangerUp, dangerDown, dangerLeft, dangerRight,
      dirUp, dirDown, dirLeft, dirRight
    ];
  }
}
