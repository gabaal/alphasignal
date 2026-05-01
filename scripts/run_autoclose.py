from backend.services import HarvestService

def run():
    print("Starting auto_close_signals...")
    h = HarvestService(cache=None)
    try:
        h.auto_close_signals()
        print("auto_close_signals completed successfully!")
    except Exception as e:
        print("CRASHED:", repr(e))

if __name__ == '__main__':
    run()
