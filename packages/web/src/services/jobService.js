const API_BASE_URL = 'http://localhost:3002'

class JobService {
  async fetchJobs(params = {}) {
    try {
      const queryParams = new URLSearchParams({
        page: params.page || 1,
        limit: params.limit || 20,
        ...(params.search && { search: params.search }),
        ...(params.location && { location: params.location }),
        ...(params.remote_type && { remote_type: params.remote_type }),
        ...(params.experience_level && { experience_level: params.experience_level })
      })

      const response = await fetch(`${API_BASE_URL}/api/jobs?${queryParams}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.success) {
        return {
          jobs: this.transformJobs(data.data),
          pagination: data.pagination
        }
      } else {
        throw new Error(data.error || 'Failed to fetch jobs')
      }
    } catch (error) {
      console.error('Error fetching jobs:', error)
      throw error
    }
  }

  async fetchJobById(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/jobs/${id}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.success) {
        return this.transformJob(data.data)
      } else {
        throw new Error(data.error || 'Failed to fetch job')
      }
    } catch (error) {
      console.error('Error fetching job:', error)
      throw error
    }
  }

  async triggerJobScraping() {
    try {
      console.log('🚀 Triggering job scraping...')
      
      const response = await fetch(`${API_BASE_URL}/api/scraping/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: 'software developer',
          location: 'United States'
        })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('✅ Scraping completed:', data)
      
      return data
    } catch (error) {
      console.error('Error triggering scraping:', error)
      throw error
    }
  }

  async getScrapingStatus() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/scraping/status`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error getting scraping status:', error)
      throw error
    }
  }

  transformJobs(jobs) {
    return jobs.map(job => this.transformJob(job))
  }

  transformJob(job) {
    return {
      id: job.id,
      title: job.title,
      company: job.company_name,
      location: job.location,
      salary: this.formatSalary(job.salary_min, job.salary_max, job.salary_currency),
      type: this.formatEmploymentType(job.employment_type),
      remote: job.remote_type === 'remote',
      description: job.description || 'No description available',
      requirements: Array.isArray(job.skills) ? job.skills : (job.skills ? [job.skills] : []),
      benefits: job.benefits ? (typeof job.benefits === 'string' ? [job.benefits] : job.benefits) : [],
      companySize: 'Unknown',
      industry: this.guessIndustry(job.title, job.company_name),
      posted: this.formatDate(job.posted_date || job.created_at),
      logo: this.generateCompanyLogo(job.company_name),
      match: Math.floor(Math.random() * 20) + 80, // Random match score for now
      source: job.source || 'Database',
      sourceUrl: job.source_url
    }
  }

  formatSalary(min, max, currency = 'USD') {
    if (!min && !max) return 'Competitive'
    
    const formatNumber = (num) => {
      if (num >= 1000) {
        return `$${(num / 1000).toFixed(0)}k`
      }
      return `$${num.toLocaleString()}`
    }
    
    if (min && max) {
      return `${formatNumber(min)} - ${formatNumber(max)}`
    } else if (min) {
      return `${formatNumber(min)}+`
    } else if (max) {
      return `Up to ${formatNumber(max)}`
    }
    
    return 'Competitive'
  }

  formatEmploymentType(type) {
    const typeMap = {
      'full_time': 'Full-time',
      'part_time': 'Part-time',
      'contract': 'Contract',
      'internship': 'Internship'
    }
    return typeMap[type] || 'Full-time'
  }

  formatDate(dateString) {
    if (!dateString) return 'Recently'
    
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now - date)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return '1 day ago'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
    
    return 'Over a year ago'
  }

  generateCompanyLogo(companyName) {
    if (!companyName) return 'https://via.placeholder.com/60x60/4F46E5/white?text=?'
    
    const colors = [
      '4F46E5', '10B981', 'F59E0B', '8B5CF6', 'EF4444',
      '06B6D4', 'F97316', '84CC16', 'EC4899', '6366F1'
    ]
    
    const colorIndex = companyName.length % colors.length
    const color = colors[colorIndex]
    const initials = companyName.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase()
    
    return `https://via.placeholder.com/60x60/${color}/white?text=${initials}`
  }

  guessIndustry(title, company) {
    const titleLower = title.toLowerCase()
    const companyLower = company.toLowerCase()
    
    if (titleLower.includes('fintech') || companyLower.includes('bank') || companyLower.includes('financial')) {
      return 'Fintech'
    }
    if (titleLower.includes('health') || companyLower.includes('health') || companyLower.includes('medical')) {
      return 'Healthcare'
    }
    if (titleLower.includes('ai') || titleLower.includes('ml') || titleLower.includes('machine learning')) {
      return 'AI/ML'
    }
    if (companyLower.includes('startup') || companyLower.includes('labs')) {
      return 'Startup'
    }
    
    return 'Technology'
  }

  // Method to ensure we have jobs available
  async ensureJobsAvailable() {
    try {
      // First check if we have jobs
      const jobsResponse = await this.fetchJobs({ limit: 5 })
      
      if (jobsResponse.jobs.length === 0) {
        console.log('No jobs found, triggering scraping...')
        await this.triggerJobScraping()
        
        // Wait a moment for scraping to complete
        await new Promise(resolve => setTimeout(resolve, 3000))
        
        // Try fetching again
        return await this.fetchJobs({ limit: 20 })
      }
      
      return jobsResponse
    } catch (error) {
      console.error('Error ensuring jobs available:', error)
      throw error
    }
  }
}

export default new JobService()
