import requests
import json

headers = {'User-agent': 'AlphaSignal Outreach Bot 1.0'}
subreddits = ['algotrading', 'CryptoCurrency', 'Daytrading', 'CryptoMarkets', 'MachineLearning']

print("Recent Reddit Posts (Last 24h) for potential outreach:\n")

for sub in subreddits:
    try:
        url = f'https://www.reddit.com/r/{sub}/new.json?limit=5'
        r = requests.get(url, headers=headers)
        if r.status_code == 200:
            data = r.json()
            posts = data.get('data', {}).get('children', [])
            if posts:
                print(f"--- r/{sub} ---")
                for post in posts:
                    title = post['data']['title']
                    url = post['data']['url']
                    print(f"- {title}\n  {url}")
                print("\n")
    except Exception as e:
        pass
