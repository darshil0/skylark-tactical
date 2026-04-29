export interface Flight {
  id: string;
  flightNumber: string;
  airline: string;
  origin: {
    code: string;
    city: string;
    lat: number;
    lng: number;
  };
  destination: {
    code: string;
    city: string;
    lat: number;
    lng: number;
  };
  departureTime: string; // ISO 8601
  arrivalTime: string;   // ISO 8601
  status: 'scheduled' | 'on-time' | 'delayed' | 'landed' | 'diverted';
  atcLog?: string[];
  currentPosition?: {
    lat: number;
    lng: number;
    altitude: number;
    speed: number;
    heading: number;
  };
  progress: number; // 0 to 100
  aircraftType?: string;
  gate?: string;
  telemetry?: {
    predictedFuelBurn?: string;
    estimatedTimeToDestination?: string;
    weatherAdvisories?: string[];
  };
  history?: { lat: number; lng: number; timestamp: string }[];
}

// Fix for Issue #6: Type definitions for form input
export interface FlightInput {
  flightNumber: string;
  airline: string;
  originCode: string;
  originCity: string;
  destinationCode: string;
  destinationCity: string;
  departureTime: string; // Used as string in form (datetime-local format)
  arrivalTime: string;   // Used as string in form
  status: Flight['status'];
  progress: number;
}

export interface UserLocation {
  lat: number;
  lng: number;
}

export interface UserPreferences {
  units: {
    altitude: 'ft' | 'm';
    speed: 'kts' | 'kmh';
    distance: 'nm' | 'km';
  };
  mapStyle: 'dark' | 'satellite' | 'navigation';
  notifications: {
    statusChanges: boolean;
    proximityAlerts: boolean;
    proximityRadius: number; // in nautical miles
    audibleAlerts: boolean;
  };
  mapLayers: {
    weather: boolean;
    airspace: boolean;
  };
  defaultView: 'global' | 'local';
}

