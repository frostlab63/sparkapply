const OpenAI = require("openai");

class InterviewCoachService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async generateQuestions(jobDescription) {
    const completion = await this.openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are an expert interview coach. Generate 5 interview questions based on the provided job description.",
        },
        {
          role: "user",
          content: jobDescription,
        },
      ],
      model: "gpt-4.1-mini",
    });

    return completion.choices[0].message.content;
  }

  async provideFeedback(question, answer) {
    const completion = await this.openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are an expert interview coach. Provide feedback on the user's answer to the interview question. Use the STAR method.",
        },
        {
          role: "user",
          content: `Question: ${question}\nAnswer: ${answer}`,
        },
      ],
      model: "gpt-4.1-mini",
    });

    return completion.choices[0].message.content;
  }
}

module.exports = InterviewCoachService;
