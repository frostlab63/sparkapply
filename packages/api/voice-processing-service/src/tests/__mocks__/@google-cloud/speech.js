module.exports = {
  SpeechClient: jest.fn(() => ({
    recognize: jest.fn(() => [
      {
        results: [
          {
            alternatives: [{ transcript: "This is a test transcription." }],
          },
        ],
      },
    ]),
  })),
};
