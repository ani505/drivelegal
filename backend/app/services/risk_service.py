"""
DriveLegal — Risk Scoring & Predictive Compliance Service
"""
from typing import Optional
from datetime import datetime, timedelta


class RiskService:
    """
    Calculates driving risk scores and compliance metrics.
    
    Risk Score: 0-100 (0 = safest, 100 = highest risk)
    Compliance Score: 0-100 (100 = perfect compliance)
    """

    SEVERITY_WEIGHTS = {
        "low": 5,
        "medium": 15,
        "high": 30,
        "critical": 50,
    }

    RECENCY_MULTIPLIERS = {
        0: 2.0,    # within 3 months
        1: 1.5,    # 3-6 months
        2: 1.2,    # 6-12 months
        3: 1.0,    # 1-2 years
        4: 0.5,    # 2+ years
    }

    def calculate_risk_score(
        self,
        violations: list,
        total_points: int,
        points_limit: int,
        suspension_count: int = 0,
    ) -> dict:
        """
        Calculate a comprehensive risk score from violation history.
        """
        if not violations:
            return self._low_risk_result()

        now = datetime.utcnow()
        weighted_score = 0.0

        recent_count = 0
        last_year_count = 0

        for v in violations:
            severity = getattr(v, "severity", "medium")
            if hasattr(severity, "value"):
                severity = severity.value

            base_weight = self.SEVERITY_WEIGHTS.get(severity, 15)

            # Recency factor
            incident_date = getattr(v, "incident_date", None) or getattr(v, "created_at", now)
            months_ago = (now - incident_date).days / 30 if incident_date else 24
            recency_key = min(int(months_ago / 3), 4)
            multiplier = self.RECENCY_MULTIPLIERS[recency_key]

            weighted_score += base_weight * multiplier

            if months_ago <= 3:
                recent_count += 1
            if months_ago <= 12:
                last_year_count += 1

        # Points factor
        points_ratio = total_points / max(points_limit, 1)
        points_contribution = points_ratio * 30

        # Suspension history
        suspension_contribution = min(suspension_count * 10, 30)

        raw_score = weighted_score + points_contribution + suspension_contribution
        risk_score = min(raw_score, 100.0)

        # Compliance score is inverse
        compliance_score = max(0.0, 100.0 - risk_score)

        risk_level = self._get_risk_level(risk_score)

        risk_factors = self._identify_risk_factors(
            violations, recent_count, last_year_count, points_ratio, suspension_count
        )
        recommendations = self._get_recommendations(risk_level, risk_factors)
        insurance_impact = self._estimate_insurance_impact(risk_score)

        return {
            "risk_score": round(risk_score, 1),
            "compliance_score": round(compliance_score, 1),
            "risk_level": risk_level,
            "top_risk_factors": risk_factors[:5],
            "recommendations": recommendations[:5],
            "estimated_insurance_impact": insurance_impact,
            "violations_analyzed": len(violations),
            "last_calculated": now,
        }

    def _low_risk_result(self) -> dict:
        return {
            "risk_score": 0.0,
            "compliance_score": 100.0,
            "risk_level": "low",
            "top_risk_factors": [],
            "recommendations": ["Maintain your excellent driving record!"],
            "estimated_insurance_impact": "Eligible for safe driver discounts",
            "violations_analyzed": 0,
            "last_calculated": datetime.utcnow(),
        }

    def _get_risk_level(self, score: float) -> str:
        if score < 20:
            return "low"
        elif score < 40:
            return "medium"
        elif score < 65:
            return "high"
        return "critical"

    def _identify_risk_factors(
        self, violations, recent_count, last_year_count, points_ratio, suspension_count
    ) -> list[str]:
        factors = []
        if recent_count >= 2:
            factors.append(f"{recent_count} violations in the last 3 months")
        if last_year_count >= 3:
            factors.append(f"{last_year_count} violations in the past year")
        if points_ratio > 0.7:
            factors.append(f"License points at {int(points_ratio * 100)}% of limit")
        if suspension_count > 0:
            factors.append(f"History of {suspension_count} license suspension(s)")

        # Check for critical violations
        critical = [v for v in violations if getattr(getattr(v, "violation_type", None), "severity", None) == "critical"]
        if critical:
            factors.append(f"{len(critical)} critical violation(s) on record")

        return factors

    def _get_recommendations(self, risk_level: str, factors: list) -> list[str]:
        base = {
            "low": [
                "Continue your safe driving habits",
                "Consider defensive driving courses for insurance discounts",
            ],
            "medium": [
                "Review traffic laws in your area",
                "Consider a defensive driving course",
                "Monitor your license point balance regularly",
            ],
            "high": [
                "Enroll in a certified defensive driving program immediately",
                "Review all recent violations and understand the rules",
                "Consider consulting a traffic attorney about your record",
                "Check insurance policy — premiums may increase",
            ],
            "critical": [
                "Consult a traffic attorney urgently",
                "Risk of license suspension is high — drive with extreme caution",
                "Attend mandatory safe driving workshops",
                "Contact your insurer about coverage implications",
                "Avoid all traffic violations — next offense could result in suspension",
            ],
        }
        return base.get(risk_level, [])

    def _estimate_insurance_impact(self, risk_score: float) -> str:
        if risk_score < 20:
            return "Eligible for 5-15% safe driver discount"
        elif risk_score < 40:
            return "Standard rates apply"
        elif risk_score < 65:
            return "Premium increase of 20-40% likely"
        return "Premium increase of 50%+ or policy non-renewal possible"


risk_service = RiskService()
