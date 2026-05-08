import { describe, it, expect } from 'vitest';
import { z } from "zod";

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

describe('flightSchema', () => {
  const validFlight = {
    id: "uuid-123",
    flightNumber: "BA123",
    airline: "British Airways",
    origin: { code: "LHR", city: "London", lat: 51.47, lng: -0.45 },
    destination: { code: "JFK", city: "New York", lat: 40.64, lng: -73.77 },
    departureTime: "2023-01-01T10:00:00Z",
    arrivalTime: "2023-01-01T18:00:00Z",
    status: "on-time",
    progress: 50
  };

  it('validates a correct flight object', () => {
    const result = flightSchema.safeParse(validFlight);
    expect(result.success).toBe(true);
  });

  it('rejects missing flight number', () => {
    const invalidFlight = { ...validFlight, flightNumber: "" };
    const result = flightSchema.safeParse(invalidFlight);
    expect(result.success).toBe(false);
  });

  it('rejects invalid airport code', () => {
    const invalidFlight = { ...validFlight, origin: { ...validFlight.origin, code: "LONGCODE" } };
    const result = flightSchema.safeParse(invalidFlight);
    expect(result.success).toBe(false);
  });

  it('rejects out of range progress', () => {
    const invalidFlight = { ...validFlight, progress: 150 };
    const result = flightSchema.safeParse(invalidFlight);
    expect(result.success).toBe(false);
  });
});
