import sys

with open(r'c:\Users\geral\.gemini\antigravity\scratch\alphasignal\backend\routes\ai_engine.py', 'r', encoding='utf-8') as f:
    text = f.read()

target = '''        try:
            resp = client.chat.completions.create(
                model='gpt-4o-mini',
                messages=[
                    {'role': 'system', 'content': system_prompt},
                    {'role': 'user',   'content': user_prompt}
                ],
                max_tokens=350,
                temperature=0.7
            )
            explanation = resp.choices[0].message.content.strip()
            self.send_json({
                'explanation': explanation,
                'source': 'gpt-4o-mini'
            })
        except Exception as e:
            print(f'[AI Engine] Options Explain Error: {e}')
            self.send_json({'error': str(e)})'''

replacement = '''        is_stream = 'stream=true' in self.path.lower()
        try:
            resp = client.chat.completions.create(
                model='gpt-4o-mini',
                messages=[
                    {'role': 'system', 'content': system_prompt},
                    {'role': 'user',   'content': user_prompt}
                ],
                max_tokens=350,
                temperature=0.7,
                stream=is_stream
            )
            
            if is_stream:
                import json
                self.send_response(200)
                self.send_header('Content-Type', 'text/event-stream')
                self.send_header('Cache-Control', 'no-cache')
                self.send_header('Connection', 'keep-alive')
                # Access-Control matching from router
                origin = self.headers.get('Origin', '')
                cors_origin = origin if origin in {'https://alphasignal.digital', 'https://www.alphasignal.digital', 'http://localhost:8006', 'http://127.0.0.1:8006'} else 'https://alphasignal.digital'
                self.send_header('Access-Control-Allow-Origin', cors_origin)
                self.end_headers()
                
                for chunk in resp:
                    delta = chunk.choices[0].delta.content
                    if delta:
                        self.wfile.write(f"data: {json.dumps({'text': delta})}\\n\\n".encode('utf-8'))
                        self.wfile.flush()
            else:
                explanation = resp.choices[0].message.content.strip()
                self.send_json({
                    'explanation': explanation,
                    'source': 'gpt-4o-mini'
                })
        except Exception as e:
            print(f'[AI Engine] Options Explain Error: {e}')
            if is_stream:
                import json
                try:
                    self.wfile.write(f"data: {json.dumps({'error': str(e)})}\\n\\n".encode('utf-8'))
                    self.wfile.flush()
                except:
                    pass
            else:
                self.send_json({'error': str(e)})'''

text = text.replace(target, replacement)
with open(r'c:\Users\geral\.gemini\antigravity\scratch\alphasignal\backend\routes\ai_engine.py', 'w', encoding='utf-8') as f:
    f.write(text)
