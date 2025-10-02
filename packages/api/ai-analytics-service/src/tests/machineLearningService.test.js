const MachineLearningService = require("../services/machineLearningService");

describe("MachineLearningService", () => {
  it("should make a prediction", async () => {
    const machineLearningService = new MachineLearningService();
    const data = [[1, 2, 3, 4, 5]];
    const predictions = await machineLearningService.predict(data);
    expect(predictions).toBeDefined();
    expect(predictions.length).toBe(1);
  });
});

