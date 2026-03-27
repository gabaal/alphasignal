import os

os.makedirs('backend/routes', exist_ok=True)
open('backend/routes/__init__.py', 'w').close()

with open('backend/api_router.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Define the mixin categorization dictionaries to route the methods accurately.
import ast

with open('backend/api_router.py', 'r', encoding='utf-8') as f:
    source = f.read()

tree = ast.parse(source)

# Discover the AlphaHandler class
alpha_class = None
for node in tree.body:
    if isinstance(node, ast.ClassDef) and node.name == 'AlphaHandler':
        alpha_class = node
        break

auth_methods = ['is_authenticated', 'get_auth_token', 'handle_user_settings', 'handle_auth_status', 'handle_test_telegram']
market_methods = ['handle_btc', 'handle_fear_greed', 'handle_system_dials', 'handle_macro_calendar', 'handle_heatmap', 'handle_sectors', 'handle_tape', 'handle_market_pulse', 'handle_news']
institutional_methods = ['handle_portfolio_optimize', 'handle_onchain', 'handle_chain_velocity', 'handle_depeg', 'handle_tvl', 'handle_factor_web', 'handle_execution_time', 'handle_sankey', 'handle_correlation_matrix', 'handle_mindshare', 'handle_regime', 'handle_derivatives', 'handle_volatility_surface', 'handle_funding_rates', 'handle_ssr', 'handle_macro', 'handle_wallet_attribution', 'handle_narrative_clusters', 'handle_briefing', 'handle_search', 'handle_ai_analyst', 'handle_alerts', 'handle_benchmark', 'handle_signals', 'handle_miners', 'handle_flows', 'handle_catalysts', 'handle_risk', 'handle_correlation', 'handle_dominance', 'handle_rotation', 'handle_monte_carlo', 'handle_backtest', 'generate_timeline', 'handle_history', 'handle_trade_lab', 'handle_leaderboard', 'handle_liquidity', 'handle_whales_entity', 'handle_liquidations', 'handle_setup_generation', 'handle_whales', 'handle_alpha_score', 'handle_performance', 'handle_export', 'handle_notifications', 'handle_signal_history', 'handle_live_portfolio_sim', 'handle_portfolio_risk', 'handle_portfolio_correlations', 'handle_portfolio_performance', 'handle_portfolio_export', 'handle_trade_ledger', 'handle_stress_test']

auth_nodes = []
market_nodes = []
inst_nodes = []
kept_nodes = []

for item in alpha_class.body:
    if isinstance(item, ast.FunctionDef):
        if item.name in auth_methods:
            auth_nodes.append(item)
        elif item.name in market_methods:
            market_nodes.append(item)
        elif item.name in institutional_methods:
            inst_nodes.append(item)
        else:
            kept_nodes.append(item)
    else:
        kept_nodes.append(item)

header = "import json, urllib.parse, base64, hashlib, random, traceback, sqlite3, time, struct, requests, math\nimport numpy as np\nimport pandas as pd\nfrom datetime import datetime, timedelta\nfrom backend.caching import CACHE\nfrom backend.services import NOTIFY, ML_ENGINE, PORTFOLIO_SIM\nfrom backend.database import SupabaseClient, DB_PATH, STRIPE_SECRET_KEY, stripe, UNIVERSE, WHALE_WALLETS, SENTIMENT_KEYWORDS, data_dir, SUPABASE_URL, SUPABASE_HEADERS\n\n"

def write_mixin(filename, class_name, nodes):
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(header)
        f.write(f"class {class_name}:\n")
        if not nodes:
            f.write("    pass\n")
        else:
            for n in nodes:
                # Re-parse to unparse correctly with indentation
                func_code = ast.unparse(n)
                # indent all lines
                indented = "".join(["    " + line + "\n" for line in func_code.split("\n") if line.strip()])
                f.write(indented)
                f.write("\n")

write_mixin('backend/routes/auth.py', 'AuthRoutesMixin', auth_nodes)
write_mixin('backend/routes/market.py', 'MarketRoutesMixin', market_nodes)
write_mixin('backend/routes/institutional.py', 'InstitutionalRoutesMixin', inst_nodes)

# Re-write the api_router.py header and adjusted AlphaHandler
with open('backend/api_router.py', 'w', encoding='utf-8') as f:
    f.write(header)
    f.write("from backend.routes.auth import AuthRoutesMixin\n")
    f.write("from backend.routes.market import MarketRoutesMixin\n")
    f.write("from backend.routes.institutional import InstitutionalRoutesMixin\n")
    f.write("import socketserver, http.server\n\n")
    
    # write ThreadedHTTPServer manually since it's short
    f.write("class ThreadedHTTPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):\n    daemon_threads = True\n\n")
    
    # Write the modified AlphaHandler
    f.write("class AlphaHandler(http.server.SimpleHTTPRequestHandler, AuthRoutesMixin, MarketRoutesMixin, InstitutionalRoutesMixin):\n")
    for n in kept_nodes:
        func_code = ast.unparse(n)
        indented = "".join(["    " + line + "\n" for line in func_code.split("\n") if line.strip()])
        f.write(indented)
        f.write("\n")


print("Successfully unparsed into Mixins.")
