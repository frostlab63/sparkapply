jest.mock("@google-cloud/speech");
const SpeechToTextService = require("../services/speechToTextService");

describe("SpeechToTextService", () => {
  it("should transcribe audio", async () => {
    const speechToTextService = new SpeechToTextService();
    // This is a mock audio buffer
    const audio = Buffer.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    // In a real test, you would mock the Google Cloud Speech API
    // and assert that the transcription is correct.
    // For now, we will just check that the method doesn't throw an error.
    const transcription = await speechToTextService.transcribe(audio);
    expect(transcription).toBe("This is a test transcription.");
  });
});
