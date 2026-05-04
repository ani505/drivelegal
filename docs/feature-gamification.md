# Feature: Gamification & Community

**Branch:** `feature/gamification`  
**Status:** 🔲 Planned — Phase 3

## Overview
Safe driver badges, leaderboards, community enforcement zone reporting, and insurance discount integration.

## Planned Implementation

### Backend Files to Create
- `app/models/gamification.py` — Badge, Achievement, Leaderboard models
- `app/services/gamification_service.py` — Badge award logic
- `app/api/routes/gamification.py` — REST endpoints

### New DB Models
```python
class Badge(Base):
    id, name, description, icon, criteria, points_required

class UserBadge(Base):
    user_id, badge_id, earned_at

class Leaderboard(Base):
    user_id, region, score, rank, period (monthly/yearly)
```

### API Endpoints to Add
```
GET  /api/v1/gamification/badges           — List all badges
GET  /api/v1/gamification/my-badges        — User's earned badges
GET  /api/v1/gamification/leaderboard      — Regional/national rankings
POST /api/v1/gamification/check-badges     — Evaluate new badge eligibility
GET  /api/v1/gamification/insurance-deals  — Partner insurance discounts
```

### Badge Ideas
- 🏆 Clean Slate — 1 year violation-free
- 🚀 Perfect Score — 100 compliance score
- 🗺️ Road Guardian — 10 enforcement zone reports
- 📚 Law Learner — Completed 5 legal Q&A sessions
- 🌍 Global Driver — Checked laws in 3+ countries

## Frontend Components
- `BadgeGrid.tsx` — Display earned badges
- `LeaderboardTable.tsx` — Ranking table
- `InsurancePartners.tsx` — Partner deals carousel
