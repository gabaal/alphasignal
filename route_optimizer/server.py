import http.server
import json
import sqlite3
import urllib.parse
import os
import sys

# Define path for DB file in the same directory as server.py
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_FILE = os.path.join(BASE_DIR, 'route_optimizer.db')

def init_db():
    print(f"Initializing database at: {DB_FILE}")
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS stops (
            id TEXT PRIMARY KEY,
            stop_date TEXT,
            client_name TEXT,
            address TEXT,
            phone TEXT,
            task TEXT,
            lat REAL,
            lng REAL,
            position INTEGER
        )
    ''')
    conn.commit()
    conn.close()

class RouteOptimizerHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        # Always serve static files from BASE_DIR directory
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def end_headers(self):
        # Ensure CORS is allowed for all endpoints
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        parsed_path = urllib.parse.urlparse(self.path)
        if parsed_path.path == '/api/stops':
            query_params = urllib.parse.parse_qs(parsed_path.query)
            date_val = query_params.get('date', [None])[0]
            if not date_val:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': "Missing 'date' parameter"}).encode('utf-8'))
                return
            
            try:
                conn = sqlite3.connect(DB_FILE)
                conn.row_factory = sqlite3.Row
                c = conn.cursor()
                c.execute('''
                    SELECT id, client_name, address, phone, task, lat, lng 
                    FROM stops 
                    WHERE stop_date = ? 
                    ORDER BY position ASC
                ''', (date_val,))
                rows = c.fetchall()
                stops = []
                for r in rows:
                    stops.append({
                        'id': r['id'],
                        'name': r['client_name'],
                        'address': r['address'],
                        'phone': r['phone'],
                        'task': r['task'],
                        'lat': r['lat'],
                        'lng': r['lng']
                    })
                conn.close()
                
                response_data = json.dumps(stops).encode('utf-8')
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', len(response_data))
                self.end_headers()
                self.wfile.write(response_data)
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))
        else:
            # Serve static files
            super().do_GET()

    def do_POST(self):
        parsed_path = urllib.parse.urlparse(self.path)
        if parsed_path.path == '/api/stops':
            query_params = urllib.parse.parse_qs(parsed_path.query)
            date_val = query_params.get('date', [None])[0]
            if not date_val:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': "Missing 'date' parameter"}).encode('utf-8'))
                return
            
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            try:
                stops = json.loads(post_data.decode('utf-8'))
            except Exception as e:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': f"Invalid JSON payload: {e}"}).encode('utf-8'))
                return
            
            try:
                conn = sqlite3.connect(DB_FILE)
                c = conn.cursor()
                c.execute('BEGIN TRANSACTION')
                c.execute('DELETE FROM stops WHERE stop_date = ?', (date_val,))
                for i, stop in enumerate(stops):
                    c.execute('''
                        INSERT INTO stops (id, stop_date, client_name, address, phone, task, lat, lng, position)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ''', (
                        stop.get('id'),
                        date_val,
                        stop.get('name'),
                        stop.get('address'),
                        stop.get('phone'),
                        stop.get('task'),
                        stop.get('lat'),
                        stop.get('lng'),
                        i
                    ))
                conn.commit()
                conn.close()
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'status': 'success'}).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()

if __name__ == '__main__':
    init_db()
    port = 8081
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            pass
            
    server_address = ('', port)
    httpd = http.server.HTTPServer(server_address, RouteOptimizerHandler)
    print(f"Route Optimizer server running on port {port}...")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server.")
        httpd.server_close()
