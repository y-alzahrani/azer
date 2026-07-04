import anthropic
import base64
import json
import os
from dotenv import load_dotenv
from prompts.annual_prompt import annual_prompt
from prompts.quarterly_prompt import quarterly_prompt
 
load_dotenv()
client = anthropic.Anthropic()

MAX_TOKENS = {
    "Annual": 6000,
    "Quarterly": 4000
}

def extract_report(pdf_path, company, report_type):
    """Extracts financial metrics and topic summaries from a PDF report.

    Args:
        pdf_path: Path to the PDF file
        company: Canonical company name selected by the user
        report_type: "Annual" or "Quarterly" - selected by the user in the UI

    Returns:
        Tuple of (ordered_result dict, raw result text) or None if extraction fails
    """

    active_prompt = annual_prompt if report_type == "Annual" else quarterly_prompt
    max_tokens = MAX_TOKENS[report_type]

    with open(pdf_path, "rb") as f:
        pdf_data = base64.standard_b64encode(f.read()).decode("utf-8")

    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=max_tokens,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "document",
                        "source": {
                            "type": "base64",
                            "media_type": "application/pdf",
                            "data": pdf_data
                        }
                    },
                    {"type": "text", "text": active_prompt}
                ]
            }
        ]
    )

    # Token and cost logging
    input_tokens = response.usage.input_tokens
    output_tokens = response.usage.output_tokens
    input_cost = (input_tokens / 1_000_000) * 3.00
    output_cost = (output_tokens / 1_000_000) * 15.00
    total_cost = input_cost + output_cost
    print(f"Stop reason: {response.stop_reason}")
    print(f"Input tokens: {input_tokens}")
    print(f"Output tokens: {output_tokens}")
    print(f"Estimated cost: ${total_cost:.4f}")

    if response.stop_reason == "max_tokens":
        print(f"Warning: response truncated - consider raising max_tokens")

    result_text = response.content[0].text
    clean_text = result_text.strip().replace("```json", "").replace("```", "").strip()

    # Handle extra text after closing brace
    last_brace = clean_text.rfind("}")
    if last_brace != -1:
        if last_brace < len(clean_text) - 1:
            print(f"Warning: extra text detected after closing brace - truncating")
        clean_text = clean_text[:last_brace + 1]

    result = json.loads(clean_text)

    # Ticker detected by LLM from the document
    ticker = result["report_info"].get("ticker")
    if not ticker:
        print(f"Warning: ticker not detected for '{company}' - price metrics will be unavailable")

    ordered_result = {
        "company": company,
        "ticker": ticker,
        "report_type": report_type,
        "period": result["report_info"].get("period"),
        "period_end_date": result["report_info"].get("period_end_date"),
        "currency": result["report_info"].get("currency"),
        "unit": result["report_info"].get("unit"),
        "metrics": result["metrics"],
        "narrative": result["narrative"]
    }

    # Cross-check report type between user selection and LLM detection
    llm_report_type = result["report_info"].get("report_type")
    if llm_report_type and llm_report_type != report_type:
        print(f"Warning: user selected '{report_type}' but LLM detected '{llm_report_type}' - verify")

    return ordered_result, result_text


def save_result(result, base_folder, filename):
    """Saves extracted result to disk under the correct company and report type subfolder.

    Folder structure:
        extracted_data/
            {Company}/
                Annual/
                    *.json
                Quarterly/
                    *.json
    """
    company = result["company"]
    report_type = result["report_type"]

    output_folder = os.path.join(base_folder, company, report_type)
    os.makedirs(output_folder, exist_ok=True)

    output_path = os.path.join(output_folder, filename)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)
    print(f"Saved: {output_path}")