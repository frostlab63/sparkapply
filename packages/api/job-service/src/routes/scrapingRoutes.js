import express from 'express'
import {
  scrapeJobs,
  runFullScrape,
  getScrapingStatus,
  scheduleRegularScraping,
  clearOldJobs
} from '../controllers/scrapingController.js'

const router = express.Router()

// POST /api/scraping/jobs - Scrape jobs with specific parameters
router.post('/jobs', scrapeJobs)

// POST /api/scraping/full - Run comprehensive scraping across all sources
router.post('/full', runFullScrape)

// GET /api/scraping/status - Get current scraping status and statistics
router.get('/status', getScrapingStatus)

// POST /api/scraping/schedule - Schedule regular scraping
router.post('/schedule', scheduleRegularScraping)

// DELETE /api/scraping/cleanup - Clear old jobs from database
router.delete('/cleanup', clearOldJobs)

export default router
