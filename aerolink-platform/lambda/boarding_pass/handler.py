import json
import base64
import qrcode
from io import BytesIO

def generate_boarding_pass(event, context):
    """
    AWS Lambda function to generate a boarding pass QR code and PDF payload.
    Triggered by SQS/SNS or API Gateway.
    """
    try:
        # Assuming event contains passenger_id, flight_id, seat
        body = json.loads(event.get('body', '{}'))
        flight_id = body.get("flight_id")
        seat = body.get("seat")
        passenger_name = body.get("passenger_name", "UNKNOWN")
        
        if not all([flight_id, seat]):
            return {
                "statusCode": 400,
                "body": json.dumps({"error": "Missing flight_id or seat"})
            }
            
        # Generate QR Code
        qr_data = f"AEROLINK:{flight_id}:{seat}:{passenger_name}"
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(qr_data)
        qr.make(fit=True)
        img = qr.make_image(fill='black', back_color='white')
        
        # Save to buffer
        buffered = BytesIO()
        img.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
        
        # In a real system, we might push this to S3 and return a pre-signed URL.
        # For simplicity, we return the base64 payload.
        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({
                "message": "Boarding pass generated",
                "qr_code_base64": img_str,
                "seat": seat
            })
        }
    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)})
        }
