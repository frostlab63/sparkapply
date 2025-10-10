const axios = require('axios');

class RealJobService {
  constructor() {
    this.sources = {
      remoteok: 'https://remoteok.io/api',
      github: 'https://jobs.github.com/positions.json',
      adzuna: 'https://api.adzuna.com/v1/api/jobs',
      usajobs: 'https://data.usajobs.gov/api/search'
    };
  }

  async fetchRemoteOkJobs(limit = 20) {
    try {
      console.log('🔍 Fetching jobs from RemoteOK...');
      
      const response = await axios.get(this.sources.remoteok, {
        headers: {
          'User-Agent': 'SparkApply Job Aggregator (contact@sparkapply.com)'
        },
        timeout: 10000
      });

      const jobs = response.data.slice(1, limit + 1); // Skip first item (metadata)
      
      return jobs.map(job => ({
        title: job.position || 'Software Developer',
        company_name: job.company || 'Remote Company',
        location: job.location || 'Remote',
        salary_min: job.salary_min || 60000,
        salary_max: job.salary_max || 120000,
        description: job.description || 'Remote position available',
        remote_type: 'remote',
        employment_type: 'full_time',
        experience_level: this.guessExperienceLevel(job.position),
        skills: job.tags || ['JavaScript', 'React'],
        is_active: true,
        posted_date: new Date(job.date || Date.now()),
        source: 'RemoteOK',
        source_url: job.url
      }));

    } catch (error) {
      console.error('Error fetching RemoteOK jobs:', error.message);
      return [];
    }
  }

  async fetchGitHubJobs(query = 'developer', limit = 20) {
    try {
      console.log('🔍 Fetching jobs from GitHub...');
      
      const response = await axios.get(this.sources.github, {
        params: {
          description: query,
          full_time: true,
          limit: limit
        },
        headers: {
          'User-Agent': 'SparkApply Job Aggregator'
        },
        timeout: 10000
      });

      return response.data.map(job => ({
        title: job.title,
        company_name: job.company,
        location: job.location || 'Remote',
        salary_min: 70000,
        salary_max: 130000,
        description: this.cleanDescription(job.description),
        remote_type: job.location?.toLowerCase().includes('remote') ? 'remote' : 'on_site',
        employment_type: job.type?.toLowerCase().replace(' ', '_') || 'full_time',
        experience_level: this.guessExperienceLevel(job.title),
        skills: this.extractSkills(job.description),
        is_active: true,
        posted_date: new Date(job.created_at),
        source: 'GitHub',
        source_url: job.url
      }));

    } catch (error) {
      console.error('Error fetching GitHub jobs:', error.message);
      return [];
    }
  }

