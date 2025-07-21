from flask import Blueprint, request, jsonify
from database import db
from utils import allowed_file, predict_with_gradcam

patient_bp = Blueprint('patient_bp', __name__)

@patient_bp.route('/api/patient/login', methods=['POST'])
def patient_login():
    try:
        data = request.json
        username = data.get('username')
        password = data.get('password')
        if not username or not password:
            return jsonify({'success': False, 'error': 'Username and password are required'})
        patient = db.get_patient_by_credentials(username, password)
        if patient:
            return jsonify({'success': True, 'data': {'id': patient['id'], 'name': patient['name'], 'patient_id': patient['patient_id'], 'email': patient['email']}})
        else:
            return jsonify({'success': False, 'error': 'Invalid credentials'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@patient_bp.route('/api/patient/<int:patient_id>/scans', methods=['GET'])
def get_patient_scans(patient_id):
    try:
        scans = db.get_patient_scans(patient_id)
        return jsonify({'success': True, 'data': scans})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@patient_bp.route('/api/patient/<int:patient_id>/reports', methods=['GET'])
def get_patient_reports(patient_id):
    try:
        reports = db.get_patient_reports(patient_id)
        return jsonify({'success': True, 'data': reports})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@patient_bp.route('/api/patient/<int:patient_id>', methods=['GET'])
def get_patient_info(patient_id):
    try:
        patient = db.get_patient_by_id(patient_id)
        if patient:
            return jsonify({'success': True, 'data': patient})
        else:
            return jsonify({'success': False, 'error': 'Patient not found'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}) 