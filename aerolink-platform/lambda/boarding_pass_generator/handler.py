"""AWS Lambda function to compile printable boarding pass PDF layouts. ★ Enhancement #24"""

import json
import base64
import structlog

logger = structlog.get_logger()


def compile_boarding_pass_pdf(event, context):
    """Triggered by check-in event, compiles a structured HTML/PDF boarding pass."""
    try:
        body = json.loads(event.get("body", "{}"))
        passenger_name = body.get("passenger_name", "UNKNOWN")
        flight_number = body.get("flight_number", "AL000")
        seat = body.get("seat", "N/A")
        
        if not flight_number or not seat:
            return {
                "statusCode": 400,
                "body": json.dumps({"error": "Missing flight_number or seat"})
            }
            
        # Simulate compiling a raw PDF binary
        logger.info(
            "Compiling printable boarding pass PDF", 
            passenger=passenger_name, 
            flight=flight_number, 
            seat=seat
        )
        
        # Simulating base64-encoded mock PDF stream bytes
        mock_pdf_stream = base64.b64encode(
            f"%PDF-1.4 Mock Printable Boarding Pass {passenger_name} {flight_number} Seat {seat}".encode("utf-8")
        ).decode("utf-8")
        
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Content-Disposition": f"attachment; filename=boarding_pass_{flight_number}_{seat}.pdf"
            },
            "body": json.dumps({
                "message": "Boarding pass PDF successfully compiled.",
                "pdf_base64": mock_pdf_stream,
                "flight_number": flight_number,
                "seat": seat
            })
        }
    except Exception as e:
        logger.error("Failed to compile boarding pass PDF", error=str(e))
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)})
        }
