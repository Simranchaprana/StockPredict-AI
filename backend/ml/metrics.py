import numpy as np

def sharpe_ratio(daily_returns, risk_free_rate=0.0, periods_per_year=252):
    excess = daily_returns - risk_free_rate / periods_per_year
    if excess.std() == 0:
        return 0.0
    return (excess.mean() / excess.std()) * np.sqrt(periods_per_year)

def max_drawdown(equity_curve):
    running_max = np.maximum.accumulate(equity_curve)
    drawdown = (equity_curve - running_max) / running_max
    return drawdown.min() * 100 # percentage

def win_rate(daily_returns):
    return (daily_returns > 0).mean() * 100 # percentage

def backtest_summary(equity_curve, daily_returns):
    return {
        "sharpe": sharpe_ratio(daily_returns),
        "max_drawdown": max_drawdown(equity_curve),
        "win_rate": win_rate(daily_returns),
        "final_return_pct": (equity_curve[-1] / equity_curve[0] - 1) * 100,
    }
