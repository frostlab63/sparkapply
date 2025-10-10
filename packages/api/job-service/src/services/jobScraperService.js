import axios from 'axios'
import * as cheerio from 'cheerio'
import { Job } from '../models/Job.js'

class JobScraperService {
  constructor() {
    this.sources = [
      {
        name: 'Indeed',
        baseUrl: 'https://www.indeed.com',
        searchPath: '/jobs',
        enabled: true
      },
      {
        name: 'LinkedIn',
        baseUrl: 'https://www.linkedin.com',
        searchPath: '/jobs/search',
        enabled: true
      },
      {
        name: 'AngelList',
        baseUrl: 'https://angel.co',
        searchPath: '/jobs',
        enabled: true
      }
    ]
    
    this.userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    ]
  }

  getRandomUserAgent() {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)]
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  async scrapeIndeedJobs(query = 'software developer', location = 'United States', limit = 20) {
    try {
      console.log(`🔍 Scraping Indeed for: ${query} in ${location}`)
      
      const searchUrl = `https://www.indeed.com/jobs?q=${encodeURIComponent(query)}&l=${encodeURIComponent(location)}&limit=${limit}`
      
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': this.getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        },
        timeout: 10000
      })

      const $ = cheerio.load(response.data)
      const jobs = []

      // Indeed job card selectors (updated for current Indeed structure)
      $('.job_seen_beacon, .slider_container .slider_item, [data-jk]').each((index, element) => {
        try {
          const $job = $(element)
          
          const title = $job.find('h2 a span, .jobTitle a span, [data-testid="job-title"]').first().text().trim()
          const company = $job.find('.companyName a, .companyName span, [data-testid="company-name"]').first().text().trim()
          const location = $job.find('.companyLocation, [data-testid="job-location"]').first().text().trim()
          const salary = $job.find('.salary-snippet, .estimated-salary, [data-testid="job-salary"]').first().text().trim()
          const summary = $job.find('.job-snippet, .summary, [data-testid="job-snippet"]').first().text().trim()
          const jobKey = $job.attr('data-jk') || $job.find('a').attr('href')?.match(/jk=([^&]+)/)?.[1]
          
          if (title && company && title.length > 0 && company.length > 0) {
            jobs.push({
              title: title,
              company: company,
              location: location || 'Remote',
              salary: salary || 'Competitive',
              description: summary || 'No description available',
              source: 'Indeed',
              sourceId: jobKey || `indeed_${Date.now()}_${index}`,
              url: jobKey ? `https://www.indeed.com/viewjob?jk=${jobKey}` : null,
              type: 'Full-time',
              remote: location.toLowerCase().includes('remote'),
              requirements: this.extractRequirements(summary),
              benefits: [],
              companySize: 'Unknown',
              industry: this.guessIndustry(title, company),
              posted: 'Recently',
              match: Math.floor(Math.random() * 20) + 80 // Random match score 80-100
            })
          }
        } catch (error) {
          console.log(`Error parsing job ${index}:`, error.message)
        }
      })

      console.log(`✅ Scraped ${jobs.length} jobs from Indeed`)
      return jobs

    } catch (error) {
      console.error('❌ Error scraping Indeed:', error.message)
      return []
    }
  }

  async scrapeRemoteOkJobs(query = 'developer', limit = 20) {
    try {
      console.log(`🔍 Scraping RemoteOK for: ${query}`)
      
      // RemoteOK has an API endpoint
      const response = await axios.get('https://remoteok.io/api', {
        headers: {
          'User-Agent': this.getRandomUserAgent(),
          'Accept': 'application/json'
        },
        timeout: 10000
      })

      const data = response.data
      const jobs = []

      // Skip the first item (it's metadata)
      const jobData = Array.isArray(data) ? data.slice(1, limit + 1) : []

      jobData.forEach((job, index) => {
        try {
          if (job.position && job.company && 
              job.position.toLowerCase().includes(query.toLowerCase())) {
            
            jobs.push({
              title: job.position,
              company: job.company,
              location: job.location || 'Remote',
              salary: job.salary ? `$${job.salary}` : 'Competitive',
              description: job.description || 'Remote position available',
              source: 'RemoteOK',
              sourceId: job.id || `remoteok_${Date.now()}_${index}`,
              url: job.url || `https://remoteok.io/remote-jobs/${job.id}`,
              type: 'Full-time',
              remote: true,
              requirements: job.tags || [],
              benefits: ['Remote work', 'Flexible schedule'],
              companySize: 'Unknown',
              industry: this.guessIndustry(job.position, job.company),
              posted: job.date || 'Recently',
              match: Math.floor(Math.random() * 20) + 80
            })
          }
        } catch (error) {
          console.log(`Error parsing RemoteOK job ${index}:`, error.message)
        }
      })

      console.log(`✅ Scraped ${jobs.length} jobs from RemoteOK`)
      return jobs

    } catch (error) {
      console.error('❌ Error scraping RemoteOK:', error.message)
      return []
    }
  }

  async scrapeGitHubJobs(query = 'developer', limit = 20) {
    try {
      console.log(`🔍 Scraping GitHub Jobs for: ${query}`)
      
      // GitHub Jobs API alternative - using a job board that aggregates GitHub jobs
      const searchUrl = `https://jobs.github.com/positions.json?description=${encodeURIComponent(query)}&full_time=true`
      
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': this.getRandomUserAgent(),
          'Accept': 'application/json'
        },
        timeout: 10000
      })

      const jobData = response.data || []
      const jobs = []

      jobData.slice(0, limit).forEach((job, index) => {
        try {
          jobs.push({
            title: job.title,
            company: job.company,
            location: job.location || 'Remote',
            salary: 'Competitive',
            description: job.description ? job.description.substring(0, 200) + '...' : 'GitHub job opportunity',
            source: 'GitHub',
            sourceId: job.id || `github_${Date.now()}_${index}`,
            url: job.url || job.company_url,
            type: job.type || 'Full-time',
            remote: job.location?.toLowerCase().includes('remote') || false,
            requirements: this.extractRequirements(job.description),
            benefits: ['Open source', 'Tech-focused'],
            companySize: 'Unknown',
            industry: 'Technology',
            posted: job.created_at || 'Recently',
            match: Math.floor(Math.random() * 20) + 80
          })
        } catch (error) {
          console.log(`Error parsing GitHub job ${index}:`, error.message)
        }
      })

      console.log(`✅ Scraped ${jobs.length} jobs from GitHub`)
      return jobs

    } catch (error) {
      console.error('❌ Error scraping GitHub Jobs:', error.message)
      return []
    }
  }

  extractRequirements(description) {
    if (!description) return []
    
    const requirements = []
    const text = description.toLowerCase()
    
    // Common tech requirements
    const techKeywords = [
      'react', 'javascript', 'typescript', 'node.js', 'python', 'java',
      'aws', 'docker', 'kubernetes', 'sql', 'mongodb', 'postgresql',
      'git', 'agile', 'scrum', 'rest api', 'graphql', 'microservices'
    ]
    
    techKeywords.forEach(keyword => {
      if (text.includes(keyword)) {
        requirements.push(keyword.charAt(0).toUpperCase() + keyword.slice(1))
      }
    })
    
    // Experience requirements
    const expMatch = text.match(/(\d+)\+?\s*years?\s*(of\s*)?(experience|exp)/i)
    if (expMatch) {
      requirements.push(`${expMatch[1]}+ years experience`)
    }
    
    return requirements.slice(0, 5) // Limit to 5 requirements
  }

  guessIndustry(title, company) {
    const title_lower = title.toLowerCase()
    const company_lower = company.toLowerCase()
    
    if (title_lower.includes('fintech') || company_lower.includes('bank') || company_lower.includes('financial')) {
      return 'Fintech'
    }
    if (title_lower.includes('health') || company_lower.includes('health') || company_lower.includes('medical')) {
      return 'Healthcare'
    }
    if (title_lower.includes('ai') || title_lower.includes('ml') || title_lower.includes('machine learning')) {
      return 'AI/ML'
    }
    if (company_lower.includes('startup') || company_lower.includes('labs')) {
      return 'Startup'
    }
    
    return 'Technology'
  }

  async scrapeAllSources(query = 'software developer', location = 'United States', limit = 50) {
    console.log(`🚀 Starting comprehensive job scraping for: ${query}`)
    
    const allJobs = []
    const sources = [
      () => this.scrapeIndeedJobs(query, location, Math.floor(limit * 0.4)),
      () => this.scrapeRemoteOkJobs(query, Math.floor(limit * 0.3)),
      () => this.scrapeGitHubJobs(query, Math.floor(limit * 0.3))
    ]

    // Run scrapers with delays to avoid rate limiting
    for (const scraper of sources) {
      try {
        const jobs = await scraper()
        allJobs.push(...jobs)
        await this.delay(2000) // 2 second delay between sources
      } catch (error) {
        console.error('Error with scraper:', error.message)
      }
    }

    // Remove duplicates based on title and company
    const uniqueJobs = this.removeDuplicates(allJobs)
    
    console.log(`✅ Total unique jobs scraped: ${uniqueJobs.length}`)
    return uniqueJobs
  }

  removeDuplicates(jobs) {
    const seen = new Set()
    return jobs.filter(job => {
      const key = `${job.title.toLowerCase()}_${job.company.toLowerCase()}`
      if (seen.has(key)) {
        return false
      }
      seen.add(key)
      return true
    })
  }

  async saveJobsToDatabase(jobs) {
    console.log(`💾 Saving ${jobs.length} jobs to database...`)
    
    let savedCount = 0
    for (const jobData of jobs) {
      try {
        // Check if job already exists
        const existingJob = await Job.findOne({
          where: {
            sourceId: jobData.sourceId,
            source: jobData.source
          }
        })

        if (!existingJob) {
          await Job.create({
            ...jobData,
            requirements: JSON.stringify(jobData.requirements),
            benefits: JSON.stringify(jobData.benefits),
            createdAt: new Date(),
            updatedAt: new Date()
          })
          savedCount++
        }
      } catch (error) {
        console.error(`Error saving job ${jobData.title}:`, error.message)
      }
    }

    console.log(`✅ Saved ${savedCount} new jobs to database`)
    return savedCount
  }

  async runFullScrape(queries = ['software developer', 'frontend developer', 'backend developer', 'full stack developer']) {
    console.log('🎯 Starting full job scraping process...')
    
    let totalJobs = []
    
    for (const query of queries) {
      console.log(`\n📋 Scraping for: ${query}`)
      const jobs = await this.scrapeAllSources(query, 'United States', 20)
      totalJobs.push(...jobs)
      
      // Delay between different queries
      await this.delay(3000)
    }

    // Remove duplicates across all queries
    const uniqueJobs = this.removeDuplicates(totalJobs)
    
    // Save to database
    const savedCount = await this.saveJobsToDatabase(uniqueJobs)
    
    console.log(`\n🎉 Scraping complete! Total jobs found: ${uniqueJobs.length}, Saved: ${savedCount}`)
    
    return {
      totalFound: uniqueJobs.length,
      totalSaved: savedCount,
      jobs: uniqueJobs
    }
  }
}

export default JobScraperService
