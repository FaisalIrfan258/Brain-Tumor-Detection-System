from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import uuid
import datetime
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv
from database import db
from cloudinary_service import cloudinary_service
from psycopg2.extras import RealDictCursor
import torch
import torch.nn as nn
import torchvision.models as models
import torchvision.transforms as transforms
from torchvision.models import ResNet18_Weights
import numpy as np
import cv2
from PIL import Image
import base64
import io
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.cm as cm
from werkzeug.utils import secure_filename
import json
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image as RLImage, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

load_dotenv('config.env')

app = Flask(__name__)

# Enhanced CORS configuration
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:3000", "http://127.0.0.1:3000"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"],
        "supports_credentials": True
    }
})

app.config['REPORT_FOLDER'] = os.getenv('REPORT_FOLDER', 'reports')
app.config['MAX_CONTENT_LENGTH'] = int(os.getenv('MAX_CONTENT_LENGTH', 16777216))

# Create necessary directories
os.makedirs(app.config['REPORT_FOLDER'], exist_ok=True)

# Device configuration
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

class BrainTumorClassifier(nn.Module):
    def __init__(self, pretrained=True):
        super(BrainTumorClassifier, self).__init__()
        
        # Use ResNet18 as backbone
        self.backbone = models.resnet18(weights=ResNet18_Weights.DEFAULT if pretrained else None)
        
        # Replace the final layer for binary classification
        num_features = self.backbone.fc.in_features
        self.backbone.fc = nn.Sequential(
            nn.Dropout(0.3),
            nn.Linear(num_features, 512),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(512, 256),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(256, 1)
        )

    def forward(self, x):
        return self.backbone(x)

class GradCAM:
    def __init__(self, model, target_layer_name='backbone.layer4'):
        self.model = model
        self.target_layer_name = target_layer_name
        self.gradients = None
        self.activations = None
        self.hooks = []
        self.register_hooks()

    def register_hooks(self):
        def backward_hook(module, grad_input, grad_output):
            self.gradients = grad_output[0]

        def forward_hook(module, input, output):
            self.activations = output

        # Get the target layer
        target_layer = dict([*self.model.named_modules()])[self.target_layer_name]
        
        # Register hooks
        hook1 = target_layer.register_backward_hook(backward_hook)
        hook2 = target_layer.register_forward_hook(forward_hook)
        self.hooks = [hook1, hook2]

    def generate_cam(self, input_image, class_idx=None):
        # Forward pass
        self.model.eval()
        model_output = self.model(input_image)
        
        # Backward pass
        self.model.zero_grad()
        model_output[0][0].backward(retain_graph=True)
        
        # Generate CAM
        if self.gradients is None or self.activations is None:
            return np.zeros((224, 224))
        
        gradients = self.gradients[0].cpu().data.numpy()
        activations = self.activations[0].cpu().data.numpy()
        
        # Calculate weights
        weights = np.mean(gradients, axis=(1, 2))
        
        # Generate weighted combination
        cam = np.zeros(activations.shape[1:], dtype=np.float32)
        for i, w in enumerate(weights):
            cam += w * activations[i]
        
        # Apply ReLU
        cam = np.maximum(cam, 0)
        
        # Resize to input size
        cam = cv2.resize(cam, (224, 224))
        
        # Normalize
        if cam.max() > 0:
            cam = cam / cam.max()
        
        return cam

    def remove_hooks(self):
        for hook in self.hooks:
            hook.remove()

# Initialize model
model = BrainTumorClassifier(pretrained=True)

# Load your trained model weights
checkpoint = torch.load('models/brain_tumor_detection_model_complete.pth', map_location=device)
if "model_state_dict" in checkpoint:
    model.load_state_dict(checkpoint["model_state_dict"])
else:
    model.load_state_dict(checkpoint)
model = model.to(device)
model.eval()

# Image preprocessing
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

