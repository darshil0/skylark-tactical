import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import { configDotenv } from "./server/dotenv.ts";
import { z } from "zod";

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
});

// Mock Database
let flights = [
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
    origin: ["http://0.0.0.0:3000", "http://localhost:3000", process.env.APP_URL].filter(Boolean) as string[],
    credentials: true
  }));

  // API Routes
  app.get("/api/flights", (req, res) => {
    res.json(flights);
  });

  app.post("/api/flights", (req, res) => {
    try {
      const data = flightSchema.parse({ ...req.body, id: Math.random().toString(36).substr(2, 9) });
      (flights as any).push(data);
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
      res.status(400).json({ error: "Validation failed" });
    }
  });

  app.delete("/api/flights/:id", (req, res) => {
    flights = flights.filter(f => f.id !== req.params.id);
    res.status(204).send();
  });

  // Proxy OpenSky Network for real-time data
  app.get("/api/external/live-flights", async (req, res) => {
    try {
      // Default to a broad USA bounding box if none provided
      const lamin = req.query.lamin || 24;
      const lomin = req.query.lomin || -125;
      const lamax = req.query.lamax || 50;
      const lomax = req.query.lomax || -66;

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
