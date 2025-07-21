import os
import boto3
from dotenv import load_dotenv
from botocore.exceptions import ClientError

load_dotenv('config.env')

class S3Service:
    def __init__(self):
        self.bucket = os.getenv('AWS_S3_BUCKET')
        self.region = os.getenv('AWS_REGION')
        self.s3 = boto3.client(
            's3',
            aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
            aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
            region_name=self.region
        )

    def upload_pdf(self, pdf_path, s3_key=None):
        """Upload a PDF to S3 and return the S3 key."""
        if not s3_key:
            s3_key = f"reports/{os.path.basename(pdf_path)}"
        try:
            self.s3.upload_file(pdf_path, self.bucket, s3_key, ExtraArgs={'ContentType': 'application/pdf'})
            return {
                'success': True,
                's3_key': s3_key
            }
        except ClientError as e:
            print(f"Error uploading PDF to S3: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    def generate_presigned_url(self, s3_key, expires_in=3600):
        """Generate a pre-signed URL for downloading a PDF from S3."""
        try:
            url = self.s3.generate_presigned_url(
                'get_object',
                Params={'Bucket': self.bucket, 'Key': s3_key},
                ExpiresIn=expires_in
            )
            return {
                'success': True,
                'url': url
            }
        except ClientError as e:
            print(f"Error generating pre-signed URL: {e}")
            return {
                'success': False,
                'error': str(e)
            }

s3_service = S3Service() 