def send_credentials_email(email, username, password, patient_name):
    """Send login credentials to patient via email"""
    try:
        smtp_server = os.getenv('SMTP_SERVER')
        smtp_port = int(os.getenv('SMTP_PORT', 587))
        smtp_username = os.getenv('SMTP_USERNAME')
        smtp_password = os.getenv('SMTP_PASSWORD')
        
        if not all([smtp_server, smtp_username, smtp_password]):
            print("Email configuration not complete")
            return False
        
        msg = MIMEMultipart()
        msg['From'] = smtp_username
        msg['To'] = email
        msg['Subject'] = "Your Brain Tumor Detection System Login Credentials"
        
        body = f"""
        Dear {patient_name},
        
        Your account has been created in the Brain Tumor Detection System.
        
        Your login credentials are:
        Username: {username}
        Password: {password}
        
        Please keep these credentials safe and do not share them with anyone.
        
        You can access your portal at: http://localhost:3000/patient-login
        
        Best regards,
        Brain Tumor Detection System Team
        """
        
        msg.attach(MIMEText(body, 'plain'))
        
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(smtp_username, smtp_password)
        text = msg.as_string()
        server.sendmail(smtp_username, email, text)
        server.quit()
        
        return True
        
    except Exception as e:
        print(f"Error sending email: {e}")
        return False

