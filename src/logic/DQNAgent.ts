import * as tf from '@tensorflow/tfjs';

interface Experience {
  state: number[];
  action: number;
  reward: number;
  nextState: number[];
  done: boolean;
}

export class DQNAgent {
  private model: tf.LayersModel;
  private targetModel: tf.LayersModel;
  private memory: Experience[] = [];
  private maxMemorySize: number = 10000;
  private batchSize: number = 64;
  private gamma: number = 0.95; // Discount factor
  private epsilon: number = 1.0; // Exploration rate
  private epsilonMin: number = 0.01;
  private epsilonDecay: number = 0.995;
  private learningRate: number = 0.001;
  private stateSize: number;
  private actionSize: number = 4;

  constructor(stateSize: number) {
    this.stateSize = stateSize;
    this.model = this.createModel();
    this.targetModel = this.createModel();
    this.updateTargetModel();
  }

  private createModel(): tf.LayersModel {
    const model = tf.sequential();
    model.add(tf.layers.dense({
      units: 64,
      activation: 'relu',
      inputShape: [this.stateSize]
    }));
    model.add(tf.layers.dense({
      units: 64,
      activation: 'relu'
    }));
    model.add(tf.layers.dense({
      units: this.actionSize,
      activation: 'linear'
    }));
    model.compile({
      optimizer: tf.train.adam(this.learningRate),
      loss: 'meanSquaredError'
    });
    return model;
  }

  updateTargetModel() {
    this.targetModel.setWeights(this.model.getWeights());
  }

  remember(state: number[], action: number, reward: number, nextState: number[], done: boolean) {
    this.memory.push({ state, action, reward, nextState, done });
    if (this.memory.length > this.maxMemorySize) {
      this.memory.shift();
    }
  }

  act(state: number[]): number {
    if (Math.random() <= this.epsilon) {
      return Math.floor(Math.random() * this.actionSize);
    }
    return tf.tidy(() => {
      const stateTensor = tf.tensor2d([state]);
      const prediction = this.model.predict(stateTensor) as tf.Tensor;
      return prediction.argMax(1).dataSync()[0];
    });
  }

  async train() {
    if (this.memory.length < this.batchSize) return;

    const batch = this.sampleBatch();
    const states = batch.map(e => e.state);
    const nextStates = batch.map(e => e.nextState);

    const statesTensor = tf.tensor2d(states);
    const nextStatesTensor = tf.tensor2d(nextStates);

    const currentQ = this.model.predict(statesTensor) as tf.Tensor;
    const nextQ = this.targetModel.predict(nextStatesTensor) as tf.Tensor;

    const currentQData = await currentQ.data();
    const nextQData = await nextQ.data();

    const targetQData = new Float32Array(currentQData);

    for (let i = 0; i < this.batchSize; i++) {
      const { action, reward, done } = batch[i];
      let target = reward;
      if (!done) {
        const maxNextQ = Math.max(...nextQData.slice(i * 4, (i + 1) * 4));
        target = reward + this.gamma * maxNextQ;
      }
      targetQData[i * 4 + action] = target;
    }

    const targetQ = tf.tensor2d(targetQData, [this.batchSize, 4]);

    await this.model.fit(statesTensor, targetQ, {
      epochs: 1,
      verbose: 0
    });

    if (this.epsilon > this.epsilonMin) {
      this.epsilon *= this.epsilonDecay;
    }

    statesTensor.dispose();
    nextStatesTensor.dispose();
    currentQ.dispose();
    nextQ.dispose();
    targetQ.dispose();
  }

  private sampleBatch() {
    const indices = [];
    for (let i = 0; i < this.batchSize; i++) {
      indices.push(Math.floor(Math.random() * this.memory.length));
    }
    return indices.map(i => this.memory[i]);
  }

  async save() {
    await this.model.save('localstorage://snake-ai-model');
    console.log('Model saved to local storage');
  }

  async load() {
    try {
      this.model = await tf.loadLayersModel('localstorage://snake-ai-model');
      this.model.compile({
        optimizer: tf.train.adam(this.learningRate),
        loss: 'meanSquaredError'
      });
      this.updateTargetModel();
      console.log('Model loaded from local storage');
      return true;
    } catch (e) {
      console.error('Failed to load model:', e);
      return false;
    }
  }

  async export() {
    await this.model.save('downloads://snake-ai-model');
  }

  getEpsilon() {
    return this.epsilon;
  }
}
