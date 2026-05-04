"""
DriveLegal — AI Legal Assistant Service
Supports: Anthropic Claude + Google Gemini
"""
import json
from typing import Optional
import anthropic
import google.generativeai as genai
from app.core.config import settings


SYSTEM_PROMPT = """You are DriveLegal, an expert AI assistant specializing in traffic laws, 
road safety regulations, and vehicle compliance. You provide accurate, location-specific 
information about traffic violations, fines, legal procedures, and driver rights.

Guidelines:
- Always specify the jurisdiction (country/state) your answer applies to
- Cite relevant legal sections when possible (e.g., Section 183 of the Motor Vehicles Act)
- Clarify if a question requires a lawyer for specific legal advice
- Be concise but thorough — drivers need clear, actionable information
- If the user's language is not English, respond in their language
- Never provide information that could encourage reckless or dangerous driving

When answering about fines:
- Give the range (minimum to maximum)
- Mention any license points or demerit implications
- Note if imprisonment is possible for severe violations

Format responses with clear structure when explaining procedures."""


class AIService:
    """Unified AI service supporting multiple LLM providers."""

    def __init__(self):
        self.provider = settings.LLM_PROVIDER
        
        # Anthropic Setup
        if settings.ANTHROPIC_API_KEY:
            self.anthropic_client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        else:
            self.anthropic_client = None
            
        # Gemini Setup
        if settings.GEMINI_API_KEY:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            self.gemini_model = genai.GenerativeModel('gemini-flash-latest')
        else:
            self.gemini_model = None

    async def chat(
        self,
        message: str,
        conversation_history: list[dict],
        country_code: Optional[str] = None,
        state_code: Optional[str] = None,
        language: str = "en",
        rag_context: Optional[str] = None,
    ) -> tuple[str, list[dict]]:
        """
        Send a message to the LLM and get a response.
        Returns (response_text, sources_list)
        """
        # Build location-aware system prompt
        location_context = ""
        if country_code:
            location_context = f"\nUser's jurisdiction: {country_code}"
            if state_code:
                location_context += f" / {state_code}"

        language_context = ""
        if language != "en":
            language_context = f"\nRespond in language code: {language}"

        rag_section = ""
        if rag_context:
            rag_section = f"\n\nRelevant legal database context:\n{rag_context}"

        system = SYSTEM_PROMPT + location_context + language_context + rag_section

        # Build messages array
        messages = conversation_history + [{"role": "user", "content": message}]

        if self.provider == "anthropic" and self.anthropic_client:
            return await self._anthropic_chat(system, messages)
        elif self.provider == "gemini" and self.gemini_model:
            return await self._gemini_chat(system, messages)
        else:
            # Automatic fallback if provider is set but client is missing
            if self.anthropic_client:
                return await self._anthropic_chat(system, messages)
            if self.gemini_model:
                return await self._gemini_chat(system, messages)
            
            return await self._fallback_response(message, country_code)

    async def _anthropic_chat(self, system: str, messages: list[dict]) -> tuple[str, list]:
        """Call Claude API."""
        try:
            response = self.anthropic_client.messages.create(
                model="claude-3-sonnet-20240229",
                max_tokens=1500,
                system=system,
                messages=messages,
            )
            content = response.content[0].text
            return content, []
        except Exception as exc:
            err_text = str(exc).lower()
            if "credit balance is too low" in err_text or "insufficient_funds" in err_text:
                if self.gemini_model:
                    # Automatic switch to Gemini if Anthropic fails due to credits
                    return await self._gemini_chat(system, messages)
                return ("Anthropic credits exhausted. Please switch to Gemini in .env.", [])
            
            if "invalid x-api-key" in err_text or "authentication_error" in err_text or "401" in err_text:
                return (
                    "DriveLegal AI is ready. Your configured Anthropic API key is invalid. "
                    "Please update ANTHROPIC_API_KEY in backend .env with a valid key, "
                    "or switch to GEMINI_API_KEY.",
                    [],
                )
            raise

    async def _gemini_chat(self, system: str, messages: list[dict]) -> tuple[str, list]:
        """Call Gemini API."""
        try:
            # Combine system and user messages for Gemini
            prompt = f"System Instruction: {system}\n\n"
            for m in messages:
                role = "User" if m['role'] == "user" else "Assistant"
                prompt += f"{role}: {m['content']}\n"
            
            response = self.gemini_model.generate_content(prompt)
            return response.text, []
        except Exception as exc:
            return (f"Gemini API Error: {str(exc)}", [])

    async def _fallback_response(self, message: str, country_code: Optional[str]) -> tuple[str, list]:
        """Fallback when no LLM API key is configured."""
        return (
            f"DriveLegal AI is ready. For '{message}' in {country_code or 'your jurisdiction'}, "
            "please configure your API key (ANTHROPIC_API_KEY or GEMINI_API_KEY) in .env to get detailed legal information.",
            []
        )

    async def extract_violation_from_text(self, ocr_text: str) -> dict:
        """
        Extract structured violation data from OCR text of a traffic citation.
        """
        prompt = f"""Analyze this traffic citation/ticket text and extract structured information.
Return ONLY a valid JSON object with these fields:
{{
  "violation_type": "string or null",
  "violation_code": "string or null",
  "fine_amount": "number or null",
  "currency": "string or null",
  "violation_date": "ISO date string or null",
  "location": "string or null",
  "vehicle_number": "string or null",
  "officer_id": "string or null",
  "court_date": "ISO date string or null",
  "appeal_deadline": "ISO date string or null",
  "legal_section": "string or null",
  "notes": "string or null"
}}

Citation text:
{ocr_text}"""

        if self.provider == "gemini" and self.gemini_model:
            response = self.gemini_model.generate_content(prompt)
            text = response.text
        elif self.anthropic_client:
            response = self.anthropic_client.messages.create(
                model="claude-3-sonnet-20240229",
                max_tokens=500,
                messages=[{"role": "user", "content": prompt}],
            )
            text = response.content[0].text
        else:
            return {"error": "No LLM API configured"}

        # Strip any markdown code fences
        text = text.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            return {"raw_extraction": text, "error": "Failed to parse JSON"}

    async def generate_appeal_guidance(
        self,
        violation_type: str,
        country_code: str,
        state_code: Optional[str],
        circumstances: Optional[str],
    ) -> str:
        """Generate step-by-step appeal instructions."""
        prompt = f"""Generate step-by-step guidance for appealing a traffic violation.

Violation: {violation_type}
Jurisdiction: {country_code}{f' / {state_code}' if state_code else ''}
Circstances: {circumstances or 'Not specified'}

Provide:
1. Eligibility for appeal
2. Deadline to file
3. Required documents
4. Where to file (which authority/court)
5. What to argue
6. Expected timeline
7. Costs involved"""

        if self.provider == "gemini" and self.gemini_model:
            response = self.gemini_model.generate_content(prompt)
            return response.text
        elif self.anthropic_client:
            response = self.anthropic_client.messages.create(
                model="claude-3-sonnet-20240229",
                max_tokens=1000,
                messages=[{"role": "user", "content": prompt}],
            )
            return response.content[0].text
        else:
            return "Configure an LLM API key to generate appeal guidance."

    def get_suggested_questions(self, country_code: Optional[str]) -> list[str]:
        """Return context-aware suggested follow-up questions."""
        base = [
            "What are the penalties for drunk driving?",
            "How do I contest a traffic fine?",
            "What documents must I carry while driving?",
            "What happens if I miss the fine payment deadline?",
        ]
        if country_code == "IN":
            return [
                "What are the fines under the Motor Vehicles Act 2019?",
                "How many demerit points before license suspension in India?",
                "Is it mandatory to have a PUC certificate?",
                "What is the fine for using a mobile phone while driving?",
            ]
        return base


ai_service = AIService()
