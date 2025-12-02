# ✨ Fleet

[![Playwright Production Tests](https://github.com/asmortongpt/Fleet/actions/workflows/playwright-production.yml/badge.svg)](https://github.com/asmortongpt/Fleet/actions/workflows/playwright-production.yml)
[![Test Suite](https://github.com/asmortongpt/Fleet/actions/workflows/test.yml/badge.svg)](https://github.com/asmortongpt/Fleet/actions/workflows/test.yml)
[![CI/CD](https://github.com/asmortongpt/Fleet/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/asmortongpt/Fleet/actions/workflows/ci-cd.yml)

A modern cloud platform built with GitHub Spark.

## 🚀 Overview

Fleet is a comprehensive cloud platform leveraging GitHub Spark for rapid development and deployment. This project provides a clean, scalable foundation for building cloud-native applications.

## 🏗️ What's Inside?

- **GitHub Spark Integration** - Built on GitHub's modern development platform
- **React 19** - Latest React features and performance improvements
- **TypeScript** - Type-safe development experience
- **Tailwind CSS** - Modern utility-first styling
- **Vite** - Lightning-fast build tooling
- **Radix UI** - Accessible component primitives

## 🛠️ Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🧪 Testing

Fleet includes a comprehensive test suite with 122+ Playwright tests covering all aspects of the application.

### Run Tests Locally

```bash
# Run all E2E tests
npm test

# Run specific test suites
npm run test:smoke          # Smoke tests
npm run test:main           # Main modules
npm run test:management     # Management modules
npm run test:procurement    # Procurement & communication
npm run test:tools          # Tools modules
npm run test:workflows      # Workflows
npm run test:validation     # Form validation
npm run test:a11y           # Accessibility tests
npm run test:performance    # Performance tests
npm run test:security       # Security tests
npm run test:load           # Load tests

# Run tests in UI mode
npm run test:ui

# Run tests in headed mode (see browser)
npm run test:headed

# View test report
npm run test:report
```

### CI/CD Testing

Tests automatically run on:
- **Pull Requests** to main branch
- **Push** to main branch
- **Nightly** at 2 AM UTC
- **Manual trigger** via GitHub Actions

Production tests run against: `http://68.220.148.2`

#### Manual Trigger

You can manually trigger tests from GitHub Actions:
1. Go to [Actions](https://github.com/asmortongpt/Fleet/actions/workflows/playwright-production.yml)
2. Click "Run workflow"
3. Select test suite and browser (optional)
4. Click "Run workflow"

Test results are available as artifacts for 7-30 days.

## 📚 Documentation

Visit our [documentation site](https://asmortongpt.github.io/Fleet/) for detailed guides and API references.

## 🔗 Links

- **GitHub Repository**: [github.com/asmortongpt/Fleet](https://github.com/asmortongpt/Fleet)
- **GitHub Spark**: [github.com/spark/asmortongpt/fleet](https://github.com/spark/asmortongpt/fleet)

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
