class ATSIntegration {
  constructor(platform, credentials) {
    this.platform = platform;
    this.client = this.createClient(platform, credentials);
    this.mapper = new DataMapper(platform);
    this.sync = new SyncEngine(platform);
  }

  createClient(platform, credentials) {
    // Logic to create a client for the specified ATS platform
    // This will be implemented in a separate file for each platform
        if (platform === "workday") {
      const WorkdayClient = require("./workdayClient");
      return new WorkdayClient(credentials);
    }
    if (platform === "bamboohr") {
      const BambooHRClient = require("./bambooHRClient");
      return new BambooHRClient(credentials);
    }
    if (platform === "greenhouse") {
      const GreenhouseClient = require("./greenhouseClient");
      return new GreenhouseClient(credentials);
    }
    return null;
  }

  async syncCandidates(options = {}) {
    const candidates = await this.client.getCandidates(options);
    const mapped = this.mapper.mapCandidates(candidates);
    return await this.sync.syncData("candidates", mapped);
  }

  async syncJobs(options = {}) {
    const jobs = await this.client.getJobs(options);
    const mapped = this.mapper.mapJobs(jobs);
    return await this.sync.syncData("jobs", mapped);
  }

  async syncApplications(options = {}) {
    const applications = await this.client.getApplications(options);
    const mapped = this.mapper.mapApplications(applications);
    return await this.sync.syncData("applications", mapped);
  }
}

module.exports = ATSIntegration;

