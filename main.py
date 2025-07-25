from flask import Flask, request, jsonify
import requests
import os
from datetime import datetime
import pytz

app = Flask(__name__)

# Bot Configuration
BOT_TOKEN = os.getenv('BOT_TOKEN')
CHAT_ID = os.getenv('CHAT_ID')
TELEGRAM_API_URL = f"https://api.telegram.org/bot{BOT_TOKEN}"

IST = pytz.timezone('Asia/Kolkata')

def send_telegram_message(message):
    url = f"{TELEGRAM_API_URL}/sendMessage"
    payload = {
        'chat_id': CHAT_ID,
        'text': message,
        'parse_mode': 'HTML'
    }
    
    try:
        response = requests.post(url, json=payload, timeout=10)
        return response.status_code == 200
    except Exception as e:
        return False

@app.route('/')
def home():
    return jsonify({
        'status': 'Astrological Trading Webhook Active! 🔮',
        'bot': '@ashraf786bot',
        'timestamp': datetime.now(IST).isoformat(),
        'endpoints': ['/test', '/daily-analysis', '/health']
    })

@app.route('/test')
def test():
    message = f"""
🧪 <b>WEBHOOK TEST SUCCESSFUL</b>
⏰ {datetime.now(IST).strftime('%d-%m-%Y %H:%M:%S IST')}

✅ Railway webhook working perfectly!
🔮 URL: website-to-compute-production.up.railway.app
🤖 Bot: @ashraf786bot ready!

🌟 Astrological trading alerts activated!
"""
    
    success = send_telegram_message(message)
    return jsonify({
        'status': 'success' if success else 'failed',
        'message': 'Test sent to Telegram' if success else 'Failed to send'
    })

@app.route('/daily-analysis')
def daily_analysis():
    message = f"""
🔮 <b>ASTROLOGICAL TRADING ANALYSIS</b>
📅 {datetime.now(IST).strftime('%d-%m-%Y %H:%M:%S IST')}

🏛️ <b>NIFTY 50:</b> 🟢 BULLISH (Jupiter support)
🏦 <b>BANK NIFTY:</b> 🟢🟢 STRONG BULLISH (Venus favorable)

📊 <b>SECTOR ANALYSIS:</b>
🟢 BANKING: Jupiter excellent for longs
🟢 IT: Mercury direct, technology surge
🟡 AUTO: Venus mixed signals
🟢 PHARMA: Ketu favorable for research
🔴 METALS: Mars weak, avoid or short
🟢 FMCG: Moon in Cancer, consumer strength

⭐ <b>TODAY'S COSMIC TIMING:</b>
- 09:30 - Moon peak (FMCG bullish)
- 11:00 - Jupiter strong (Banking momentum)
- 14:00 - Venus rise (Consumer goods up)
- 15:00 - Mercury favor (IT sector boost)

💡 <b>STRATEGY:</b> Focus on Banking, IT & FMCG for today's trades!

⚠️ Always combine cosmic insights with technical analysis!
"""
    
    success = send_telegram_message(message)
    return jsonify({
        'status': 'success' if success else 'failed'
    })

@app.route('/health')
def health():
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now(IST).isoformat(),
        'bot_token_configured': bool(BOT_TOKEN),
        'chat_id_configured': bool(CHAT_ID)
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
