"""
Job data normalization and enrichment utilities
"""

import re
import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass

from loguru import logger

from ..config.scraper_config import normalization_config


@dataclass
class SalaryInfo:
    """Structured salary information"""
    min_salary: Optional[int] = None
    max_salary: Optional[int] = None
    currency: str = "USD"
    period: str = "yearly"  # yearly, monthly, hourly
    is_estimated: bool = False


class JobNormalizer:
    """
    Normalizes and enriches job data from various sources
    """
    
    def __init__(self):
        self.config = normalization_config
        self._setup_patterns()
    
    def _setup_patterns(self):
        """Set up regex patterns for data extraction"""
        
        # Salary patterns
        self.salary_patterns = [
            # $80,000 - $120,000
            re.compile(r'\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*-\s*\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)', re.IGNORECASE),
            # $80,000 per year
            re.compile(r'\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:per|/)\s*(?:year|yr|annum)', re.IGNORECASE),
            # 80,000 - 120,000 USD
            re.compile(r'(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*-\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:USD|dollars?)', re.IGNORECASE),
            # $40/hour
            re.compile(r'\$(\d{1,3}(?:\.\d{2})?)\s*(?:per|/)\s*(?:hour|hr)', re.IGNORECASE),
            # Up to $150,000
            re.compile(r'up\s+to\s+\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)', re.IGNORECASE),
            # Starting at $60,000
            re.compile(r'starting\s+at\s+\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)', re.IGNORECASE),
        ]
        
        # Experience level patterns
        self.experience_patterns = {
            'entry': re.compile(r'\b(?:entry|junior|jr\.?|grad|graduate|new|fresh|0-2\s*years?)\b', re.IGNORECASE),
            'mid': re.compile(r'\b(?:mid|middle|intermediate|2-5\s*years?|3-5\s*years?)\b', re.IGNORECASE),
            'senior': re.compile(r'\b(?:senior|sr\.?|lead|principal|5\+\s*years?|5-10\s*years?)\b', re.IGNORECASE),
            'executive': re.compile(r'\b(?:executive|director|vp|vice\s*president|c-level|10\+\s*years?)\b', re.IGNORECASE),
        }
        
        # Remote work patterns
        self.remote_patterns = {
            'remote': re.compile(r'\b(?:remote|work\s*from\s*home|wfh|telecommute|distributed|100%\s*remote)\b', re.IGNORECASE),
            'hybrid': re.compile(r'\b(?:hybrid|flexible|remote-friendly|partial\s*remote|some\s*remote)\b', re.IGNORECASE),
        }
        
        # Employment type patterns
        self.employment_patterns = {
            'full_time': re.compile(r'\b(?:full.?time|permanent|salaried)\b', re.IGNORECASE),
            'part_time': re.compile(r'\b(?:part.?time|hourly)\b', re.IGNORECASE),
            'contract': re.compile(r'\b(?:contract|contractor|freelance|consulting|temp|temporary)\b', re.IGNORECASE),
            'internship': re.compile(r'\b(?:intern|internship|co-op|coop)\b', re.IGNORECASE),
        }
        
        # Skills extraction pattern
        self.skills_pattern = re.compile(
            r'\b(?:' + '|'.join(re.escape(skill) for skill in self.config.skill_keywords) + r')\b',
            re.IGNORECASE
        )
    
    async def normalize_job_data(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Normalize and enrich job data
        
        Args:
            raw_data: Raw job data dictionary
            
        Returns:
            Normalized job data dictionary
        """
        try:
            logger.debug(f"Normalizing job data: {raw_data.get('title', 'Unknown')}")
            
            normalized = raw_data.copy()
            
            # Normalize title
            normalized['title'] = self._normalize_title(raw_data.get('title', ''))
            
            # Normalize company
            normalized['company'] = self._normalize_company(raw_data.get('company', ''))
            
            # Normalize location and determine remote type
            location, remote_type = self._normalize_location(raw_data.get('location', ''))
            normalized['location'] = location
            normalized['remote_type'] = remote_type
            
            # Extract and normalize salary
            salary_info = self._extract_salary_info(raw_data.get('description', ''))
            if salary_info.min_salary:
                normalized['salary_min'] = salary_info.min_salary
            if salary_info.max_salary:
                normalized['salary_max'] = salary_info.max_salary
            normalized['salary_currency'] = salary_info.currency
            
            # Determine experience level
            normalized['experience_level'] = self._determine_experience_level(
                raw_data.get('title', ''), 
                raw_data.get('description', '')
            )
            
            # Determine employment type
            normalized['employment_type'] = self._determine_employment_type(
                raw_data.get('title', ''), 
                raw_data.get('description', '')
            )
            
            # Extract skills
            normalized['skills'] = self._extract_skills(raw_data.get('description', ''))
            
            # Extract categories/tags
            normalized['categories'] = self._extract_categories(
                raw_data.get('title', ''), 
                raw_data.get('description', '')
            )
            
            # Normalize dates
            normalized['posted_date'] = self._normalize_date(raw_data.get('posted_date'))
            normalized['expires_date'] = self._calculate_expiry_date(normalized['posted_date'])
            
            # Calculate quality score
            normalized['quality_score'] = self._calculate_quality_score(normalized)
            
            # Clean up text fields
            normalized['description'] = self._clean_text(raw_data.get('description', ''))
            normalized['requirements'] = self._extract_requirements(raw_data.get('description', ''))
            normalized['benefits'] = self._extract_benefits(raw_data.get('description', ''))
            
            logger.debug(f"Successfully normalized job: {normalized['title']} at {normalized['company']}")
            return normalized
            
        except Exception as e:
            logger.error(f"Error normalizing job data: {e}")
            return raw_data
    
    def _normalize_title(self, title: str) -> str:
        """Normalize job title"""
        if not title:
            return ""
        
        # Clean whitespace
        title = re.sub(r'\s+', ' ', title.strip())
        
        # Remove stopwords
        for stopword in self.config.title_stopwords:
            title = re.sub(rf'\b{re.escape(stopword)}\b', '', title, flags=re.IGNORECASE)
        
        # Apply replacements
        for old, new in self.config.title_replacements.items():
            title = re.sub(rf'\b{re.escape(old)}\b', new, title, flags=re.IGNORECASE)
        
        # Clean up multiple spaces
        title = re.sub(r'\s+', ' ', title.strip())
        
        # Capitalize properly
        title = title.title()
        
        return title
    
    def _normalize_company(self, company: str) -> str:
        """Normalize company name"""
        if not company:
            return ""
        
        # Clean whitespace
        company = re.sub(r'\s+', ' ', company.strip())
        
        # Remove common suffixes for matching purposes, but keep original
        # This helps with deduplication while preserving the full name
        
        return company
    
    def _normalize_location(self, location: str) -> Tuple[str, str]:
        """
        Normalize location and determine remote type
        
        Returns:
            Tuple of (normalized_location, remote_type)
        """
        if not location:
            return "", "on_site"
        
        location = re.sub(r'\s+', ' ', location.strip())
        
        # Check for remote work indicators
        if self.remote_patterns['remote'].search(location):
            return "Remote", "remote"
        elif self.remote_patterns['hybrid'].search(location):
            # Extract the base location if mentioned
            clean_location = re.sub(r'\b(?:hybrid|flexible|remote-friendly)\b', '', location, flags=re.IGNORECASE)
            clean_location = re.sub(r'\s+', ' ', clean_location.strip())
            return clean_location or "Hybrid", "hybrid"
        
        return location, "on_site"
    
    def _extract_salary_info(self, text: str) -> SalaryInfo:
        """Extract salary information from text"""
        if not text:
            return SalaryInfo()
        
        for pattern in self.salary_patterns:
            match = pattern.search(text)
            if match:
                groups = match.groups()
                
                if len(groups) == 2:  # Range pattern
                    min_sal = self._parse_salary(groups[0])
                    max_sal = self._parse_salary(groups[1])
                    return SalaryInfo(
                        min_salary=min_sal,
                        max_salary=max_sal,
                        currency="USD"
                    )
                elif len(groups) == 1:  # Single value pattern
                    salary = self._parse_salary(groups[0])
                    
                    # Determine if it's hourly
                    if 'hour' in match.group(0).lower():
                        # Convert hourly to yearly (assuming 40 hours/week, 52 weeks/year)
                        yearly_salary = int(salary * 40 * 52)
                        return SalaryInfo(
                            min_salary=yearly_salary,
                            currency="USD",
                            period="yearly",
                            is_estimated=True
                        )
                    
                    # Check if it's "up to" or "starting at"
                    if 'up to' in match.group(0).lower():
                        return SalaryInfo(max_salary=salary, currency="USD")
                    elif 'starting' in match.group(0).lower():
                        return SalaryInfo(min_salary=salary, currency="USD")
                    else:
                        return SalaryInfo(min_salary=salary, currency="USD")
        
        return SalaryInfo()
    
    def _parse_salary(self, salary_str: str) -> int:
        """Parse salary string to integer"""
        # Remove commas and convert to int
        return int(salary_str.replace(',', '').replace('.', ''))
    
    def _determine_experience_level(self, title: str, description: str) -> str:
        """Determine experience level from title and description"""
        text = f"{title} {description}".lower()
        
        for level, pattern in self.experience_patterns.items():
            if pattern.search(text):
                return level
        
        return "mid"  # Default
    
    def _determine_employment_type(self, title: str, description: str) -> str:
        """Determine employment type from title and description"""
        text = f"{title} {description}".lower()
        
        for emp_type, pattern in self.employment_patterns.items():
            if pattern.search(text):
                return emp_type
        
        return "full_time"  # Default
    
    def _extract_skills(self, description: str) -> List[str]:
        """Extract skills from job description"""
        if not description:
            return []
        
        # Find all skill matches
        matches = self.skills_pattern.findall(description.lower())
        
        # Remove duplicates and return sorted list
        skills = list(set(matches))
        skills.sort()
        
        return skills
    
    def _extract_categories(self, title: str, description: str) -> List[str]:
        """Extract job categories/tags"""
        categories = []
        text = f"{title} {description}".lower()
        
        # Technology categories
        if any(tech in text for tech in ['python', 'javascript', 'java', 'react', 'node']):
            categories.append('Software Development')
        
        if any(term in text for term in ['data', 'analytics', 'machine learning', 'ai']):
            categories.append('Data Science')
        
        if any(term in text for term in ['devops', 'infrastructure', 'cloud', 'aws', 'azure']):
            categories.append('DevOps')
        
        if any(term in text for term in ['mobile', 'ios', 'android', 'flutter', 'react native']):
            categories.append('Mobile Development')
        
        if any(term in text for term in ['frontend', 'front-end', 'ui', 'ux', 'design']):
            categories.append('Frontend')
        
        if any(term in text for term in ['backend', 'back-end', 'api', 'server', 'database']):
            categories.append('Backend')
        
        if any(term in text for term in ['manager', 'lead', 'director', 'management']):
            categories.append('Management')
        
        if any(term in text for term in ['security', 'cybersecurity', 'infosec']):
            categories.append('Security')
        
        return categories
    
    def _normalize_date(self, date_input: Any) -> Optional[datetime]:
        """Normalize date input to datetime object"""
        if not date_input:
            return datetime.now()
        
        if isinstance(date_input, datetime):
            return date_input
        
        if isinstance(date_input, str):
            # Try to parse common date formats
            date_formats = [
                "%Y-%m-%d",
                "%Y-%m-%d %H:%M:%S",
                "%m/%d/%Y",
                "%d/%m/%Y",
                "%Y-%m-%dT%H:%M:%S",
                "%Y-%m-%dT%H:%M:%SZ"
            ]
            
            for fmt in date_formats:
                try:
                    return datetime.strptime(date_input, fmt)
                except ValueError:
                    continue
        
        # Default to current time
        return datetime.now()
    
    def _calculate_expiry_date(self, posted_date: Optional[datetime]) -> Optional[datetime]:
        """Calculate job expiry date (default 30 days from posted date)"""
        if not posted_date:
            return None
        
        return posted_date + timedelta(days=30)
    
    def _clean_text(self, text: str) -> str:
        """Clean and normalize text content"""
        if not text:
            return ""
        
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text.strip())
        
        # Remove HTML tags if any
        text = re.sub(r'<[^>]+>', '', text)
        
        # Remove special characters that might cause issues
        text = re.sub(r'[^\w\s\-.,;:()!?]', '', text)
        
        return text
    
    def _extract_requirements(self, description: str) -> str:
        """Extract requirements section from job description"""
        if not description:
            return ""
        
        # Look for requirements section
        requirements_patterns = [
            r'(?:requirements?|qualifications?|skills?)[:\s]*([^.]*(?:\.[^.]*){0,10})',
            r'(?:must have|required)[:\s]*([^.]*(?:\.[^.]*){0,5})',
            r'(?:you should have|we\'re looking for)[:\s]*([^.]*(?:\.[^.]*){0,5})'
        ]
        
        for pattern in requirements_patterns:
            match = re.search(pattern, description, re.IGNORECASE | re.DOTALL)
            if match:
                return self._clean_text(match.group(1))
        
        return ""
    
    def _extract_benefits(self, description: str) -> str:
        """Extract benefits section from job description"""
        if not description:
            return ""
        
        # Look for benefits section
        benefits_patterns = [
            r'(?:benefits?|perks?|we offer)[:\s]*([^.]*(?:\.[^.]*){0,10})',
            r'(?:compensation|package includes)[:\s]*([^.]*(?:\.[^.]*){0,5})'
        ]
        
        for pattern in benefits_patterns:
            match = re.search(pattern, description, re.IGNORECASE | re.DOTALL)
            if match:
                return self._clean_text(match.group(1))
        
        return ""
    
    def _calculate_quality_score(self, job_data: Dict[str, Any]) -> float:
        """Calculate quality score for normalized job data"""
        score = 0.0
        
        # Title quality (0-0.2)
        title = job_data.get('title', '')
        if len(title) >= self.config.min_title_length:
            score += 0.15
        if any(keyword in title.lower() for keyword in ['senior', 'lead', 'principal']):
            score += 0.05
        
        # Company quality (0-0.1)
        company = job_data.get('company', '')
        if len(company) > 2:
            score += 0.1
        
        # Description quality (0-0.3)
        description = job_data.get('description', '')
        if len(description) >= self.config.min_description_length:
            score += 0.2
        if len(description) >= 500:
            score += 0.1
        
        # Location quality (0-0.1)
        location = job_data.get('location', '')
        if location and location != "Unknown":
            score += 0.1
        
        # Salary information (0-0.15)
        if job_data.get('salary_min') or job_data.get('salary_max'):
            score += 0.15
        
        # Skills information (0-0.1)
        skills = job_data.get('skills', [])
        if len(skills) > 0:
            score += 0.05
        if len(skills) >= 5:
            score += 0.05
        
        # Required fields completeness (0-0.05)
        required_fields = ['title', 'company', 'source_url']
        complete_fields = sum(1 for field in required_fields if job_data.get(field))
        score += (complete_fields / len(required_fields)) * 0.05
        
        return min(score, 1.0)
    
    async def batch_normalize(self, job_data_list: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Normalize a batch of job data"""
        tasks = [self.normalize_job_data(job_data) for job_data in job_data_list]
        return await asyncio.gather(*tasks)
    
    def get_normalization_stats(self, original_data: Dict[str, Any], normalized_data: Dict[str, Any]) -> Dict[str, Any]:
        """Get statistics about the normalization process"""
        stats = {
            'fields_added': [],
            'fields_modified': [],
            'quality_improvement': 0.0,
            'skills_extracted': len(normalized_data.get('skills', [])),
            'categories_extracted': len(normalized_data.get('categories', [])),
        }
        
        # Check for added fields
        for key in normalized_data:
            if key not in original_data or not original_data.get(key):
                if normalized_data.get(key):
                    stats['fields_added'].append(key)
        
        # Check for modified fields
        for key in original_data:
            if key in normalized_data and original_data[key] != normalized_data[key]:
                stats['fields_modified'].append(key)
        
        # Calculate quality improvement
        original_quality = self._calculate_quality_score(original_data)
        normalized_quality = normalized_data.get('quality_score', 0.0)
        stats['quality_improvement'] = normalized_quality - original_quality
        
        return stats


# Example usage
async def main():
    """Example usage of JobNormalizer"""
    normalizer = JobNormalizer()
    
    raw_job = {
        'title': 'Sr. Python Dev - URGENT HIRING',
        'company': 'Tech Corp Inc.',
        'location': 'San Francisco, CA (Remote OK)',
        'description': '''
        We are looking for a senior Python developer with 5+ years of experience.
        
        Requirements:
        - Python, Django, Flask
        - AWS, Docker, Kubernetes
        - $120,000 - $150,000 per year
        
        Benefits:
        - Health insurance
        - 401k matching
        - Flexible work arrangements
        ''',
        'source': 'linkedin',
        'source_url': 'https://linkedin.com/jobs/123456'
    }
    
    normalized = await normalizer.normalize_job_data(raw_job)
    
    print("Original:", raw_job['title'])
    print("Normalized:", normalized['title'])
    print("Skills:", normalized['skills'])
    print("Salary:", f"${normalized.get('salary_min', 0):,} - ${normalized.get('salary_max', 0):,}")
    print("Quality Score:", normalized['quality_score'])


if __name__ == "__main__":
    asyncio.run(main())
