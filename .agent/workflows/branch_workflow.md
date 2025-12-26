---
description: Branch workflow for module lifecycle (review, repair, enhance, validate, deploy)
---

# Branch Workflow for a Single Module

This workflow outlines the **five** stages you should follow for any module in the Fleet codebase. Each stage lives on its own Git branch, making changes isolated, reviewable, and CI‑friendly.

## 1️⃣ Review (`review/<module-name>`)
- **Goal**: Understand current implementation and surface existing issues.
- **Actions**:
  - `git checkout -b review/<module-name> main`
  - Run lint, type‑check, and unit tests: `npm run lint && npm run test && tsc --noEmit`.
  - Document findings in a `README.md` inside the branch (or a markdown note).
  - Capture any performance or UX concerns.

## 2️⃣ Repair (`repair/<module-name>`)
- **Goal**: Fix build‑blocking bugs, lint errors, and type mismatches.
- **Actions**:
  - `git checkout -b repair/<module-name> review/<module-name>`
  - Apply targeted code edits (e.g., close JSX tags, add missing types).
  - Re‑run the full build: `npm run build`.
  - Ensure the CI pipeline passes for this branch.

## 3️⃣ Enhance (`enhance/<module-name>`)
- **Goal**: Add the requested new functionality (e.g., virtual scrolling, pagination, UI polish).
- **Actions**:
  - `git checkout -b enhance/<module-name> repair/<module-name>`
  - Implement the feature, add any new components, and update tests.
  - Update documentation/comments as needed.
  - Run `npm run test` to verify coverage.

## 4️⃣ Validate (`validate/<module-name>`)
- **Goal**: Verify that the module works end‑to‑end and meets quality gates.
- **Actions**:
  - `git checkout -b validate/<module-name> enhance/<module-name>`
  - Run the full suite: `npm run lint && npm run test && npm run build`.
  - Manually spin up the dev server (`npm run dev`) and perform UI sanity checks.
  - Record any remaining observations in the branch’s README.

## 5️⃣ Deploy (`deploy/<module-name>`)
- **Goal**: Merge the validated changes into `main` (or a release branch) and trigger CI/CD.
- **Actions**:
  - Push the branch: `git push origin validate/<module-name>`.
  - Open a Pull Request targeting `main`.
  - Ensure all CI checks pass (lint, tests, build, security scans).
  - After approval, merge. The CI pipeline will automatically deploy to staging/production based on your repo’s configuration.

---

### How to Use the Workflow
1. **Pick a module** (e.g., `AssetManagement`, `moduleManager`, `EVChargingManagement`).
2. Follow the steps above, substituting `<module-name>` with the actual name.
3. After each stage, push the branch and create a PR so reviewers can see incremental progress.
4. Repeat for the next module.

Feel free to adjust branch naming conventions to match your team’s style (e.g., `feature/`, `bugfix/`). The core idea is to keep each logical step isolated, making code reviews easier and CI feedback faster.

---

**Next Step**: Let me know which module you’d like to start with, and I can generate the first `review/<module>` branch checklist or even scaffold a PR template for you.
