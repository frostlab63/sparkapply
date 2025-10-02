const axios = require("axios");

class BambooHRClient {
  constructor(credentials) {
    this.credentials = credentials;
    this.client = axios.create({
      baseURL: `https://api.bamboohr.com/api/gateway.php/${this.credentials.subdomain}/v1`,
      auth: {
        username: this.credentials.apiKey,
        password: "x",
      },
    });
  }

  async getJobs() {
    const response = await this.client.get("/jobs/summary");
    return response.data;
  }

  async getApplications(jobId) {
    const response = await this.client.get(`/jobs/${jobId}/applications`);
    return response.data;
  }

  async addCandidate(jobId, candidateData) {
    const response = await this.client.post(`/jobs/${jobId}/applications`, candidateData);
    return response.data;
  }
}

module.exports = BambooHRClient;
