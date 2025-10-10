import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Heart,
  X,
  MapPin,
  DollarSign,
  Clock,
  Building,
  Users,
  Briefcase,
  Star,
  ChevronLeft,
  ChevronRight,
  RefreshCw
} from 'lucide-react'
import jobService from '../../services/jobService'

// Fallback jobs in case API fails
const fallbackJobs = [
  {
    id: 1,
    title: "Senior Frontend Developer",
    company: "TechCorp Inc.",
    location: "San Francisco, CA",
    salary: "$120,000 - $160,000",
    type: "Full-time",
    remote: true,
    description: "Join our dynamic team building cutting-edge web applications using React, TypeScript, and modern frontend technologies.",
    requirements: ["5+ years React experience", "TypeScript proficiency", "Modern CSS frameworks"],
    benefits: ["Health insurance", "401k matching", "Flexible PTO", "Remote work"],
    companySize: "500-1000",
    industry: "Technology",
    posted: "2 days ago",
    logo: "https://via.placeholder.com/60x60/4F46E5/white?text=TC",
    match: 95
  },
  {
    id: 2,
    title: "Full Stack Engineer",
    company: "StartupXYZ",
    location: "New York, NY",
    salary: "$100,000 - $140,000",
    type: "Full-time",
    remote: false,
    description: "Build scalable web applications from frontend to backend. Work with React, Node.js, and cloud technologies.",
    requirements: ["3+ years full-stack experience", "React & Node.js", "AWS/GCP knowledge"],
    benefits: ["Equity package", "Health insurance", "Learning budget", "Gym membership"],
    companySize: "50-100",
    industry: "Fintech",
    posted: "1 day ago",
    logo: "https://via.placeholder.com/60x60/10B981/white?text=SX",
    match: 88
  },
  {
    id: 3,
    title: "React Developer",
    company: "Digital Agency Pro",
    location: "Austin, TX",
    salary: "$90,000 - $120,000",
    type: "Contract",
    remote: true,
    description: "Create beautiful, responsive web applications for our diverse client base. Focus on user experience and performance.",
    requirements: ["React expertise", "Responsive design", "Performance optimization"],
    benefits: ["Flexible schedule", "Remote work", "Project bonuses", "Professional development"],
    companySize: "10-50",
    industry: "Digital Marketing",
    posted: "3 days ago",
    logo: "https://via.placeholder.com/60x60/F59E0B/white?text=DA",
    match: 82
  },
  {
    id: 4,
    title: "Software Engineer",
    company: "Enterprise Solutions",
    location: "Seattle, WA",
    salary: "$110,000 - $150,000",
    type: "Full-time",
    remote: false,
    description: "Develop enterprise-grade software solutions using modern technologies. Work on large-scale distributed systems.",
    requirements: ["Computer Science degree", "5+ years experience", "System design knowledge"],
    benefits: ["Comprehensive health coverage", "Stock options", "Relocation assistance", "Career growth"],
    companySize: "1000+",
    industry: "Enterprise Software",
    posted: "1 week ago",
    logo: "https://via.placeholder.com/60x60/8B5CF6/white?text=ES",
    match: 91
  },
  {
    id: 5,
    title: "Frontend Architect",
    company: "Innovation Labs",
    location: "Boston, MA",
    salary: "$140,000 - $180,000",
    type: "Full-time",
    remote: true,
    description: "Lead frontend architecture decisions and mentor junior developers. Shape the future of our product platform.",
    requirements: ["8+ years frontend experience", "Architecture experience", "Team leadership"],
    benefits: ["High salary", "Equity", "Unlimited PTO", "Conference budget"],
    companySize: "200-500",
    industry: "AI/ML",
    posted: "4 days ago",
    logo: "https://via.placeholder.com/60x60/EF4444/white?text=IL",
    match: 97
  }
]

