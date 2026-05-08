import { Flight } from "../types";

export async function searchFlights(query: string): Promise<Flight[]> {
  try {
    const res = await fetch('/api/ai/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });
    if (!res.ok) throw new Error('Search failed');
    return await res.json();
  } catch (err) {
    console.error("AI Search failed:", err);
    return [];
  }
}

export async function getInitialFlights(): Promise<Flight[]> {
  return searchFlights("Show 5 major active international flights right now");
}

export async function getFlightTelemetry(flight: Flight): Promise<Flight['telemetry']> {
  try {
    const res = await fetch('/api/ai/telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ flight })
    });
    if (!res.ok) throw new Error('Telemetry failed');
    return await res.json();
  } catch (err) {
    console.error("AI Telemetry failed:", err);
    return undefined;
  }
}
