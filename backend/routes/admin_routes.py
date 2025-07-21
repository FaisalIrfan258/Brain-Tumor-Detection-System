from flask import Blueprint, request, jsonify
from database import db
from utils import send_credentials_email, allowed_file, predict_with_gradcam, generate_pdf_report
from werkzeug.utils import secure_filename
import uuid
import os

admin_bp = Blueprint('admin_bp', __name__)

@admin_bp.route('/api/admin/dashboard', methods=['GET'])
def admin_dashboard():
    try:
        stats = db.get_dashboard_stats()
        return jsonify({'success': True, 'data': stats})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@admin_bp.route('/api/admin/dashboard/stats', methods=['GET'])
def admin_dashboard_stats():
    try:
        stats = db.get_dashboard_stats()
        return jsonify({'success': True, 'data': stats})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@admin_bp.route('/api/admin/patients', methods=['GET'])
def get_all_patients():
    try:
        patients = db.get_all_patients()
        return jsonify({'success': True, 'data': patients})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@admin_bp.route('/api/admin/login', methods=['POST'])
def admin_login():
    try:
        data = request.json
        username = data.get('username')
        password = data.get('password')
        if not username or not password:
            return jsonify({'success': False, 'error': 'Username and password are required'})
        admin = db.get_admin_by_credentials(username, password)
        if admin:
            return jsonify({'success': True, 'data': {'id': admin['id'], 'username': admin['username'], 'email': admin['email']}})
        else:
            return jsonify({'success': False, 'error': 'Invalid credentials'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@admin_bp.route('/api/admin/patients/<int:patient_id>', methods=['GET'])
def get_admin_patient_info(patient_id):
    try:
        patient = db.get_patient_by_id(patient_id)
        if patient:
            return jsonify({'success': True, 'data': patient})
        else:
            return jsonify({'success': False, 'error': 'Patient not found'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@admin_bp.route('/api/admin/patients/<int:patient_id>/scans', methods=['GET'])
def get_admin_patient_scans(patient_id):
    try:
        scans = db.get_patient_scans(patient_id)
        return jsonify({'success': True, 'data': scans})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@admin_bp.route('/api/admin/patients/<int:patient_id>/reports', methods=['GET'])
def get_admin_patient_reports(patient_id):
    try:
        reports = db.get_patient_reports(patient_id)
        return jsonify({'success': True, 'data': reports})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@admin_bp.route('/api/admin/patients', methods=['POST'])
def add_patient():
    try:
        data = request.json
        required_fields = ['name', 'email']
        for field in required_fields:
            if field not in data:
                return jsonify({'success': False, 'error': f'Missing required field: {field}'})
        result = db.add_patient(
            name=data['name'],
            email=data['email'],
            age=data.get('age'),
            gender=data.get('gender'),
            phone=data.get('phone'),
            address=data.get('address')
        )
        if result:
            email_sent = send_credentials_email(result['email'], result['username'], result['password'], result['name'])
            return jsonify({'success': True, 'data': {'patient_id': result['patient_id'], 'username': result['username'], 'password': result['password'], 'email_sent': email_sent}})
        else:
            return jsonify({'success': False, 'error': 'Failed to add patient'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@admin_bp.route('/api/admin/scans', methods=['GET'])
def get_all_scans():
    try:
        scans = db.get_all_scans()
        return jsonify({'success': True, 'data': scans})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@admin_bp.route('/api/admin/scans/upload', methods=['POST'])
def upload_scan_admin():
    try:
        if 'files' not in request.files:
            return jsonify({'success': False, 'error': 'No files uploaded'})
        files = request.files.getlist('files')
        patient_id = request.form.get('patient_id')
        if not patient_id:
            return jsonify({'success': False, 'error': 'Patient ID is required'})
        if not files or all(file.filename == '' for file in files):
            return jsonify({'success': False, 'error': 'No files selected'})
        results = []
        scan_ids = []
        for file in files:
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                unique_filename = f"{uuid.uuid4()}_{filename}"
                temp_dir = "temp_uploads"
                os.makedirs(temp_dir, exist_ok=True)
                filepath = os.path.join(temp_dir, unique_filename)
                file.save(filepath)
                result = predict_with_gradcam(filepath)
                try:
                    os.remove(filepath)
                except:
                    pass
                if result['success']:
                    scan_result = db.add_scan(
                        patient_id=int(patient_id),
                        original_filename=filename,
                        original_path=result['original_path'],
                        heatmap_path=result['heatmap_path'],
                        overlay_path=result['overlay_path'],
                        prediction=result['prediction'],
                        confidence=result['confidence'],
                        probability=result['probability']
                    )
                    if scan_result:
                        scan_ids.append(scan_result['scan_id'])
                        results.append({'success': True, 'filename': filename, 'scan_id': scan_result['scan_id'], 'prediction': result['prediction'], 'confidence': result['confidence'], 'probability': result['probability'], 'original_image': result['original_path'], 'heatmap': result['heatmap_path'], 'overlay': result['overlay_path']})
                    else:
                        results.append({'success': False, 'filename': filename, 'error': 'Failed to save scan to database'})
                else:
                    results.append({'success': False, 'filename': filename, 'error': result['error']})
            else:
                results.append({'success': False, 'filename': file.filename if file else 'unknown', 'error': 'Invalid file type'})
        report_data = None
        if scan_ids:
            try:
                patient = db.get_patient_by_id(int(patient_id))
                if patient:
                    # Get only the current batch of scans
                    batch_scans = db.get_scans_by_ids(scan_ids)
                    if batch_scans:
                        report_path = generate_pdf_report(patient, batch_scans)
                        if report_path:
                            tumor_count = sum(1 for s in batch_scans if s['prediction'] == 'Tumor')
                            no_tumor_count = sum(1 for s in batch_scans if s['prediction'] == 'No Tumor')
                            report_result = db.add_report(
                                patient_id=int(patient_id),
                                report_path=report_path,
                                scan_count=len(batch_scans),
                                tumor_count=tumor_count,
                                no_tumor_count=no_tumor_count
                            )
                            if report_result:
                                report_data = {'report_id': report_result['report_id'], 'report_url': report_path, 'scan_count': len(batch_scans), 'tumor_count': tumor_count, 'no_tumor_count': no_tumor_count}
            except Exception as e:
                print(f"Error generating report: {e}")
        return jsonify({'success': True, 'scan_ids': scan_ids, 'results': results, 'report_generated': report_data is not None, 'report_data': report_data})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@admin_bp.route('/api/admin/reports', methods=['GET'])
def get_all_reports():
    try:
        reports = db.get_all_reports()
        return jsonify({'success': True, 'data': reports})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}) 