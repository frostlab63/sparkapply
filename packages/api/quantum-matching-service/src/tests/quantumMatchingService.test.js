const QuantumMatchingService = require("../services/quantumMatchingService");

describe("QuantumMatchingService", () => {
  it("should return a match score", async () => {
    const quantumMatchingService = new QuantumMatchingService();
    const candidate = { id: 1, skills: ["JavaScript", "React"] };
    const job = { id: 1, requirements: ["JavaScript", "React", "Node.js"] };
    const result = await quantumMatchingService.match(candidate, job);
    expect(result.matchScore).toBeDefined();
    expect(typeof result.matchScore).toBe("number");
  });
});
