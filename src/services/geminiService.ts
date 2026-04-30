import { GoogleGenAI, Type } from "@google/genai";
import { Flight } from "../types";

let aiClient: GoogleGenAI | null = null;

export function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    aiClient = new GoogleGenAI({ apiKey: key });
  }
  return aiClient;
}

export async function searchFlights(query: string): Promise<Flight[]> {
  const client = getAiClient();
  try {
    const response = await client.models.generateContent({
      model: "gemini-3-flash-preview",
    contents: `You are a real-time flight data and ATC surveillance engine. Use Google Search to find current, accurate flight information and relevant sector ATC communications for: "${query}".
    
    Current global time: ${new Date().toISOString()}
    Search for:
    1. Real-time flight numbers and vector telemetry (lat/lng, altitude, speed).
    2. Approximate ATC communications or simulated transcripts based on flight phase (climb, cruise, descent) and major ATC sectors nearby.
    
    Return an array of flight objects following the schema. For every flight, include an "atcLog" array containing 3-5 lines of anonymized ATC-style radio comms (e.g., "G-ABCD, contact London Center on 132.5", "Maintain FL350", "Proceed direct to waypoint BAVAX").`,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            flightNumber: { type: Type.STRING },
            airline: { type: Type.STRING },
            origin: {
              type: Type.OBJECT,
              properties: {
                code: { type: Type.STRING },
                city: { type: Type.STRING },
                lat: { type: Type.NUMBER },
                lng: { type: Type.NUMBER }
              },
              required: ["code", "city", "lat", "lng"]
            },
            destination: {
              type: Type.OBJECT,
              properties: {
                code: { type: Type.STRING },
                city: { type: Type.STRING },
                lat: { type: Type.NUMBER },
                lng: { type: Type.NUMBER }
              },
              required: ["code", "city", "lat", "lng"]
            },
            departureTime: { type: Type.STRING, description: "ISO 8601" },
            arrivalTime: { type: Type.STRING, description: "ISO 8601" },
            status: { 
              type: Type.STRING, 
              enum: ["scheduled", "on-time", "delayed", "landed", "diverted"] 
            },
            currentPosition: {
              type: Type.OBJECT,
              properties: {
                lat: { type: Type.NUMBER },
                lng: { type: Type.NUMBER },
                altitude: { type: Type.NUMBER },
                speed: { type: Type.NUMBER },
                heading: { type: Type.NUMBER }
              },
              required: ["lat", "lng", "altitude", "speed", "heading"]
            },
            progress: { type: Type.NUMBER },
            aircraftType: { type: Type.STRING },
            gate: { type: Type.STRING }
          },
          required: ["id", "flightNumber", "airline", "origin", "destination", "departureTime", "arrivalTime", "status", "progress"]
        }
      }
    }
  });

    try {
      const text = response.text;
      if (!text) return [];
      // Handle potential markdown code blocks in response
      const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleanText);
    } catch (e) {
      console.error("Failed to parse Gemini response", e);
      return [];
    }
  } catch (err) {
    console.error("AI Search generateContent failed:", err);
    return [];
  }
}

export async function getInitialFlights(): Promise<Flight[]> {
  return searchFlights("Show 5 major active international flights right now");
}

export async function getFlightTelemetry(flight: Flight): Promise<Flight['telemetry']> {
  const client = getAiClient();
  try {
    const response = await client.models.generateContent({
      model: "gemini-3-flash-preview",
    contents: `Analyze the following flight and provide tactical telemetry predictions and safety advisories.
    
    Flight: ${flight.flightNumber} (${flight.airline})
    Route: ${flight.origin.city} (${flight.origin.code}) -> ${flight.destination.city} (${flight.destination.code})
    Current Speed: ${flight.currentPosition?.speed || 'Unknown'} kts
    Current Altitude: ${flight.currentPosition?.altitude || 'Unknown'} ft
    Aircraft Type: ${flight.aircraftType || 'Commercial Jet'}
    
    Predict based on current vectors and route:
    1. Predicted fuel burn (total for route).
    2. Accurate Estimated Time to Destination (ETD) expressed as "X hours Y minutes".
    3. Potential en-route weather advisories or turbulence warnings based on the general route region.`,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          predictedFuelBurn: { type: Type.STRING },
          estimatedTimeToDestination: { type: Type.STRING },
          weatherAdvisories: { 
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["predictedFuelBurn", "estimatedTimeToDestination", "weatherAdvisories"]
      }
    }
  });

    try {
      const text = response.text;
      if (!text) return undefined;
      const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleanText);
    } catch (e) {
      console.error("Failed to parse telemetry response", e);
      return undefined;
    }
  } catch (err) {
    console.error("AI Telemetry generateContent failed:", err);
    return undefined;
  }
}
