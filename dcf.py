"""
DCF Valuation Module

Calculates intrinsic value per share using a discounted cash flow model.
Framed as fair value estimation, not a prediction or investment recommendation.
"""


def run_dcf(base_fcf, growth_rate, wacc, terminal_growth_rate, projection_years, shares, net_debt=0):
    """
    Runs a simple DCF model and returns intrinsic value per share.
 
    Args:
        base_fcf: Most recent annual FCF as the base figure
        growth_rate: Annual FCF growth rate assumption
        wacc: Weighted average cost of capital
        terminal_growth_rate: Long-term terminal growth rate
        projection_years: Number of years to project FCF
        shares: Shares outstanding for per-share calculation
        net_debt: Net debt (total debt - cash). Subtracted from firm value to get equity value.
                  Negative value indicates net cash position.
 
    Returns:
        dict with projected FCFs, terminal value, total intrinsic value,
        equity value, and intrinsic value per share. Returns None if inputs are invalid.
    """
    if wacc <= terminal_growth_rate:
        return None  # DCF undefined when WACC <= terminal growth rate
 
    if base_fcf is None or shares is None or shares == 0:
        return None
 
    # Project FCF for each year and discount to present value
    projected_fcfs = []
    fcf = base_fcf
    for year in range(1, projection_years + 1):
        fcf = fcf * (1 + growth_rate)
        discounted = fcf / ((1 + wacc) ** year)
        projected_fcfs.append(round(discounted, 2))
 
    # Terminal value - Gordon Growth Model
    terminal_fcf = projected_fcfs[-1] * (1 + wacc) * (1 + terminal_growth_rate)
    terminal_value = terminal_fcf / (wacc - terminal_growth_rate)
    discounted_terminal = terminal_value / ((1 + wacc) ** projection_years)
 
    # Total firm value (debt + equity)
    total_intrinsic_value = sum(projected_fcfs) + discounted_terminal
 
    # Equity value = firm value - net debt
    # If net_debt is negative (net cash), this increases equity value
    equity_value = total_intrinsic_value - (net_debt or 0)
    intrinsic_value_per_share = equity_value / shares
 
    return {
        "projected_fcfs": projected_fcfs,
        "terminal_value": round(discounted_terminal, 2),
        "total_intrinsic_value": round(total_intrinsic_value, 2),
        "equity_value": round(equity_value, 2),
        "intrinsic_value_per_share": round(intrinsic_value_per_share, 2),
    }
 
 
def get_recommendation(safety_margin, buy_threshold=20.0, sell_threshold=-10.0):
    """
    Returns a Buy / Hold / Sell recommendation based on safety margin.
    Framed as a fair value estimation, not investment advice.
 
    Safety margin = (intrinsic value - current price) / intrinsic value * 100
    Positive = stock trading below intrinsic value (potential upside)
    Negative = stock trading above intrinsic value (potential downside)
 
    Args:
        safety_margin: Calculated safety margin percentage
        buy_threshold: Minimum safety margin to recommend Buy (default 20%)
        sell_threshold: Safety margin below which to recommend Sell (default -10%)
    """
    if safety_margin is None:
        return "N/A"
    if safety_margin > buy_threshold:
        return "Buy"
    if safety_margin > sell_threshold:
        return "Hold"
    return "Sell"
 
 
def calculate_scenarios(base_fcf, wacc, terminal_growth_rate, projection_years,
                        shares, net_debt, share_price,
                        bearish_growth_rate, neutral_growth_rate, bullish_growth_rate,
                        buy_threshold=20.0, sell_threshold=-10.0):
    """
    Runs DCF for bearish, neutral, and bullish scenarios.
 
    Args:
        base_fcf: Most recent annual FCF
        wacc: Weighted average cost of capital
        terminal_growth_rate: Long-term terminal growth rate
        projection_years: Number of years to project
        shares: Shares outstanding
        net_debt: Net debt (total debt - cash). Negative = net cash position.
        share_price: Current share price (for safety margin calculation)
        bearish_growth_rate: FCF growth rate for bearish scenario
        neutral_growth_rate: FCF growth rate for neutral scenario
        bullish_growth_rate: FCF growth rate for bullish scenario
        buy_threshold: Minimum safety margin to recommend Buy (default 20%)
        sell_threshold: Safety margin below which to recommend Sell (default -10%)
 
    Returns:
        dict with results for each scenario
    """
    scenarios = {}
 
    for scenario, growth_rate in [
        ("bearish", bearish_growth_rate),
        ("neutral", neutral_growth_rate),
        ("bullish", bullish_growth_rate),
    ]:
        result = run_dcf(
            base_fcf=base_fcf,
            growth_rate=growth_rate,
            wacc=wacc,
            terminal_growth_rate=terminal_growth_rate,
            projection_years=projection_years,
            shares=shares,
            net_debt=net_debt,
        )
 
        if result is None:
            scenarios[scenario] = {
                "error": "WACC must be greater than terminal growth rate"
            }
            continue
 
        intrinsic = result["intrinsic_value_per_share"]
        safety_margin = (
            (intrinsic - share_price) / intrinsic * 100
            if intrinsic and share_price else None
        )
 
        scenarios[scenario] = {
            "growth_rate": growth_rate,
            "projected_fcfs": result["projected_fcfs"],
            "terminal_value": result["terminal_value"],
            "total_intrinsic_value": result["total_intrinsic_value"],
            "equity_value": result["equity_value"],
            "intrinsic_value_per_share": intrinsic,
            "current_price": share_price,
            "safety_margin_pct": round(safety_margin, 1) if safety_margin is not None else None,
            "recommendation": get_recommendation(safety_margin, buy_threshold, sell_threshold),
        }
 
    return scenarios