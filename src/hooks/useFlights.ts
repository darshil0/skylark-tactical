import { useState, useEffect, useCallback } from 'react';
import { Flight } from '../types';
import { getInitialFlights, getFlightTelemetry } from '../services/geminiService';

export function useFlights() {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedFlightId, setSelectedFlightId] = useState<string | undefined>();
  const [isTelemetryLoading, setIsTelemetryLoading] = useState(false);

  const fetchFlights = async () => {
    try {
      const res = await fetch('/api/flights');
      if (res.ok) {
        const data = await res.json();
        setFlights(data);
        return data;
      }
    } catch (err) {
      console.error("Failed to fetch from API", err);
    }
    return [];
  };

  useEffect(() => {
    fetchFlights().then(data => {
      if (data.length === 0) {
        setIsSearching(true);
        getInitialFlights().then(async (initialData) => {
          for (const f of initialData) {
            await fetch('/api/flights', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(f)
            });
          }
          fetchFlights();
          setIsSearching(false);
        });
      }
    });
  }, []);

  useEffect(() => {
    const flight = flights.find(f => f.id === selectedFlightId);
    if (flight && !flight.telemetry && !isTelemetryLoading) {
      const fetchTelemetry = async () => {
        setIsTelemetryLoading(true);
        const telemetry = await getFlightTelemetry(flight);
        if (telemetry) {
          setFlights(prev => prev.map(f => f.id === flight.id ? { ...f, telemetry } : f));
        }
        setIsTelemetryLoading(false);
      };
      fetchTelemetry();
    }
  }, [selectedFlightId, flights, isTelemetryLoading]);

  const saveFlight = async (payload: Partial<Flight>, editingFlightId?: string) => {
    const url = editingFlightId ? `/api/flights/${editingFlightId}` : '/api/flights';
    const method = editingFlightId ? 'PATCH' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      await fetchFlights();
      return true;
    }
    return false;
  };

  const deleteFlight = async (id: string) => {
    const res = await fetch(`/api/flights/${id}`, { method: 'DELETE' });
    if (res.ok) {
      await fetchFlights();
      if (selectedFlightId === id) setSelectedFlightId(undefined);
      return true;
    }
    return false;
  };

  return {
    flights,
    setFlights,
    isSearching,
    setIsSearching,
    selectedFlightId,
    setSelectedFlightId,
    fetchFlights,
    saveFlight,
    deleteFlight,
  };
}
