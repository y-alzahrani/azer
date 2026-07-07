import json
import os
import yfinance as yf


# ------------------------------------------------------------------------------------
# Helper functions
# ------------------------------------------------------------------------------------


def _get(m, field):
    """Reads a metric field regardless of shape (plain number or object with 'value' key)."""
    val = m.get(field)
    if isinstance(val, dict):
        return val.get("value")
    return val
 

def _safe_divide(a, b):
    if a is None or b is None or b == 0:
        return None
    return a / b
 

def _round(value, decimals=4):
    if value is None:
        return None
    return round(value, decimals)


# ------------------------------------------------------------------------------------
# Step 1: Load all documents from the extracted data folder
# ------------------------------------------------------------------------------------


def load_all_documents(folder="extracted_data"):
    """
    Reads all JSON files from the extracted_data folder.
 
    extracted_data folder structure:
        extracted_data/
            {Company}/
                Annual/
                    *.json
                Quarterly/
                    *.json
 
    Returns:
        Flat list of all document dicts.
    """
    
    docs = []
    
    for company_folder in os.listdir(folder):
        company_path = os.path.join(folder, company_folder)
        if os.path.isdir(company_path):
            for report_type in ("Annual", "Quarterly"):
                report_type_path = os.path.join(company_path, report_type)
                if os.path.isdir(report_type_path):
                    for filename in os.listdir(report_type_path):
                        if filename.endswith(".json"):
                            filepath = os.path.join(report_type_path, filename)
                            with open(filepath, encoding="utf-8") as f:
                                docs.append(json.load(f))
    return docs


# ------------------------------------------------------------------------------------
# Step 2: Calculate derived metrics for a single document
# ------------------------------------------------------------------------------------


def calculate_metrics(doc):
    """
    Calculates derived ratios from a single extracted document.
    Returns None for any metric where required inputs are missing.
    """
    
    m = doc.get("metrics", {})
 
    revenue = _get(m, "revenue")
    cost_of_revenue = _get(m, "cost_of_revenue")
    operating_income = _get(m, "operating_income")
    net_income = _get(m, "net_income")
    short_term_debt = _get(m, "short_term_debt")
    long_term_debt = _get(m, "long_term_debt")
    total_equity = _get(m, "total_equity")
    gross_margin = _round(_safe_divide(revenue - cost_of_revenue, revenue)
                              if revenue is not None and cost_of_revenue is not None else None)
    operating_margin = _round(_safe_divide(operating_income, revenue))
    net_margin = _round(_safe_divide(net_income, revenue))

    if short_term_debt is not None or long_term_debt is not None:
        total_debt = (short_term_debt or 0) + (long_term_debt or 0)
    else:
        total_debt = None
    
    debt_to_equity = _round(_safe_divide(total_debt, total_equity))
    return_on_equity = _round(_safe_divide(net_income, total_equity))
 
    return {
        "gross_margin": gross_margin,
        "operating_margin": operating_margin,
        "net_margin": net_margin,
        "total_debt": total_debt,
        "debt_to_equity": debt_to_equity,
        "return_on_equity": return_on_equity,
    }


# ------------------------------------------------------------------------------------
# Step 3: Build financials for a single report
# ------------------------------------------------------------------------------------


def build_report_financials(doc):
    """
    Flattens extracted metrics + derived metrics into a single dict.
    Price-based ratios default to None until populate_price_metrics() runs.
    """
    
    m = doc["metrics"]
    derived = calculate_metrics(doc)
 
    return {
        "period": doc["period"],
        "period_end_date": doc["period_end_date"],
        "currency": doc["currency"],
        "unit": doc["unit"],
        "revenue": m["revenue"],
        "cost_of_revenue": _get(m, "cost_of_revenue"),
        "operating_expenses": _get(m, "operating_expenses"),
        "operating_income": m["operating_income"],
        "net_income": m["net_income"],
        "operating_margin": derived["operating_margin"],
        "net_margin": derived["net_margin"],
        "eps": m["eps"],
        "operating_cash_flow": m["operating_cash_flow"],
        "capital_expenditure": _get(m, "capital_expenditure"),
        "free_cash_flow": _get(m, "free_cash_flow"),
        "cash_and_equivalents": _get(m, "cash_and_equivalents"),
        "total_debt": derived["total_debt"],
        "net_debt": _get(m, "net_debt"),
        "total_equity": m["total_equity"],
        "share_price": None,
        "market_cap": None,
        "shares_outstanding": _get(m, "shares_outstanding"),
        "shares_weighted_average_diluted": _get(m, "shares_weighted_average_diluted"),
        "debt_to_equity": derived["debt_to_equity"],
        "return_on_equity": derived["return_on_equity"],
        "trailing_pe_ratio": None,
        "forward_pe_ratio": None,
        "ps_ratio": None,
        "pb_ratio": None,
    }


