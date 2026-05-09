# Contributing to SkyTrack

Thank you for considering contributing to **SkyTrack**! We welcome contributions that help refine the tactical UI, improve geospatial logic, or harden security protocols.

---

## Getting Started

1. **Fork** the repository on GitHub.
2. **Clone** your fork:
```bash
git clone https://github.com/<your-username>/skytrack.git
cd skytrack
```
3. **Add upstream remote** so you can stay in sync:
```bash
git remote add upstream https://github.com/darshil0/skytrack.git
git fetch upstream
```
4. **Create a feature branch** from `main`:
```bash
git checkout -b feat/your-feature-name
```

---
##  Development Setup

### Prerequisites
- **Node.js**: v22 or higher
- **npm**: latest

### Installation
```bash
# Install dependencies
npm install

# Start the development server (Vite + Express)
npm run dev

# Run all tests before submitting changes
npm test
```

## Branch Naming Convention

Use the following prefixes:

| Prefix | Use for |
| ----------- | ------------------------ |
| `feat/` | New features |
| `fix/` | Bug fixes |
| `docs/` | Documentation changes |
| `refactor/` | Code refactoring |
| `test/` | Adding or updating tests |
| `chore/` | Maintenance tasks |

---

## Commit Message Format

```
<scope>: <short clear action in present tense>.
```

## Pull Request Guidelines

> **Before starting work, sync your fork with upstream `main`.**
> Opening a PR from a stale fork causes unnecessary merge conflicts.
> Run these steps before creating your feature branch:
>
> ```bash
> # Step 1 — Sync your fork with upstream before starting work
> git fetch upstream
> git checkout main
> git rebase upstream/main
> git push origin main
>
> # Step 2 — Then create your feature branch
> git checkout -b feat/your-feature-name
> ```

1. **One PR = One Purpose**: fix one bug, add one feature, or improve documentation.
2. Keep PRs **small and focused** — large PRs are harder to review.
3. Fill in the **PR template** completely (it loads automatically).
4. **Link the relevant issue** using `Fixes #<issue-number>`.
5. **All CI checks must pass** — maintainers will not review failing PRs.
6. Add or update **tests** for any new functionality.
7. Update **documentation** (README, docstrings, comments) as needed.

---

## Code of Conduct
Please be respectful and professional in all interactions. We aim to maintain a high-quality, mission-critical environment for all contributors.
