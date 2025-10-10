import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  User,
  Mail,
  MapPin,
  Briefcase,
  Star,
  Edit3,
  Upload,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Calendar,
  Clock,
  Target,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import JobSwiper from '../jobs/JobSwiper'

const ProfileDashboard = () => {
  const { user, updateProfile, getCurrentUser, logout } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [profileData, setProfileData] = useState(null)

  // Load current user profile on mount
  useEffect(() => {
    const loadProfile = async () => {
      setIsLoading(true)
      try {
        const result = await getCurrentUser()
        if (result.success) {
          setProfileData(result.user)
        }
      } catch (error) {
        console.error('Error loading profile:', error)
        // Set basic profile data from user context if API fails
        setProfileData(user)
      } finally {
        setIsLoading(false)
      }
    }

    // Set a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        console.log('Profile loading timeout, using basic user data')
        setProfileData(user)
        setIsLoading(false)
      }
    }, 3000)

    loadProfile()

    return () => clearTimeout(timeoutId)
  }, [getCurrentUser, user, isLoading])

  // Calculate profile completion percentage
  const calculateCompletion = () => {
    if (!profileData?.jobSeekerProfile) return 0

    const profile = profileData.jobSeekerProfile
    const fields = [
      profile.first_name,
      profile.last_name,
      profile.location,
      profile.bio,
      profile.skills?.length > 0,
      profile.years_experience > 0,
    ]

    const completedFields = fields.filter(Boolean).length
    return Math.round((completedFields / fields.length) * 100)
  }

  const completionPercentage = calculateCompletion()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Welcome back, {profileData?.jobSeekerProfile?.first_name || 'User'}!
                </h1>
                <p className="text-gray-600">Manage your profile and job applications</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge className="bg-emerald-100 text-emerald-700">
                <CheckCircle className="w-3 h-3 mr-1" />
                Active
              </Badge>
              <Button
                variant="outline"
                onClick={logout}
                className="text-gray-600 hover:text-gray-800"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          {/* Job Discovery Section */}
          <div className="mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-500" />
                  Discover Jobs
                </CardTitle>
                <CardDescription>
                  Swipe through personalized job recommendations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <JobSwiper />
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Completion Card */}
            <div className="lg:col-span-1">
            <Card className="border border-gray-200 rounded-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-orange-500" />
                  Profile Completion
                </CardTitle>
                <CardDescription>Complete your profile to get better job matches</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-medium text-gray-900">{completionPercentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${completionPercentage}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Completion Status */}
                  <div className="space-y-2">
                    {completionPercentage < 100 && (
                      <div className="flex items-center gap-2 text-amber-600">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm">Profile incomplete</span>
                      </div>
                    )}
                    {completionPercentage === 100 && (
                      <div className="flex items-center gap-2 text-emerald-600">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm">Profile complete!</span>
                      </div>
                    )}
                  </div>

                  {/* Edit Profile Button */}
                  <Button className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white">
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="border border-gray-200 rounded-xl mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Applications Sent</span>
                    <span className="font-semibold text-gray-900">0</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Profile Views</span>
                    <span className="font-semibold text-gray-900">0</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Matches</span>
                    <span className="font-semibold text-gray-900">0</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profile Information */}
          <div className="lg:col-span-2">
            <Card className="border border-gray-200 rounded-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-orange-500" />
                  Profile Information
                </CardTitle>
                <CardDescription>Your current profile details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900 border-b border-gray-200 pb-2">
                      Basic Information
                    </h3>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Email</p>
                          <p className="font-medium text-gray-900">{profileData?.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <User className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Full Name</p>
                          <p className="font-medium text-gray-900">
                            {profileData?.jobSeekerProfile?.first_name &&
                            profileData?.jobSeekerProfile?.last_name
                              ? `${profileData.jobSeekerProfile.first_name} ${profileData.jobSeekerProfile.last_name}`
                              : 'Not provided'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Location</p>
                          <p className="font-medium text-gray-900">
                            {profileData?.jobSeekerProfile?.location || 'Not provided'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Briefcase className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Experience</p>
                          <p className="font-medium text-gray-900">
                            {profileData?.jobSeekerProfile?.years_experience
                              ? `${profileData.jobSeekerProfile.years_experience} years`
                              : 'Not provided'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Professional Information */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900 border-b border-gray-200 pb-2">
                      Professional Details
                    </h3>

                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Bio</p>
                        <p className="text-gray-900 text-sm leading-relaxed">
                          {profileData?.jobSeekerProfile?.bio ||
                            'No bio provided yet. Add a brief description about yourself and your career goals.'}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-600 mb-2">Skills</p>
                        <div className="flex flex-wrap gap-2">
                          {profileData?.jobSeekerProfile?.skills?.length > 0 ? (
                            profileData.jobSeekerProfile.skills.map((skill, index) => (
                              <Badge key={index} className="bg-orange-100 text-orange-700">
                                {skill.name}
                              </Badge>
                            ))
                          ) : (
                            <p className="text-sm text-gray-500">No skills added yet</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Member Since</p>
                          <p className="font-medium text-gray-900">
                            {new Date(profileData?.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 mt-8 pt-6 border-t border-gray-200">
                  <Button className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white">
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                  <Button
                    variant="outline"
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Resume
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default ProfileDashboard
