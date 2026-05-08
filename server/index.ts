import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import { configDotenv } from "./dotenv.ts";
import { z } from "zod";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { v4 as uuidv4 } from "uuid";
import NodeCache from "node-cache";

configDotenv();

const flightStatusSchema = z.enum(["scheduled", "on-time", "delayed", "landed", "diverted"]);

const flightSchema = z.object({
  id: z.string(),
  flightNumber: z.string().min(1),
  airline: z.string().min(1),
  origin: z.object({
    code: z.string().length(3),
    city: z.string(),
    lat: z.number(),
    lng: z.number(),
  }),
  destination: z.object({
    code: z.string().length(3),
    city: z.string(),
    lat: z.number(),
    lng: z.number(),
  }),
  departureTime: z.string(), // ISO string
  arrivalTime: z.string(),   // ISO string
  status: flightStatusSchema,
  progress: z.number().min(0).max(100),
  currentPosition: z.object({
    lat: z.number(),
    lng: z.number(),
    altitude: z.number(),
    speed: z.number(),
    heading: z.number(),
  }).optional(),
  atcLog: z.array(z.string()).optional(),
  aircraftType: z.string().optional(),
  gate: z.string().optional(),
  telemetry: z.object({
    predictedFuelBurn: z.string().optional(),
    estimatedTimeToDestination: z.string().optional(),
    weatherAdvisories: z.array(z.string()).optional(),
  }).optional(),
  history: z.array(z.object({
    lat: z.number(),
    lng: z.number(),
    timestamp: z.string(),
  })).optional(),
});

type Flight = z.infer<typeof flightSchema>;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const radarCache = new NodeCache({ stdTTL: 15 });

