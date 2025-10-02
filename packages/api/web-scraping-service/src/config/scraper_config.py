"""
Configuration settings for web scraping service
"""

import os
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings


class ScraperConfig(BaseSettings):
    """Main scraper configuration"""
    
    # Crawlee settings
    max_requests_per_crawl: int = Field(default=1000, description="Maximum requests per crawl session")
    max_jobs_per_page: int = Field(default=25, description="Maximum jobs to extract per page")
    headless: bool = Field(default=True, description="Run browser in headless mode")
    browser_type: str = Field(default="chromium", description="Browser type (chromium, firefox, webkit)")
    request_timeout: int = Field(default=30, description="Request timeout in seconds")
    max_retries: int = Field(default=3, description="Maximum retry attempts")
    session_pool_size: int = Field(default=10, description="Session pool size")
    
    # Anti-detection settings
    use_proxy: bool = Field(default=False, description="Use proxy rotation")
    proxy_urls: List[str] = Field(default_factory=list, description="List of proxy URLs")
    user_agents: List[str] = Field(default_factory=lambda: [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    ])
    
    # Rate limiting
    delay_between_requests: float = Field(default=2.0, description="Delay between requests in seconds")
    randomize_delay: bool = Field(default=True, description="Randomize delay between requests")
    max_concurrent_requests: int = Field(default=5, description="Maximum concurrent requests")
    
    # Data quality
    min_title_length: int = Field(default=5, description="Minimum job title length")
    min_description_length: int = Field(default=50, description="Minimum job description length")
    required_fields: List[str] = Field(default_factory=lambda: ["title", "company", "source_url"])
    
    # Database settings
    database_url: str = Field(default="postgresql://postgres:password@localhost:5432/sparkapply_jobs")
    mongodb_url: str = Field(default="mongodb://localhost:27017/sparkapply_jobs")
    redis_url: str = Field(default="redis://localhost:6379/0")
    
    # Storage settings
    data_storage_path: str = Field(default="./data", description="Path to store scraped data")
    log_storage_path: str = Field(default="./logs", description="Path to store logs")
    
    # Job board specific settings
    job_boards: Dict[str, Dict[str, Any]] = Field(default_factory=lambda: {
        "linkedin": {
            "enabled": True,
            "base_url": "https://www.linkedin.com/jobs/search",
            "max_pages": 10,
            "selectors": {
                "job_list": ".jobs-search__results-list li",
                "job_link": ".base-card__full-link",
                "title": ".top-card-layout__title",
                "company": ".topcard__flavor a",
                "location": ".topcard__flavor--bullet",
                "description": ".show-more-less-html__markup"
            }
        },
        "indeed": {
            "enabled": True,
            "base_url": "https://www.indeed.com/jobs",
            "max_pages": 10,
            "selectors": {
                "job_list": "[data-jk]",
                "title": "[data-testid='jobsearch-JobInfoHeader-title']",
                "company": "[data-testid='inlineHeader-companyName']",
                "location": "[data-testid='job-location']",
                "description": "#jobDescriptionText"
            }
        },
        "glassdoor": {
            "enabled": True,
            "base_url": "https://www.glassdoor.com/Job/jobs.htm",
            "max_pages": 5,
            "selectors": {
                "job_list": "[data-test='job-link']",
                "title": "[data-test='job-title']",
                "company": "[data-test='employer-name']",
                "location": "[data-test='job-location']",
                "description": "[data-test='jobDescriptionContent']"
            }
        },
        "dice": {
            "enabled": False,
            "base_url": "https://www.dice.com/jobs",
            "max_pages": 5
        },
        "monster": {
            "enabled": False,
            "base_url": "https://www.monster.com/jobs/search",
            "max_pages": 5
        }
    })
    
    # Search parameters
    default_search_params: Dict[str, Any] = Field(default_factory=lambda: {
        "keywords": ["python", "javascript", "java", "react", "node.js"],
        "locations": ["San Francisco", "New York", "Seattle", "Austin", "Remote"],
        "experience_levels": ["entry", "mid", "senior"],
        "job_types": ["full_time", "contract", "part_time"]
    })
    
    # Scheduling settings
    scraping_schedule: Dict[str, str] = Field(default_factory=lambda: {
        "linkedin": "0 */6 * * *",  # Every 6 hours
        "indeed": "0 */4 * * *",    # Every 4 hours
        "glassdoor": "0 */8 * * *", # Every 8 hours
        "full_scrape": "0 2 * * *"  # Daily at 2 AM
    })
    
    # Monitoring and alerts
    enable_monitoring: bool = Field(default=True, description="Enable monitoring and alerts")
    webhook_url: Optional[str] = Field(default=None, description="Webhook URL for alerts")
    alert_thresholds: Dict[str, int] = Field(default_factory=lambda: {
        "min_jobs_per_hour": 10,
        "max_error_rate": 20,  # percentage
        "max_response_time": 30  # seconds
    })
    
    class Config:
        env_file = ".env"
        env_prefix = "SCRAPER_"


