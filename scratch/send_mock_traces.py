import urllib.request
import json
import time
import random

# Jaeger OTLP/HTTP traces endpoint
JAEGER_URL = "http://localhost:4318/v1/traces"

# Generate hex trace and span IDs
def random_id(bytes_num):
    return "".join(random.choices("0123456789abcdef", k=bytes_num * 2))

trace_id = random_id(16)
gateway_span_id = random_id(8)
booking_span_id = random_id(8)
flight_span_id = random_id(8)
db_span_id = random_id(8)

now_ms = int(time.time() * 1000)
# Timing offsets
t0 = now_ms * 1_000_000
t1 = (now_ms + 25) * 1_000_000
t2 = (now_ms + 115) * 1_000_000
t3 = (now_ms + 120) * 1_000_000
t4 = (now_ms + 210) * 1_000_000
t5 = (now_ms + 230) * 1_000_000
t6 = (now_ms + 240) * 1_000_000

# Formulate OTLP trace JSON structure
trace_payload = {
    "resourceSpans": [
        # Span 1: api-gateway
        {
            "resource": {
                "attributes": [
                    {"key": "service.name", "value": {"stringValue": "api-gateway"}},
                    {"key": "service.version", "value": {"stringValue": "1.0.0"}},
                    {"key": "host.name", "value": {"stringValue": "localhost"}}
                ]
            },
            "scopeSpans": [{
                "spans": [{
                    "traceId": trace_id,
                    "spanId": gateway_span_id,
                    "name": "POST /api/v1/bookings",
                    "kind": 2, # Server
                    "startTimeUnixNano": str(t0),
                    "endTimeUnixNano": str(t6),
                    "attributes": [
                        {"key": "http.method", "value": {"stringValue": "POST"}},
                        {"key": "http.target", "value": {"stringValue": "/api/v1/bookings"}},
                        {"key": "http.status_code", "value": {"intValue": 201}},
                        {"key": "correlation_id", "value": {"stringValue": "c83a-874f-923f"}}
                    ]
                }]
            }]
        },
        # Span 2: booking-service
        {
            "resource": {
                "attributes": [
                    {"key": "service.name", "value": {"stringValue": "booking-service"}},
                    {"key": "service.version", "value": {"stringValue": "1.0.0"}}
                ]
            },
            "scopeSpans": [{
                "spans": [{
                    "traceId": trace_id,
                    "spanId": booking_span_id,
                    "parentSpanId": gateway_span_id,
                    "name": "Process Booking Saga",
                    "kind": 3, # Client
                    "startTimeUnixNano": str(t1),
                    "endTimeUnixNano": str(t5),
                    "attributes": [
                        {"key": "saga.step", "value": {"stringValue": "initiate"}},
                        {"key": "booking.status", "value": {"stringValue": "CONFIRMED"}}
                    ]
                }]
            }]
        },
        # Span 3: flight-service
        {
            "resource": {
                "attributes": [
                    {"key": "service.name", "value": {"stringValue": "flight-service"}},
                    {"key": "service.version", "value": {"stringValue": "1.0.0"}}
                ]
            },
            "scopeSpans": [{
                "spans": [
                    {
                        "traceId": trace_id,
                        "spanId": flight_span_id,
                        "parentSpanId": booking_span_id,
                        "name": "Reserve Flight Seats",
                        "kind": 2,
                        "startTimeUnixNano": str(t2),
                        "endTimeUnixNano": str(t4),
                        "attributes": [
                            {"key": "flight.number", "value": {"stringValue": "AL1001"}},
                            {"key": "seat.number", "value": {"stringValue": "4C"}}
                        ]
                    },
                    {
                        "traceId": trace_id,
                        "spanId": db_span_id,
                        "parentSpanId": flight_span_id,
                        "name": "SQL SELECT FOR UPDATE",
                        "kind": 3,
                        "startTimeUnixNano": str(t3),
                        "endTimeUnixNano": str(t4),
                        "attributes": [
                            {"key": "db.system", "value": {"stringValue": "postgresql"}},
                            {"key": "db.name", "value": {"stringValue": "aerolink_db"}},
                            {"key": "db.statement", "value": {"stringValue": "SELECT * FROM seats WHERE flight_id = ? FOR UPDATE"}}
                        ]
                    }
                ]
            }]
        }
    ]
}

# Send the payload via HTTP POST
req = urllib.request.Request(
    JAEGER_URL,
    data=json.dumps(trace_payload).encode("utf-8"),
    headers={"Content-Type": "application/json"}
)

try:
    with urllib.request.urlopen(req) as response:
        print("Traces successfully sent to local Jaeger!")
        print("HTTP Status Code:", response.getcode())
except Exception as e:
    print("Failed to send traces to Jaeger:", str(e))
