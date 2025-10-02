const axios = require("axios");

class SAPSuccessFactorsClient {
  constructor(credentials) {
    this.credentials = credentials;
    this.client = axios.create({
      baseURL: `https://${this.credentials.api_url}/odata/v2`,
      headers: {
        "Authorization": `Bearer ${this.credentials.accessToken}`
      }
    });
  }

  async getEmployees() {
    const response = await this.client.get("/User");
    return response.data;
  }
}

module.exports = SAPSuccessFactorsClient;
