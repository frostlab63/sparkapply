"""
Fallback scrapers using BeautifulSoup, Scrapy, and Selenium
Used when Crawlee fails or for specific use cases
"""

import asyncio
import time
import random
from datetime import datetime
from typing import Dict, List, Optional, Any
from urllib.parse import urljoin, urlparse
from dataclasses import dataclass

import requests
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException, NoSuchElementException
import scrapy
from scrapy.crawler import CrawlerProcess
from scrapy.utils.project import get_project_settings

from loguru import logger

from ..config.scraper_config import FallbackScraperConfig
from ..utils.job_normalizer import JobNormalizer


@dataclass
class ScrapedJob:
    """Structured scraped job data"""
    title: str
    company: str
    location: Optional[str] = None
    description: Optional[str] = None
    source: str = ""
    source_url: str = ""
    posted_date: Optional[datetime] = None
    external_id: Optional[str] = None


class BeautifulSoupScraper:
    """
    Fallback scraper using BeautifulSoup and requests
    Good for simple HTML pages without heavy JavaScript
    """
    
    def __init__(self, config: FallbackScraperConfig):
        self.config = config
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        })
        
    async def scrape_jobs(self, urls: List[str]) -> List[ScrapedJob]:
        """Scrape jobs from a list of URLs"""
        jobs = []
        
        for url in urls:
            try:
                logger.info(f"Scraping with BeautifulSoup: {url}")
                
                response = self.session.get(url, timeout=30)
                response.raise_for_status()
                
                soup = BeautifulSoup(response.content, self.config.beautifulsoup_parser)
                
                # Determine the job board and use appropriate selectors
                domain = urlparse(url).netloc.lower()
                
                if 'indeed' in domain:
                    job_data = self._scrape_indeed_job(soup, url)
                elif 'glassdoor' in domain:
                    job_data = self._scrape_glassdoor_job(soup, url)
                elif 'dice' in domain:
                    job_data = self._scrape_dice_job(soup, url)
                else:
                    job_data = self._scrape_generic_job(soup, url)
                
                if job_data:
                    jobs.append(job_data)
                
                # Rate limiting
                await asyncio.sleep(random.uniform(1, 3))
                
            except Exception as e:
                logger.error(f"Error scraping {url} with BeautifulSoup: {e}")
                continue
        
        return jobs
    
    def _scrape_indeed_job(self, soup: BeautifulSoup, url: str) -> Optional[ScrapedJob]:
        """Scrape Indeed job page"""
        try:
            title_elem = soup.find('h1', {'data-testid': 'jobsearch-JobInfoHeader-title'})
            company_elem = soup.find('a', {'data-testid': 'inlineHeader-companyName'})
            location_elem = soup.find('div', {'data-testid': 'job-location'})
            description_elem = soup.find('div', id='jobDescriptionText')
            
            title = title_elem.get_text(strip=True) if title_elem else ""
            company = company_elem.get_text(strip=True) if company_elem else ""
            location = location_elem.get_text(strip=True) if location_elem else ""
            description = description_elem.get_text(strip=True) if description_elem else ""
            
            if title and company:
                return ScrapedJob(
                    title=title,
                    company=company,
                    location=location,
                    description=description,
                    source="indeed",
                    source_url=url,
                    posted_date=datetime.now()
                )
                
        except Exception as e:
            logger.error(f"Error scraping Indeed job: {e}")
        
        return None
    
    def _scrape_glassdoor_job(self, soup: BeautifulSoup, url: str) -> Optional[ScrapedJob]:
        """Scrape Glassdoor job page"""
        try:
            title_elem = soup.find('h1', {'data-test': 'job-title'})
            company_elem = soup.find('a', {'data-test': 'employer-name'})
            location_elem = soup.find('span', {'data-test': 'job-location'})
            description_elem = soup.find('div', {'data-test': 'jobDescriptionContent'})
            
            title = title_elem.get_text(strip=True) if title_elem else ""
            company = company_elem.get_text(strip=True) if company_elem else ""
            location = location_elem.get_text(strip=True) if location_elem else ""
            description = description_elem.get_text(strip=True) if description_elem else ""
            
            if title and company:
                return ScrapedJob(
                    title=title,
                    company=company,
                    location=location,
                    description=description,
                    source="glassdoor",
                    source_url=url,
                    posted_date=datetime.now()
                )
                
        except Exception as e:
            logger.error(f"Error scraping Glassdoor job: {e}")
        
        return None
    
    def _scrape_dice_job(self, soup: BeautifulSoup, url: str) -> Optional[ScrapedJob]:
        """Scrape Dice job page"""
        try:
            title_elem = soup.find('h1', class_='jobTitle')
            company_elem = soup.find('a', class_='employer')
            location_elem = soup.find('li', class_='location')
            description_elem = soup.find('div', class_='jobdescSec')
            
            title = title_elem.get_text(strip=True) if title_elem else ""
            company = company_elem.get_text(strip=True) if company_elem else ""
            location = location_elem.get_text(strip=True) if location_elem else ""
            description = description_elem.get_text(strip=True) if description_elem else ""
            
            if title and company:
                return ScrapedJob(
                    title=title,
                    company=company,
                    location=location,
                    description=description,
                    source="dice",
                    source_url=url,
                    posted_date=datetime.now()
                )
                
        except Exception as e:
            logger.error(f"Error scraping Dice job: {e}")
        
        return None
    
    def _scrape_generic_job(self, soup: BeautifulSoup, url: str) -> Optional[ScrapedJob]:
        """Scrape generic job page using common patterns"""
        try:
            # Try common title selectors
            title_selectors = ['h1', '.job-title', '.title', '[class*="title"]', '[id*="title"]']
            title = ""
            
            for selector in title_selectors:
                elem = soup.select_one(selector)
                if elem and len(elem.get_text(strip=True)) > 5:
                    title = elem.get_text(strip=True)
                    break
            
            # Try common company selectors
            company_selectors = ['.company', '.employer', '[class*="company"]', '[class*="employer"]']
            company = ""
            
            for selector in company_selectors:
                elem = soup.select_one(selector)
                if elem and len(elem.get_text(strip=True)) > 2:
                    company = elem.get_text(strip=True)
                    break
            
            # Get page text as description
            description = soup.get_text()[:1000]  # First 1000 characters
            
            if title and company:
                return ScrapedJob(
                    title=title,
                    company=company,
                    description=description,
                    source="generic",
                    source_url=url,
                    posted_date=datetime.now()
                )
                
        except Exception as e:
            logger.error(f"Error scraping generic job: {e}")
        
        return None


