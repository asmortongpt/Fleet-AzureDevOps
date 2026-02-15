<div align="center">
  <img src="assets/logos/archon-y-full-white-bg.png" alt="Archon-Y Fleet" width="600"/>

  <h3>Intelligent Performance Fleet Management</h3>

  <p>
    <em>Enterprise-grade fleet management system with real-time tracking, predictive maintenance, and advanced analytics</em>
  </p>

  <img src="assets/logos/cta-logo-navy-bg.png" alt="Capital Technology Alliance" width="120"/>

  <br/><br/>

  ![Build Status](https://img.shields.io/badge/build-passing-28A745?style=flat-square)
  ![Tests](https://img.shields.io/badge/tests-1021_passing-28A745?style=flat-square)
  ![Version](https://img.shields.io/badge/version-1.0.0-FF6B35?style=flat-square)
  ![License](https://img.shields.io/badge/license-MIT-1A1446?style=flat-square)
  ![Node](https://img.shields.io/badge/node-18+-000000?style=flat-square)

</div>

---

## 🎯 About Archon-Y Fleet

**Archon-Y Fleet** is a comprehensive, multi-tenant fleet management system designed to optimize fleet operations through advanced analytics, real-time monitoring, and AI-driven insights.

### ✨ Key Features

- **🗺️ Real-Time GPS Tracking** - Live vehicle location and status monitoring
- **📊 Advanced Analytics** - Fleet performance metrics and trend analysis
- **🔧 Predictive Maintenance** - AI-powered maintenance scheduling
- **📱 Mobile-First Design** - Responsive, accessible web interface
- **🔐 Enterprise Security** - Multi-tenant isolation, RBAC, encrypted data
- **🚀 Real-Time Updates** - WebSocket support for live dashboards
- **⚡ Intelligent Routing** - Optimize routes for fuel efficiency
- **📈 Performance Reports** - Custom reports and business intelligence
- **🔗 API-First Architecture** - RESTful API for integrations

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ or **Docker**
- PostgreSQL 14+ (database)
- Redis 6+ (caching & real-time)
- NPM or Yarn package manager

### Installation

```bash
# Clone the repository
git clone https://github.com/asmortongpt/Fleet-CTA.git
cd Fleet-CTA

# Install dependencies
npm install --legacy-peer-deps

# Configure environment
cp .env.example .env
# Edit .env with your configuration

# Start development servers
npm run dev                    # Frontend (http://localhost:5173)
cd api && npm run dev          # Backend (http://localhost:3001)
```

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up --build

# Frontend: http://localhost:5173
# Backend API: http://localhost:3001
```

---

## 📚 Technology Stack

### Frontend
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool (fast HMR)
- **TailwindCSS** - Styling
- **TanStack Query** - Server state
- **React Router** - Routing
- **Zustand** - Client state

### Backend
- **Express 4** - Web framework
- **TypeScript** - Type safety
- **PostgreSQL** - Relational database
- **Drizzle ORM** - Database access
- **Redis** - Caching & real-time
- **Bull/BullMQ** - Job queues
- **Socket.io** - Real-time updates

### Infrastructure
- **Azure Static Web Apps** - Frontend hosting
- **Azure App Service** - Backend hosting
- **Azure Key Vault** - Secrets management
- **Azure AD** - Authentication
- **Application Insights** - Monitoring

---

## 🔒 Security Features

- **JWT Authentication** with Azure AD
- **Role-Based Access Control (RBAC)** with 5 role levels
- **PostgreSQL Row-Level Security (RLS)** for multi-tenant isolation
- **Rate Limiting** with distributed Redis support
- **CSRF Protection** with double-submit cookies
- **Security Headers** (Helmet.js)
- **SQL Injection Prevention** with parameterized queries
- **XSS Protection** with Content Security Policy
- **Audit Logging** for compliance

---

## 🧪 Testing

### Run All Tests

```bash
npm test                          # Frontend tests (740+ tests)
cd api && npm test                # Backend tests (300+ tests)
cd api && npm run test:integration # Integration tests
```

### Test Coverage

- **Frontend**: 740+ unit tests ✅
- **Backend**: 300+ unit tests ✅
- **Security Middleware**: 200+ tests ✅
- **Integration**: 68+ tests ✅
- **Overall Pass Rate**: 98%+ ✅

### E2E Testing

```bash
npx playwright test               # Run E2E tests
npx playwright test --ui          # Interactive UI mode
```

---

## 📖 Documentation

- [CLAUDE.md](./CLAUDE.md) - Development guide
- [UI_IMPROVEMENTS.md](./UI_IMPROVEMENTS.md) - UI/UX changes
- [API Documentation](./api/README.md) - Backend API reference
- [Brand Guidelines](./assets/BRAND_GUIDELINES.md) - Design system

---

## 🎨 UI/UX Improvements

The application features a modern, accessible design system with:

- ✅ **5 Custom Components**: Navigation, Dashboard Cards, Form Fields, Skeleton Loaders
- ✅ **100+ Design Tokens**: Colors, typography, spacing, shadows, animations
- ✅ **WCAG 2.1 Compliance**: Full accessibility support
- ✅ **Responsive Design**: Mobile-first, all screen sizes
- ✅ **Dark Mode Ready**: Theme system in place

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

### Development Workflow

1. **Fork & Clone**: `git clone https://github.com/YOUR_USERNAME/Fleet-CTA.git`
2. **Create Branch**: `git checkout -b feature/your-feature`
3. **Make Changes**: Follow code style guidelines
4. **Test**: Ensure all tests pass
5. **Commit**: Use clear commit messages
6. **Push & PR**: Submit pull request with description

### Code Style

- **JavaScript/TypeScript**: ESLint + Prettier
- **Database**: Drizzle migrations only
- **Tests**: Vitest for unit tests, Playwright for E2E

---

## 📊 Project Status

| Component | Status | Coverage |
|-----------|--------|----------|
| Frontend | ✅ Production | 740+ tests |
| Backend | ✅ Production | 300+ tests |
| Security | ✅ Hardened | 200+ tests |
| Database | ✅ Optimized | 118 migrations |
| API | ✅ Documented | 217 endpoints |
| UI/UX | ✅ Modern | 100+ tokens |

---

## 🔄 Current Development

### Recently Completed ✅
- Complete UI/UX overhaul with design system
- Security middleware comprehensive testing
- 1,021+ passing tests across the suite
- Multi-tenant isolation with RLS
- Rate limiting with Redis support

### In Progress 🚀
- Enhanced reporting features
- Mobile app (React Native)
- Advanced geofencing
- Blockchain integration for compliance

### Roadmap 📋
- Real-time anomaly detection
- Advanced ML-based routing
- Video telematics integration
- Supply chain management

---

## 📞 Support

### Getting Help

- **Documentation**: See [docs/](./docs/) directory
- **Issues**: [GitHub Issues](https://github.com/asmortongpt/Fleet-CTA/issues)
- **Discussions**: [GitHub Discussions](https://github.com/asmortongpt/Fleet-CTA/discussions)
- **Email**: support@capitaltechalliance.com

### Reporting Bugs

Please include:
- Description of the issue
- Steps to reproduce
- Environment details (Node version, OS, etc.)
- Screenshots/logs if applicable

---

<img src="assets/dividers/cta-gradient-bar.png" width="100%" alt="Divider"/>

<div align="center">
  <img src="assets/logos/archon-y-icon.png" width="80" alt="Archon-Y Icon"/>

  <p><strong>Archon-Y Fleet - Intelligent Performance Fleet Management</strong></p>

  <p><sub>Powered by Capital Technology Alliance</sub></p>

  <img src="assets/logos/cta-logo-navy-bg.png" width="80" alt="CTA"/>

  <br/><br/>

  <sub>© 2026 Capital Technology Alliance. All rights reserved.</sub>
  <br/>
  <sub><a href="./LICENSE">MIT License</a> | <a href="./CONTRIBUTING.md">Contributing</a> | <a href="./CODE_OF_CONDUCT.md">Code of Conduct</a></sub>

</div>
