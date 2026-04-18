import sys
sys.path.append('backend')
from routes.institutional import InstitutionalRoutesMixin
import traceback

class Mock(InstitutionalRoutesMixin):
    path = '/onchain'
    _onchain_cache = {}
    def send_json(self, d):
        pass

def run():
    try:
        i = Mock()
        try:
            i.handle_onchain()
        except:
            traceback.print_exc()
    except Exception as e:
        print("Setup error:", e)

run()