const JobSwiper = () => {
  const [currentJobIndex, setCurrentJobIndex] = useState(0)
  const [jobs, setJobs] = useState([])
  const [swipeDirection, setSwipeDirection] = useState(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Load real jobs on component mount
  useEffect(() => {
    loadJobs()
  }, [])

  const loadJobs = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔍 Loading real jobs...')
      const response = await jobService.ensureJobsAvailable()
      
      if (response.jobs && response.jobs.length > 0) {
        setJobs(response.jobs)
        console.log(`✅ Loaded ${response.jobs.length} real jobs`)
      } else {
        console.log('⚠️ No jobs found, using fallback')
        setJobs(fallbackJobs)
      }
    } catch (error) {
      console.error('❌ Error loading jobs:', error)
      setError('Failed to load jobs')
      setJobs(fallbackJobs) // Use fallback on error
    } finally {
      setLoading(false)
    }
  }

  const refreshJobs = async () => {
    try {
      setLoading(true)
      console.log('🔄 Refreshing jobs...')
      
      // Trigger new scraping
      await jobService.triggerJobScraping()
      
      // Wait a moment then reload
      setTimeout(async () => {
        const response = await jobService.fetchJobs({ limit: 20 })
        if (response.jobs && response.jobs.length > 0) {
          setJobs(response.jobs)
          setCurrentJobIndex(0) // Reset to first job
          console.log(`✅ Refreshed with ${response.jobs.length} jobs`)
        }
        setLoading(false)
      }, 3000)
      
    } catch (error) {
      console.error('❌ Error refreshing jobs:', error)
      setLoading(false)
    }
  }

  const currentJob = jobs[currentJobIndex]

  const handleSwipe = (direction) => {
    if (isAnimating) return
    
    setIsAnimating(true)
    setSwipeDirection(direction)
    
    setTimeout(() => {
      if (direction === 'like') {
        console.log('Liked job:', currentJob.title)
        // Here you would typically save the like to the backend
      } else {
        console.log('Passed on job:', currentJob.title)
      }
      
      // Move to next job
      if (currentJobIndex < jobs.length - 1) {
        setCurrentJobIndex(currentJobIndex + 1)
      } else {
        // Reset to beginning or show "no more jobs" message
        setCurrentJobIndex(0)
      }
      
      setSwipeDirection(null)
      setIsAnimating(false)
    }, 300)
  }

  const handlePrevious = () => {
    if (currentJobIndex > 0) {
      setCurrentJobIndex(currentJobIndex - 1)
    }
  }

  const handleNext = () => {
    if (currentJobIndex < jobs.length - 1) {
      setCurrentJobIndex(currentJobIndex + 1)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading Real Jobs...</h3>
          <p className="text-gray-600">Fetching the latest opportunities from the job market</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Unable to load jobs</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={loadJobs} className="bg-blue-500 hover:bg-blue-600">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (!currentJob) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No more jobs!</h3>
          <p className="text-gray-600 mb-4">You've seen all available jobs. Get fresh opportunities!</p>
          <Button onClick={refreshJobs} className="bg-green-500 hover:bg-green-600">
            <RefreshCw className="w-4 h-4 mr-2" />
            Get New Jobs
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto">
      {/* Job Counter */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-500">
          {currentJobIndex + 1} of {jobs.length}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={refreshJobs}
          disabled={loading}
          className="text-xs"
        >
          <RefreshCw className={`w-3 h-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Job Card */}
      <div className="relative">
        <Card className={`transition-all duration-300 ${
          swipeDirection === 'like' ? 'transform translate-x-full opacity-0' :
          swipeDirection === 'pass' ? 'transform -translate-x-full opacity-0' : ''
        }`}>
          <CardContent className="p-0">
            {/* Header with company logo and match */}
            <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-t-lg">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <img 
                    src={currentJob.logo} 
                    alt={currentJob.company}
                    className="w-12 h-12 rounded-lg bg-white/20 p-1"
                  />
                  <div>
                    <h2 className="text-xl font-bold">{currentJob.title}</h2>
                    <p className="text-blue-100">{currentJob.company}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-1 bg-white/20 rounded-full px-3 py-1">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="font-semibold">{currentJob.match}%</span>
                  </div>
                  <p className="text-xs text-blue-100 mt-1">Match</p>
                </div>
              </div>
            </div>

            {/* Job Details */}
            <div className="p-6 space-y-4">
              {/* Location and Salary */}
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <MapPin className="w-4 h-4" />
                  <span>{currentJob.location}</span>
                  {currentJob.remote && (
                    <Badge variant="secondary" className="ml-2">Remote</Badge>
                  )}
                </div>
                <div className="flex items-center space-x-1">
                  <DollarSign className="w-4 h-4" />
                  <span>{currentJob.salary}</span>
                </div>
              </div>

              {/* Job Type and Posted */}
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Briefcase className="w-4 h-4" />
                  <span>{currentJob.type}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{currentJob.posted}</span>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">About the Role</h4>
                <p className="text-gray-700 text-sm leading-relaxed">
                  {currentJob.description}
                </p>
              </div>

              {/* Requirements */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Requirements</h4>
                <div className="flex flex-wrap gap-2">
                  {currentJob.requirements.map((req, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {req}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Company Info */}
              <div className="flex items-center justify-between text-sm text-gray-600 pt-4 border-t">
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>{currentJob.companySize} employees</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Building className="w-4 h-4" />
                  <span>{currentJob.industry}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Swipe Indicators */}
        {swipeDirection && (
          <div className={`absolute inset-0 flex items-center justify-center pointer-events-none ${
            swipeDirection === 'like' ? 'text-green-500' : 'text-red-500'
          }`}>
            <div className={`text-6xl font-bold opacity-80 ${
              swipeDirection === 'like' ? 'rotate-12' : '-rotate-12'
            }`}>
              {swipeDirection === 'like' ? '💚' : '❌'}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center space-x-6 mt-6">
        <Button
          variant="outline"
          size="lg"
          className="rounded-full w-16 h-16 border-red-200 hover:border-red-300 hover:bg-red-50"
          onClick={() => handleSwipe('pass')}
          disabled={isAnimating}
        >
          <X className="w-6 h-6 text-red-500" />
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          className="rounded-full"
          onClick={handlePrevious}
          disabled={currentJobIndex === 0 || isAnimating}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          className="rounded-full"
          onClick={handleNext}
          disabled={currentJobIndex === jobs.length - 1 || isAnimating}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>

        <Button
          variant="outline"
          size="lg"
          className="rounded-full w-16 h-16 border-green-200 hover:border-green-300 hover:bg-green-50"
          onClick={() => handleSwipe('like')}
          disabled={isAnimating}
        >
          <Heart className="w-6 h-6 text-green-500" />
        </Button>
      </div>

      {/* Navigation Dots */}
      <div className="flex justify-center space-x-2 mt-4">
        {jobs.map((_, index) => (
          <button
            key={index}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === currentJobIndex ? 'bg-blue-500' : 'bg-gray-300'
            }`}
            onClick={() => setCurrentJobIndex(index)}
          />
        ))}
      </div>
    </div>
  )
}

export default JobSwiper
