import sys
import os
import pandas as pd
sys.path.append(os.path.abspath(r'C:\Users\geral\.gemini\antigravity\scratch\alphasignal'))
from backend.caching import CACHE

raw = CACHE.download("MOG-USD", period="60d", interval="1d", column="Close")
if raw is not None:
    data = raw.squeeze()
    print("Has zeros?")
    print((data == 0.0).sum())
    non_zero = data[data > 0]
    print(non_zero.tail())
