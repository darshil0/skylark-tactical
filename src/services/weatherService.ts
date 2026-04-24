export interface WeatherCell {
  id: string;
  lat: number;
  lng: number;
  intensity: number; // 0 to 1
  radius: number; // in degrees
  type: 'precipitation' | 'wind' | 'storm';
}

export async function getLiveWeatherOverlay(): Promise<WeatherCell[]> {
  try {
    const response = await fetch("/api/ai/weather");
    if (!response.ok) throw new Error("Weather failed");
    return await response.json();
  } catch (e) {
    console.error("Failed to fetch weather data", e);
    return [];
  }
}

export interface AirspaceSector {
  id: string;
  name: string;
  center: { lat: number, lng: number };
  level: string; // 'upper' | 'lower'
}

export async function getAirspaceSectors(): Promise<AirspaceSector[]> {
  // Mocked or fetched major FIR hubs for tactical visualization
  return [
    { id: 'EGTT', name: 'London FIR', center: { lat: 51.5, lng: -0.1 }, level: 'upper' },
    { id: 'KZNY', name: 'New York FIR', center: { lat: 40.7, lng: -74.0 }, level: 'upper' },
    { id: 'VABB', name: 'Mumbai FIR', center: { lat: 19.1, lng: 72.8 }, level: 'upper' },
    { id: 'RJTG', name: 'Tokyo FIR', center: { lat: 35.7, lng: 139.7 }, level: 'upper' },
    { id: 'ZBBB', name: 'Beijing FIR', center: { lat: 39.9, lng: 116.4 }, level: 'upper' },
    { id: 'SBBS', name: 'Brazil FIR', center: { lat: -15.8, lng: -47.9 }, level: 'upper' },
    { id: 'YBBB', name: 'Australia FIR', center: { lat: -35.3, lng: 149.1 }, level: 'upper' },
  ];
}
