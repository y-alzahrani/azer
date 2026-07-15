import json
import os
import anthropic
from prompts.summary_prompt import SUMMARY_PROMPT

client = anthropic.Anthropic()


def get_company_narratives(company, docs):
    """Extracts narrative sections from raw JSON files for a specific company, tagged by period."""
    narratives = {}
    for doc in docs:
        if doc["company"] == company:
            narratives[doc["period"]] = doc["narrative"]["sections_found"]
    return narratives


def generate_summary(company, financials, docs):
    """Generates an Arabic analysis summary for a company using all available periods."""

    company_financials = financials[company]
    company_narratives = get_company_narratives(company, docs)

    prompt = SUMMARY_PROMPT.format(
    company=company,
    company_financials=json.dumps(company_financials, ensure_ascii=False, indent=2),
    company_narratives=json.dumps(company_narratives, ensure_ascii=False, indent=2)
    )

    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=10000,
        messages=[
            {"role": "user", "content": prompt}
        ]
    )

    result_text = response.content[0].text
    clean_text = result_text.strip().replace("```json", "").replace("```", "").strip()
    last_brace = clean_text.rfind("}")
    if last_brace != -1:
        if last_brace < len(clean_text) - 1:
            print("Warning: extra text detected after closing brace - truncating")
        clean_text = clean_text[:last_brace + 1]

    return json.loads(clean_text)


def save_summary(company, summary, base_folder="summaries"):
    """Saves the generated summary to disk as a cache."""
    os.makedirs(base_folder, exist_ok=True)
    summary_path = os.path.join(base_folder, f"{company}_summary.json")
    with open(summary_path, "w", encoding="utf-8") as f:
        json.dump({"summary": summary}, f, ensure_ascii=False, indent=2)
    print(f"Summary saved for {company}")


def load_summary(company, base_folder="summaries"):
    """Loads cached summary from disk. Returns None if not found."""
    summary_path = os.path.join(base_folder, f"{company}_summary.json")
    if os.path.exists(summary_path):
        print(f"Loaded cached summary for {company}")
        with open(summary_path, encoding="utf-8") as f:
            return json.load(f)["summary"]
    return None