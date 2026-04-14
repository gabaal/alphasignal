import json
from http.server import HTTPServer
import threading
import time
import requests

def test_api():
    # Because starting the whole main.py might be tricky, we can just load the auth and route modules.
    import backend.api_router as api_router
    # To bypass auth, we can monkeypatch `is_authenticated`
    def fake_auth(self):
        return {'email': 'geraldbaalham@live.co.uk'}
    
    api_router.AlphaSignalRouter.is_authenticated = fake_auth
    
    server = HTTPServer(('127.0.0.1', 8888), api_router.AlphaSignalRouter)
    t = threading.Thread(target=server.serve_forever)
    t.daemon = True
    t.start()
    time.sleep(1)
    
    try:
        # First, SET the values to something we know using /alert-settings
        payload1 = {
            "rebalance_threshold": 8.0,
            "whale_threshold": 42.0,
            "alerts_enabled": True
        }
        res = requests.post('http://127.0.0.1:8888/alert-settings', json=payload1)
        print("POST 1:", res.status_code, res.text)
        
        # Then, GET to see if it saved
        res = requests.get('http://127.0.0.1:8888/alert-settings')
        print("GET 1:", res.status_code, res.text)
        
        # Then, POST from user/settings to simulate main.js (only sending z_threshold)
        payload2 = {
            "z_threshold": 4.5
        }
        res = requests.post('http://127.0.0.1:8888/alert-settings', json=payload2)
        print("POST 2:", res.status_code, res.text)
        
        # Finally GET again to see if rebalance was preserved
        res = requests.get('http://127.0.0.1:8888/alert-settings')
        print("GET 2:", res.status_code, res.text)
        
    finally:
        server.shutdown()

if __name__ == '__main__':
    test_api()
