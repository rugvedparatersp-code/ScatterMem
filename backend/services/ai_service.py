
import os
import json
import re
from pathlib import Path

from dotenv import load_dotenv
from google import genai
from google.genai import types


# --------------------------------------------------
# CONFIGURATION
# --------------------------------------------------

BACKEND_DIR = Path(__file__).resolve().parents[1]
load_dotenv(BACKEND_DIR / ".env")

API_KEY = os.getenv("GEMINI_API_KEY")
MODEL_NAME = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

client = genai.Client(api_key=API_KEY) if API_KEY else None


# --------------------------------------------------
# DOCUMENT PREPARATION
# --------------------------------------------------

def prepare_document(extracted_sections):
    """
    Converts extracted PDF/DOCX sections into a consistent format.

    Expected input:
    [
        {
            "location": "Page 1",
            "text": "Document content..."
        }
    ]
    """

    prepared_sections = []

    if not isinstance(extracted_sections, list):
        raise ValueError("Document sections must be provided as a list.")

    for section in extracted_sections:

        if not isinstance(section, dict):
            continue

        text = str(section.get("text", "")).strip()

        if not text:
            continue

        # Use the actual location field returned by main.py.
        location = section.get("location")

        # Compatibility with alternative section formats.
        if not location and "page_number" in section:
            location = f"Page {section['page_number']}"

        elif not location and "paragraph_number" in section:
            location = f"Paragraph {section['paragraph_number']}"

        elif not location:
            location = "Unknown location"

        location = str(location)

        prepared_sections.append({
            "location": location,
            "text": text
        })

    return prepared_sections


# --------------------------------------------------
# JSON EXTRACTION
# --------------------------------------------------

def extract_json_response(response_text):
    """
    Extracts JSON from Gemini's response.
    Handles responses wrapped in Markdown code blocks.
    """

    if not response_text:
        raise ValueError("Gemini returned an empty response.")

    cleaned_text = response_text.strip()

    cleaned_text = re.sub(
        r"^```(?:json)?\s*",
        "",
        cleaned_text,
        flags=re.IGNORECASE
    )

    cleaned_text = re.sub(
        r"\s*```$",
        "",
        cleaned_text
    )

    return json.loads(cleaned_text)


# --------------------------------------------------
# ANALYSIS VALIDATION
# --------------------------------------------------

def validate_analysis(result, prepared_sections):
    """
    Validates the AI response and ensures evidence comes
    from the uploaded document.
    """

    if not isinstance(result, dict):
        raise ValueError("Invalid analysis response.")

    source_text = "\n".join(
        section["text"] for section in prepared_sections
    )

    findings = result.get("findings", [])

    if not isinstance(findings, list):
        findings = []

    validated_findings = []

    for finding in findings:

        if not isinstance(finding, dict):
            continue

        title = str(finding.get("title", "")).strip()
        description = str(finding.get("description", "")).strip()
        evidence = str(finding.get("evidence", "")).strip()

        if not title or not description or not evidence:
            continue

        # Do not accept evidence that cannot be found
        # in the uploaded document.
        if evidence.lower() not in source_text.lower():
            continue

        source_location = str(
            finding.get("source_location", "Unknown location")
        )

        # Ensure the source location belongs to this document.
        valid_locations = [
            section["location"]
            for section in prepared_sections
        ]

        if source_location not in valid_locations:
            source_location = next(
                (
                    section["location"]
                    for section in prepared_sections
                    if evidence.lower() in section["text"].lower()
                ),
                "Unknown location"
            )

        try:
            confidence = float(finding.get("confidence", 0.5))
        except (ValueError, TypeError):
            confidence = 0.5

        confidence = max(0.0, min(1.0, confidence))

        validated_findings.append({
            "category": str(
                finding.get("category", "General")
            ),
            "title": title,
            "description": description,
            "evidence": evidence,
            "source_location": source_location,
            "confidence": confidence,
            "status": "Needs Review"
        })

    missing_information = result.get("missing_information", [])
    recommended_next_actions = result.get(
        "recommended_next_actions", []
    )

    if not isinstance(missing_information, list):
        missing_information = []

    if not isinstance(recommended_next_actions, list):
        recommended_next_actions = []

    return {
        "document_summary": str(
            result.get("document_summary", "")
        ),
        "findings": validated_findings,
        "missing_information": [
            str(item) for item in missing_information
        ],
        "recommended_next_actions": [
            str(item) for item in recommended_next_actions
        ]
    }


# --------------------------------------------------
# RULE-BASED FALLBACK
# --------------------------------------------------

