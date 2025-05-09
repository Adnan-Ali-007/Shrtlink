from flask import Flask, request, redirect, render_template, url_for
import string, random, sqlite3, os
from werkzeug.middleware.proxy_fix import ProxyFix

app = Flask(__name__)
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)
app.config['DATABASE'] = 'db.sqlite3'

def get_db():
    conn = sqlite3.connect(app.config['DATABASE'])
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with get_db() as db:
        db.execute('''CREATE TABLE IF NOT EXISTS urls (
                        id INTEGER PRIMARY KEY,
                        slug TEXT UNIQUE,
                        original TEXT
                    )''')

init_db()  # <-- Call this once when app starts

@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        original = request.form['url']
        slug = ''.join(random.choices(string.ascii_letters + string.digits, k=6))
        db = get_db()
        db.execute('INSERT INTO urls (slug, original) VALUES (?, ?)', (slug, original))
        db.commit()
        base_url = request.url_root
        if base_url.startswith("http://"):
            base_url = base_url.replace("http://", "https://", 1)
        short_url = base_url + slug
        return render_template('index.html', short_url=short_url)
    return render_template('index.html', short_url=None)

@app.route('/<slug>')
def redirect_slug(slug):
    db = get_db()
    result = db.execute('SELECT original FROM urls WHERE slug = ?', (slug,)).fetchone()
    if result:
        return redirect(result['original'])
    return render_template('404.html'), 404

if __name__ == '__main__':
    if os.environ.get("RENDER") == "true":
        port = int(os.environ.get("PORT", 10000))
        app.run(host='0.0.0.0', port=port)
    else:
        app.run(debug=True)
