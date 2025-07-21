from flask import Flask
from flask_cors import CORS
import os
from dotenv import load_dotenv

# Load environment variables
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

# Register blueprints
from routes.admin_routes import admin_bp
from routes.patient_routes import patient_bp
from routes.scan_routes import scan_bp
from routes.report_routes import report_bp
from routes.options_routes import options_bp
from routes.health_routes import health_bp

app.register_blueprint(admin_bp)
app.register_blueprint(patient_bp)
app.register_blueprint(scan_bp)
app.register_blueprint(report_bp)
app.register_blueprint(options_bp)
app.register_blueprint(health_bp)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000) 