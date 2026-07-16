"""
Chatbot Module
Query router, retrieval, and answer generation for the AI chatbot.

Architecture:
- LLM call 1: Router classifies question and extracts entities
- Retrieval: Direct lookup from all_financials or all_narratives
- LLM call 2: Answer generation with citations and conversation history
"""

import json
import anthropic
from prompts.router_prompt import ROUTER_PROMPT
from prompts.answer_prompt import ANSWER_PROMPT

client = anthropic.Anthropic()


# ---------------------------------------------------------------------------
# Build all narratives
# ---------------------------------------------------------------------------

def build_all_narratives(docs):
    """
    Extracts narrative sections from all documents, organized by company and period.

    Returns:
        {
            "Aramco": {
                "FY 2025": [{"topic": "...", "page_range": "...", "summary": "..."}, ...],
                "Q1 2026": [...],
            },
            "Meta": { ... }
        }
    """
    narratives = {}
    for doc in docs:
        company = doc["company"]
        period = doc["period"]
        if company not in narratives:
            narratives[company] = {}
        narratives[company][period] = doc["narrative"]["sections_found"]
    return narratives


# ---------------------------------------------------------------------------
# Router
# ---------------------------------------------------------------------------


def summarize_history(history):
    """Creates a brief summary of conversation history for the router."""
    if not history:
        return "No previous conversation."
    lines = []
    for msg in history[-6:]:  # Only last 6 messages for router context
        role = "User" if msg["role"] == "user" else "Assistant"
        content = msg.get("content", msg.get("text", ""))
        lines.append(f"{role}: {content[:200]}")  # Truncate long messages
    return "\n".join(lines)


def route_question(question, available_companies, history=None):
    """
    Classifies the user's question and extracts entities.

    Returns:
        dict with classification, company, periods, field
    """
    if history is None:
        history = []

    prompt = ROUTER_PROMPT.format(
        available_companies=', '.join(available_companies),
        history_summary=summarize_history(history),
        question=question
    )

    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=256,
        messages=[{"role": "user", "content": prompt}]
    )

    result_text = response.content[0].text
    clean_text = result_text.strip().replace("```json", "").replace("```", "").strip()
    last_brace = clean_text.rfind("}")
    if last_brace != -1:
        if last_brace < len(clean_text) - 1:
            print("Warning: extra text detected after closing brace - truncating")
        clean_text = clean_text[:last_brace + 1]

    try:
        return json.loads(clean_text)
    except json.JSONDecodeError:
        return {
            "classification": "hybrid",
            "company": None,
            "periods": None,
            "field": None
        }


# ---------------------------------------------------------------------------
# Retrieval
# ---------------------------------------------------------------------------

def get_metric_context(all_financials, company, periods, field):
    """
    Retrieves financial metrics for a specific company and period(s).
    If periods is None, returns all periods sorted chronologically.
    """
    if company not in all_financials:
        return None

    entries = []
    for report_type in ("Annual", "Quarterly"):
        entries.extend(all_financials[company][report_type])

    entries.sort(key=lambda x: x["period_end_date"])

    if periods:
        matched = [e for e in entries if any(p.lower() in e["period"].lower() for p in periods)]
        if matched:
            return matched

    return entries


def get_narrative_context(all_narratives, company, periods):
    """
    Retrieves narrative sections for a specific company.
    If periods is specified, returns only those periods' sections.
    If not, returns all periods' sections.
    """
    if company not in all_narratives:
        return None

    if periods:
        result = {}
        for p in all_narratives[company]:
            if any(period.lower() in p.lower() for period in periods):
                result[p] = all_narratives[company][p]
        if result:
            return result

    return all_narratives[company]


# ---------------------------------------------------------------------------
# Answer generation
# ---------------------------------------------------------------------------

def format_metric_context(metric_entries):
    """Formats metric entries for the answer prompt."""
    if not metric_entries:
        return ""

    lines = ["البيانات المالية المستخرجة:"]
    for entry in metric_entries:
        lines.append(f"\n--- {entry['period']} ({entry['currency']} {entry['unit']}) ---")
        fields = [
            ("الإيرادات", "revenue"),
            ("الربح التشغيلي", "operating_income"),
            ("صافي الربح", "net_income"),
            ("هامش الربح التشغيلي", "operating_margin"),
            ("هامش الربح الصافي", "net_margin"),
            ("التدفق النقدي التشغيلي", "operating_cash_flow"),
            ("النفقات الرأسمالية", "capital_expenditure"),
            ("التدفق النقدي الحر", "free_cash_flow"),
            ("النقد وما يعادله", "cash_and_equivalents"),
            ("إجمالي الديون", "total_debt"),
            ("صافي الدين", "net_debt"),
            ("ربحية السهم", "eps"),
            ("نسبة الدين إلى حقوق الملكية", "debt_to_equity"),
            ("العائد على حقوق الملكية", "return_on_equity"),
            ("سعر السهم", "share_price"),
            ("القيمة السوقية", "market_cap"),
            ("مكرر الأرباح الحالي", "trailing_pe_ratio"),
            ("مكرر الأرباح المستقبلي", "forward_pe_ratio"),
            ("مكرر المبيعات", "ps_ratio"),
            ("مكرر القيمة الدفترية", "pb_ratio"),
        ]
        for label, key in fields:
            value = entry.get(key)
            if value is not None:
                lines.append(f"{label}: {value}")

    return "\n".join(lines)


