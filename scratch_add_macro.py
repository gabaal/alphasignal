import sys
import re

with open(r'c:\Users\geral\.gemini\antigravity\scratch\alphasignal\backend\routes\institutional.py', 'r', encoding='utf-8') as f:
    inst_content = f.read()

# Make sure not to duplicate
if 'def handle_macro_regime' not in inst_content:
    code_to_add = """
    def handle_macro_regime(self):
        \"\"\"Fetches live CME FedWatch ZQ=F futures and DXY/BTC correlation\"\"\"
        try:
            import yfinance as yf
            import pandas as pd
            
            # Fetch ZQ=F (Fed Funds 30-Day Futures) and DXY/BTC
            tickers = yf.download(['ZQ=F', 'DX-Y.NYB', 'BTC-USD'], period='90d', interval='1d', progress=False)
            df = tickers['Close'].dropna()
            
            # 1. Fed Funds Rate
            curr_zq = df['ZQ=F'].iloc[-1] if not df['ZQ=F'].empty else 95.0
            implied_rate = round(100 - curr_zq, 3)
            
            # 2. Correlation
            corr = df['DX-Y.NYB'].corr(df['BTC-USD']) if not df.empty else 0.0
            corr = round(corr, 3)
            
            # Additional dummy matrix metrics for UI representation
            dxy_momentum = round(df['DX-Y.NYB'].iloc[-1] - df['DX-Y.NYB'].iloc[-30], 2) if len(df) >= 30 else 0
            
            self.send_json({
                'implied_fed_rate': implied_rate,
                'zq_futures': round(curr_zq, 3),
                'btc_dxy_correlation_90d': corr,
                'dxy_30d_momentum': dxy_momentum,
                'status': 'System Normalized' if corr < 0 else 'Severe Liquidity Drain'
            })
        except Exception as e:
            self.send_json({'error': str(e)})
"""
    with open(r'c:\Users\geral\.gemini\antigravity\scratch\alphasignal\backend\routes\institutional.py', 'a', encoding='utf-8') as f:
        f.write(code_to_add)
    print("handle_macro_regime added.")

# Now patch api_router.py
with open(r'c:\Users\geral\.gemini\antigravity\scratch\alphasignal\backend\api_router.py', 'r', encoding='utf-8') as f:
    router_content = f.read()

if 'self.handle_macro_regime()' not in router_content:
    target = "elif path.startswith('/api/yield-curve'):\n            self.handle_yield_curve()"
    replacement = "elif path.startswith('/api/yield-curve'):\n            self.handle_yield_curve()\n        elif path.startswith('/api/macro-regime'):\n            self.handle_macro_regime()"
    
    router_content = router_content.replace(target, replacement)
    
    with open(r'c:\Users\geral\.gemini\antigravity\scratch\alphasignal\backend\api_router.py', 'w', encoding='utf-8') as f:
        f.write(router_content)
    print("api_router mapped.")