class FallbackScraperConfig(BaseModel):
    """Configuration for fallback scrapers"""
    
    # BeautifulSoup settings
    beautifulsoup_enabled: bool = Field(default=True)
    beautifulsoup_parser: str = Field(default="html.parser")
    
    # Scrapy settings
    scrapy_enabled: bool = Field(default=True)
    scrapy_concurrent_requests: int = Field(default=16)
    scrapy_download_delay: float = Field(default=1.0)
    scrapy_randomize_download_delay: bool = Field(default=True)
    
    # Selenium settings
    selenium_enabled: bool = Field(default=True)
    selenium_implicit_wait: int = Field(default=10)
    selenium_page_load_timeout: int = Field(default=30)
    selenium_webdriver_path: Optional[str] = Field(default=None)
    
    # Requests settings
    requests_timeout: int = Field(default=30)
    requests_max_retries: int = Field(default=3)
    requests_backoff_factor: float = Field(default=0.3)


class JobNormalizationConfig(BaseModel):
    """Configuration for job data normalization"""
    
    # Title normalization
    title_stopwords: List[str] = Field(default_factory=lambda: [
        "urgent", "immediate", "asap", "hiring now", "apply now"
    ])
    title_replacements: Dict[str, str] = Field(default_factory=lambda: {
        "sr.": "senior",
        "jr.": "junior",
        "dev": "developer",
        "eng": "engineer"
    })
    
    # Location normalization
    remote_keywords: List[str] = Field(default_factory=lambda: [
        "remote", "work from home", "wfh", "telecommute", "distributed"
    ])
    hybrid_keywords: List[str] = Field(default_factory=lambda: [
        "hybrid", "flexible", "remote-friendly"
    ])
    
    # Salary normalization
    salary_patterns: List[str] = Field(default_factory=lambda: [
        r'\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*-\s*\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)',
        r'\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:per|/)\s*(?:year|yr|annum)',
        r'(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*-\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:USD|dollars?)'
    ])
    
    # Skills extraction
    skill_keywords: List[str] = Field(default_factory=lambda: [
        "python", "javascript", "java", "react", "node.js", "angular", "vue.js",
        "typescript", "go", "rust", "kotlin", "swift", "c++", "c#", "php",
        "ruby", "scala", "r", "matlab", "sql", "nosql", "mongodb", "postgresql",
        "mysql", "redis", "elasticsearch", "docker", "kubernetes", "aws", "azure",
        "gcp", "terraform", "jenkins", "git", "github", "gitlab", "jira", "agile",
        "scrum", "machine learning", "ai", "data science", "blockchain", "devops"
    ])
    
    # Company normalization
    company_suffixes: List[str] = Field(default_factory=lambda: [
        "inc", "inc.", "corp", "corp.", "llc", "ltd", "ltd.", "co", "co.",
        "company", "corporation", "incorporated", "limited"
    ])


# Global configuration instances
scraper_config = ScraperConfig()
fallback_config = FallbackScraperConfig()
normalization_config = JobNormalizationConfig()


def get_job_board_config(board_name: str) -> Dict[str, Any]:
    """Get configuration for a specific job board"""
    return scraper_config.job_boards.get(board_name, {})


def is_job_board_enabled(board_name: str) -> bool:
    """Check if a job board is enabled"""
    board_config = get_job_board_config(board_name)
    return board_config.get("enabled", False)


def get_enabled_job_boards() -> List[str]:
    """Get list of enabled job boards"""
    return [
        board_name for board_name, config in scraper_config.job_boards.items()
        if config.get("enabled", False)
    ]


def update_job_board_config(board_name: str, config_updates: Dict[str, Any]):
    """Update configuration for a specific job board"""
    if board_name in scraper_config.job_boards:
        scraper_config.job_boards[board_name].update(config_updates)


# Environment-specific configurations
def get_development_config() -> ScraperConfig:
    """Get configuration for development environment"""
    config = ScraperConfig()
    config.max_requests_per_crawl = 50
    config.max_jobs_per_page = 5
    config.headless = False
    config.delay_between_requests = 3.0
    return config


def get_production_config() -> ScraperConfig:
    """Get configuration for production environment"""
    config = ScraperConfig()
    config.max_requests_per_crawl = 5000
    config.max_jobs_per_page = 50
    config.headless = True
    config.delay_between_requests = 1.0
    config.max_concurrent_requests = 20
    return config


def get_testing_config() -> ScraperConfig:
    """Get configuration for testing environment"""
    config = ScraperConfig()
    config.max_requests_per_crawl = 10
    config.max_jobs_per_page = 2
    config.headless = True
    config.delay_between_requests = 0.5
    return config
