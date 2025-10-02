const tf = require("@tensorflow/tfjs-node");

class MachineLearningService {
  constructor() {
    this.model = null;
  }

  async loadModel() {
    // In a real application, you would load a pre-trained model
    // For now, we will create a simple sequential model
    this.model = tf.sequential();
    this.model.add(tf.layers.dense({ units: 10, inputShape: [5], activation: "relu" }));
    this.model.add(tf.layers.dense({ units: 1, activation: "sigmoid" }));
    this.model.compile({ optimizer: "sgd", loss: "binaryCrossentropy" });
  }

  async predict(data) {
    if (!this.model) {
      await this.loadModel();
    }
    const tensorData = tf.tensor2d(data, [data.length, 5]);
    const prediction = this.model.predict(tensorData);
    return prediction.array();
  }
}

module.exports = MachineLearningService;