# ------------------------------------------------------------------------------------
# Step 4: Build financials for all reports and group them into an ordered structure
# ------------------------------------------------------------------------------------


def build_all_financials(docs):
    """
    Builds all report financials and groups them by company and report type, sorted chronologically.
 
    Returns:
        {
            "Company 1": {
                "Annual":    [ ... ],  # sorted by period_end_date ascending
                "Quarterly": [ ... ]
            },
            "Company 2": {
                "Annual":    [ ... ],
                "Quarterly": [ ... ]
            },
            ...
        }
    """

    financials = {}
 
    for doc in docs:
        company = doc["company"]
        report_type = doc["report_type"]
 
        if company not in financials:
            financials[company] = {"Annual": [], "Quarterly": []}
 
        entry = build_report_financials(doc)
        financials[company][report_type].append(entry)
 
    # Sort each list chronologically
    for company in financials:
        for report_type in financials[company]:
            financials[company][report_type].sort(key=lambda x: x["period_end_date"])
 
    return financials


# ------------------------------------------------------------------------------------
# Step 5: Populate price-based ratios for the most recent period per company
# ------------------------------------------------------------------------------------


def populate_price_metrics(financials, docs):
    """
    Fetches live share price data from Yahoo Finance and fills in valuation ratios
    for the single most recent period per company (across annual and quarterly reports).
 
    Trailing P/E and Forward P/E: taken directly from yfinance (trailingPE, forwardPE).
    P/S and P/B: calculated from extracted figures using live price.
    """

    # Build ticker lookup from docs
    tickers = {doc["company"]: doc["ticker"] for doc in docs}
 
    for company in financials:
        ticker = tickers.get(company)
        if not ticker:
            print(f"Warning: no ticker found for '{company}' - skipping price metrics")
            continue
 
        # Find the single most recent entry across annual and quarterly reports
        most_recent_entry = None
        most_recent_date  = None
 
        for report_type in ("Annual", "Quarterly"):
            entries = financials[company][report_type]
            if entries:
                latest = entries[-1]   # already sorted chronologically
                if most_recent_date is None or latest["period_end_date"] > most_recent_date:
                    most_recent_date  = latest["period_end_date"]
                    most_recent_entry = latest
 
        if most_recent_entry is None:
            continue
 
        # Fetch from yfinance
        try:
            info  = yf.Ticker(ticker).info
            share_price = info.get("currentPrice") or info.get("regularMarketPrice")
 
            # Trailing P/E and Forward P/E - taken directly from yfinance
            most_recent_entry["trailing_pe_ratio"] = info.get("trailingPE")
            most_recent_entry["forward_pe_ratio"] = info.get("forwardPE")
 
        except Exception as e:
            print(f"Warning: could not fetch price data for '{ticker}': {e}")
            continue
 
        # P/S and P/B - calculated from extracted figures
        shares = most_recent_entry.get("shares_outstanding") or most_recent_entry.get("shares_weighted_average_diluted")
        market_cap = share_price * shares if share_price and shares else None
        revenue = most_recent_entry.get("revenue")
        total_equity = most_recent_entry.get("total_equity")
        
        most_recent_entry["share_price"] = share_price
        most_recent_entry["market_cap"] = round(market_cap, 1) if market_cap else None
        most_recent_entry["ps_ratio"] = round(market_cap / revenue, 2) if market_cap and revenue else None
        most_recent_entry["pb_ratio"] = round(market_cap / total_equity, 2) if market_cap and total_equity else None


def build_all_narratives(docs):
    narratives = {}
    for doc in docs:
        company = doc["company"]
        period = doc["period"]
        if company not in narratives:
            narratives[company] = {}
        narratives[company][period] = doc["narrative"]["sections_found"]
    return narratives