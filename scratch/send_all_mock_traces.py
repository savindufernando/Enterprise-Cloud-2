import urllib.request
import json
import time
import random

JAEGER_URL = "http://localhost:4318/v1/traces"

def random_id(bytes_num):
    return "".join(random.choices("0123456789abcdef", k=bytes_num * 2))

def send_spans(resource_spans):
    payload = {"resourceSpans": resource_spans}
    req = urllib.request.Request(
        JAEGER_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req) as response:
            return response.getcode() == 200
    except Exception as e:
        print("Error sending spans:", str(e))
        return False

# Scenario 1: Complete Booking Workflow
# Services: api-gateway, passenger-service, booking-service, flight-service, payment-service, notification-service, realtime-service
def send_booking_scenario():
    trace_id = random_id(16)
    gw_span = random_id(8)
    pass_span = random_id(8)
    booking_span = random_id(8)
    flight_span = random_id(8)
    payment_span = random_id(8)
    notif_span = random_id(8)
    realtime_span = random_id(8)
    db_span = random_id(8)

    now = int(time.time() * 1000)
    t = lambda offset_ms: str((now + offset_ms) * 1_000_000)

    spans = [
        # api-gateway
        {
            "resource": {"attributes": [{"key": "service.name", "value": {"stringValue": "api-gateway"}}]},
            "scopeSpans": [{
                "spans": [{
                    "traceId": trace_id, "spanId": gw_span, "name": "POST /api/v1/bookings", "kind": 2,
                    "startTimeUnixNano": t(0), "endTimeUnixNano": t(350),
                    "attributes": [
                        {"key": "http.method", "value": {"stringValue": "POST"}},
                        {"key": "http.status_code", "value": {"intValue": 201}},
                        {"key": "correlation_id", "value": {"stringValue": "booking-c83a-874f"}}
                    ]
                }]
            }]
        },
        # passenger-service (validate passenger credentials)
        {
            "resource": {"attributes": [{"key": "service.name", "value": {"stringValue": "passenger-service"}}]},
            "scopeSpans": [{
                "spans": [{
                    "traceId": trace_id, "spanId": pass_span, "parentSpanId": gw_span, "name": "Validate Passport & Account", "kind": 2,
                    "startTimeUnixNano": t(10), "endTimeUnixNano": t(50),
                    "attributes": [{"key": "passenger.id", "value": {"stringValue": "pass-uuid-9821"}}]
                }]
            }]
        },
        # booking-service (Saga Orchestration)
        {
            "resource": {"attributes": [{"key": "service.name", "value": {"stringValue": "booking-service"}}]},
            "scopeSpans": [{
                "spans": [{
                    "traceId": trace_id, "spanId": booking_span, "parentSpanId": gw_span, "name": "Execute Booking Saga", "kind": 2,
                    "startTimeUnixNano": t(60), "endTimeUnixNano": t(340),
                    "attributes": [{"key": "saga.transaction.id", "value": {"stringValue": "saga-txn-1092"}}]
                }]
            }]
        },
        # flight-service (Reserve Seats)
        {
            "resource": {"attributes": [{"key": "service.name", "value": {"stringValue": "flight-service"}}]},
            "scopeSpans": [{
                "spans": [
                    {
                        "traceId": trace_id, "spanId": flight_span, "parentSpanId": booking_span, "name": "Reserve Flight Seat", "kind": 2,
                        "startTimeUnixNano": t(70), "endTimeUnixNano": t(180),
                        "attributes": [{"key": "flight.number", "value": {"stringValue": "AL1001"}}, {"key": "seat.number", "value": {"stringValue": "4C"}}]
                    },
                    {
                        "traceId": trace_id, "spanId": db_span, "parentSpanId": flight_span, "name": "SQL SELECT & UPDATE", "kind": 3,
                        "startTimeUnixNano": t(80), "endTimeUnixNano": t(170),
                        "attributes": [{"key": "db.statement", "value": {"stringValue": "UPDATE seats SET status = 'LOCKED' WHERE seat_number = '4C'"}}]
                    }
                ]
            }]
        },
        # payment-service (Charge Card)
        {
            "resource": {"attributes": [{"key": "service.name", "value": {"stringValue": "payment-service"}}]},
            "scopeSpans": [{
                "spans": [{
                    "traceId": trace_id, "spanId": payment_span, "parentSpanId": booking_span, "name": "Process Payment", "kind": 2,
                    "startTimeUnixNano": t(190), "endTimeUnixNano": t(290),
                    "attributes": [{"key": "payment.amount", "value": {"stringValue": "450.00"}}, {"key": "payment.gateway", "value": {"stringValue": "mock-stripe"}}]
                }]
            }]
        },
        # notification-service (Consume confirmation event)
        {
            "resource": {"attributes": [{"key": "service.name", "value": {"stringValue": "notification-service"}}]},
            "scopeSpans": [{
                "spans": [{
                    "traceId": trace_id, "spanId": notif_span, "parentSpanId": booking_span, "name": "Kafka Event Consumer: booking.confirmed", "kind": 4, # Consumer
                    "startTimeUnixNano": t(300), "endTimeUnixNano": t(330),
                    "attributes": [{"key": "notification.type", "value": {"stringValue": "email"}}]
                }]
            }]
        },
        # realtime-service (WebSocket event broadcast)
        {
            "resource": {"attributes": [{"key": "service.name", "value": {"stringValue": "realtime-service"}}]},
            "scopeSpans": [{
                "spans": [{
                    "traceId": trace_id, "spanId": realtime_span, "parentSpanId": booking_span, "name": "WebSocket Broadcast: seat.locked", "kind": 3,
                    "startTimeUnixNano": t(310), "endTimeUnixNano": t(340),
                    "attributes": [{"key": "ws.channel", "value": {"stringValue": "flight-locks-AL1001"}}]
                }]
            }]
        }
    ]
    return send_spans(spans)

