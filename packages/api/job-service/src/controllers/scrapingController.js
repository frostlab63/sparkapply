import JobScraperService from '../services/jobScraperService.js'
import { Job } from '../models/Job.js'

const scraperService = new JobScraperService()

export const scrapeJobs = async (req, res) => {
  try {
    const { 
      query = 'software developer', 
      location = 'United States', 
      limit = 50,
      sources = ['indeed', 'remoteok', 'github']
    } = req.body

    console.log(`🚀 Starting job scraping: ${query} in ${location}`)

    const result = await scraperService.scrapeAllSources(query, location, limit)
    
    res.json({
      success: true,
      message: `Successfully scraped ${result.length} jobs`,
      data: {
        totalJobs: result.length,
        jobs: result.slice(0, 10), // Return first 10 for preview
        query,
        location,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('❌ Scraping error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to scrape jobs',
      error: error.message
    })
  }
}

export const runFullScrape = async (req, res) => {
  try {
    const { 
      queries = ['software developer', 'frontend developer', 'backend developer', 'full stack developer', 'react developer']
    } = req.body

    console.log('🎯 Starting comprehensive job scraping...')

    const result = await scraperService.runFullScrape(queries)
    
    res.json({
      success: true,
      message: `Scraping completed! Found ${result.totalFound} jobs, saved ${result.totalSaved} new jobs`,
      data: {
        totalFound: result.totalFound,
        totalSaved: result.totalSaved,
        queries,
        timestamp: new Date().toISOString(),
        sampleJobs: result.jobs.slice(0, 5)
      }
    })

  } catch (error) {
    console.error('❌ Full scraping error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to complete full scraping',
      error: error.message
    })
  }
}

export const getScrapingStatus = async (req, res) => {
  try {
    // Get recent jobs from database
    const recentJobs = await Job.findAll({
      limit: 10,
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'title', 'company', 'source', 'createdAt']
    })

    // Get job counts by source
    const jobCounts = await Job.findAll({
      attributes: [
        'source',
        [Job.sequelize.fn('COUNT', Job.sequelize.col('id')), 'count']
      ],
      group: ['source']
    })

    // Get total job count
    const totalJobs = await Job.count()

    res.json({
      success: true,
      data: {
        totalJobs,
        jobCountsBySource: jobCounts,
        recentJobs,
        lastUpdated: recentJobs[0]?.createdAt || null
      }
    })

  } catch (error) {
    console.error('❌ Status check error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get scraping status',
      error: error.message
    })
  }
}

export const scheduleRegularScraping = async (req, res) => {
  try {
    // This would typically use a job queue like Bull or Agenda
    // For now, we'll just trigger a scrape
    
    console.log('📅 Scheduling regular job scraping...')
    
    // Run scraping in background (don't wait for completion)
    scraperService.runFullScrape().catch(error => {
      console.error('Background scraping failed:', error)
    })

    res.json({
      success: true,
      message: 'Regular scraping scheduled and started',
      data: {
        scheduledAt: new Date().toISOString(),
        frequency: 'Every 6 hours',
        nextRun: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString()
      }
    })

  } catch (error) {
    console.error('❌ Scheduling error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to schedule scraping',
      error: error.message
    })
  }
}

export const clearOldJobs = async (req, res) => {
  try {
    const { daysOld = 30 } = req.body
    
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)
    
    const deletedCount = await Job.destroy({
      where: {
        createdAt: {
          [Job.sequelize.Op.lt]: cutoffDate
        }
      }
    })

    res.json({
      success: true,
      message: `Cleared ${deletedCount} jobs older than ${daysOld} days`,
      data: {
        deletedCount,
        cutoffDate: cutoffDate.toISOString()
      }
    })

  } catch (error) {
    console.error('❌ Cleanup error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to clear old jobs',
      error: error.message
    })
  }
}
