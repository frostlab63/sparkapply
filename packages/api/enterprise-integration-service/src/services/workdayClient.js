const axios = require("axios");

class WorkdayClient {
  constructor(credentials) {
    this.credentials = credentials;
    this.client = axios.create({
      baseURL: `https://${this.credentials.tenant}.workday.com/ccx/api/v1`,
      headers: {
        "Authorization": `Bearer ${this.credentials.accessToken}`
      }
    });
  }

  async getJobPostings() {
    const response = await this.client.get("/jobPostings");
    return response.data;
  }

  async getProspects() {
    const response = await this.client.get("/prospects");
    return response.data;
  }

  async getProspect(id) {
    const response = await this.client.get(`/prospects/${id}`);
    return response.data;
  }
}

module.exports = WorkdayClient;
