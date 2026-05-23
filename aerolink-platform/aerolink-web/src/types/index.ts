// src/types/index.ts

export type UserRole = 'passenger' | 'airline_operator' | 'ground_staff' | 'admin';

export interface UserSession {
  id: string;
  email: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
}

export interface FlightRoute {
  id: string;
  flight_number: string;
  origin_airport: string;
  destination_airport: string;
  departure_time: string;
  arrival_time: string;
  base_price: number;
  aircraft_model: string;
  status: 'SCHEDULED' | 'ON_TIME' | 'DELAYED' | 'BOARDING' | 'DEPARTED' | 'ARRIVED';
}

export interface SeatLock {
  seat_number: string;
  is_occupied: boolean;
  class: 'Business' | 'Economy';
  price_premium: number;
}

export interface BaggageScanItem {
  id: string;
  passenger_id: string;
  flight_id: string;
  weight_kg: number;
  status: 'Checked' | 'In Transit' | 'Loaded' | 'Arrived' | 'Delayed' | 'Lost';
  last_location: 'Counter' | 'Security' | 'Cargo' | 'Carousel' | 'Unknown';
  updated_at: string;
}

export interface ServiceHealthCheck {
  status: 'up' | 'down' | 'unreachable';
  details?: {
    status: string;
    timestamp: string;
    checks?: Record<string, any>;
  };
  error?: string;
}

export interface CentralHealthReport {
  status: 'fully_operational' | 'degraded';
  services: {
    'flight-service': ServiceHealthCheck;
    'booking-service': ServiceHealthCheck;
    'passenger-service': ServiceHealthCheck;
    'baggage-service': ServiceHealthCheck;
    'payment-service': ServiceHealthCheck;
    'notification-service': ServiceHealthCheck;
  };
}
