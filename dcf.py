"""
DCF Valuation Model

Calculates intrinsic value per share using a discounted cash flow model.
Framed as fair value estimation, not a prediction or investment recommendation.
"""


def dcf_valuation(projected_fcfs_input, wacc, terminal_growth_rate, shares, net_debt=0):
    """
    Runs a simple DCF model using user-provided projected FCF values.
 
    Args:
        projected_fcfs_input: List of user-entered FCF values (one per projection year)
        wacc: Weighted average cost of capital
        terminal_growth_rate: Long-term terminal growth rate
        projection_years: Number of years to project FCF
        shares: Shares outstanding for per-share calculation
        net_debt: Net debt (total debt - cash). Subtracted from firm value to get equity value.
                  Negative value indicates net cash position.
 
    Returns:
        dict with discounted FCFs, terminal value, equity value,
        and intrinsic value per share. Returns None if inputs are invalid.
    """
    if wacc <= terminal_growth_rate:
        return None  # DCF undefined when WACC <= terminal growth rate
 
    if not projected_fcfs_input or shares is None or shares == 0:
        return None
    
    projection_years = len(projected_fcfs_input)

    # Discount each projected FCF to present value
    discounted_fcfs = []
    for year, fcf in enumerate(projected_fcfs_input, start=1):
        discounted = fcf / ((1 + wacc) ** year)
        discounted_fcfs.append(discounted)
 
    # Terminal value - Gordon Growth Model
    # Based on the last projected FCF (undiscounted) grown by terminal growth rate
    last_fcf = projected_fcfs_input[-1]
    terminal_fcf = last_fcf * (1 + terminal_growth_rate)
    terminal_value = terminal_fcf / (wacc - terminal_growth_rate)
    discounted_terminal = terminal_value / ((1 + wacc) ** projection_years)

    # Total firm value
    enterprise_value = sum(discounted_fcfs) + discounted_terminal

    equity_value = enterprise_value - net_debt
    intrinsic_value_per_share = equity_value / shares
 
    return {
        "projected_fcfs_input": projected_fcfs_input,
        "discounted_fcfs": discounted_fcfs,
        "terminal_value": round(discounted_terminal, 2),
        "enterprise_value": round(enterprise_value, 2),
        "net_debt": round(net_debt, 2),
        "equity_value": round(equity_value, 2),
        "intrinsic_value_per_share": round(intrinsic_value_per_share, 2),
    }
 
 
def get_valuation_label(safety_margin):
    """
    Returns a valuation label based on safety margin.
    Describes the relationship between intrinsic value and current price.

    Safety margin = (intrinsic value - current price) / intrinsic value * 100
    """
    if safety_margin is None:
        return "N/A"
    if safety_margin > 30:
        return "مقيّم بأقل من قيمته العادلة بشكل كبير"
    if safety_margin > 10:
        return "مقيّم بأقل من قيمته العادلة"
    if safety_margin > -10:
        return "مقيّم بقيمته العادلة"
    if safety_margin > -30:
        return "مقيّم بأكثر من قيمته العادلة"
    return "مقيّم بأكثر من قيمته العادلة بشكل كبير"