import sys
import json
sys.path.append('.')
from backend.routes.institutional import InstitutionalRoutesMixin

class DummyProxy(InstitutionalRoutesMixin):
    def send_json(self, data):
        print('JSON_DATA_RETURNED:', len(data))

proxy = DummyProxy()
proxy.handle_signals()
