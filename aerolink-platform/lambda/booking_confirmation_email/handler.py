"""AWS Lambda function to send booking confirmation email notifications. ★ Enhancement #22"""

import json
import os
import structlog

logger = structlog.get_logger()


def send_confirmation_email(event, context):
    """Triggered by SNS or Kafka trigger when booking is confirmed."""
    try:
        # Assuming event has the SNS/SQS message structure containing confirmation payload
        records = event.get("Records", [])
        if not records:
            body = json.loads(event.get("body", "{}"))
        else:
            # SNS/SQS JSON payload parsing
            sns_msg = records[0].get("Sns", {}).get("Message", "{}")
            body = json.loads(sns_msg)
            
        booking_id = body.get("booking_id")
        email = body.get("email", "customer@aerolink.local")
        price = body.get("price", 0.00)
        
        if not booking_id:
            return {
                "statusCode": 400,
                "body": json.dumps({"error": "Missing booking_id"})
            }
            
        # Simulate outbound SMTP/SES email payload compiling
        logger.info(
            "Sending booking confirmation email", 
            booking_id=booking_id, 
            email=email, 
            amount=price
        )
        
        return {
            "statusCode": 200,
            "body": json.dumps({
                "message": "Booking confirmation email successfully dispatched.",
                "booking_id": booking_id,
                "recipient": email,
                "status": "SENT"
            })
        }
    except Exception as e:
        logger.error("Failed to compile confirmation email", error=str(e))
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)})
        }