class SeleniumScraper:
    """
    Fallback scraper using Selenium WebDriver
    Good for JavaScript-heavy pages that require interaction
    """
    
    def __init__(self, config: FallbackScraperConfig):
        self.config = config
        self.driver = None
        
    def _setup_driver(self):
        """Set up Chrome WebDriver with options"""
        chrome_options = Options()
        chrome_options.add_argument('--headless')
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--disable-gpu')
        chrome_options.add_argument('--window-size=1920,1080')
        chrome_options.add_argument('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
        
        self.driver = webdriver.Chrome(options=chrome_options)
        self.driver.implicitly_wait(self.config.selenium_implicit_wait)
        self.driver.set_page_load_timeout(self.config.selenium_page_load_timeout)
    
    async def scrape_jobs(self, urls: List[str]) -> List[ScrapedJob]:
        """Scrape jobs from a list of URLs using Selenium"""
        if not self.driver:
            self._setup_driver()
        
        jobs = []
        
        try:
            for url in urls:
                try:
                    logger.info(f"Scraping with Selenium: {url}")
                    
                    self.driver.get(url)
                    
                    # Wait for page to load
                    WebDriverWait(self.driver, 10).until(
                        EC.presence_of_element_located((By.TAG_NAME, "body"))
                    )
                    
                    # Determine the job board and use appropriate selectors
                    domain = urlparse(url).netloc.lower()
                    
                    if 'linkedin' in domain:
                        job_data = self._scrape_linkedin_job_selenium(url)
                    elif 'indeed' in domain:
                        job_data = self._scrape_indeed_job_selenium(url)
                    elif 'glassdoor' in domain:
                        job_data = self._scrape_glassdoor_job_selenium(url)
                    else:
                        job_data = self._scrape_generic_job_selenium(url)
                    
                    if job_data:
                        jobs.append(job_data)
                    
                    # Rate limiting
                    await asyncio.sleep(random.uniform(2, 5))
                    
                except Exception as e:
                    logger.error(f"Error scraping {url} with Selenium: {e}")
                    continue
        
        finally:
            if self.driver:
                self.driver.quit()
        
        return jobs
    
    def _scrape_linkedin_job_selenium(self, url: str) -> Optional[ScrapedJob]:
        """Scrape LinkedIn job page with Selenium"""
        try:
            # Wait for job details to load
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, ".top-card-layout__entity-info"))
            )
            
            title_elem = self.driver.find_element(By.CSS_SELECTOR, ".top-card-layout__title")
            company_elem = self.driver.find_element(By.CSS_SELECTOR, ".topcard__flavor a")
            location_elem = self.driver.find_element(By.CSS_SELECTOR, ".topcard__flavor--bullet")
            
            # Try to expand description
            try:
                show_more_btn = self.driver.find_element(By.CSS_SELECTOR, ".show-more-less-html__button--more")
                if show_more_btn.is_displayed():
                    show_more_btn.click()
                    time.sleep(1)
            except NoSuchElementException:
                pass
            
            description_elem = self.driver.find_element(By.CSS_SELECTOR, ".show-more-less-html__markup")
            
            title = title_elem.text.strip() if title_elem else ""
            company = company_elem.text.strip() if company_elem else ""
            location = location_elem.text.strip() if location_elem else ""
            description = description_elem.text.strip() if description_elem else ""
            
            if title and company:
                return ScrapedJob(
                    title=title,
                    company=company,
                    location=location,
                    description=description,
                    source="linkedin",
                    source_url=url,
                    posted_date=datetime.now()
                )
                
        except Exception as e:
            logger.error(f"Error scraping LinkedIn job with Selenium: {e}")
        
        return None
    
    def _scrape_indeed_job_selenium(self, url: str) -> Optional[ScrapedJob]:
        """Scrape Indeed job page with Selenium"""
        try:
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='jobsearch-JobInfoHeader-title']"))
            )
            
            title_elem = self.driver.find_element(By.CSS_SELECTOR, "[data-testid='jobsearch-JobInfoHeader-title']")
            company_elem = self.driver.find_element(By.CSS_SELECTOR, "[data-testid='inlineHeader-companyName']")
            location_elem = self.driver.find_element(By.CSS_SELECTOR, "[data-testid='job-location']")
            description_elem = self.driver.find_element(By.ID, "jobDescriptionText")
            
            title = title_elem.text.strip() if title_elem else ""
            company = company_elem.text.strip() if company_elem else ""
            location = location_elem.text.strip() if location_elem else ""
            description = description_elem.text.strip() if description_elem else ""
            
            if title and company:
                return ScrapedJob(
                    title=title,
                    company=company,
                    location=location,
                    description=description,
                    source="indeed",
                    source_url=url,
                    posted_date=datetime.now()
                )
                
        except Exception as e:
            logger.error(f"Error scraping Indeed job with Selenium: {e}")
        
        return None
    
    def _scrape_glassdoor_job_selenium(self, url: str) -> Optional[ScrapedJob]:
        """Scrape Glassdoor job page with Selenium"""
        try:
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "[data-test='job-title']"))
            )
            
            title_elem = self.driver.find_element(By.CSS_SELECTOR, "[data-test='job-title']")
            company_elem = self.driver.find_element(By.CSS_SELECTOR, "[data-test='employer-name']")
            location_elem = self.driver.find_element(By.CSS_SELECTOR, "[data-test='job-location']")
            description_elem = self.driver.find_element(By.CSS_SELECTOR, "[data-test='jobDescriptionContent']")
            
            title = title_elem.text.strip() if title_elem else ""
            company = company_elem.text.strip() if company_elem else ""
            location = location_elem.text.strip() if location_elem else ""
            description = description_elem.text.strip() if description_elem else ""
            
            if title and company:
                return ScrapedJob(
                    title=title,
                    company=company,
                    location=location,
                    description=description,
                    source="glassdoor",
                    source_url=url,
                    posted_date=datetime.now()
                )
                
        except Exception as e:
            logger.error(f"Error scraping Glassdoor job with Selenium: {e}")
        
        return None
    
    def _scrape_generic_job_selenium(self, url: str) -> Optional[ScrapedJob]:
        """Scrape generic job page with Selenium"""
        try:
            # Try to find title
            title_selectors = ["h1", ".job-title", ".title", "[class*='title']"]
            title = ""
            
            for selector in title_selectors:
                try:
                    elem = self.driver.find_element(By.CSS_SELECTOR, selector)
                    if elem and len(elem.text.strip()) > 5:
                        title = elem.text.strip()
                        break
                except NoSuchElementException:
                    continue
            
            # Try to find company
            company_selectors = [".company", ".employer", "[class*='company']", "[class*='employer']"]
            company = ""
            
            for selector in company_selectors:
                try:
                    elem = self.driver.find_element(By.CSS_SELECTOR, selector)
                    if elem and len(elem.text.strip()) > 2:
                        company = elem.text.strip()
                        break
                except NoSuchElementException:
                    continue
            
            # Get page text as description
            body_elem = self.driver.find_element(By.TAG_NAME, "body")
            description = body_elem.text[:1000] if body_elem else ""
            
            if title and company:
                return ScrapedJob(
                    title=title,
                    company=company,
                    description=description,
                    source="generic",
                    source_url=url,
                    posted_date=datetime.now()
                )
                
        except Exception as e:
            logger.error(f"Error scraping generic job with Selenium: {e}")
        
        return None