  async generateSampleJobs() {
    console.log('🎯 Generating realistic sample jobs...');
    
    const companies = [
      'TechCorp', 'InnovateLabs', 'StartupXYZ', 'DigitalSolutions', 'CloudTech',
      'DataDriven Inc', 'AI Innovations', 'WebCraft', 'CodeFactory', 'DevStudio'
    ];
    
    const titles = [
      'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
      'React Developer', 'Node.js Developer', 'Python Developer',
      'Software Engineer', 'Senior Developer', 'Lead Developer',
      'DevOps Engineer', 'Data Scientist', 'Product Manager'
    ];
    
    const locations = [
      'San Francisco, CA', 'New York, NY', 'Austin, TX', 'Seattle, WA',
      'Boston, MA', 'Denver, CO', 'Remote', 'Chicago, IL', 'Los Angeles, CA'
    ];
    
    const skills = [
      ['JavaScript', 'React', 'Node.js'],
      ['Python', 'Django', 'PostgreSQL'],
      ['Java', 'Spring', 'MySQL'],
      ['TypeScript', 'Angular', 'MongoDB'],
      ['Vue.js', 'Express', 'Redis'],
      ['React Native', 'iOS', 'Android'],
      ['AWS', 'Docker', 'Kubernetes'],
      ['GraphQL', 'Apollo', 'Prisma']
    ];

    const jobs = [];
    
    for (let i = 0; i < 25; i++) {
      const company = companies[Math.floor(Math.random() * companies.length)];
      const title = titles[Math.floor(Math.random() * titles.length)];
      const location = locations[Math.floor(Math.random() * locations.length)];
      const skillSet = skills[Math.floor(Math.random() * skills.length)];
      
      jobs.push({
        title: title,
        company_name: company,
        location: location,
        salary_min: 60000 + Math.floor(Math.random() * 40000),
        salary_max: 100000 + Math.floor(Math.random() * 80000),
        description: `Join ${company} as a ${title}. We're looking for talented developers to build amazing products. Work with modern technologies and a great team.`,
        remote_type: location === 'Remote' ? 'remote' : Math.random() > 0.5 ? 'hybrid' : 'on_site',
        employment_type: 'full_time',
        experience_level: ['entry', 'mid', 'senior'][Math.floor(Math.random() * 3)],
        skills: skillSet,
        is_active: true,
        posted_date: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)), // Random date within last week
        source: 'Generated',
        source_url: null
      });
    }
    
    return jobs;
  }

  async fetchAllJobs() {
    console.log('🚀 Fetching jobs from all sources...');
    
    const allJobs = [];
    
    try {
      // Try to fetch from real APIs
      const remoteOkJobs = await this.fetchRemoteOkJobs(15);
      allJobs.push(...remoteOkJobs);
      
      await this.delay(1000); // Rate limiting
      
      const githubJobs = await this.fetchGitHubJobs('developer', 10);
      allJobs.push(...githubJobs);
      
    } catch (error) {
      console.log('Real APIs failed, using generated jobs');
    }
    
    // Always add some generated jobs to ensure we have content
    const generatedJobs = await this.generateSampleJobs();
    allJobs.push(...generatedJobs);
    
    // Remove duplicates and limit
    const uniqueJobs = this.removeDuplicates(allJobs);
    
    console.log(`✅ Total jobs collected: ${uniqueJobs.length}`);
    return uniqueJobs.slice(0, 50); // Limit to 50 jobs
  }

  guessExperienceLevel(title) {
    const titleLower = title.toLowerCase();
    if (titleLower.includes('senior') || titleLower.includes('lead') || titleLower.includes('principal')) {
      return 'senior';
    }
    if (titleLower.includes('junior') || titleLower.includes('entry') || titleLower.includes('intern')) {
      return 'entry';
    }
    return 'mid';
  }

  extractSkills(description) {
    if (!description) return ['JavaScript', 'React'];
    
    const skills = [];
    const techKeywords = [
      'JavaScript', 'TypeScript', 'React', 'Vue', 'Angular', 'Node.js',
      'Python', 'Java', 'C++', 'Go', 'Rust', 'PHP', 'Ruby',
      'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes',
      'MongoDB', 'PostgreSQL', 'MySQL', 'Redis',
      'GraphQL', 'REST', 'API', 'Microservices'
    ];
    
    techKeywords.forEach(keyword => {
      if (description.toLowerCase().includes(keyword.toLowerCase())) {
        skills.push(keyword);
      }
    });
    
    return skills.length > 0 ? skills.slice(0, 5) : ['JavaScript', 'React'];
  }

  cleanDescription(description) {
    if (!description) return 'Great opportunity to work with modern technologies';
    
    // Remove HTML tags and limit length
    const cleaned = description.replace(/<[^>]*>/g, '').substring(0, 300);
    return cleaned + (cleaned.length === 300 ? '...' : '');
  }

  removeDuplicates(jobs) {
    const seen = new Set();
    return jobs.filter(job => {
      const key = `${job.title.toLowerCase()}_${job.company_name.toLowerCase()}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = RealJobService;
