#!/bin/bash
# =============================================================
# DriveLegal — Git Repository & Branch Setup Script
# Run once after cloning: bash scripts/setup_git_branches.sh
# =============================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚗 DriveLegal — Setting up Git branches${NC}"
echo "=================================================="

# Initialize git if not already done
if [ ! -d ".git" ]; then
  git init
  echo -e "${GREEN}✅ Git repository initialized${NC}"
fi

# Configure git (update with your details)
# git config user.name "Your Name"
# git config user.email "you@email.com"

# ── Initial commit on main ────────────────────────────────────
echo -e "\n${YELLOW}📌 Setting up main branch...${NC}"
git add .
git commit -m "chore: initial project structure — DriveLegal Road Safety Hackathon 2026" 2>/dev/null || true
git branch -M main

# ── develop branch ───────────────────────────────────────────
echo -e "\n${YELLOW}📌 Creating develop branch...${NC}"
git checkout -b develop
git push origin develop 2>/dev/null || echo "  (push skipped — no remote set)"

# ── Feature Branches ─────────────────────────────────────────
BRANCHES=(
  "feature/backend-core:✅ FastAPI + PostgreSQL + ChromaDB setup"
  "feature/ai-legal-assistant:🤖 RAG chatbot with Claude/Gemini"
  "feature/document-ocr:📄 OCR citation processing"
  "feature/predictive-risk:📊 Risk scoring + route alerts"
  "feature/blockchain-records:⛓️  Immutable violation records"
  "feature/multi-jurisdiction:🌍 Cross-border legal integration"
  "feature/computer-vision:👁️  Traffic sign recognition"
  "feature/gamification:🏆 Badges + leaderboards"
  "feature/accessibility:♿ Voice + TTS + 25 languages"
  "feature/integrations:🔗 Maps + insurance + govt APIs"
  "feature/analytics-dashboard:📈 Compliance scores + trends"
  "feature/frontend-nextjs:⚛️  Next.js 14 frontend"
)

echo -e "\n${YELLOW}📌 Creating feature branches...${NC}"
for branch_info in "${BRANCHES[@]}"; do
  branch="${branch_info%%:*}"
  description="${branch_info##*:}"
  
  git checkout -b "$branch" develop 2>/dev/null || git checkout "$branch"
  
  # Create branch README
  mkdir -p ".branch-info"
  echo "# ${description}
  
Branch: \`${branch}\`
Base: \`develop\`
Created: $(date -u +%Y-%m-%dT%H:%M:%SZ)

## Description
${description}

## How to work on this branch
\`\`\`bash
git checkout ${branch}
git pull origin develop  # keep up to date
# ... make your changes ...
git push origin ${branch}
# Open a PR to merge into develop
\`\`\`
" > ".branch-info/${branch//\//-}.md"
  
  git add ".branch-info/${branch//\//-}.md"
  git commit -m "chore: initialize branch ${branch} — ${description}" 2>/dev/null || true
  
  echo -e "  ${GREEN}✅${NC} ${branch}"
done

# ── Back to develop ───────────────────────────────────────────
git checkout develop
echo -e "\n${GREEN}🎉 All branches created!${NC}"
echo ""
echo -e "${BLUE}Branch Summary:${NC}"
git branch --list
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Add your remote:  git remote add origin <your-github-url>"
echo "  2. Push all branches: git push --all origin"
echo "  3. On GitHub: Set 'develop' as the default branch"
echo "  4. Start backend:    cd backend && uvicorn app.main:app --reload"
echo ""
echo -e "${GREEN}Happy coding! 🚀${NC}"
