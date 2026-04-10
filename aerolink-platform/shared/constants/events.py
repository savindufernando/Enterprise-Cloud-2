"""Kafka Event Topic names."""

# Flights
FLIGHT_CREATED = "aerolink.flight.created"
FLIGHT_UPDATED = "aerolink.flight.updated"
FLIGHT_STATUS_CHANGED = "aerolink.flight.status-changed"
FLIGHT_PRICING_UPDATED = "aerolink.flight.pricing-updated"

# Seats
SEAT_AVAILABILITY_CHANGED = "aerolink.seat.availability-changed"

# Bookings
BOOKING_CREATED = "aerolink.booking.created"
BOOKING_CONFIRMED = "aerolink.booking.confirmed"
BOOKING_CANCELLED = "aerolink.booking.cancelled"
BOOKING_FAILED = "aerolink.booking.failed"

# Passengers
PASSENGER_REGISTERED = "aerolink.passenger.registered"
PASSENGER_CHECKED_IN = "aerolink.passenger.checked-in"

# Baggage
BAGGAGE_STATUS_UPDATED = "aerolink.baggage.status-updated"

# Payments
PAYMENT_PROCESSED = "aerolink.payment.processed"
PAYMENT_FAILED = "aerolink.payment.failed"
PAYMENT_REFUNDED = "aerolink.payment.refunded"

# Notifications
NOTIFICATION_EMAIL_SENT = "aerolink.notification.email-sent"

# System Audit
AUDIT_EVENTS = "aerolink.audit.events"