def predict_with_gradcam(image_path):
    """Make prediction and generate GradCAM visualization"""
    try:
        # Preprocess image
        image = Image.open(image_path).convert('RGB')
        image_tensor = transform(image).unsqueeze(0)
        image_tensor = image_tensor.to(device)
        
        # Make prediction
        with torch.no_grad():
            output = model(image_tensor)
            probability = torch.sigmoid(output).item()
            prediction = 1 if probability >= 0.5 else 0
            confidence = probability if prediction == 1 else 1 - probability
        
        # Generate GradCAM
        gradcam = GradCAM(model, target_layer_name='backbone.layer4')
        cam = gradcam.generate_cam(image_tensor)
        
        # Create visualizations
        original_array = np.array(image.resize((224, 224)))
        
        # Create heatmap overlay
        heatmap = cm.jet(cam)[:, :, :3]
        heatmap = (heatmap * 255).astype(np.uint8)
        
        # Create overlay
        overlay = original_array.copy()
        overlay = cv2.addWeighted(overlay, 0.6, heatmap, 0.4, 0)
        
        # Save images temporarily and upload to Cloudinary
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        temp_dir = "temp_uploads"
        os.makedirs(temp_dir, exist_ok=True)
        temp_original_path = os.path.join(temp_dir, f"temp_original_{timestamp}.png")
        temp_heatmap_path = os.path.join(temp_dir, f"temp_heatmap_{timestamp}.png")
        temp_overlay_path = os.path.join(temp_dir, f"temp_overlay_{timestamp}.png")
        
        Image.fromarray(original_array.astype(np.uint8)).save(temp_original_path)
        Image.fromarray(heatmap.astype(np.uint8)).save(temp_heatmap_path)
        Image.fromarray(overlay.astype(np.uint8)).save(temp_overlay_path)
        
        # Upload to Cloudinary
        original_upload = cloudinary_service.upload_image(temp_original_path, folder="brain_tumor_scans/original")
        heatmap_upload = cloudinary_service.upload_image(temp_heatmap_path, folder="brain_tumor_scans/heatmap")
        overlay_upload = cloudinary_service.upload_image(temp_overlay_path, folder="brain_tumor_scans/overlay")
        
        # Clean up temporary files
        os.remove(temp_original_path)
        os.remove(temp_heatmap_path)
        os.remove(temp_overlay_path)
        
        # Clean up GradCAM
        gradcam.remove_hooks()
        
        if not all([original_upload['success'], heatmap_upload['success'], overlay_upload['success']]):
            return {
                'success': False,
                'error': 'Failed to upload images to Cloudinary'
            }
        
        return {
            'success': True,
            'prediction': 'Tumor' if prediction == 1 else 'No Tumor',
            'confidence': float(confidence),
            'probability': float(probability),
            'original_path': original_upload['url'],
            'heatmap_path': heatmap_upload['url'],
            'overlay_path': overlay_upload['url'],
            'original_public_id': original_upload['public_id'],
            'heatmap_public_id': heatmap_upload['public_id'],
            'overlay_public_id': overlay_upload['public_id']
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

def generate_pdf_report(patient_info, scans_data):
    """Generate a PDF report with all results and patient information"""
    try:
        # Create a unique filename for the report
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        report_filename = f"brain_scan_report_{timestamp}.pdf"
        report_path = os.path.join(app.config['REPORT_FOLDER'], report_filename)
        
        # Create the PDF document
        doc = SimpleDocTemplate(
            report_path,
            pagesize=letter,
            rightMargin=72,
            leftMargin=72,
            topMargin=72,
            bottomMargin=18
        )
        
        # Container for the 'Flowable' objects
        elements = []
        
        # Define styles
        styles = getSampleStyleSheet()
        
        # Add custom styles
        styles.add(ParagraphStyle(
            name='CenteredTitle',
            parent=styles['Heading1'],
            alignment=1,
            spaceAfter=12
        ))
        
        # Add title
        elements.append(Paragraph("Brain Tumor Detection Report", styles['CenteredTitle']))
        elements.append(Spacer(1, 0.25*inch))
        
        # Add date and time
        report_date = datetime.datetime.now().strftime("%B %d, %Y at %H:%M:%S")
        elements.append(Paragraph(f"Report Generated: {report_date}", styles['Heading2']))
        elements.append(Spacer(1, 0.25*inch))
        
        # Add patient information
        elements.append(Paragraph("Patient Information:", styles['Heading2']))
        
        patient_data = [
            ["Name:", patient_info.get('name', 'Not provided')],
            ["Patient ID:", patient_info.get('patient_id', 'Not provided')],
            ["Age:", str(patient_info.get('age', 'Not provided'))],
            ["Gender:", patient_info.get('gender', 'Not provided')],
            ["Email:", patient_info.get('email', 'Not provided')]
        ]
        
        patient_table = Table(patient_data, colWidths=[1.5*inch, 4*inch])
        patient_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.black),
            ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
            ('ALIGN', (1, 0), (1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('BACKGROUND', (1, 0), (1, -1), colors.white),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        elements.append(patient_table)
        elements.append(Spacer(1, 0.25*inch))
        
        # Add summary of results
        elements.append(Paragraph("Summary of Results:", styles['Heading2']))
        elements.append(Spacer(1, 0.1*inch))
        
        # Count tumor and no tumor cases
        tumor_count = sum(1 for s in scans_data if s.get('prediction') == 'Tumor')
        no_tumor_count = sum(1 for s in scans_data if s.get('prediction') == 'No Tumor')
        
        summary_text = f"""
        Total images analyzed: {len(scans_data)}<br/>
        Images with tumor detected: {tumor_count}<br/>
        Images with no tumor detected: {no_tumor_count}<br/>
        """
        
        elements.append(Paragraph(summary_text, styles['Normal']))
        elements.append(Spacer(1, 0.25*inch))
        
        # Add detailed results for each scan
        elements.append(Paragraph("Detailed Analysis:", styles['Heading2']))
        elements.append(Spacer(1, 0.1*inch))
        
        for i, scan in enumerate(scans_data):
            elements.append(Paragraph(f"Scan {i+1}: {scan.get('original_filename', 'Unknown')}", styles['Heading3']))
            
            prediction = scan.get('prediction', 'Unknown')
            confidence = scan.get('confidence', 'N/A')
            probability = scan.get('probability', 'N/A')
            
            elements.append(Paragraph(f"Prediction: <font color={'red' if prediction == 'Tumor' else 'green'}>{prediction}</font>", styles['Normal']))
            elements.append(Paragraph(f"Confidence: {confidence}", styles['Normal']))
            elements.append(Paragraph(f"Probability: {probability}", styles['Normal']))
            elements.append(Spacer(1, 0.1*inch))
            
            # Add images if available (now using Cloudinary URLs)
            if scan.get('original_path'):
                img_width = 2*inch
                img_height = 2*inch
                
                try:
                    # For Cloudinary URLs, we need to download them temporarily
                    import requests
                    from io import BytesIO
                    
                    # Download images from Cloudinary
                    original_response = requests.get(scan['original_path'])
                    heatmap_response = requests.get(scan['heatmap_path'])
                    overlay_response = requests.get(scan['overlay_path'])
                    
                    if original_response.status_code == 200 and heatmap_response.status_code == 200 and overlay_response.status_code == 200:
                        original_img = RLImage(BytesIO(original_response.content), width=img_width, height=img_height)
                        heatmap_img = RLImage(BytesIO(heatmap_response.content), width=img_width, height=img_height)
                        overlay_img = RLImage(BytesIO(overlay_response.content), width=img_width, height=img_height)
                    
                    # Create table with images
                    image_data = [
                        ["Original Scan", "GradCAM Heatmap", "Overlay Visualization"],
                        [original_img, heatmap_img, overlay_img]
                    ]
                    
                    image_table = Table(image_data, colWidths=[2.1*inch, 2.1*inch, 2.1*inch])
                    image_table.setStyle(TableStyle([
                        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                        ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
                        ('GRID', (0, 0), (-1, -1), 1, colors.black),
                        ('BOTTOMPADDING', (0, 0), (-1, 0), 6),
                    ]))
                    
                    elements.append(image_table)
                except Exception as e:
                    elements.append(Paragraph(f"Error loading images: {str(e)}", styles['Normal']))
            
            elements.append(Spacer(1, 0.25*inch))
        
        # Add disclaimer
        elements.append(Spacer(1, 0.25*inch))
        elements.append(Paragraph("<b>Disclaimer:</b> This report is generated by an AI-based system and is intended for informational purposes only. It should not be considered as a substitute for professional medical advice, diagnosis, or treatment.", styles['Normal']))
        
        # Build the PDF
        doc.build(elements)
        
        # Store PDF locally in reports folder
        pdf_result = cloudinary_service.upload_pdf(report_path, folder="brain_tumor_reports")
        
        if not pdf_result['success']:
            print(f"Error storing PDF: {pdf_result['error']}")
            return None
        
        return pdf_result['url']
        
    except Exception as e:
        print(f"Error generating PDF: {str(e)}")
        return None

# API Routes

@app.route('/api/admin/login', methods=['OPTIONS'])
def handle_admin_login_options():
    """Handle OPTIONS requests for admin login"""
    response = jsonify({})
    response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With')
    response.headers.add('Access-Control-Allow-Methods', 'POST,OPTIONS')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response

@app.route('/api/patient/login', methods=['OPTIONS'])
def handle_patient_login_options():
    """Handle OPTIONS requests for patient login"""
    response = jsonify({})
    response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With')
    response.headers.add('Access-Control-Allow-Methods', 'POST,OPTIONS')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response

@app.route('/api/admin/dashboard/stats', methods=['OPTIONS'])
def handle_dashboard_stats_options():
    """Handle OPTIONS requests for dashboard stats"""
    response = jsonify({})
    response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With')
    response.headers.add('Access-Control-Allow-Methods', 'GET,OPTIONS')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response

@app.route('/api/<path:path>', methods=['OPTIONS'])
def handle_general_options(path):
    """Handle OPTIONS requests for other API routes"""
    response = jsonify({})
    response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With')
    response.headers.add('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response

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

@app.route('/api/admin/dashboard/stats', methods=['GET'])
def admin_dashboard_stats():
    """Get dashboard statistics (alternative endpoint)"""
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

@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    """Admin login"""
    try:
        data = request.json
        username = data.get('username')
        password = data.get('password')
        
        print(f"🔍 Admin login attempt - Username: {username}")
        
        if not username or not password:
            return jsonify({'success': False, 'error': 'Username and password are required'})
        
        admin = db.get_admin_by_credentials(username, password)
        
        print(f"🔍 Admin lookup result: {admin is not None}")
        
        if admin:
            print(f"✅ Admin login successful for: {username}")
            return jsonify({
                'success': True,
                'data': {
                    'id': admin['id'],
                    'username': admin['username'],
                    'email': admin['email']
                }
            })
        else:
            print(f"❌ Admin login failed for: {username}")
            return jsonify({'success': False, 'error': 'Invalid credentials'})
            
    except Exception as e:
        print(f"❌ Admin login error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/admin/patients/<int:patient_id>', methods=['GET'])
def get_admin_patient_info(patient_id):
    """Get specific patient info for admin"""
    try:
        patient = db.get_patient_by_id(patient_id)
        if patient:
            return jsonify({'success': True, 'data': patient})
        else:
            return jsonify({'success': False, 'error': 'Patient not found'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/admin/patients/<int:patient_id>/scans', methods=['GET'])
def get_admin_patient_scans(patient_id):
    """Get all scans for a specific patient (admin view)"""
    try:
        scans = db.get_patient_scans(patient_id)
        return jsonify({'success': True, 'data': scans})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/admin/patients/<int:patient_id>/reports', methods=['GET'])
def get_admin_patient_reports(patient_id):
    """Get all reports for a specific patient (admin view)"""
    try:
        reports = db.get_patient_reports(patient_id)
        return jsonify({'success': True, 'data': reports})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/admin/patients', methods=['POST'])
def add_patient():
    """Add a new patient"""
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
            # Send credentials email
            email_sent = send_credentials_email(
                result['email'],
                result['username'],
                result['password'],
                result['name']
            )
            
            return jsonify({
                'success': True,
                'data': {
                    'patient_id': result['patient_id'],
                    'username': result['username'],
                    'password': result['password'],
                    'email_sent': email_sent
                }
            })
        else:
            return jsonify({'success': False, 'error': 'Failed to add patient'})
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/patient/login', methods=['POST'])
def patient_login():
    """Patient login"""
    try:
        data = request.json
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({'success': False, 'error': 'Username and password are required'})
        
        patient = db.get_patient_by_credentials(username, password)
        
        if patient:
            return jsonify({
                'success': True,
                'data': {
                    'id': patient['id'],
                    'name': patient['name'],
                    'patient_id': patient['patient_id'],
                    'email': patient['email']
                }
            })
        else:
            return jsonify({'success': False, 'error': 'Invalid credentials'})
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/patient/<int:patient_id>/scans', methods=['GET'])
def get_patient_scans(patient_id):
    """Get all scans for a patient"""
    try:
        scans = db.get_patient_scans(patient_id)
        return jsonify({'success': True, 'data': scans})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/patient/<int:patient_id>/reports', methods=['GET'])
def get_patient_reports(patient_id):
    """Get all reports for a patient"""
    try:
        reports = db.get_patient_reports(patient_id)
        return jsonify({'success': True, 'data': reports})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/patient/<int:patient_id>', methods=['GET'])
def get_patient_info(patient_id):
    """Get patient information"""
    try:
        patient = db.get_patient_by_id(patient_id)
        if patient:
            return jsonify({'success': True, 'data': patient})
        else:
            return jsonify({'success': False, 'error': 'Patient not found'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/admin/scans', methods=['GET'])
def get_all_scans():
    """Get all scans (admin view)"""
    try:
        scans = db.get_all_scans()
        return jsonify({'success': True, 'data': scans})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/admin/scans/upload', methods=['POST'])
def upload_scan_admin():
    """Upload and analyze brain scan (admin endpoint)"""
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
                # Save uploaded file to temporary directory
                filename = secure_filename(file.filename)
                unique_filename = f"{uuid.uuid4()}_{filename}"
                temp_dir = "temp_uploads"
                os.makedirs(temp_dir, exist_ok=True)
                filepath = os.path.join(temp_dir, unique_filename)
                file.save(filepath)
                
                # Analyze the image
                result = predict_with_gradcam(filepath)
                
                # Clean up temporary file
                try:
                    os.remove(filepath)
                except:
                    pass
                
                if result['success']:
                    # Save to database
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
                        results.append({
                            'success': True,
                            'filename': filename,
                            'scan_id': scan_result['scan_id'],
                            'prediction': result['prediction'],
                            'confidence': result['confidence'],
                            'probability': result['probability'],
                            'original_image': result['original_path'],
                            'heatmap': result['heatmap_path'],
                            'overlay': result['overlay_path']
                        })
                    else:
                        results.append({
                            'success': False,
                            'filename': filename,
                            'error': 'Failed to save scan to database'
                        })
                else:
                    results.append({
                        'success': False,
                        'filename': filename,
                        'error': result['error']
                    })
            else:
                results.append({
                    'success': False,
                    'filename': file.filename if file else 'unknown',
                    'error': 'Invalid file type'
                })
        
        # After successful scans, generate a report
        report_data = None
        if results and any(r['success'] for r in results):
            try:
                # Get patient information
                patient = db.get_patient_by_id(int(patient_id))
                if patient:
                    # Get all patient scans
                    all_scans = db.get_patient_scans(int(patient_id))
                    if all_scans:
                        # Generate PDF report
                        report_path = generate_pdf_report(patient, all_scans)
                        
                        if report_path:
                            # Save report to database
                            tumor_count = sum(1 for s in all_scans if s['prediction'] == 'Tumor')
                            no_tumor_count = sum(1 for s in all_scans if s['prediction'] == 'No Tumor')
                            
                            report_result = db.add_report(
                                patient_id=int(patient_id),
                                report_path=report_path,
                                scan_count=len(all_scans),
                                tumor_count=tumor_count,
                                no_tumor_count=no_tumor_count
                            )
                            
                            if report_result:
                                report_data = {
                                    'report_id': report_result['report_id'],
                                    'report_url': report_path,
                                    'scan_count': len(all_scans),
                                    'tumor_count': tumor_count,
                                    'no_tumor_count': no_tumor_count
                                }
            except Exception as e:
                print(f"Error generating report: {e}")
        
        return jsonify({
            'success': True,
            'scan_ids': scan_ids,
            'results': results,
            'report_generated': report_data is not None,
            'report_data': report_data
        })
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/admin/reports', methods=['GET'])
def get_all_reports():
    """Get all reports (admin view)"""
    try:
        reports = db.get_all_reports()
        return jsonify({'success': True, 'data': reports})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/scan/upload', methods=['POST'])
def upload_scan():
    """Upload and analyze brain scan"""
    try:
        if 'file' not in request.files:
            return jsonify({'success': False, 'error': 'No file uploaded'})
        
        file = request.files['file']
        patient_id = request.form.get('patient_id')
        
        if not patient_id:
            return jsonify({'success': False, 'error': 'Patient ID is required'})
        
        if file.filename == '':
            return jsonify({'success': False, 'error': 'No file selected'})
        
        if file and allowed_file(file.filename):
            # Save uploaded file to temporary directory
            filename = secure_filename(file.filename)
            unique_filename = f"{uuid.uuid4()}_{filename}"
            temp_dir = "temp_uploads"
            os.makedirs(temp_dir, exist_ok=True)
            filepath = os.path.join(temp_dir, unique_filename)
            file.save(filepath)
            
            # Analyze the image
            result = predict_with_gradcam(filepath)
            
            # Clean up temporary file
            try:
                os.remove(filepath)
            except:
                pass
            
            if result['success']:
                # Save to database
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
                    return jsonify({
                        'success': True,
                        'data': {
                            'scan_id': scan_result['scan_id'],
                            'prediction': result['prediction'],
                            'confidence': result['confidence'],
                            'probability': result['probability']
                        }
                    })
                else:
                    return jsonify({'success': False, 'error': 'Failed to save scan to database'})
            else:
                return jsonify({'success': False, 'error': result['error']})
        else:
            return jsonify({'success': False, 'error': 'Invalid file type'})
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/report/generate', methods=['POST'])
def generate_report():
    """Generate PDF report for a patient"""
    try:
        data = request.json
        patient_id = data.get('patient_id')
        
        print(f"🔍 Generating report for patient ID: {patient_id}")
        
        if not patient_id:
            return jsonify({'success': False, 'error': 'Patient ID is required'})
        
        # Get patient information
        patient = db.get_patient_by_id(patient_id)
        if not patient:
            print(f"❌ Patient not found: {patient_id}")
            return jsonify({'success': False, 'error': 'Patient not found'})
        
        print(f"✅ Patient found: {patient['name']}")
        
        # Get patient scans
        scans = db.get_patient_scans(patient_id)
        if not scans:
            print(f"❌ No scans found for patient: {patient_id}")
            return jsonify({'success': False, 'error': 'No scans found for patient'})
        
        print(f"✅ Found {len(scans)} scans for patient")
        
        # Generate PDF report
        print("📄 Generating PDF report...")
        report_path = generate_pdf_report(patient, scans)
        
        if report_path:
            print(f"✅ PDF report generated: {report_path}")
            
            # Save report to database
            tumor_count = sum(1 for s in scans if s['prediction'] == 'Tumor')
            no_tumor_count = sum(1 for s in scans if s['prediction'] == 'No Tumor')
            
            print(f"📊 Stats - Total: {len(scans)}, Tumors: {tumor_count}, No Tumors: {no_tumor_count}")
            
            report_result = db.add_report(
                patient_id=patient_id,
                report_path=report_path,
                scan_count=len(scans),
                tumor_count=tumor_count,
                no_tumor_count=no_tumor_count
            )
            
            if report_result:
                print(f"✅ Report saved to database: {report_result['report_id']}")
                return jsonify({
                    'success': True,
                    'data': {
                        'report_id': report_result['report_id'],
                        'report_path': report_path
                    }
                })
            else:
                print("❌ Failed to save report to database")
                return jsonify({'success': False, 'error': 'Failed to save report to database'})
        else:
            print("❌ Failed to generate PDF report")
            return jsonify({'success': False, 'error': 'Failed to generate PDF report'})
            
    except Exception as e:
        print(f"❌ Report generation error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/report/download/<report_id>')
def download_report(report_id):
    """Get report download URL"""
    try:
        # Get report from database
        cursor = db.connection.cursor(cursor_factory=RealDictCursor)
        cursor.execute("SELECT report_path FROM reports WHERE report_id = %s", (report_id,))
        report = cursor.fetchone()
        cursor.close()
        
        if not report:
            return jsonify({'success': False, 'error': 'Report not found'})
        
        # Return the report URL for download
        return jsonify({
            'success': True,
            'download_url': report['report_path']
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/report/file/<filename>')
def serve_report_file(filename):
    """Serve PDF report files"""
    try:
        # Security check - only allow PDF files
        if not filename.endswith('.pdf'):
            return jsonify({'success': False, 'error': 'Invalid file type'})
        
        # Get the file path
        file_path = os.path.join(app.config['REPORT_FOLDER'], filename)
        
        if os.path.exists(file_path):
            return send_file(file_path, as_attachment=True, download_name=filename)
        else:
            return jsonify({'success': False, 'error': 'Report file not found'})
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})



def allowed_file(filename):
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000) 