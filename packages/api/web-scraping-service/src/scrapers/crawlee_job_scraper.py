"""
Primary job scraper using Crawlee Python framework.
Designed for robust, scalable job board scraping with anti-detection capabilities.
"""

import asyncio
import json
import re
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from urllib.parse import urljoin, urlparse

from crawlee import PlaywrightCrawler, Router
from crawlee.storages import Dataset
from crawlee.playwright_crawler import PlaywrightCrawlingContext
from pydantic import BaseModel, Field
from loguru import logger

from ..config.scraper_config import ScraperConfig
from ..utils.data_processor import JobDataProcessor
from ..utils.job_normalizer import JobNormalizer
from ..services.database_service import DatabaseService


class JobData(BaseModel):
    """Structured job data model"""
    title: str
    company: str
    location: Optional[str] = None
    remote_type: str = "on_site"
    employment_type: str = "full_time"
    experience_level: str = "mid"
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    salary_currency: str = "USD"
    description: Optional[str] = None
    requirements: Optional[str] = None
    benefits: Optional[str] = None
    skills: List[str] = Field(default_factory=list)
    categories: List[str] = Field(default_factory=list)
    source: str
    source_url: str
    posted_date: Optional[datetime] = None
    expires_date: Optional[datetime] = None
    external_id: Optional[str] = None
    quality_score: float = 0.0


