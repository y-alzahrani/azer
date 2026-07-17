# AZER: AI-Powered Financial Analysis Platform

## Overview

AZER is an AI-powered financial analysis platform that extracts key metrics and insights from company financial reports, generates analytical summaries, and provides an interactive dashboard and AI chatbot to help retail investors make informed decisions based on actual financial data.

## The Problem

Retail investors in Arabic-speaking countries lack professional, accessible financial analysis tools that deliver insights in **Arabic** based on companies' published financial reports; leading to investment decisions built on incomplete or inaccurate information. Financial reports can exceed 150 pages in length, making it difficult for non-specialist investors to access and absorb the information that matters. Investors with limited English language skills face an additional obstacle, as financial reports from companies in foreign stock markets are rarely published in Arabic, limiting their ability to properly analyze and evaluate non-local companies.

## The Solution

AZER automates the entire pipeline from raw PDF reports to comprehensive financial analysis and insights.

1. **Extract** — upload a financial report and the platform extracts all key financial metrics and management commentary using large language models
2. **Analyze** — an interactive dashboard displays financial trends over time with charts and summary cards
3. **Summarize** — an AI-generated summary covers positive and negative signals in company performance, and an overall outlook grounded in management commentary
4. **Ask** — an AI chatbot answers questions about company performance in Arabic or English, grounded entirely in the extracted data
5. **Value** — a DCF-based fair share price estimator for professional investors

## Features

### PDF Ingestion

- Supports annual and quarterly reports published in English for Saudi and foreign companies
- Extracts structured financial metrics (JSON) and management commentary summaries in a single API call

### Financial Metrics Dashboard

- 8 cards for the most recent period: Share Price, Market Cap, Revenue, Net Income, Net Margin, Free Cash Flow, Net Debt, Forward P/E
- Trend charts across all available periods: Profitability, Margins, Free Cash Flow
- Valuation cards with live share price data: P/E Ratio, Forward P/E Ratio, P/S Ratio, P/B Ratio

### AI Summary

- Key positive signals with figures and trends
- Key negative signals and risks
- Holistic narrative covering financial trajectory, strategic decisions, and management outlook

### AI Chatbot

- Grounded entirely in extracted data — no hallucination or guessing
- Responds in the same language as the question (Arabic or English)
- Classifies questions as metric, narrative, or hybrid and retrieves accordingly
- Metric questions answered directly from structured financial data
- Narrative questions answered by passing management commentary summaries to LLM
- Maintains conversation history for natural follow-up questions
- Every answer cites source section, page number, and period

### DCF Valuation

- Fully manual — user inputs their own assumptions
- Historical FCF shown as reference
- Undervalued / Fairly Valued / Overvalued indicator based on safety margin

## Tech Stack
 
| Layer | Technology |
|-------|-----------|
| Frontend | React + Recharts |
| Backend | Python + FastAPI |
| LLM | Anthropic API (Claude Sonnet 4.6) |
| PDF Processing | Anthropic native document understanding |
| Market Data | yfinance |
| Environment | uv + python-dotenv |
 
## Project Structure

```
azer/
├── extracted_data/
│   ├── Meta/
│   │   ├── Annual/
│   │   └── Quarterly/
│   └── Aramco/
│       ├── Annual/
│       └── Quarterly/
├── reports/                  # Created automatically on first upload, not committed to Git
│   ├── Meta/
│   │   ├── Annual/
│   │   └── Quarterly/
│   └── Aramco/
│       ├── Annual/
│       └── Quarterly/
├── summaries/
│   ├── Meta_summary.json
│   └── Aramco_summary.json
├── prompts/
│   ├── annual_prompt.py
│   ├── quarterly_prompt.py
│   ├── summary_prompt.py
│   ├── router_prompt.py
│   └── answer_prompt.py
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── Navbar.jsx
│       │   ├── SummaryCard.jsx
│       │   ├── SectionHeader.jsx
│       │   └── UploadModal.jsx
│       ├── pages/
│       │   ├── Home.jsx
│       │   ├── Dashboard.jsx
│       │   ├── MyDocuments.jsx
│       │   ├── Chat.jsx
│       │   └── DCF.jsx
│       ├── styles/
│       │   └── global.css
│       ├── App.jsx
│       └── main.jsx
├── pdf_extractor.py          # Extracts financial data from PDF reports
├── financials_builder.py     # Builds structured dataset of company financials
├── summary_generator.py      # Generates summaries using LLM
├── chatbot.py                # Query router and answer generation
├── dcf.py                    # DCF valuation calculations
├── main.py                   # FastAPI backend - all API endpoints
├── pyproject.toml            # Python dependencies and project configuration
├── .env                      # Environment variables (not committed to Git)
└── LICENSE
```

## Dataset
 
| Company | Ticker | Annual Reports | Quarterly Reports |
|---------|--------|---------------|------------------|
| Meta Platforms | META | FY 2021 – FY 2025 | Q1 2026, Q1-Q3 2025 |
| Saudi Aramco | 2222 | FY 2021 – FY 2025 | Q1 2026, Q1-Q3 2025 |
| Saudi Telecom Company | 7010 | FY 2021 – FY 2025 | Q1 2026 |
 
**Total: 24 documents**

## Metrics Extracted
 
**From financial statements (using LLM):**
Revenue, Cost of Revenue, Operating Expenses, Operating Income, Net Income, EPS (Diluted), Operating Cash Flow, Capital Expenditure, Free Cash Flow, Short-Term Debt, Long-Term Debt, Net Debt, Total Equity, Cash & Cash Equivalents, Shares Outstanding, Weighted Average Shares Outstanding (Diluted)
 
**Calculated in Python:**
Operating Margin, Net Profit Margin, Total Debt, Debt-to-Equity, Return on Equity, P/E Ratio, Forward P/E, P/S Ratio, P/B Ratio, Market Cap

## Authors

- Maram Alshammary
- Reyam Albalihi
- Yazeed Alzahrani

## License

Copyright © 2026 AZER.
All Rights Reserved.