// Mock Database
let flights: Flight[] = [
  {
    id: "1",
    flightNumber: "BA123",
    airline: "British Airways",
    origin: { code: "LHR", city: "London", lat: 51.4700, lng: -0.4543 },
    destination: { code: "JFK", city: "New York", lat: 40.6413, lng: -73.7781 },
    departureTime: new Date(Date.now() - 3600000).toISOString(),
    arrivalTime: new Date(Date.now() + 21600000).toISOString(),
    status: "on-time",
    progress: 15,
    currentPosition: { lat: 52.0, lng: -10.0, altitude: 35000, speed: 450, heading: 270 }
  }
];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  
  // Fix for Issue #9: CORS configuration
  app.use(cors({
    origin: (origin, callback) => {
      const allowedOrigins = ["http://localhost:3000", "http://0.0.0.0:3000", process.env.APP_URL].filter(Boolean);
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true
  }));

  // API Routes
  app.get("/api/flights", (req, res) => {
    res.json(flights);
  });

  app.post("/api/flights", (req, res) => {
    try {
      const data = flightSchema.parse({ ...req.body, id: uuidv4() });
      flights.push(data);
      res.status(201).json(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Validation failed", details: error.issues });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  });

  app.patch("/api/flights/:id", (req, res) => {
    const index = flights.findIndex(f => f.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: "Flight not found" });
    
    try {
      const patchSchema = flightSchema.partial();
      const updates = patchSchema.parse(req.body);
      flights[index] = { ...flights[index], ...updates };
      res.json(flights[index]);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Validation failed", details: error.issues });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  });

  app.delete("/api/flights/:id", (req, res) => {
    flights = flights.filter(f => f.id !== req.params.id);
    res.status(204).send();
  });

  // AI Proxy Routes
  app.post("/api/ai/search", async (req, res) => {
    const { query } = req.body;
    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                id: { type: SchemaType.STRING },
                flightNumber: { type: SchemaType.STRING },
                airline: { type: SchemaType.STRING },
                origin: {
                  type: SchemaType.OBJECT,
                  properties: {
                    code: { type: SchemaType.STRING },
                    city: { type: SchemaType.STRING },
                    lat: { type: SchemaType.NUMBER },
                    lng: { type: SchemaType.NUMBER }
                  },
                  required: ["code", "city", "lat", "lng"]
                },
                destination: {
                  type: SchemaType.OBJECT,
                  properties: {
                    code: { type: SchemaType.STRING },
                    city: { type: SchemaType.STRING },
                    lat: { type: SchemaType.NUMBER },
                    lng: { type: SchemaType.NUMBER }
                  },
                  required: ["code", "city", "lat", "lng"]
                },
                departureTime: { type: SchemaType.STRING },
                arrivalTime: { type: SchemaType.STRING },
                status: {
                  type: SchemaType.STRING,
                  enum: ["scheduled", "on-time", "delayed", "landed", "diverted"],
                  format: "enum"
                } as any,
                currentPosition: {
                  type: SchemaType.OBJECT,
                  properties: {
                    lat: { type: SchemaType.NUMBER },
                    lng: { type: SchemaType.NUMBER },
                    altitude: { type: SchemaType.NUMBER },
                    speed: { type: SchemaType.NUMBER },
                    heading: { type: SchemaType.NUMBER }
                  },
                  required: ["lat", "lng", "altitude", "speed", "heading"]
                },
                progress: { type: SchemaType.NUMBER },
                aircraftType: { type: SchemaType.STRING },
                gate: { type: SchemaType.STRING },
                atcLog: {
                  type: SchemaType.ARRAY,
                  items: { type: SchemaType.STRING }
                }
              },
              required: ["id", "flightNumber", "airline", "origin", "destination", "departureTime", "arrivalTime", "status", "progress"]
            }
          }
        }
      }, { apiVersion: 'v1beta' });

      const prompt = `You are a real-time flight data and ATC surveillance engine. Use Google Search to find current, accurate flight information and relevant sector ATC communications for: "${query}".

      Current global time: ${new Date().toISOString()}
      Search for:
      1. Real-time flight numbers and vector telemetry (lat/lng, altitude, speed).
      2. Approximate ATC communications or simulated transcripts based on flight phase (climb, cruise, descent) and major ATC sectors nearby.

      Return an array of flight objects following the schema. For every flight, include an "atcLog" array containing 3-5 lines of anonymized ATC-style radio comms.`;

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        tools: [{ googleSearchRetrieval: {} }] as any,
      });

      const response = result.response;
      res.json(JSON.parse(response.text()));
    } catch (error) {
      console.error("AI Search failed:", error);
      res.status(500).json({ error: "AI search failed" });
    }
  });

  app.post("/api/ai/telemetry", async (req, res) => {
    const { flight } = req.body;
    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: SchemaType.OBJECT,
            properties: {
              predictedFuelBurn: { type: SchemaType.STRING },
              estimatedTimeToDestination: { type: SchemaType.STRING },
              weatherAdvisories: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING }
              }
            },
            required: ["predictedFuelBurn", "estimatedTimeToDestination", "weatherAdvisories"]
          }
        }
      }, { apiVersion: 'v1beta' });

      const prompt = `Analyze the following flight and provide tactical telemetry predictions and safety advisories.

      Flight: ${flight.flightNumber} (${flight.airline})
      Route: ${flight.origin.city} (${flight.origin.code}) -> ${flight.destination.city} (${flight.destination.code})
      Current Speed: ${flight.currentPosition?.speed || 'Unknown'} kts
      Current Altitude: ${flight.currentPosition?.altitude || 'Unknown'} ft
      Aircraft Type: ${flight.aircraftType || 'Commercial Jet'}

      Predict based on current vectors and route:
      1. Predicted fuel burn (total for route).
      2. Accurate Estimated Time to Destination (ETD) expressed as "X hours Y minutes".
      3. Potential en-route weather advisories or turbulence warnings based on the general route region.`;

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        tools: [{ googleSearchRetrieval: {} }] as any,
      });

      res.json(JSON.parse(result.response.text()));
    } catch (error) {
      console.error("AI Telemetry failed:", error);
      res.status(500).json({ error: "AI telemetry analysis failed" });
    }
  });

  app.get("/api/ai/weather", async (req, res) => {
    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                id: { type: SchemaType.STRING },
                lat: { type: SchemaType.NUMBER },
                lng: { type: SchemaType.NUMBER },
                intensity: { type: SchemaType.NUMBER },
                radius: { type: SchemaType.NUMBER },
                type: {
                  type: SchemaType.STRING,
                  enum: ['precipitation', 'wind', 'storm'],
                  format: "enum"
                } as any
              },
              required: ["id", "lat", "lng", "intensity", "radius", "type"]
            }
          }
        }
      }, { apiVersion: 'v1beta' });

      const prompt = "Identify the current top 10 most intense weather systems (storms or high precipitation areas) globally. Provide their exact coordinates (lat, lng), intensity (0.1 to 1.0), and estimated radius of influence (in degrees).";

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        tools: [{ googleSearchRetrieval: {} }] as any,
      });

      res.json(JSON.parse(result.response.text()));
    } catch (error) {
      console.error("AI Weather failed:", error);
      res.status(500).json({ error: "AI weather analysis failed" });
    }
  });

  // Proxy OpenSky Network for real-time data
  app.get("/api/external/live-flights", async (req, res) => {
    try {
      // Default to a broad USA bounding box if none provided
      const lamin = req.query.lamin || 24;
      const lomin = req.query.lomin || -125;
      const lamax = req.query.lamax || 50;
      const lomax = req.query.lomax || -66;

      const cacheKey = `radar_${lamin}_${lomin}_${lamax}_${lomax}`;
      const cachedData = radarCache.get(cacheKey);
      if (cachedData) {
        return res.json(cachedData);
      }

      const url = `https://opensky-network.org/api/states/all?lamin=${lamin}&lomin=${lomin}&lamax=${lamax}&lomax=${lomax}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`OpenSky API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Limit to top 50 flights for performance
      const states = (data.states || []).slice(0, 50).map((s: any) => ({
        id: s[0],
        callsign: s[1]?.trim() || "N/A",
        origin_country: s[2],
        lat: s[6],
        lng: s[5],
        altitude: s[7],
        velocity: s[9],
        heading: s[10],
        on_ground: s[8]
      }));

      radarCache.set(cacheKey, states);
      res.json(states);
    } catch (error) {
      console.error("OpenSky fetch failed:", error);
      res.status(500).json({ error: "Failed to fetch live flight data" });
    }
  });

  // Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