class CrawleeJobScraper:
    """
    Primary job scraper using Crawlee Python framework.
    Handles multiple job boards with intelligent routing and data extraction.
    """
    
    def __init__(self, config: ScraperConfig):
        self.config = config
        self.router = Router()
        self.data_processor = JobDataProcessor()
        self.job_normalizer = JobNormalizer()
        self.database_service = DatabaseService()
        
        # Initialize crawler with anti-detection settings
        self.crawler = PlaywrightCrawler(
            max_requests_per_crawl=config.max_requests_per_crawl,
            headless=config.headless,
            browser_type=config.browser_type,
            request_handler_timeout=timedelta(seconds=config.request_timeout),
            max_request_retries=config.max_retries,
            use_session_pool=True,
            session_pool_size=config.session_pool_size,
            persist_cookies_per_session=True,
        )
        
        # Set up routing
        self._setup_routes()
        
        logger.info(f"Initialized CrawleeJobScraper with config: {config.dict()}")
    
    def _setup_routes(self):
        """Set up URL routing for different job boards"""
        
        @self.router.handler('linkedin_jobs')
        async def linkedin_handler(context: PlaywrightCrawlingContext):
            await self._handle_linkedin_jobs(context)
        
        @self.router.handler('linkedin_job_detail')
        async def linkedin_detail_handler(context: PlaywrightCrawlingContext):
            await self._handle_linkedin_job_detail(context)
        
        @self.router.handler('indeed_jobs')
        async def indeed_handler(context: PlaywrightCrawlingContext):
            await self._handle_indeed_jobs(context)
        
        @self.router.handler('indeed_job_detail')
        async def indeed_detail_handler(context: PlaywrightCrawlingContext):
            await self._handle_indeed_job_detail(context)
        
        @self.router.handler('glassdoor_jobs')
        async def glassdoor_handler(context: PlaywrightCrawlingContext):
            await self._handle_glassdoor_jobs(context)
        
        @self.router.handler('glassdoor_job_detail')
        async def glassdoor_detail_handler(context: PlaywrightCrawlingContext):
            await self._handle_glassdoor_job_detail(context)
        
        @self.router.default_handler
        async def default_handler(context: PlaywrightCrawlingContext):
            await self._handle_generic_job_page(context)
    
    async def scrape_job_board(self, board_name: str, search_params: Dict[str, Any]) -> List[JobData]:
        """
        Scrape jobs from a specific job board
        
        Args:
            board_name: Name of the job board (linkedin, indeed, glassdoor, etc.)
            search_params: Search parameters (keywords, location, etc.)
        
        Returns:
            List of scraped job data
        """
        try:
            logger.info(f"Starting scrape for {board_name} with params: {search_params}")
            
            # Generate search URLs based on board and parameters
            search_urls = self._generate_search_urls(board_name, search_params)
            
            if not search_urls:
                logger.warning(f"No search URLs generated for {board_name}")
                return []
            
            # Run the crawler
            await self.crawler.run(search_urls)
            
            # Get scraped data from dataset
            dataset = await Dataset.open()
            scraped_data = []
            
            async for item in dataset.iterate_items():
                try:
                    job_data = JobData(**item)
                    scraped_data.append(job_data)
                except Exception as e:
                    logger.error(f"Error parsing job data: {e}")
                    continue
            
            logger.info(f"Scraped {len(scraped_data)} jobs from {board_name}")
            return scraped_data
            
        except Exception as e:
            logger.error(f"Error scraping {board_name}: {e}")
            return []
    
    def _generate_search_urls(self, board_name: str, search_params: Dict[str, Any]) -> List[str]:
        """Generate search URLs for different job boards"""
        
        keywords = search_params.get('keywords', '')
        location = search_params.get('location', '')
        experience_level = search_params.get('experience_level', '')
        job_type = search_params.get('job_type', '')
        
        urls = []
        
        if board_name == 'linkedin':
            base_url = "https://www.linkedin.com/jobs/search"
            params = []
            
            if keywords:
                params.append(f"keywords={keywords.replace(' ', '%20')}")
            if location:
                params.append(f"location={location.replace(' ', '%20')}")
            if experience_level:
                exp_map = {'entry': '1', 'mid': '2', 'senior': '3', 'executive': '4'}
                if experience_level in exp_map:
                    params.append(f"f_E={exp_map[experience_level]}")
            
            url = f"{base_url}?{'&'.join(params)}" if params else base_url
            urls.append(url)
            
        elif board_name == 'indeed':
            base_url = "https://www.indeed.com/jobs"
            params = []
            
            if keywords:
                params.append(f"q={keywords.replace(' ', '+')}")
            if location:
                params.append(f"l={location.replace(' ', '+')}")
            
            url = f"{base_url}?{'&'.join(params)}" if params else base_url
            urls.append(url)
            
        elif board_name == 'glassdoor':
            base_url = "https://www.glassdoor.com/Job/jobs.htm"
            params = []
            
            if keywords:
                params.append(f"sc.keyword={keywords.replace(' ', '%20')}")
            if location:
                params.append(f"locT=C&locId={location.replace(' ', '%20')}")
            
            url = f"{base_url}?{'&'.join(params)}" if params else base_url
            urls.append(url)
        
        return urls
    
    async def _handle_linkedin_jobs(self, context: PlaywrightCrawlingContext):
        """Handle LinkedIn job listing pages"""
        try:
            logger.info(f"Processing LinkedIn jobs page: {context.request.url}")
            
            # Wait for job listings to load
            await context.page.wait_for_selector('.jobs-search__results-list', timeout=10000)
            
            # Extract job listing URLs
            job_links = await context.page.locator('.jobs-search__results-list li .base-card__full-link').all()
            
            for link in job_links[:self.config.max_jobs_per_page]:
                href = await link.get_attribute('href')
                if href:
                    full_url = urljoin(context.request.url, href)
                    await context.add_requests([{
                        'url': full_url,
                        'label': 'linkedin_job_detail'
                    }])
            
            # Look for pagination
            next_button = context.page.locator('[aria-label="Next"]')
            if await next_button.count() > 0 and await next_button.is_enabled():
                next_url = await next_button.get_attribute('href')
                if next_url:
                    await context.add_requests([{
                        'url': urljoin(context.request.url, next_url),
                        'label': 'linkedin_jobs'
                    }])
                    
        except Exception as e:
            logger.error(f"Error processing LinkedIn jobs page: {e}")
    
    async def _handle_linkedin_job_detail(self, context: PlaywrightCrawlingContext):
        """Handle LinkedIn job detail pages"""
        try:
            logger.info(f"Processing LinkedIn job detail: {context.request.url}")
            
            # Wait for job details to load
            await context.page.wait_for_selector('.top-card-layout__entity-info', timeout=10000)
            
            # Extract job data
            title_elem = context.page.locator('.top-card-layout__title')
            company_elem = context.page.locator('.topcard__flavor a')
            location_elem = context.page.locator('.topcard__flavor--bullet')
            description_elem = context.page.locator('.show-more-less-html__markup')
            
            title = await title_elem.text_content() if await title_elem.count() > 0 else ""
            company = await company_elem.text_content() if await company_elem.count() > 0 else ""
            location = await location_elem.text_content() if await location_elem.count() > 0 else ""
            description = await description_elem.text_content() if await description_elem.count() > 0 else ""
            
            # Clean and normalize data
            title = re.sub(r'\s+', ' ', title.strip())
            company = re.sub(r'\s+', ' ', company.strip())
            location = re.sub(r'\s+', ' ', location.strip())
            description = re.sub(r'\s+', ' ', description.strip())
            
            # Extract additional details
            job_data = JobData(
                title=title,
                company=company,
                location=location,
                description=description,
                source="linkedin",
                source_url=context.request.url,
                external_id=self._extract_linkedin_job_id(context.request.url),
                posted_date=datetime.now(),
                quality_score=self._calculate_quality_score(title, company, description)
            )
            
            # Normalize and enrich data
            normalized_data = await self.job_normalizer.normalize_job_data(job_data.dict())
            
            # Save to dataset
            await context.push_data(normalized_data)
            
        except Exception as e:
            logger.error(f"Error processing LinkedIn job detail: {e}")
    
    async def _handle_indeed_jobs(self, context: PlaywrightCrawlingContext):
        """Handle Indeed job listing pages"""
        try:
            logger.info(f"Processing Indeed jobs page: {context.request.url}")
            
            # Wait for job listings to load
            await context.page.wait_for_selector('[data-jk]', timeout=10000)
            
            # Extract job listing URLs
            job_cards = await context.page.locator('[data-jk]').all()
            
            for card in job_cards[:self.config.max_jobs_per_page]:
                job_id = await card.get_attribute('data-jk')
                if job_id:
                    job_url = f"https://www.indeed.com/viewjob?jk={job_id}"
                    await context.add_requests([{
                        'url': job_url,
                        'label': 'indeed_job_detail'
                    }])
            
            # Look for pagination
            next_button = context.page.locator('[aria-label="Next Page"]')
            if await next_button.count() > 0:
                await next_button.click()
                await context.page.wait_for_load_state('networkidle')
                current_url = context.page.url
                await context.add_requests([{
                    'url': current_url,
                    'label': 'indeed_jobs'
                }])
                    
        except Exception as e:
            logger.error(f"Error processing Indeed jobs page: {e}")
    
    async def _handle_indeed_job_detail(self, context: PlaywrightCrawlingContext):
        """Handle Indeed job detail pages"""
        try:
            logger.info(f"Processing Indeed job detail: {context.request.url}")
            
            # Wait for job details to load
            await context.page.wait_for_selector('[data-testid="jobsearch-JobInfoHeader-title"]', timeout=10000)
            
            # Extract job data
            title_elem = context.page.locator('[data-testid="jobsearch-JobInfoHeader-title"]')
            company_elem = context.page.locator('[data-testid="inlineHeader-companyName"]')
            location_elem = context.page.locator('[data-testid="job-location"]')
            description_elem = context.page.locator('#jobDescriptionText')
            
            title = await title_elem.text_content() if await title_elem.count() > 0 else ""
            company = await company_elem.text_content() if await company_elem.count() > 0 else ""
            location = await location_elem.text_content() if await location_elem.count() > 0 else ""
            description = await description_elem.text_content() if await description_elem.count() > 0 else ""
            
            # Clean data
            title = re.sub(r'\s+', ' ', title.strip())
            company = re.sub(r'\s+', ' ', company.strip())
            location = re.sub(r'\s+', ' ', location.strip())
            description = re.sub(r'\s+', ' ', description.strip())
            
            job_data = JobData(
                title=title,
                company=company,
                location=location,
                description=description,
                source="indeed",
                source_url=context.request.url,
                external_id=self._extract_indeed_job_id(context.request.url),
                posted_date=datetime.now(),
                quality_score=self._calculate_quality_score(title, company, description)
            )
            
            # Normalize and save
            normalized_data = await self.job_normalizer.normalize_job_data(job_data.dict())
            await context.push_data(normalized_data)
            
        except Exception as e:
            logger.error(f"Error processing Indeed job detail: {e}")
    
    async def _handle_glassdoor_jobs(self, context: PlaywrightCrawlingContext):
        """Handle Glassdoor job listing pages"""
        try:
            logger.info(f"Processing Glassdoor jobs page: {context.request.url}")
            
            # Wait for job listings to load
            await context.page.wait_for_selector('[data-test="job-link"]', timeout=10000)
            
            # Extract job listing URLs
            job_links = await context.page.locator('[data-test="job-link"]').all()
            
            for link in job_links[:self.config.max_jobs_per_page]:
                href = await link.get_attribute('href')
                if href:
                    full_url = urljoin("https://www.glassdoor.com", href)
                    await context.add_requests([{
                        'url': full_url,
                        'label': 'glassdoor_job_detail'
                    }])
            
            # Look for pagination
            next_button = context.page.locator('[data-test="pagination-next"]')
            if await next_button.count() > 0 and await next_button.is_enabled():
                await next_button.click()
                await context.page.wait_for_load_state('networkidle')
                current_url = context.page.url
                await context.add_requests([{
                    'url': current_url,
                    'label': 'glassdoor_jobs'
                }])
                    
        except Exception as e:
            logger.error(f"Error processing Glassdoor jobs page: {e}")
    
    async def _handle_glassdoor_job_detail(self, context: PlaywrightCrawlingContext):
        """Handle Glassdoor job detail pages"""
        try:
            logger.info(f"Processing Glassdoor job detail: {context.request.url}")
            
            # Wait for job details to load
            await context.page.wait_for_selector('[data-test="job-title"]', timeout=10000)
            
            # Extract job data
            title_elem = context.page.locator('[data-test="job-title"]')
            company_elem = context.page.locator('[data-test="employer-name"]')
            location_elem = context.page.locator('[data-test="job-location"]')
            description_elem = context.page.locator('[data-test="jobDescriptionContent"]')
            
            title = await title_elem.text_content() if await title_elem.count() > 0 else ""
            company = await company_elem.text_content() if await company_elem.count() > 0 else ""
            location = await location_elem.text_content() if await location_elem.count() > 0 else ""
            description = await description_elem.text_content() if await description_elem.count() > 0 else ""
            
            # Clean data
            title = re.sub(r'\s+', ' ', title.strip())
            company = re.sub(r'\s+', ' ', company.strip())
            location = re.sub(r'\s+', ' ', location.strip())
            description = re.sub(r'\s+', ' ', description.strip())
            
            job_data = JobData(
                title=title,
                company=company,
                location=location,
                description=description,
                source="glassdoor",
                source_url=context.request.url,
                external_id=self._extract_glassdoor_job_id(context.request.url),
                posted_date=datetime.now(),
                quality_score=self._calculate_quality_score(title, company, description)
            )
            
            # Normalize and save
            normalized_data = await self.job_normalizer.normalize_job_data(job_data.dict())
            await context.push_data(normalized_data)
            
        except Exception as e:
            logger.error(f"Error processing Glassdoor job detail: {e}")
    
    async def _handle_generic_job_page(self, context: PlaywrightCrawlingContext):
        """Handle generic job pages from unknown sources"""
        try:
            logger.info(f"Processing generic job page: {context.request.url}")
            
            # Try to extract job data using common selectors
            page_text = await context.page.text_content('body')
            
            # Use basic heuristics to extract job information
            job_data = await self._extract_generic_job_data(context.request.url, page_text)
            
            if job_data:
                normalized_data = await self.job_normalizer.normalize_job_data(job_data.dict())
                await context.push_data(normalized_data)
            
        except Exception as e:
            logger.error(f"Error processing generic job page: {e}")
    
    async def _extract_generic_job_data(self, url: str, page_text: str) -> Optional[JobData]:
        """Extract job data from generic pages using heuristics"""
        try:
            # This is a simplified implementation
            # In practice, you'd use more sophisticated NLP techniques
            
            lines = page_text.split('\n')
            title = ""
            company = ""
            
            # Look for job title patterns
            for line in lines[:20]:  # Check first 20 lines
                line = line.strip()
                if len(line) > 10 and any(keyword in line.lower() for keyword in ['developer', 'engineer', 'manager', 'analyst', 'specialist']):
                    title = line
                    break
            
            # Look for company name patterns
            domain = urlparse(url).netloc
            company = domain.replace('www.', '').replace('.com', '').replace('.org', '').title()
            
            if title and company:
                return JobData(
                    title=title,
                    company=company,
                    description=page_text[:1000],  # First 1000 chars
                    source="generic",
                    source_url=url,
                    posted_date=datetime.now(),
                    quality_score=0.3  # Lower quality for generic extraction
                )
            
            return None
            
        except Exception as e:
            logger.error(f"Error extracting generic job data: {e}")
            return None
    
    def _extract_linkedin_job_id(self, url: str) -> Optional[str]:
        """Extract job ID from LinkedIn URL"""
        match = re.search(r'/jobs/view/(\d+)', url)
        return match.group(1) if match else None
    
    def _extract_indeed_job_id(self, url: str) -> Optional[str]:
        """Extract job ID from Indeed URL"""
        match = re.search(r'jk=([^&]+)', url)
        return match.group(1) if match else None
    
    def _extract_glassdoor_job_id(self, url: str) -> Optional[str]:
        """Extract job ID from Glassdoor URL"""
        match = re.search(r'jobListingId=(\d+)', url)
        return match.group(1) if match else None
    
    def _calculate_quality_score(self, title: str, company: str, description: str) -> float:
        """Calculate quality score for job data"""
        score = 0.0
        
        # Title quality
        if len(title) > 5:
            score += 0.3
        if any(keyword in title.lower() for keyword in ['senior', 'lead', 'principal', 'director']):
            score += 0.1
        
        # Company quality
        if len(company) > 2:
            score += 0.2
        
        # Description quality
        if len(description) > 100:
            score += 0.3
        if len(description) > 500:
            score += 0.1
        
        return min(score, 1.0)
    
    async def close(self):
        """Clean up resources"""
        try:
            await self.crawler.teardown()
            await self.database_service.close()
        except Exception as e:
            logger.error(f"Error closing scraper: {e}")


# Example usage
async def main():
    """Example usage of the CrawleeJobScraper"""
    from ..config.scraper_config import ScraperConfig
    
    config = ScraperConfig(
        max_requests_per_crawl=100,
        max_jobs_per_page=10,
        headless=True,
        browser_type='chromium'
    )
    
    scraper = CrawleeJobScraper(config)
    
    try:
        # Scrape LinkedIn jobs
        linkedin_jobs = await scraper.scrape_job_board('linkedin', {
            'keywords': 'python developer',
            'location': 'San Francisco',
            'experience_level': 'mid'
        })
        
        print(f"Scraped {len(linkedin_jobs)} jobs from LinkedIn")
        
        # Scrape Indeed jobs
        indeed_jobs = await scraper.scrape_job_board('indeed', {
            'keywords': 'software engineer',
            'location': 'New York'
        })
        
        print(f"Scraped {len(indeed_jobs)} jobs from Indeed")
        
    finally:
        await scraper.close()


if __name__ == "__main__":
    asyncio.run(main())