# Scenario 2: Passenger Account Registration
# Services: api-gateway, passenger-service, notification-service
def send_registration_scenario():
    trace_id = random_id(16)
    gw_span = random_id(8)
    pass_span = random_id(8)
    notif_span = random_id(8)
    db_span = random_id(8)

    now = int(time.time() * 1000) - 5000  # Offset by 5 seconds
    t = lambda offset_ms: str((now + offset_ms) * 1_000_000)

    spans = [
        # api-gateway
        {
            "resource": {"attributes": [{"key": "service.name", "value": {"stringValue": "api-gateway"}}]},
            "scopeSpans": [{
                "spans": [{
                    "traceId": trace_id, "spanId": gw_span, "name": "POST /api/v1/passengers/register", "kind": 2,
                    "startTimeUnixNano": t(0), "endTimeUnixNano": t(180),
                    "attributes": [
                        {"key": "http.method", "value": {"stringValue": "POST"}},
                        {"key": "http.status_code", "value": {"intValue": 201}},
                        {"key": "correlation_id", "value": {"stringValue": "register-df92-710d"}}
                    ]
                }]
            }]
        },
        # passenger-service (create profile, Bcrypt hash)
        {
            "resource": {"attributes": [{"key": "service.name", "value": {"stringValue": "passenger-service"}}]},
            "scopeSpans": [{
                "spans": [
                    {
                        "traceId": trace_id, "spanId": pass_span, "parentSpanId": gw_span, "name": "Create Profile", "kind": 2,
                        "startTimeUnixNano": t(10), "endTimeUnixNano": t(170),
                        "attributes": [{"key": "auth.hash_algorithm", "value": {"stringValue": "bcrypt"}}]
                    },
                    {
                        "traceId": trace_id, "spanId": db_span, "parentSpanId": pass_span, "name": "SQL INSERT passenger", "kind": 3,
                        "startTimeUnixNano": t(20), "endTimeUnixNano": t(120),
                        "attributes": [{"key": "db.statement", "value": {"stringValue": "INSERT INTO passengers (email, password_hash, role) VALUES (?, ?, ?)"}}]
                    }
                ]
            }]
        },
        # notification-service (send welcome email)
        {
            "resource": {"attributes": [{"key": "service.name", "value": {"stringValue": "notification-service"}}]},
            "scopeSpans": [{
                "spans": [{
                    "traceId": trace_id, "spanId": notif_span, "parentSpanId": gw_span, "name": "Send Welcome Email", "kind": 2,
                    "startTimeUnixNano": t(130), "endTimeUnixNano": t(175),
                    "attributes": [{"key": "email.template", "value": {"stringValue": "welcome_passenger"}}]
                }]
            }]
        }
    ]
    return send_spans(spans)

