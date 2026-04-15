import numpy as np

try:
    float(np.array([1]))
except Exception as e:
    print("np.array([1]):", repr(e))

try:
    float(np.array([1, 2]))
except Exception as e:
    print("np.array([1, 2]):", repr(e))

import pandas as pd
df = pd.DataFrame({'HOOD': [1, 2, 3]})
try:
    [float(p) for p in df.values]
except Exception as e:
    print("df.values list comp:", repr(e))
