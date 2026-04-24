import { Flight } from "../types";

export async function searchFlights(query: string): Promise<Flight[]> {
  try {
    const response = await fetch("/api/ai/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    if (!response.ok) throw new Error("Search failed");
    return await response.json();
  } catch (e) {
    console.error("Failed to search flights", e);
    return [];
  }
}

export async function getInitialFlights(): Promise<Flight[]> {
  return searchFlights("Show 5 major active international flights right now");
}

export async function getFlightTelemetry(flight: Flight): Promise<Flight['telemetry']> {
  try {
    const response = await fetch("/api/ai/telemetry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(flight),
    });
    if (!response.ok) throw new Error("Telemetry failed");
    return await response.json();
  } catch (e) {
    console.error("Failed to get telemetry", e);
    return undefined;
  }
}
