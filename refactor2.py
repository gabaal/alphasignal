import os

os.makedirs('backend', exist_ok=True)
open('backend/__init__.py', 'w').close()

with open('main.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# 1. backend/database.py
with open('backend/database.py', 'w', encoding='utf-8') as f:
    f.write('import os\nimport sqlite3\nimport requests\n')
    f.writelines(lines[25:179])

# 2. backend/caching.py
with open('backend/caching.py', 'w', encoding='utf-8') as f:
    f.write('import json\nimport time\nimport sqlite3\nimport threading\nimport pandas as pd\nimport yfinance as yf\nimport io\nfrom datetime import datetime\n')
    f.write('from .database import SupabaseClient, DB_PATH\n\n')
    f.writelines(lines[182:336])

# 3. backend/services.py
with open('backend/services.py', 'w', encoding='utf-8') as f:
    f.write('import sqlite3\nimport requests\nimport json\nimport os\nimport time\nimport threading\nimport random\nfrom datetime import datetime\n')
    f.write('import pandas as pd\nimport numpy as np\nfrom sklearn.ensemble import RandomForestRegressor\nimport yfinance as yf\n')
    f.write('from .database import DB_PATH\n')
    f.write('from .caching import CACHE\n\n')
    f.write('UNIVERSE = ' + ''.join(lines[117:130]) + '\n')
    
    # Needs getting sentiment dependencies - for now we'll copy lines 825-890 first, then ML engine
    f.writelines(lines[825:891]) # get_sentiment, get_sentiment_batch, get_orderbook_imbalance
    f.writelines(lines[336:825]) # NotificationService, MLAlphaEngine, PortfolioSimulator, HarvestService

# Now generate a stripped down main.py mock without replacing yet, so we can verify it works
with open('main_new.py', 'w', encoding='utf-8') as f:
    f.writelines(lines[0:25]) # Initial imports
    f.write('\n# --- INJECTED BACKEND MODULES ---\n')
    f.write('from backend.database import load_env, PORT, SUPABASE_URL, SUPABASE_KEY, SUPABASE_HEADERS, STRIPE_PUBLISHABLE_KEY, STRIPE_SECRET_KEY, SupabaseClient, UNIVERSE, WHALE_WALLETS, SENTIMENT_KEYWORDS, data_dir, DB_PATH, init_db\n')
    f.write('from backend.caching import DataCache\n')
    f.write('from backend.services import NotificationService, MLAlphaEngine, PortfolioSimulator, HarvestService, get_sentiment, get_sentiment_batch, get_orderbook_imbalance\n\n')
    
    f.write('CACHE = DataCache(ttl=300)\n')
    f.write('NOTIFY = NotificationService()\n')
    f.write('ML_ENGINE = MLAlphaEngine()\n')
    f.write('PORTFOLIO_SIM = PortfolioSimulator()\n\n')
    
    # Append the rest of main.py starting from 891 (get_ticker_name and AlphaHandler)
    f.writelines(lines[891:])

print("Successfully sliced main.py into backend/ and main_new.py")
