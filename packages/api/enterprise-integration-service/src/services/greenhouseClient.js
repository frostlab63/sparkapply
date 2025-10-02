const axios = require("axios");

class GreenhouseClient {
  constructor(credentials) {
    this.credentials = credentials;
    this.client = axios.create({
      baseURL: "https://harvest.greenhouse.io/v1",
      auth: {
        username: this.credentials.apiKey,
        password: "",
      },
    });
  }

  async getJobs() {
    const response = await this.client.get("/jobs");
    return response.data;
  }

  async getCandidates() {
    const response = await this.client.get("/candidates");
    return response.data;
  }

  async getApplications() {
    const response = await this.client.get("/applications");
    return response.data;
  }
}

module.exports = GreenhouseClient;
