import unittest
import requests
import time
import subprocess
import os

class TestAlphaSignalAPI(unittest.TestCase):
    BASE_URL = "http://127.0.0.1:8012"
    
    @classmethod
    def setUpClass(cls):
        # Start the server in a separate process
        cls.server_proc = subprocess.Popen(["python", "main.py"], cwd="c:/Users/geral/.gemini/antigravity/scratch/alphasignal")
        time.sleep(10) # Wait for server to start
        
    @classmethod
    def tearDownClass(cls):
        cls.server_proc.terminate()
        cls.server_proc.wait()

    def test_signals_endpoint(self):
        response = requests.get(f"{self.BASE_URL}/api/signals")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIsInstance(data, list)

    def test_stress_test_endpoint(self):
        # This route should now call handle_stress_test()
        response = requests.get(f"{self.BASE_URL}/api/stress-test")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('scenarios', data)
        self.assertIn('benchmark', data)
        self.assertEqual(data['benchmark'], 'BTC-USD')

if __name__ == "__main__":
    unittest.main()
