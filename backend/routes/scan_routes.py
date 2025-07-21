from flask import Blueprint, jsonify
from database import db
from utils import allowed_file, predict_with_gradcam, generate_pdf_report
from werkzeug.utils import secure_filename
import uuid
import os

scan_bp = Blueprint('scan_bp', __name__)

@scan_bp.route('/api/scan/upload', methods=['POST'])
def upload_scan():
    return jsonify({'success': False, 'error': 'Scan upload is only allowed by admins.'}), 403 