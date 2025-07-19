from flask import Flask, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv
from database import db

load_dotenv('config.env')

app = Flask(__name__)
CORS(app)

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'message': 'Brain Tumor Detection API is running'})

@app.route('/api/admin/dashboard', methods=['GET'])
def admin_dashboard():
    """Get dashboard statistics"""
    try:
        stats = db.get_dashboard_stats()
        return jsonify({'success': True, 'data': stats})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/admin/patients', methods=['GET'])
def get_all_patients():
    """Get all patients"""
    try:
        patients = db.get_all_patients()
        return jsonify({'success': True, 'data': patients})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

if __name__ == '__main__':
    print("🚀 Starting Brain Tumor Detection API (Database Test Mode)")
    print("📊 Testing database connection and API endpoints...")
    app.run(debug=True, host='0.0.0.0', port=5000) 