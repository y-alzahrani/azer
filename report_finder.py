import anthropic
import json
import requests
from prompts.reports_search_prompt import REPORTS_SEARCH_PROMPT
from prompts.pdf_selection_prompt import PDF_SELECTION_PROMPT
from playwright.sync_api import sync_playwright
from dotenv import load_dotenv

load_dotenv()


def find_reports_page(company, period):
    """Use Claude + web search to find the financial reports page URL."""
    client = anthropic.Anthropic()

    user_message = f"Find the official financial reports page for {company} where I can find their {period} financial report."

    print(f"\n--------------- Step 1: Finding financial reports page ---------------")
    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=512,
        system=REPORTS_SEARCH_PROMPT,
        messages=[{"role": "user", "content": user_message}],
        tools=[{
            "type": "web_search_20250305",
            "name": "web_search",
            "max_uses": 2,
        }],
    )

    # Debug activity
    for block in response.content:
        if block.type == "server_tool_use":
            print(f"  🔍 Searched: {block.input.get('query')}")
        elif block.type == "web_search_tool_result":
            if isinstance(block.content, list):
                print(f"  📄 Got {len(block.content)} result(s)")
            else:
                print(f"  ❌ Search error: {block.content.error_code}")
    print(f"  Searches used: {response.usage.server_tool_use.web_search_requests}")
    print(f"  Input tokens : {response.usage.input_tokens}")

    # Extract JSON
    result_text = ""
    for block in response.content:
        if block.type == "text" and "{" in block.text:
            result_text = block.text.strip()

    clean_text = result_text.replace("```json", "").replace("```", "").strip()
    first_brace = clean_text.find("{")
    if first_brace > 0:
        print("  Warning: extra text before JSON - truncating")
        clean_text = clean_text[first_brace:]
    last_brace = clean_text.rfind("}")
    if last_brace != -1:
        if last_brace < len(clean_text) - 1:
            print("  Warning: extra text after JSON - truncating")
        clean_text = clean_text[:last_brace + 1]

    result = json.loads(clean_text)
    print(f"  Reports Page URL  : {result.get('reports_page_url')}")
    print(f"  Confidence   : {result.get('confidence')}")
    return result


def render_page(url):
    """Use Playwright to extract all PDF links from a rendered page."""
    print(f"\n--------------- Step 2: Rendering page with Playwright ---------------")
    print(f"  URL: {url}")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()
        page.goto(url, wait_until="domcontentloaded", timeout=30000)
        page.wait_for_timeout(30000)
        pdf_links = page.eval_on_selector_all(
            "a[href*='.pdf']",
            "elements => elements.map(el => ({href: el.href, text: el.innerText.trim()}))"
        )
        browser.close()
    print(f"  Found {len(pdf_links)} PDF links")
    for link in pdf_links:
        print(f"    {link['text'][:60]} → {link['href']}")
    return pdf_links


def select_pdf_from_links(pdf_links, company, period, reports_page_url):
    """Pass PDF link list to Claude to select the correct one."""
    client = anthropic.Anthropic()

    print(f"\n--------------- Step 3: Selecting correct PDF ---------------")

    # Format links as a simple list for Claude
    links_text = "\n".join([f"- {link['text']} → {link['href']}" for link in pdf_links])
    user_message = f"Company: {company}\nPeriod: {period}\n\nAvailable PDF links:\n{links_text}"

    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=512,
        system=PDF_SELECTION_PROMPT,
        messages=[{"role": "user", "content": user_message}],
    )

    print(f"  Input tokens : {response.usage.input_tokens}")
    print(f"  Output tokens: {response.usage.output_tokens}")

    # Extract JSON
    result_text = ""
    for block in response.content:
        if block.type == "text" and "{" in block.text:
            result_text = block.text.strip()

    clean_text = result_text.replace("```json", "").replace("```", "").strip()
    first_brace = clean_text.find("{")
    if first_brace > 0:
        print("  Warning: extra text before JSON - truncating")
        clean_text = clean_text[first_brace:]
    last_brace = clean_text.rfind("}")
    if last_brace != -1:
        if last_brace < len(clean_text) - 1:
            print("  Warning: extra text after JSON - truncating")
        clean_text = clean_text[:last_brace + 1]

    result = json.loads(clean_text)
    result["reports_page_url"] = reports_page_url
    print(f"  PDF URL      : {result.get('pdf_url')}")
    print(f"  Report Name  : {result.get('report_name')}")
    print(f"  Confidence   : {result.get('confidence')}")
    return result


def verify_pdf_url(pdf_url):
    """HEAD request to verify the PDF URL is reachable."""
    try:
        head = requests.head(pdf_url, timeout=10, allow_redirects=True)
        if head.status_code == 200:
            print(f"\n  ✅ PDF URL verified (HTTP {head.status_code})")
            return True
        else:
            print(f"\n  ⚠️  PDF URL returned HTTP {head.status_code}")
            return False
    except requests.RequestException as e:
        print(f"\n  ⚠️  PDF URL check failed: {e}")
        return False


def find_report(company, period):
    """Coordinator: runs all steps in sequence."""
    print(f"\nSearching for: {company} — {period}")
    print("═" * 60)

    # Step 1: Find financial reports page
    page_result = find_reports_page(company, period)
    reports_page_url = page_result.get("reports_page_url")

    if not reports_page_url:
        print("\n❌ Could not find financial reports page - falling back to manual upload")
        return {"reports_page_url": None, "pdf_url": None, "report_name": None, "confidence": "not_found"}

    # Step 2: Render page and extract PDF links
    pdf_links = render_page(reports_page_url)

    if not pdf_links:
        print("\n❌ No PDF links found on page - falling back to manual upload")
        return {"reports_page_url": reports_page_url, "pdf_url": None, "report_name": None, "confidence": "not_found"}

    # Step 3: Select correct PDF
    result = select_pdf_from_links(pdf_links, company, period, reports_page_url)

    # Verify PDF URL
    pdf_url = result.get("pdf_url")
    if pdf_url:
        verify_pdf_url(pdf_url)
    else:
        print("\n  ⚠️  No PDF URL selected - falling back to manual upload")

    return result
