import { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Zap, Users, Target, Sparkles, ArrowRight, Heart, Briefcase, TrendingUp } from 'lucide-react'
import sparkApplyLogo from './assets/sparkapply-logo.png'
import './App.css'

function App() {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src={sparkApplyLogo} alt="SparkApply" className="h-8 w-auto" />
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#features" className="text-gray-600 hover:text-orange-500 transition-colors">Features</a>
            <a href="#how-it-works" className="text-gray-600 hover:text-orange-500 transition-colors">How it Works</a>
            <a href="#pricing" className="text-gray-600 hover:text-orange-500 transition-colors">Pricing</a>
            <Button variant="outline" className="mr-2">Sign In</Button>
            <Button className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white">
              Get Started
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <Badge className="mb-6 bg-orange-100 text-orange-700 hover:bg-orange-200">
            <Zap className="w-4 h-4 mr-1" />
            AI-Powered Job Discovery
          </Badge>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight bg-gradient-to-r from-orange-500 via-red-500 to-pink-600 bg-clip-text text-transparent">
            Swipe Your Way to Your Dream Job
          </h1>
          <p className="text-lg md:text-xl text-gray-500 mb-8 max-w-3xl mx-auto leading-relaxed">
            SparkApply revolutionizes job searching with AI-powered matching, automated applications, 
            and a Tinder-like interface that makes finding your next opportunity engaging and efficient.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white text-lg px-8 py-6 font-semibold rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/30 hover:-translate-y-0.5"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              Start Swiping Jobs
              <ArrowRight className={`ml-2 w-5 h-5 transition-transform duration-300 ${isHovered ? 'translate-x-1' : ''}`} />
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-6 font-semibold rounded-lg border-2 border-orange-500 text-orange-500 hover:bg-orange-50 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
              Watch Demo
            </Button>
          </div>
          <div className="mt-16 flex flex-col sm:flex-row justify-center items-center gap-6 sm:gap-8">
            <div className="flex items-center text-gray-600">
              <Users className="w-5 h-5 mr-2 text-orange-500" />
              <span className="font-medium">10K+ Job Seekers</span>
            </div>
            <div className="flex items-center text-gray-600">
              <Briefcase className="w-5 h-5 mr-2 text-orange-500" />
              <span className="font-medium">5K+ Jobs Posted</span>
            </div>
            <div className="flex items-center text-gray-600">
              <TrendingUp className="w-5 h-5 mr-2 text-emerald-500" />
              <span className="font-medium">85% Match Rate</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900">Why Choose SparkApply?</h2>
            <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
              Our AI-powered platform transforms the traditional job search into an engaging, 
              efficient, and personalized experience.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border border-gray-200 rounded-xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-white">
              <CardHeader className="p-0">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Heart className="w-6 h-6 text-orange-500" />
                </div>
                <CardTitle className="text-xl font-semibold text-gray-900 mb-3">Swipe-Based Discovery</CardTitle>
                <CardDescription className="text-gray-500 leading-relaxed">
                  Browse jobs like dating apps - swipe right on opportunities you love, 
                  left on those you don't. It's that simple!
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border border-gray-200 rounded-xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-white">
              <CardHeader className="p-0">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Sparkles className="w-6 h-6 text-red-500" />
                </div>
                <CardTitle className="text-xl font-semibold text-gray-900 mb-3">AI-Generated Applications</CardTitle>
                <CardDescription className="text-gray-500 leading-relaxed">
                  Our AI creates tailored CVs and cover letters for each job, 
                  highlighting your relevant skills and experience automatically.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border border-gray-200 rounded-xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-white">
              <CardHeader className="p-0">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Target className="w-6 h-6 text-orange-500" />
                </div>
                <CardTitle className="text-xl font-semibold text-gray-900 mb-3">Smart Matching</CardTitle>
                <CardDescription className="text-gray-500 leading-relaxed">
                  Advanced algorithms analyze your profile and preferences to show 
                  you the most relevant opportunities first.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-4 bg-gray-50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900">How SparkApply Works</h2>
            <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
              Get started in minutes and let our AI do the heavy lifting for your job search.
            </p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: "1", title: "Create Profile", desc: "Upload your resume and set preferences" },
              { step: "2", title: "Start Swiping", desc: "Browse personalized job recommendations" },
              { step: "3", title: "AI Applies", desc: "We generate and submit tailored applications" },
              { step: "4", title: "Track Progress", desc: "Monitor responses and schedule interviews" }
            ].map((item, index) => (
              <div key={index} className="text-center group">
                <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900">{item.title}</h3>
                <p className="text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-orange-500 to-red-500">
        <div className="container mx-auto text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">Ready to Transform Your Job Search?</h2>
          <p className="text-lg md:text-xl mb-8 opacity-90 max-w-2xl mx-auto leading-relaxed">
            Join thousands of job seekers who have already discovered their dream jobs through SparkApply.
          </p>
          <Button size="lg" variant="secondary" className="text-lg px-8 py-6 font-semibold bg-white text-orange-500 hover:bg-gray-50 rounded-lg transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
            Get Started for Free
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <img src={sparkApplyLogo} alt="SparkApply" className="h-8 w-auto brightness-0 invert" />
              </div>
              <p className="text-gray-400">
                AI-powered job discovery platform for the modern job seeker.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 SparkApply. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
