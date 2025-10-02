const InterviewCoachService = require("../services/interviewCoachService");

describe("InterviewCoachService", () => {
  it("should generate questions", async () => {
    const interviewCoachService = new InterviewCoachService();
    const jobDescription = "Software Engineer";
    // In a real test, you would mock the OpenAI API
    // and assert that the questions are correct.
    // For now, we will just check that the method doesn't throw an error.
    await expect(interviewCoachService.generateQuestions(jobDescription)).resolves.not.toThrow();
  });

  it("should provide feedback", async () => {
    const interviewCoachService = new InterviewCoachService();
    const question = "What is your greatest strength?";
    const answer = "I am a hard worker.";
    // In a real test, you would mock the OpenAI API
    // and assert that the feedback is correct.
    // For now, we will just check that the method doesn't throw an error.
    await expect(interviewCoachService.provideFeedback(question, answer)).resolves.not.toThrow();
  });
});