class ScrapyJobSpider(scrapy.Spider):
    """
    Scrapy spider for job scraping
    Good for large-scale scraping with built-in features
    """
    
    name = 'job_spider'
    
    def __init__(self, urls=None, *args, **kwargs):
        super(ScrapyJobSpider, self).__init__(*args, **kwargs)
        self.start_urls = urls or []
        self.scraped_jobs = []
    
    def parse(self, response):
        """Parse job page"""
        domain = urlparse(response.url).netloc.lower()
        
        if 'indeed' in domain:
            yield from self.parse_indeed_job(response)
        elif 'glassdoor' in domain:
            yield from self.parse_glassdoor_job(response)
        else:
            yield from self.parse_generic_job(response)
    
    def parse_indeed_job(self, response):
        """Parse Indeed job page"""
        title = response.css("[data-testid='jobsearch-JobInfoHeader-title']::text").get()
        company = response.css("[data-testid='inlineHeader-companyName']::text").get()
        location = response.css("[data-testid='job-location']::text").get()
        description = response.css("#jobDescriptionText::text").getall()
        
        if title and company:
            yield {
                'title': title.strip(),
                'company': company.strip(),
                'location': location.strip() if location else "",
                'description': ' '.join(description).strip(),
                'source': 'indeed',
                'source_url': response.url,
                'posted_date': datetime.now().isoformat()
            }
    
    def parse_glassdoor_job(self, response):
        """Parse Glassdoor job page"""
        title = response.css("[data-test='job-title']::text").get()
        company = response.css("[data-test='employer-name']::text").get()
        location = response.css("[data-test='job-location']::text").get()
        description = response.css("[data-test='jobDescriptionContent']::text").getall()
        
        if title and company:
            yield {
                'title': title.strip(),
                'company': company.strip(),
                'location': location.strip() if location else "",
                'description': ' '.join(description).strip(),
                'source': 'glassdoor',
                'source_url': response.url,
                'posted_date': datetime.now().isoformat()
            }
    
    def parse_generic_job(self, response):
        """Parse generic job page"""
        title = response.css("h1::text").get()
        company = response.css(".company::text, .employer::text").get()
        description = response.css("body::text").getall()
        
        if title and company:
            yield {
                'title': title.strip(),
                'company': company.strip(),
                'location': "",
                'description': ' '.join(description)[:1000].strip(),
                'source': 'generic',
                'source_url': response.url,
                'posted_date': datetime.now().isoformat()
            }