def format_narrative_context(narrative_data):
    """Formats narrative sections for the answer prompt."""
    if not narrative_data:
        return ""

    lines = ["ملخصات تقارير الإدارة:"]
    for period, sections in narrative_data.items():
        lines.append(f"\n--- {period} ---")
        for section in sections:
            lines.append(f"الموضوع: {section.get('topic', '')}")
            lines.append(f"الصفحات: {section.get('page_range', '')}")
            lines.append(f"الملخص: {section.get('summary', '')}")
            lines.append("")

    return "\n".join(lines)


def generate_answer(question, detected_company, metric_context, narrative_context, history):
    """
    Generates an answer using the retrieved context and conversation history.

    Args:
        question: User's question
        metric_context: List of financial entries or None
        narrative_context: Dict of narrative sections or None
        history: List of previous messages [{"role": "user/assistant", "content": "..."}]

    Returns:
        str: Answer text with citations
    """
    metric_str = format_metric_context(metric_context) if metric_context else ""
    narrative_str = format_narrative_context(narrative_context) if narrative_context else ""

    system_prompt = ANSWER_PROMPT.format(
        company=detected_company,
        metric_context=metric_str,
        narrative_context=narrative_str,
    )

    # Build messages list with conversation history
    messages = []
    for msg in history:
        messages.append({
            "role": msg["role"],
            "content": msg.get("content", msg.get("text", ""))
        })
    messages.append({"role": "user", "content": question})

    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1500,
        system=system_prompt,
        messages=messages
    )

    return response.content[0].text


# ---------------------------------------------------------------------------
# Main chatbot function
# ---------------------------------------------------------------------------

def chat(question, all_financials, all_narratives, history=None):
    """
    Main chatbot function - routes, retrieves, and generates an answer.

    Args:
        question: User's question
        all_financials: The full financials dict from financials_builder.py
        all_narratives: The full narratives dict from chatbot.py
        history: List of previous messages for conversation context

    Returns:
        dict with "response" and "citations" keys
    """
    if history is None:
        history = []

    # Cap history to last 20 messages
    history = history[-20:]

    available_companies = list(all_financials.keys())

    # Step 1: Route the question
    routing = route_question(question, available_companies, history)
    print(f"Routing result: {routing}")
    classification = routing.get("classification", "hybrid")
    detected_company = routing.get("company")
    periods = routing.get("periods")

    # Handle clarify - ask user to specify company
    if classification == "clarify" or not detected_company:
        return {
            "response": f"عن أي شركة تودّ الاستفسار؟ الشركات المتاحة في النظام: {', '.join(available_companies)}.",
            "citations": []
        }

    # Handle followup - answer from history only, no new retrieval
    if classification == "followup":
        last_company = detected_company or list(all_financials.keys())[0]
        metric_context = get_metric_context(all_financials, last_company, None, None)
        answer = generate_answer(
            question=question,
            detected_company=last_company,
            metric_context=metric_context,
            narrative_context=None,
            history=history,
        )
        return {"response": answer, "citations": []}

    # If company not in system
    if detected_company not in all_financials:
        return {
            "response": f"عذراً، لا تتوفر بيانات لشركة '{detected_company}' في النظام. الشركات المتاحة هي: {', '.join(available_companies)}.",
            "citations": []
        }

    # Step 2: Retrieve context based on classification
    metric_context = None
    narrative_context = None

    if classification in ("metric", "hybrid"):
        metric_context = get_metric_context(all_financials, detected_company, periods, routing.get("field"))

    if classification in ("narrative", "hybrid"):
        narrative_context = get_narrative_context(all_narratives, detected_company, periods)

    # Step 3: Generate answer
    answer = generate_answer(
        question=question,
        detected_company=detected_company,
        metric_context=metric_context,
        narrative_context=narrative_context,
        history=history,
    )

    return {
        "response": answer,
        "citations": []
    }