# Scenario 3: Baggage Scanning and DynamoDB Tracking
# Services: api-gateway, baggage-service, notification-service
def send_baggage_scenario():
    trace_id = random_id(16)
    gw_span = random_id(8)
    bag_span = random_id(8)
    ddb_span = random_id(8)
    notif_span = random_id(8)

    now = int(time.time() * 1000) - 10000  # Offset by 10 seconds
    t = lambda offset_ms: str((now + offset_ms) * 1_000_000)

    spans = [
        # api-gateway
        {
            "resource": {"attributes": [{"key": "service.name", "value": {"stringValue": "api-gateway"}}]},
            "scopeSpans": [{
                "spans": [{
                    "traceId": trace_id, "spanId": gw_span, "name": "POST /api/v1/baggage/scan", "kind": 2,
                    "startTimeUnixNano": t(0), "endTimeUnixNano": t(120),
                    "attributes": [
                        {"key": "http.method", "value": {"stringValue": "POST"}},
                        {"key": "http.status_code", "value": {"intValue": 200}},
                        {"key": "correlation_id", "value": {"stringValue": "baggage-e839-a931"}}
                    ]
                }]
            }]
        },
        # baggage-service (write to local DynamoDB)
        {
            "resource": {"attributes": [{"key": "service.name", "value": {"stringValue": "baggage-service"}}]},
            "scopeSpans": [{
                "spans": [
                    {
                        "traceId": trace_id, "spanId": bag_span, "parentSpanId": gw_span, "name": "Update Baggage Scan Status", "kind": 2,
                        "startTimeUnixNano": t(10), "endTimeUnixNano": t(110),
                        "attributes": [{"key": "baggage.id", "value": {"stringValue": "bag-9832-1234"}}, {"key": "scan.location", "value": {"stringValue": "LHR-T5"}}]
                    },
                    {
                        "traceId": trace_id, "spanId": ddb_span, "parentSpanId": bag_span, "name": "DynamoDB PutItem", "kind": 3,
                        "startTimeUnixNano": t(15), "endTimeUnixNano": t(55),
                        "attributes": [
                            {"key": "db.system", "value": {"stringValue": "dynamodb"}},
                            {"key": "db.name", "value": {"stringValue": "aerolink-baggage-prod"}}
                        ]
                    }
                ]
            }]
        },
        # notification-service (publish baggage status shift alerts)
        {
            "resource": {"attributes": [{"key": "service.name", "value": {"stringValue": "notification-service"}}]},
            "scopeSpans": [{
                "spans": [{
                    "traceId": trace_id, "spanId": notif_span, "parentSpanId": gw_span, "name": "Send Baggage Status Alert", "kind": 2,
                    "startTimeUnixNano": t(70), "endTimeUnixNano": t(115),
                    "attributes": [{"key": "alert.type", "value": {"stringValue": "push_notification"}}]
                }]
            }]
        }
    ]
    return send_spans(spans)

if __name__ == "__main__":
    print("Sending mock tracing scenarios...")
    s1 = send_booking_scenario()
    s2 = send_registration_scenario()
    s3 = send_baggage_scenario()
    if s1 and s2 and s3:
        print("Successfully mocked all 8 services in local Jaeger!")
    else:
        print("Mock trace sending encountered failures.")
