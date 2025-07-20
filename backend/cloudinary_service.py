import os
import cloudinary
import cloudinary.uploader
import cloudinary.api
from dotenv import load_dotenv
import base64
from io import BytesIO
from PIL import Image
import uuid

load_dotenv('config.env')

# Configure Cloudinary
cloudinary.config(
    cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
    api_key=os.getenv('CLOUDINARY_API_KEY'),
    api_secret=os.getenv('CLOUDINARY_API_SECRET')
)

class CloudinaryService:
    def __init__(self):
        self.cloud_name = os.getenv('CLOUDINARY_CLOUD_NAME')
        self.api_key = os.getenv('CLOUDINARY_API_KEY')
        self.api_secret = os.getenv('CLOUDINARY_API_SECRET')
        
        if not all([self.cloud_name, self.api_key, self.api_secret]):
            raise ValueError("Cloudinary credentials not found in environment variables")
    
    def upload_image(self, image_path, folder="brain_tumor_scans", public_id=None):
        """Upload an image to Cloudinary"""
        try:
            if not public_id:
                public_id = f"{folder}/{uuid.uuid4()}"
            
            result = cloudinary.uploader.upload(
                image_path,
                public_id=public_id,
                folder=folder,
                resource_type="image",
                overwrite=True
            )
            
            return {
                'success': True,
                'url': result['secure_url'],
                'public_id': result['public_id'],
                'asset_id': result['asset_id']
            }
            
        except Exception as e:
            print(f"Error uploading image to Cloudinary: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def upload_pdf(self, pdf_path, folder="brain_tumor_reports", public_id=None):
        """Store PDF locally in reports folder"""
        try:
            if not public_id:
                public_id = f"{folder}/{uuid.uuid4()}"
            
            import shutil
            import os
            
            # Create reports directory if it doesn't exist
            reports_dir = "reports"
            os.makedirs(reports_dir, exist_ok=True)
            
            # Copy PDF to reports directory with unique name
            filename = f"{public_id.replace('/', '_')}.pdf"
            local_path = os.path.join(reports_dir, filename)
            shutil.copy2(pdf_path, local_path)
            
            # Return local path that can be served by Flask
            return {
                'success': True,
                'url': f"/api/report/file/{filename}",
                'public_id': public_id,
                'local_path': local_path
            }
            
        except Exception as e:
            print(f"Error storing PDF: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def upload_from_memory(self, file_data, file_type="image", folder="brain_tumor_scans", public_id=None):
        """Upload file from memory (for uploaded files)"""
        try:
            if not public_id:
                public_id = f"{folder}/{uuid.uuid4()}"
            
            if file_type == "pdf":
                resource_type = "raw"
            else:
                resource_type = "image"
            
            result = cloudinary.uploader.upload(
                file_data,
                public_id=public_id,
                folder=folder,
                resource_type=resource_type,
                overwrite=True
            )
            
            return {
                'success': True,
                'url': result['secure_url'],
                'public_id': result['public_id'],
                'asset_id': result['asset_id']
            }
            
        except Exception as e:
            print(f"Error uploading file from memory to Cloudinary: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def delete_file(self, public_id):
        """Delete a file from Cloudinary"""
        try:
            result = cloudinary.uploader.destroy(public_id)
            return {
                'success': True,
                'result': result
            }
            
        except Exception as e:
            print(f"Error deleting file from Cloudinary: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_file_url(self, public_id, transformation=None):
        """Get the URL for a file with optional transformations"""
        try:
            if transformation:
                url = cloudinary.CloudinaryImage(public_id).build_url(transformation=transformation)
            else:
                url = cloudinary.CloudinaryImage(public_id).build_url()
            
            return {
                'success': True,
                'url': url
            }
            
        except Exception as e:
            print(f"Error getting file URL from Cloudinary: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def list_files(self, folder="brain_tumor_scans", max_results=100):
        """List files in a folder"""
        try:
            result = cloudinary.api.resources(
                type="upload",
                prefix=folder,
                max_results=max_results
            )
            
            return {
                'success': True,
                'files': result['resources']
            }
            
        except Exception as e:
            print(f"Error listing files from Cloudinary: {e}")
            return {
                'success': False,
                'error': str(e)
            }

# Initialize Cloudinary service
cloudinary_service = CloudinaryService() 