from flask import Blueprint, request, jsonify, send_file, current_app
from database import db
from utils import generate_pdf_report
from s3_service import s3_service
from psycopg2.extras import RealDictCursor
import os

report_bp = Blueprint('report_bp', __name__)

@report_bp.route('/api/report/generate', methods=['POST'])
def generate_report():
    try:
        data = request.json
        patient_id = data.get('patient_id')
        scan_ids = data.get('scan_ids')
        if not patient_id:
            return jsonify({'success': False, 'error': 'Patient ID is required'})
        patient = db.get_patient_by_id(patient_id)
        if not patient:
            return jsonify({'success': False, 'error': 'Patient not found'})
        if scan_ids:
            scans = db.get_scans_by_ids(scan_ids)
        else:
            scans = db.get_patient_scans(patient_id)
        if not scans:
            return jsonify({'success': False, 'error': 'No scans found for report'})
        report_path = generate_pdf_report(patient, scans, current_app.config['REPORT_FOLDER'])
        if report_path:
            tumor_count = sum(1 for s in scans if s['prediction'] == 'Tumor')
            no_tumor_count = sum(1 for s in scans if s['prediction'] == 'No Tumor')
            report_result = db.add_report(
                patient_id=patient_id,
                report_path=report_path,
                scan_count=len(scans),
                tumor_count=tumor_count,
                no_tumor_count=no_tumor_count
            )
            if report_result:
                return jsonify({'success': True, 'data': {'report_id': report_result['report_id'], 'report_path': report_path}})
            else:
                return jsonify({'success': False, 'error': 'Failed to save report to database'})
        else:
            return jsonify({'success': False, 'error': 'Failed to generate PDF report'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@report_bp.route('/api/report/download/<report_id>')
def download_report(report_id):
    try:
        cursor = db.connection.cursor(cursor_factory=RealDictCursor)
        cursor.execute("SELECT report_path FROM reports WHERE report_id = %s", (report_id,))
        report = cursor.fetchone()
        cursor.close()
        if not report:
            return jsonify({'success': False, 'error': 'Report not found'})
        return jsonify({'success': True, 'download_url': report['report_path']})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@report_bp.route('/api/report/download-by-filename/<filename>')
def download_report_by_filename(filename):
    try:
        cursor = db.connection.cursor(cursor_factory=RealDictCursor)
        cursor.execute("SELECT report_path FROM reports WHERE report_path LIKE %s", (f"%{filename}",))
        report = cursor.fetchone()
        cursor.close()
        if not report:
            return jsonify({'success': False, 'error': 'Report not found'})
        report_path = report['report_path']
        if report_path.startswith('reports/') or report_path.endswith('.pdf'):
            s3_url_result = s3_service.generate_presigned_url(report_path)
            if s3_url_result['success']:
                return jsonify({'success': True, 'download_url': s3_url_result['url']})
            else:
                return jsonify({'success': False, 'error': s3_url_result['error']})
        return jsonify({'success': True, 'download_url': report_path})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@report_bp.route('/api/report/file/<filename>')
def serve_report_file(filename):
    try:
        if not filename.endswith('.pdf'):
            return jsonify({'success': False, 'error': 'Invalid file type'})
        file_path = os.path.join('reports', filename)
        if os.path.exists(file_path):
            return send_file(file_path, as_attachment=True, download_name=filename)
        else:
            return jsonify({'success': False, 'error': 'Report file not found'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}) 