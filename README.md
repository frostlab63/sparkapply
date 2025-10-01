# SparkApply - AI-Powered Job Discovery Platform

[![Build Status](https://github.com/frostlab63/sparkapply/workflows/CI/badge.svg)](https://github.com/frostlab63/sparkapply/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-1.0.0--alpha-orange.svg)](https://github.com/frostlab63/sparkapply)
[![Development Status](https://img.shields.io/badge/status-in--development-yellow.svg)](https://github.com/frostlab63/sparkapply)

## 🎯 Overview

SparkApply is an AI-powered job application platform that revolutionizes the job search experience through swipe-based job discovery, automated CV tailoring, and intelligent matching algorithms. Built on a modern microservices architecture, the platform serves job seekers, employers, and educational institutions with a gamified, engaging interface that transforms traditional job hunting into an interactive, efficient experience.

> **🚧 Current Status**: MVP Development in Progress - Sprint 1 Foundation Complete
> 
> **✅ Completed**: Project setup, brand identity, style guide, frontend foundation  
> **🔄 In Progress**: User authentication system, backend services  
> **📋 Next**: Job discovery engine, AI application generation

### ✨ Key Features

- **💫 Swipe-Based Discovery**: Tinder-like interface for browsing job opportunities
- **🤖 AI-Powered Applications**: Automated CV and cover letter generation tailored to each job
- **🎯 Smart Matching**: Advanced algorithms for job-candidate compatibility scoring
- **📊 Application Tracking**: Comprehensive dashboard for monitoring application status
- **🏢 Employer Portal**: Streamlined interface for job posting and candidate management
- **🎓 Institutional Partnerships**: University integration for student career services
- **🎮 Gamification**: Points, badges, and achievements to drive engagement
- **📱 Mobile-First Design**: Responsive PWA optimized for all devices

## 🏗️ Architecture

### Technology Stack

| Component | Technology | Version |
|-----------|------------|---------|
| **Frontend** | Next.js with TypeScript | 14.x |
| **Backend** | Node.js with Express | 18.x |
| **Databases** | PostgreSQL, MongoDB, Weaviate | Latest |
| **AI/ML** | Ollama (Llama 3.1), OpenAI GPT-4 | Latest |
| **Message Queue** | RabbitMQ | Latest |
| **Cache** | Redis | Latest |
| **Containerization** | Docker & Kubernetes | Latest |
| **CI/CD** | GitHub Actions | - |

### Microservices Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js Web   │    │   API Gateway   │    │   PostgreSQL    │
│   (Frontend)    │◄──►│   (Spring)      │◄──►│   (Users/Apps)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Service  │    │   Job Service   │    │   MongoDB       │
│   (Port 3001)   │    │   (Port 3002)   │    │   (Job Data)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   AI Service    │    │  Notification   │    │   Weaviate      │
│   (Port 3004)   │    │   (Port 3005)   │    │   (Vectors)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 18.x
- **pnpm** >= 8.x
- **Docker** & **Docker Compose**
- **PostgreSQL** >= 15.x
- **MongoDB** >= 6.x

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/frostlab63/sparkapply.git
   cd sparkapply
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development environment**
   ```bash
   pnpm run dev
   ```

5. **Using Docker (Recommended)**
   ```bash
   docker-compose up --build
   ```

## 🎨 Design System & Brand Guidelines

SparkApply features a comprehensive design system with consistent branding, components, and visual guidelines.

### 📚 Documentation
- **[Style Guide](docs/sparkapply-style-guide.md)** - Complete brand guidelines, colors, typography, and UI components
- **[Implementation Guide](docs/design-system-implementation.md)** - Developer guide for implementing the design system

### 🎨 Brand Colors
- **Primary Orange**: `#F97316` - Energy and innovation
- **Primary Red**: `#EF4444` - Passion and action  
- **Brand Gradient**: Orange to Red - Signature visual element

### 🧩 Component Library
- React components with Tailwind CSS
- Consistent spacing, typography, and interactions
- Accessibility-first design principles
- Mobile-responsive patterns

## 📁 Project Structure

```
sparkapply/
├── 📁 packages/
│   ├── 📁 web/                  # Next.js frontend application
│   └── 📁 api/                  # Backend microservices
│       ├── 📁 user-service/     # User authentication & profiles
│       ├── 📁 job-service/      # Job listings & search
│       ├── 📁 application-service/ # Application management
│       ├── 📁 ai-service/       # AI-powered features
│       ├── 📁 notification-service/ # Email & push notifications
│       ├── 📁 payment-service/  # Subscriptions & billing
│       └── 📁 analytics-service/ # User behavior & metrics
├── 📁 docs/                     # Documentation & style guides
│   ├── sparkapply-style-guide.md      # Brand & design guidelines
│   ├── design-system-implementation.md # Developer implementation guide
│   └── assets/                         # Visual assets & examples
├── 📁 .github/                  # GitHub workflows and templates
├── package.json                 # Root package configuration
├── pnpm-workspace.yaml         # Workspace configuration
└── README.md                   # This file
```

## 🔄 Development Workflow

### Sprint-Based Development

We follow a 6-sprint (12-week) development cycle:

| Sprint | Duration | Focus | Status |
|--------|----------|-------|--------|
| **Sprint 1** | Weeks 1-2 | Foundation & User Management | ✅ **Complete** |
| **Sprint 2** | Weeks 3-4 | Job & Application Services | 🔄 **In Progress** |
| **Sprint 3** | Weeks 5-6 | AI Service & Core AI Features | 📋 **Planned** |
| **Sprint 4** | Weeks 7-8 | Frontend - Job Discovery | 📋 **Planned** |
| **Sprint 5** | Weeks 9-10 | Employer & Institutional Features | 📋 **Planned** |
| **Sprint 6** | Weeks 11-12 | Gamification, Notifications & Launch | 📋 **Planned** |

### ✅ Sprint 1 Achievements
- [x] Repository setup and monorepo structure
- [x] Brand identity and comprehensive style guide
- [x] Frontend foundation with React/Next.js
- [x] Backend microservices architecture
- [x] User authentication service foundation
- [x] CI/CD pipeline with GitHub Actions

### ✅ Phase 5 CI/CD Implementation Complete
- [x] Comprehensive testing infrastructure (Frontend & Backend)
- [x] Multi-environment deployment configurations
- [x] Docker containerization for all services
- [x] Code quality enforcement (ESLint, Prettier, Husky)
- [x] Automated deployment scripts and health checks
- [x] Monitoring and logging infrastructure
- [x] Security configurations and best practices
- [x] Documentation and troubleshooting guides

### Branching Strategy

- **`main`** - Production-ready code
- **`develop`** - Integration branch for features
- **`feature/*`** - Feature development branches
- **`bugfix/*`** - Bug fix branches
- **`hotfix/*`** - Critical production fixes

## 🧪 Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run specific service tests
pnpm --filter user-service test
```

### Testing Strategy

- **Unit Tests**: Individual components and functions
- **Integration Tests**: API endpoints and workflows
- **E2E Tests**: Complete user journeys
- **Performance Tests**: Load and stress testing

## 🚀 Deployment

### Development
```bash
pnpm run dev
```

### Staging
```bash
docker-compose -f docker-compose.staging.yml up -d
```

### Production
```bash
kubectl apply -f k8s/
```

## 📚 Documentation

- [📖 API Documentation](docs/api/README.md)
- [🏗️ Architecture Guide](docs/architecture/README.md)
- [🚀 Deployment Guide](docs/deployment/README.md)
- [👤 User Guides](docs/user-guides/README.md)
- [💻 Development Setup](docs/development/README.md)

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guidelines](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

### Development Setup

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/frostlab63/sparkapply/issues)
- **Discussions**: [GitHub Discussions](https://github.com/frostlab63/sparkapply/discussions)

## 🗺️ Roadmap

### MVP (Months 1-3)
- [x] Project setup and architecture
- [ ] User authentication & profiles
- [ ] Job discovery & swiping interface
- [ ] AI-powered application generation
- [ ] Basic employer features

### Phase 2 (Months 4-6)
- [ ] Advanced AI features
- [ ] Social & networking features
- [ ] Premium subscriptions
- [ ] Mobile app development

### Phase 3 (Months 7-12)
- [ ] International expansion
- [ ] Advanced analytics
- [ ] Enterprise features
- [ ] API marketplace

## 📊 Project Status

![Progress](https://progress-bar.dev/35/?title=MVP%20Progress&color=f97316)

- **Foundation**: ✅ Complete (Sprint 1)
- **CI/CD Infrastructure**: ✅ Complete (Phase 5)
- **User Management**: 🔄 In Progress (Sprint 2)
- **Job Discovery**: ⏳ Planned (Sprint 3-4)
- **AI Features**: ⏳ Planned (Sprint 3)

### 🎯 Current Focus
- Completing user authentication system
- Building job service microservice
- Implementing application tracking
- Setting up database schemas

### 🚀 Recent Achievements (Phase 5)
- **Testing Infrastructure**: 64% test coverage with comprehensive unit and E2E tests
- **Deployment Automation**: Multi-environment deployment with Docker and scripts
- **Code Quality**: Automated linting, formatting, and pre-commit hooks
- **Monitoring**: Health checks, smoke tests, and logging infrastructure
- **Security**: Environment isolation, secret management, and security headers

---

**Built with ❤️ for the future of job searching**
