from flask import jsonify
from werkzeug.exceptions import HTTPException
import traceback
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class APIError(Exception):
    """Custom API error class"""
    def __init__(self, message, status_code=500, error_code=None, details=None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        self.details = details

class ValidationError(APIError):
    """Validation error"""
    def __init__(self, message, field=None, details=None):
        super().__init__(message, 400, "VALIDATION_ERROR", details)
        self.field = field

class AuthenticationError(APIError):
    """Authentication error"""
    def __init__(self, message="Authentication failed"):
        super().__init__(message, 401, "AUTHENTICATION_ERROR")

class AuthorizationError(APIError):
    """Authorization error"""
    def __init__(self, message="Access denied"):
        super().__init__(message, 403, "AUTHORIZATION_ERROR")

class NotFoundError(APIError):
    """Resource not found error"""
    def __init__(self, resource_type="Resource", resource_id=None):
        message = f"{resource_type} not found"
        if resource_id:
            message += f" with ID: {resource_id}"
        super().__init__(message, 404, "NOT_FOUND_ERROR")

class DatabaseError(APIError):
    """Database operation error"""
    def __init__(self, message="Database operation failed", details=None):
        super().__init__(message, 500, "DATABASE_ERROR", details)

class FileUploadError(APIError):
    """File upload error"""
    def __init__(self, message="File upload failed", details=None):
        super().__init__(message, 400, "FILE_UPLOAD_ERROR", details)

class ModelPredictionError(APIError):
    """AI model prediction error"""
    def __init__(self, message="Model prediction failed", details=None):
        super().__init__(message, 500, "MODEL_PREDICTION_ERROR", details)

def create_error_response(error, include_traceback=False):
    """Create standardized error response"""
    response = {
        "success": False,
        "error": error.message,
        "code": error.error_code
    }
    
    if error.details:
        response["details"] = error.details
    
    if include_traceback and hasattr(error, '__traceback__'):
        response["traceback"] = traceback.format_exc()
    
    return jsonify(response), error.status_code

def handle_api_error(error):
    """Handle custom API errors"""
    logger.error(f"API Error: {error.message} (Code: {error.error_code})")
    return create_error_response(error)

def handle_validation_error(error):
    """Handle validation errors"""
    logger.warning(f"Validation Error: {error.message}")
    return create_error_response(error)

def handle_database_error(error):
    """Handle database errors"""
    logger.error(f"Database Error: {error.message}")
    return create_error_response(error)

def handle_generic_error(error):
    """Handle generic exceptions"""
    logger.error(f"Unexpected Error: {str(error)}")
    logger.error(traceback.format_exc())
    
    # Don't expose internal errors in production
    if hasattr(error, 'status_code'):
        status_code = error.status_code
    else:
        status_code = 500
    
    return jsonify({
        "success": False,
        "error": "An unexpected error occurred",
        "code": "INTERNAL_SERVER_ERROR"
    }), status_code

def handle_http_error(error):
    """Handle HTTP exceptions"""
    logger.warning(f"HTTP Error {error.code}: {error.description}")
    return jsonify({
        "success": False,
        "error": error.description,
        "code": f"HTTP_{error.code}"
    }), error.code

def validate_required_fields(data, required_fields):
    """Validate required fields in request data"""
    missing_fields = []
    for field in required_fields:
        if field not in data or data[field] is None or data[field] == "":
            missing_fields.append(field)
    
    if missing_fields:
        raise ValidationError(
            f"Missing required fields: {', '.join(missing_fields)}",
            details={"missing_fields": missing_fields}
        )

def validate_email(email):
    """Validate email format"""
    import re
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(pattern, email):
        raise ValidationError("Invalid email format", field="email")

def validate_age(age):
    """Validate age range"""
    if age is not None:
        try:
            age_int = int(age)
            if age_int < 0 or age_int > 150:
                raise ValidationError("Age must be between 0 and 150", field="age")
        except ValueError:
            raise ValidationError("Age must be a valid number", field="age")

def validate_gender(gender):
    """Validate gender value"""
    valid_genders = ["Male", "Female", "Other"]
    if gender is not None and gender not in valid_genders:
        raise ValidationError(
            f"Gender must be one of: {', '.join(valid_genders)}",
            field="gender"
        )

def validate_phone(phone):
    """Validate phone number format"""
    if phone is not None:
        import re
        # Basic phone validation - adjust regex as needed
        pattern = r'^[\+]?[0-9\s\-\(\)]{7,15}$'
        if not re.match(pattern, phone):
            raise ValidationError("Invalid phone number format", field="phone")

def validate_file_upload(files, allowed_extensions=None, max_size_mb=10):
    """Validate file upload"""
    if not files:
        raise FileUploadError("No files uploaded")
    
    if allowed_extensions is None:
        allowed_extensions = {'png', 'jpg', 'jpeg'}
    
    for file in files:
        if file.filename == '':
            raise FileUploadError("No file selected")
        
        # Check file extension
        if '.' not in file.filename:
            raise FileUploadError("File must have an extension")
        
        extension = file.filename.rsplit('.', 1)[1].lower()
        if extension not in allowed_extensions:
            raise FileUploadError(
                f"File type not allowed. Allowed types: {', '.join(allowed_extensions)}"
            )
        
        # Check file size (basic check)
        file.seek(0, 2)  # Seek to end
        file_size = file.tell()
        file.seek(0)  # Reset to beginning
        
        max_size_bytes = max_size_mb * 1024 * 1024
        if file_size > max_size_bytes:
            raise FileUploadError(f"File size exceeds maximum limit of {max_size_mb}MB")

def log_request_info(request, response=None):
    """Log request and response information"""
    logger.info(f"Request: {request.method} {request.path}")
    logger.info(f"Request Headers: {dict(request.headers)}")
    
    if request.is_json:
        logger.info(f"Request Body: {request.get_json()}")
    
    if response:
        logger.info(f"Response Status: {response[1] if isinstance(response, tuple) else response.status_code}")

def add_cors_headers_to_error(response):
    """Add CORS headers to error responses"""
    response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With')
    response.headers.add('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response 