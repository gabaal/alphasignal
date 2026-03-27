import sys
import os
print(f"CWD: {os.getcwd()}")
print(f"sys.path: {sys.path}")
import backend.routes.institutional
print(f"Institutional file: {backend.routes.institutional.__file__}")
