"""
FastAPI Backend
All endpoints for the AZER financial analysis platform.
"""

import os
import tempfile
from contextlib import asynccontextmanager
import shutil
 
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
 
from pdf_extractor import extract_report, save_result
from financials_builder import load_all_documents, build_all_financials, populate_price_metrics, build_all_narratives
from summary_generator import generate_summary, save_summary, load_summary
from dcf import calculate_scenarios


# ---------------------------------------------------------------------------
# App state - loaded once at startup
# ---------------------------------------------------------------------------


app_state = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load all data into memory at startup."""
    print("Loading extracted documents...")
    all_extracted_docs = load_all_documents("extracted_data")
    all_financials = build_all_financials(all_extracted_docs)
    populate_price_metrics(all_financials, all_extracted_docs)
    all_narratives = build_all_narratives(all_extracted_docs)
 
    app_state["docs"] = all_extracted_docs
    app_state["financials"] = all_financials
    app_state["narratives"] = all_narratives
    print(f"Loaded {len(all_extracted_docs)} documents for {list(all_financials.keys())}")
    yield
    app_state.clear()
 

app = FastAPI(title="AZER API", lifespan=lifespan)


# Allow requests from the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite default port
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Helper - rebuild app state after a new document is added
# ---------------------------------------------------------------------------


def rebuild_state():
    """Reloads all documents and rebuilds financials and narratives in memory."""
    all_extracted_docs = load_all_documents("extracted_data")
    all_financials = build_all_financials(all_extracted_docs)
    populate_price_metrics(all_financials, all_extracted_docs)
    all_narratives = build_all_narratives(all_extracted_docs)
 
    app_state["docs"] = all_extracted_docs
    app_state["financials"] = all_financials
    app_state["narratives"] = all_narratives
    print("App state rebuilt successfully")


# ---------------------------------------------------------------------------
# Documents
# ---------------------------------------------------------------------------
 

@app.get("/documents")
def get_documents():
    """
    Returns a list of all available companies and their uploaded reports.
    Used to populate the company dropdown and My Documents page.
    """
    docs = app_state["docs"]
    result = {}
 
    for doc in docs:
        company = doc["company"]
        if company not in result:
            result[company] = {
                "ticker": doc["ticker"],
                "reports": []
            }
        result[company]["reports"].append({
            "period": doc["period"],
            "period_end_date": doc["period_end_date"],
            "report_type": doc["report_type"],
            "currency": doc["currency"],
            "unit": doc["unit"],
        })
 
    # Sort reports chronologically within each company
    for company in result:
        result[company]["reports"].sort(key=lambda x: x["period_end_date"])
 
    return result


# ---------------------------------------------------------------------------
# Financials
# ---------------------------------------------------------------------------


@app.get("/financials/{company}")
def get_financials(company: str):
    """
    Returns all financial data for a company.
    Used by the dashboard to render charts, cards, and valuation ratios.
    """
    financials = app_state["financials"]
    if company not in financials:
        raise HTTPException(status_code=404, detail=f"Company '{company}' not found")
    return financials[company]


# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
 

@app.get("/summary/{company}")
def get_summary(company: str):
    """
    Returns the cached Arabic summary for a company.
    Returns null if no summary has been generated yet.
    Frontend shows the generate button when null is returned.
    """
    summary = load_summary(company)
    return {"summary": summary}


@app.post("/summary/{company}/generate")
def generate_summary_endpoint(company: str):
    """
    Generates a new Arabic summary for a company and caches it.
    Called when the user clicks the generate or update button.
    """
    financials = app_state["financials"]
    docs = app_state["docs"]
 
    if company not in financials:
        raise HTTPException(status_code=404, detail=f"Company '{company}' not found")
 
    print(f"Generating summary for {company}...")
    summary = generate_summary(company, financials, docs)
    save_summary(company, summary)
    return {"summary": summary}


# ---------------------------------------------------------------------------
# Extraction
# ---------------------------------------------------------------------------
 

@app.post("/extract")
async def extract_endpoint(
    file: UploadFile = File(...),
    company: str = Form(...),
    report_type: str = Form(...),
):
    """
    Uploads a PDF report, runs extraction, saves the JSON, and rebuilds app state.
    company: company name selected by the user
    report_type: 'Annual' or 'Quarterly' selected by the user
    """
    if report_type not in ("Annual", "Quarterly"):
        raise HTTPException(status_code=400, detail="report_type must be 'Annual' or 'Quarterly'")
 
    # Save uploaded file to a temp path
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name
 
    try:
        result = extract_report(tmp_path, company, report_type)
        if result is None:
            raise HTTPException(status_code=500, detail="Extraction failed")
 
        ordered_result, _ = result
 
        # Check for duplicate - same company and period already exists
        existing_periods = [
            doc["period"] for doc in app_state["docs"]
            if doc["company"] == company
        ]
        if ordered_result["period"] in existing_periods:
            return {
                "status": "duplicate",
                "period": ordered_result["period"],
                "message": f"{company} - {ordered_result['period']} already exists. Confirm overwrite."
            }
 
        # Generate filename and save JSON
        period_slug = ordered_result["period"].lower().replace(" ", "_")
        company_slug = company.lower()
        filename = f"{company_slug}_{period_slug}.json"
        save_result(ordered_result, "extracted_data", filename)

        # Save original PDF
        pdf_folder = os.path.join("reports", company, report_type)
        os.makedirs(pdf_folder, exist_ok=True)
        shutil.copy(tmp_path, os.path.join(pdf_folder, filename.replace(".json", ".pdf")))
 
        # Rebuild app state to include the new document
        rebuild_state()
 
        return {
            "status": "success",
            "company": ordered_result["company"],
            "ticker": ordered_result["ticker"],
            "period": ordered_result["period"],
            "period_end_date": ordered_result["period_end_date"],
            "report_type": ordered_result["report_type"],
            "currency": ordered_result["currency"],
            "unit": ordered_result["unit"],
        }
 
    finally:
        os.unlink(tmp_path)  # Always delete temp file
 
 
@app.post("/extract/confirm-overwrite")
async def confirm_overwrite_endpoint(
    file: UploadFile = File(...),
    company: str = Form(...),
    report_type: str = Form(...),
):
    """
    Re-runs extraction and overwrites an existing document after user confirmation.
    """
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name
 
    try:
        result = extract_report(tmp_path, company, report_type)
        if result is None:
            raise HTTPException(status_code=500, detail="Extraction failed")
 
        ordered_result, _ = result
 
        period_slug = ordered_result["period"].lower().replace(" ", "_")
        company_slug = company.lower()
        filename = f"{company_slug}_{period_slug}.json"
        save_result(ordered_result, "extracted_data", filename)

        # Save original PDF
        pdf_folder = os.path.join("reports", company, report_type)
        os.makedirs(pdf_folder, exist_ok=True)
        shutil.copy(tmp_path, os.path.join(pdf_folder, filename.replace(".json", ".pdf")))
 
        rebuild_state()
 
        return {
            "status": "overwritten",
            "company": ordered_result["company"],
            "period": ordered_result["period"],
        }
 
    finally:
        os.unlink(tmp_path)


@app.get("/pdf/{company}/{report_type}/{filename}")
def get_pdf(company: str, report_type: str, filename: str):
    """Serves the original PDF report file."""
    pdf_path = os.path.join("reports", company, report_type, filename)
    if not os.path.exists(pdf_path):
        raise HTTPException(status_code=404, detail="PDF not found")
    return FileResponse(pdf_path, media_type="application/pdf")


@app.delete("/delete/{company}/{report_type}/{filename}")
def delete_report(company: str, report_type: str, filename: str):
    """Deletes an extracted document and its PDF."""
    json_path = os.path.join("extracted_data", company, report_type, filename)
    pdf_path = os.path.join("reports", company, report_type, filename.replace(".json", ".pdf"))

    if not os.path.exists(json_path):
        raise HTTPException(status_code=404, detail="Document not found")

    os.remove(json_path)
    if os.path.exists(pdf_path):
        os.remove(pdf_path)

    rebuild_state()
    return {"status": "deleted"}


# ---------------------------------------------------------------------------
# Chat
# ---------------------------------------------------------------------------
 

class ChatRequest(BaseModel):
    message: str
    company: str
 
 
@app.post("/chat")
def chat_endpoint(request: ChatRequest):
    """
    Receives a chatbot message and returns a response with citations.
    Placeholder chatbot.py will implement the actual logic.
    """
    # TODO: import and call chatbot logic once chatbot.py is ready
    return {
        "response": "bla bla",
        "citations": []
    }


# ---------------------------------------------------------------------------
# DCF
# ---------------------------------------------------------------------------
 

class DCFRequest(BaseModel):
    company: str
    wacc: float
    terminal_growth_rate: float
    projection_years: int = 5
    bearish_growth_rate: float
    neutral_growth_rate: float
    bullish_growth_rate: float
    buy_threshold: float = 20.0
    sell_threshold: float = -10.0
 
 
@app.post("/dcf/calculate")
def calculate_dcf(request: DCFRequest):
    """
    Runs DCF calculation for bearish, neutral, and bullish scenarios.
    Returns intrinsic value per share and safety margin for each scenario.
    """
    financials = app_state["financials"]
    if request.company not in financials:
        raise HTTPException(status_code=404, detail=f"Company '{request.company}' not found")
 
    # Base FCF, shares, and net debt from most recent annual entry
    annual_entries = financials[request.company]["Annual"]
    if not annual_entries:
        raise HTTPException(status_code=400, detail="No annual data available for DCF")
 
    latest_annual = annual_entries[-1]
    base_fcf = latest_annual.get("free_cash_flow")
    shares = latest_annual.get("shares_outstanding") or latest_annual.get("shares_weighted_average_diluted")
    net_debt = latest_annual.get("net_debt") or 0
 
    if base_fcf is None:
        raise HTTPException(status_code=400, detail="Free cash flow data not available")
 
    # Share price from the most recent entry across annual and quarterly
    most_recent_entry = None
    most_recent_date = None
    for report_type in ("Annual", "Quarterly"):
        entries = financials[request.company][report_type]
        if entries:
            entry = entries[-1]
            if most_recent_date is None or entry["period_end_date"] > most_recent_date:
                most_recent_date = entry["period_end_date"]
                most_recent_entry = entry
 
    share_price = most_recent_entry.get("share_price") if most_recent_entry else None
 
    scenarios = calculate_scenarios(
        base_fcf=base_fcf,
        wacc=request.wacc,
        terminal_growth_rate=request.terminal_growth_rate,
        projection_years=request.projection_years,
        shares=shares,
        net_debt=net_debt,
        share_price=share_price,
        bearish_growth_rate=request.bearish_growth_rate,
        neutral_growth_rate=request.neutral_growth_rate,
        bullish_growth_rate=request.bullish_growth_rate,
        buy_threshold=request.buy_threshold,
        sell_threshold=request.sell_threshold,
    )
 
    return {
        "company": request.company,
        "base_fcf": base_fcf,
        "net_debt": net_debt,
        "currency": latest_annual["currency"],
        "unit": latest_annual["unit"],
        "wacc": request.wacc,
        "terminal_growth_rate": request.terminal_growth_rate,
        "projection_years": request.projection_years,
        "scenarios": scenarios,
    }