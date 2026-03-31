"""
Quick Resend email test — run this directly:
  python test_email.py your@email.com
"""
import os, sys, requests
from dotenv import load_dotenv

load_dotenv()

to_email  = sys.argv[1] if len(sys.argv) > 1 else input("Send to: ").strip()
api_key   = os.getenv('RESEND_API_KEY', '')
from_addr = os.getenv('RESEND_FROM', 'AlphaSignal <onboarding@resend.dev>')

print(f"API key : {api_key[:12]}..." if api_key else "ERROR: RESEND_API_KEY not set")
print(f"From    : {from_addr}")
print(f"To      : {to_email}")
print()

if not api_key:
    print("Aborting — set RESEND_API_KEY in .env first")
    sys.exit(1)

resp = requests.post(
    'https://api.resend.com/emails',
    headers={
        'Authorization': f'Bearer {api_key}',
        'Content-Type': 'application/json',
    },
    json={
        'from': from_addr,
        'to': [to_email],
        'subject': 'AlphaSignal — Email Test',
        'html': '''
        <div style="background:#0d1117;padding:32px;font-family:Arial,sans-serif;color:#f8fafc;border-radius:8px;">
          <h2 style="color:#00f2ff;margin-top:0;">AlphaSignal Email Test</h2>
          <p style="color:#94a3b8;">If you can read this, your Resend integration is working correctly.</p>
          <p style="color:#94a3b8;">Morning digests will arrive at <strong style="color:#f8fafc;">07:30 UTC</strong> daily.</p>
          <a href="https://alphasignal.digital" style="display:inline-block;background:#00f2ff;color:#000;
            font-weight:900;padding:10px 20px;border-radius:6px;text-decoration:none;margin-top:12px;">
            Open Terminal &rarr;
          </a>
        </div>
        ''',
    },
    timeout=15
)

print(f"HTTP status : {resp.status_code}")
print(f"Response    : {resp.text}")
if resp.status_code in (200, 201, 202):
    print("\nSUCCESS -- check your inbox (may take 30s)")
else:
    print("\nFAILED -- see response above for details")

