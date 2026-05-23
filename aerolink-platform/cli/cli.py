import argparse
import sys
import requests

GATEWAY_URL = "http://localhost:8000/api/v1"

def print_flights():
    try:
        res = requests.get(f"{GATEWAY_URL}/flights/")
        res.raise_for_status()
        data = res.json()
        print("\n--- Available Flights ---")
        for f in data.get("data", []):
            print(f"Flight {f['flight_number']}: {f['origin_airport']} -> {f['destination_airport']} | Status: {f['status']} | Seats: {f['available_seats']}")
        print("-------------------------\n")
    except Exception as e:
        print(f"Error fetching flights: {e}")

def create_booking(flight_id: str, passenger_id: str, seat: str):
    try:
        payload = {
            "flight_id": flight_id,
            "passenger_id": passenger_id,
            "seat_number": seat,
            "price": 100.0,
            "payment_token": "tok_visa"
        }
        headers = {"Idempotency-Key": f"cli-booking-{flight_id}-{passenger_id}"}
        res = requests.post(f"{GATEWAY_URL}/bookings/", json=payload, headers=headers)
        if res.status_code == 201:
            print("Booking created successfully!")
            print(res.json())
        else:
            print(f"Failed to create booking: {res.status_code} - {res.text}")
    except Exception as e:
        print(f"Error creating booking: {e}")

def check_health():
    try:
        res = requests.get("http://localhost:8000/health/aggregated")
        print("\n--- System Health ---")
        print(res.json())
        print("---------------------\n")
    except Exception as e:
        print(f"Error fetching health: {e}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="AeroLink CLI client")
    subparsers = parser.add_subparsers(dest="command")

    subparsers.add_parser("flights", help="List available flights")
    subparsers.add_parser("health", help="Check system aggregated health")
    
    book_parser = subparsers.add_parser("book", help="Create a booking")
    book_parser.add_argument("--flight", required=True, help="Flight UUID")
    book_parser.add_argument("--passenger", required=True, help="Passenger UUID")
    book_parser.add_argument("--seat", required=True, help="Seat Number")

    args = parser.parse_args()

    if args.command == "flights":
        print_flights()
    elif args.command == "health":
        check_health()
    elif args.command == "book":
        create_booking(args.flight, args.passenger, args.seat)
    else:
        parser.print_help()