class FallbackScraperManager:
    """
    Manager for fallback scrapers
    Tries different scrapers in order of preference
    """
    
    def __init__(self, config: FallbackScraperConfig):
        self.config = config
        self.job_normalizer = JobNormalizer()
        
    async def scrape_with_fallbacks(self, urls: List[str]) -> List[Dict[str, Any]]:
        """
        Try scraping with different fallback methods
        
        Args:
            urls: List of URLs to scrape
            
        Returns:
            List of normalized job data
        """
        all_jobs = []
        
        # Try BeautifulSoup first (fastest)
        if self.config.beautifulsoup_enabled:
            try:
                logger.info("Trying BeautifulSoup scraper...")
                bs_scraper = BeautifulSoupScraper(self.config)
                bs_jobs = await bs_scraper.scrape_jobs(urls)
                
                if bs_jobs:
                    logger.info(f"BeautifulSoup scraped {len(bs_jobs)} jobs")
                    for job in bs_jobs:
                        job_dict = {
                            'title': job.title,
                            'company': job.company,
                            'location': job.location,
                            'description': job.description,
                            'source': job.source,
                            'source_url': job.source_url,
                            'posted_date': job.posted_date
                        }
                        normalized = await self.job_normalizer.normalize_job_data(job_dict)
                        all_jobs.append(normalized)
                    
                    return all_jobs
                    
            except Exception as e:
                logger.error(f"BeautifulSoup scraper failed: {e}")
        
        # Try Selenium if BeautifulSoup failed
        if self.config.selenium_enabled:
            try:
                logger.info("Trying Selenium scraper...")
                selenium_scraper = SeleniumScraper(self.config)
                selenium_jobs = await selenium_scraper.scrape_jobs(urls)
                
                if selenium_jobs:
                    logger.info(f"Selenium scraped {len(selenium_jobs)} jobs")
                    for job in selenium_jobs:
                        job_dict = {
                            'title': job.title,
                            'company': job.company,
                            'location': job.location,
                            'description': job.description,
                            'source': job.source,
                            'source_url': job.source_url,
                            'posted_date': job.posted_date
                        }
                        normalized = await self.job_normalizer.normalize_job_data(job_dict)
                        all_jobs.append(normalized)
                    
                    return all_jobs
                    
            except Exception as e:
                logger.error(f"Selenium scraper failed: {e}")
        
        # Try Scrapy as last resort
        if self.config.scrapy_enabled:
            try:
                logger.info("Trying Scrapy scraper...")
                scrapy_jobs = await self._run_scrapy_scraper(urls)
                
                if scrapy_jobs:
                    logger.info(f"Scrapy scraped {len(scrapy_jobs)} jobs")
                    for job_dict in scrapy_jobs:
                        normalized = await self.job_normalizer.normalize_job_data(job_dict)
                        all_jobs.append(normalized)
                    
                    return all_jobs
                    
            except Exception as e:
                logger.error(f"Scrapy scraper failed: {e}")
        
        logger.warning("All fallback scrapers failed")
        return all_jobs
    
    async def _run_scrapy_scraper(self, urls: List[str]) -> List[Dict[str, Any]]:
        """Run Scrapy spider"""
        # This is a simplified implementation
        # In practice, you'd run Scrapy in a separate process
        
        settings = get_project_settings()
        settings.update({
            'CONCURRENT_REQUESTS': self.config.scrapy_concurrent_requests,
            'DOWNLOAD_DELAY': self.config.scrapy_download_delay,
            'RANDOMIZE_DOWNLOAD_DELAY': self.config.scrapy_randomize_download_delay,
        })
        
        # For this example, we'll return empty list
        # In practice, implement proper Scrapy integration
        return []


# Example usage
async def main():
    """Example usage of fallback scrapers"""
    config = FallbackScraperConfig()
    manager = FallbackScraperManager(config)
    
    test_urls = [
        "https://www.indeed.com/viewjob?jk=test123",
        "https://www.glassdoor.com/job-listing/test456",
    ]
    
    jobs = await manager.scrape_with_fallbacks(test_urls)
    
    print(f"Scraped {len(jobs)} jobs using fallback scrapers")
    for job in jobs:
        print(f"- {job['title']} at {job['company']}")


if __name__ == "__main__":
    asyncio.run(main())