def rule_based_analysis(prepared_sections):
    """
    Basic fallback analysis when Gemini is unavailable.

    This is rule-based extraction, not generative AI.
    """

    findings = []
    missing_information = []
    recommended_next_actions = []

    patterns = [
        {
            "category": "Pending Work",
            "keywords": [
                "pending",
                "in progress",
                "not completed",
                "remaining",
                "to be completed",
                "todo",
                "to-do"
            ],
            "title": "Pending or Incomplete Work"
        },
        {
            "category": "Risk",
            "keywords": [
                "risk",
                "issue",
                "problem",
                "blocker",
                "challenge",
                "dependency"
            ],
            "title": "Potential Project Risk or Issue"
        },
        {
            "category": "Decision",
            "keywords": [
                "decided",
                "decision",
                "selected",
                "chosen",
                "approved",
                "because"
            ],
            "title": "Project Decision"
        },
        {
            "category": "Completed Work",
            "keywords": [
                "completed",
                "implemented",
                "finished",
                "successfully developed",
                "delivered"
            ],
            "title": "Completed Project Work"
        }
    ]

    for section in prepared_sections:

        section_text = section["text"]
        location = section["location"]

        sentences = re.split(
            r"(?<=[.!?])\s+",
            section_text
        )

        for sentence in sentences:

            sentence = sentence.strip()

            if len(sentence) < 15:
                continue

            lower_sentence = sentence.lower()

            for pattern in patterns:

                matched_keyword = next(
                    (
                        keyword
                        for keyword in pattern["keywords"]
                        if keyword in lower_sentence
                    ),
                    None
                )

                if not matched_keyword:
                    continue

                # Avoid duplicate findings for the same sentence.
                duplicate = any(
                    item["evidence"] == sentence
                    for item in findings
                )

                if duplicate:
                    continue

                findings.append({
                    "category": pattern["category"],
                    "title": pattern["title"],
                    "description": (
                        f"The document contains information related "
                        f"to {pattern['category'].lower()}: {sentence}"
                    ),
                    "evidence": sentence,
                    "source_location": location,
                    "confidence": 0.5,
                    "status": "Needs Review"
                })

                break

    if not findings:
        missing_information.append(
            "No clear project decisions, pending tasks, risks, "
            "or completed work could be identified automatically."
        )

    missing_information.extend([
        "Verify whether all project tasks have assigned owners.",
        "Check whether important decisions include their reasoning.",
        "Confirm whether pending tasks have deadlines."
    ])

    recommended_next_actions.extend([
        "Review the extracted findings.",
        "Assign owners to pending tasks.",
        "Document the reasoning behind important decisions.",
        "Verify project risks and dependencies."
    ])

    all_text = " ".join(
        section["text"] for section in prepared_sections
    )

    document_summary = (
        all_text[:500].strip()
        if all_text
        else "No readable document content was found."
    )

    if len(all_text) > 500:
        document_summary += "..."

    return {
        "document_summary": document_summary,
        "findings": findings,
        "missing_information": missing_information,
        "recommended_next_actions": recommended_next_actions
    }


# --------------------------------------------------
# GEMINI ANALYSIS
# --------------------------------------------------

def gemini_analysis(prepared_sections):
    """
    Sends document content to Gemini and requests
    structured project handover information.
    """

    if client is None:
        raise ValueError("Gemini API key is not configured.")

    document_text = "\n\n".join(
        f"Source: {section['location']}\n"
        f"Content: {section['text']}"
        for section in prepared_sections
    )

    # Limit input size to avoid excessively large requests.
    document_text = document_text[:30000]

    prompt = f"""
You are ScatterMem, an AI-powered project knowledge
handover assistant.

Analyze the following project document.

Your goal is to preserve important knowledge when an
employee leaves or transfers responsibilities.

Identify:

1. Important project decisions and their reasoning.
2. Completed work.
3. Pending or incomplete tasks.
4. Project risks and unresolved issues.
5. Dependencies and responsibilities.
6. Missing or unclear project information.
7. Recommended next actions.

IMPORTANT RULES:

- Do not invent facts.
- Use only information supported by the document.
- Every finding must include exact evidence copied
  from the document.
- Include the source location provided with the text.
- If information is unclear, mention that it needs review.
- Do not assume that a task is completed unless the
  document supports that conclusion.
- Keep findings specific and useful for a new employee.

Return ONLY valid JSON using this structure:

{{
    "document_summary": "Short document summary",
    "findings": [
        {{
            "category": "Decision, Pending Work, Completed Work, Risk, Dependency or General",
            "title": "Finding title",
            "description": "Detailed explanation",
            "evidence": "Exact sentence from the document",
            "source_location": "Page 1 or Paragraph 1",
            "confidence": 0.90
        }}
    ],
    "missing_information": [
        "Information that is missing or unclear"
    ],
    "recommended_next_actions": [
        "Recommended action"
    ]
}}

DOCUMENT CONTENT:

{document_text}
"""

    response = client.models.generate_content(
        model=MODEL_NAME,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            temperature=0.2
        )
    )

    result = extract_json_response(response.text)

    return validate_analysis(result, prepared_sections)


# --------------------------------------------------
# MAIN ANALYSIS FUNCTION
# --------------------------------------------------

def analyse_document(extracted_sections):
    """
    Main function called by main.py.

    Attempts Gemini analysis first.
    Uses rule-based analysis if Gemini is unavailable
    or returns an invalid response.
    """

    prepared_sections = prepare_document(extracted_sections)

    if not prepared_sections:
        raise ValueError(
            "No readable text was found in the document."
        )

    try:
        if client is None:
            raise ValueError(
                "Gemini API key is not configured."
            )

        result = gemini_analysis(prepared_sections)

        result["analysis_method"] = "Gemini"

        return result

    except Exception as error:

        print(
            "Gemini analysis unavailable. "
            f"Using rule-based fallback: {error}"
        )

        result = rule_based_analysis(prepared_sections)

        result["analysis_method"] = "Rule-based fallback"

        return result
