const SpeechToTextService = require("../services/speechToTextService");

const speechToTextService = new SpeechToTextService();

const search = async (req, res) => {
  try {
    const transcription = await speechToTextService.transcribe(req.file.buffer);
    // In a real application, you would use the transcription to search for jobs
    res.status(200).json({ transcription });
  } catch (error) {
    res.status(500).json({ message: "Error processing voice search", error: error.message });
  }
};

module.exports = {
  search,
};

