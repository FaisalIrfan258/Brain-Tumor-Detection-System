import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import datetime
from PIL import Image
import numpy as np
import matplotlib.cm as cm
import os
from models.brain_tumor_model import model, GradCAM, transform, device
from cloudinary_service import cloudinary_service
import cv2
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image as RLImage, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from s3_service import s3_service
import torch


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
        
        You can access your portal at: https://brainscanx.vercel.app/patient/login
        
        Best regards,
        Brain Tumor Detection System Team
        """
        
        msg.attach(MIMEText(body, 'plain'))
        
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(smtp_username, smtp_password)
        server.sendmail(smtp_username, email, msg.as_string())
        server.quit()
        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False 

def allowed_file(filename):
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff', 'pdf'}
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS 

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

def generate_pdf_report(patient_info, scans_data, report_folder):
    """Generate a PDF report with all results and patient information"""
    try:
        # Create a unique filename for the report
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        report_filename = f"brain_scan_report_{timestamp}.pdf"
        report_path = os.path.join(report_folder, report_filename)
        
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
        error_count = sum(1 for s in scans_data if s.get('success') is False)
        
        summary_text = f"""
        Total images analyzed: {len(scans_data)}<br/>
        Images with tumor detected: {tumor_count}<br/>
        Images with no tumor detected: {no_tumor_count}<br/>
        Images with processing errors: {error_count}<br/>
        """
        
        elements.append(Paragraph(summary_text, styles['Normal']))
        elements.append(Spacer(1, 0.25*inch))
        
        # Add image explanation section
        elements.append(Paragraph("Image Explanation:", styles['Heading2']))
        elements.append(Spacer(1, 0.1*inch))
        explanation = (
            "<b>Original Scan:</b> The original brain scan image<br/>"
            "<b>GradCAM Heatmap:</b> Areas in red/yellow show regions the AI model focused on when making its decision<br/>"
            "<b>Overlay Visualization:</b> Combined view showing the original image with the attention heatmap overlaid"
        )
        elements.append(Paragraph(explanation, styles['Normal']))
        elements.append(Spacer(1, 0.25*inch))
        
        # Add detailed results for each scan
        elements.append(Paragraph("Detailed Analysis:", styles['Heading2']))
        elements.append(Spacer(1, 0.1*inch))
        
        for i, scan in enumerate(scans_data):
            elements.append(Paragraph(f"Scan {i+1}: {scan.get('original_filename', 'Unknown')}", styles['Heading3']))
            # Only show human-friendly details
            prediction = scan.get('prediction', 'Unknown')
            confidence = scan.get('confidence', 'N/A')
            probability = scan.get('probability', 'N/A')
            scan_details = [
                ["Prediction:", f"<font color={'red' if prediction == 'Tumor' else 'green'}>{prediction}</font>"],
                ["Confidence:", str(confidence)],
                ["Probability:", str(probability)]
            ]
            scan_table = Table(scan_details, colWidths=[1.7*inch, 4*inch])
            scan_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (0, -1), colors.whitesmoke),
                ('TEXTCOLOR', (0, 0), (0, -1), colors.black),
                ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
                ('ALIGN', (1, 0), (1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (0, -1), 'Helvetica'),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
                ('BACKGROUND', (1, 0), (1, -1), colors.white),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey)
            ]))
            elements.append(scan_table)
            elements.append(Spacer(1, 0.1*inch))
            # Add images if available (now using Cloudinary URLs)
            if scan.get('original_path'):
                img_width = 2*inch
                img_height = 2*inch
                try:
                    import requests
                    from io import BytesIO
                    original_response = requests.get(scan['original_path'])
                    heatmap_response = requests.get(scan['heatmap_path'])
                    overlay_response = requests.get(scan['overlay_path'])
                    if original_response.status_code == 200 and heatmap_response.status_code == 200 and overlay_response.status_code == 200:
                        original_img = RLImage(BytesIO(original_response.content), width=img_width, height=img_height)
                        heatmap_img = RLImage(BytesIO(heatmap_response.content), width=img_width, height=img_height)
                        overlay_img = RLImage(BytesIO(overlay_response.content), width=img_width, height=img_height)
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
        # Upload PDF to S3
        s3_result = s3_service.upload_pdf(report_path)
        if s3_result['success']:
            s3_key = s3_result['s3_key']
            return s3_key  # Store S3 key in DB as report_path
        else:
            print(f"Error uploading PDF to S3: {s3_result['error']}")
            return None
    except Exception as e:
        print(f"Error generating PDF: {str(e)}")
        return None 