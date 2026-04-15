import sys
import os
sys.path.append(os.path.abspath(r'C:\Users\geral\.gemini\antigravity\scratch\alphasignal'))
from backend.caching import CACHE

ticker = "MOG2-USD" # or "MOG-USD"
raw = CACHE.download("MOG-USD", period="60d", interval="1d", column="Close")
if raw is not None:
    print(raw.tail())
else:
    print("No data for MOG-USD")

raw = CACHE.download("PEPE-USD", period="60d", interval="1d", column="Close")
if raw is not None:
    print(raw.tail())
