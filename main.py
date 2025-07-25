from flask import Flask, request, jsonify
import requests
import os
from datetime import datetime
import pytz

app = Flask(__name__)

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
        'timestamp': datetime.now(IST).isoformat()
    })

@app.route('/test')
def test():
    message = f"""
🧪 <b>WEBHOOK TEST SUCCESSFUL</b>
⏰ {datetime.now(IST).strftime('%d-%m-%Y %H:%M:%S IST')}

✅ Railway webhook working!
🔮 Astrological trading bot ready!
🌟 Ready for cosmic alerts!
"""
    
    success = send_telegram_message(message)
    return jsonify({
        'status': 'success' if success else 'failed'
    })

@app.route('/daily-analysis')
def daily_analysis():
    message = f"""
🔮 <b>ASTROLOGICAL TRADING ANALYSIS</b>
📅 {datetime.now(IST).strftime('%d-%m-%Y %H:%M:%S IST')}

🏛️ <b>NIFTY 50:</b> 🟢 BULLISH
🏦 <b>BANK NIFTY:</b> 🟢🟢 STRONG BULLISH

📊 <b>SECTOR ANALYSIS:</b>
🟢 BANKING: Jupiter excellent for longs
🟢 IT: Mercury direct, tech surge
🟡 AUTO: Venus mixed signals
🔴 METALS: Mars weak, avoid

⭐ <b>COSMIC TIMING:</b>
- 09:30 - Moon in Cancer (FMCG bullish)
- 11:00 - Jupiter peak (Banking boom)
- 14:00 - Venus rise (Consumer up)

💡 Focus on Banking & IT today! 🚀
"""
    
    success
