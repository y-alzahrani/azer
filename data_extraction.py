import anthropic
import base64
import json
import os
from dotenv import load_dotenv
from prompts.annual_prompt import annual_prompt
from prompts.quarterly_prompt import quarterly_prompt

load_dotenv()
client = anthropic.Anthropic()

def detect_report_type(filename):
    filename = filename.lower()
    if any(q in filename for q in ["q1", "q2", "q3", "q4", "quarterly", "interim", "10q", "10-q"]):
        return "Quarterly"
    if any(a in filename for a in ["annual", "fiscal", "fy", "yearly", "10k", "10-k"]):
        return "Annual"
    return None  # unknown - ask user or default

def extract_report(pdf_path, company, ticker):

    report_type = detect_report_type(os.path.basename(pdf_path))

    if report_type is None:
        print(f"Could not detect report type for '{os.path.basename(pdf_path)}'")
        report_type = input("Enter report type (Annual/Quarterly): ").strip().lower()
        if report_type not in ("Annual", "Quarterly"):
            print("Invalid input - must be 'Annual' or 'Quarterly'.")
            return None
    
    active_prompt = annual_prompt if report_type == "Annual" else quarterly_prompt
    max_tokens = 6000 if report_type == "Annual" else 4000

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

    if response.stop_reason == "max_tokens":
        print(f"Warning: response truncated - consider raising max_tokens")

    result_text = response.content[0].text
    clean_text = result_text.strip().replace("```json", "").replace("```", "").strip()

    # Handle extra text after closing brace
    last_brace = clean_text.rfind("}")
    if last_brace != -1:
        if last_brace < len(clean_text) - 1:  # only warn if there's actually text after the brace
            print(f"Warning: extra text detected after closing brace - truncating")
        clean_text = clean_text[:last_brace + 1]
        
    result = json.loads(clean_text)

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
    
    llm_report_type = result["report_info"].get("report_type")
    if llm_report_type and llm_report_type != report_type:
        print(f"Warning: filename detected or user input for report type is '{report_type}' but LLM detected '{llm_report_type}' - verify")

    return ordered_result, result_text

def save_result(result, output_folder, filename):
    os.makedirs(output_folder, exist_ok=True)
    output_path = os.path.join(output_folder, filename)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)
    print(f"Saved {output_path}")