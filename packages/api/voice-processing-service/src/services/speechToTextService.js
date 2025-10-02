const speech = require('@google-cloud/speech');

class SpeechToTextService {
  constructor() {
    this.client = new speech.SpeechClient();
  }

  async transcribe(audio) {
    const audioBytes = audio.toString('base64');

    const request = {
      audio: {
        content: audioBytes,
      },
      config: {
        encoding: 'LINEAR16',
        sampleRateHertz: 16000,
        languageCode: 'en-US',
      },
    };

    const [response] = await this.client.recognize(request);
    const transcription = response.results
      .map(result => result.alternatives[0].transcript)
      .join('\n');
    return transcription;
  }
}

module.exports = SpeechToTextService;
