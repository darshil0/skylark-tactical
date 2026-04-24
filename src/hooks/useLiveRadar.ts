import { useState, useEffect } from 'react';
import { LiveRadarFlight } from '../types';

export function useLiveRadar(active: boolean) {
  const [liveRadarFlights, setLiveRadarFlights] = useState<LiveRadarFlight[]>([]);

  const fetchLiveRadar = async () => {
    try {
      const res = await fetch('/api/external/live-flights');
      if (res.ok) {
        const data = await res.json();
        setLiveRadarFlights(data);
      }
    } catch (err) {
      console.error("Live Radar fetch failed", err);
    }
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (active) {
      fetchLiveRadar();
      interval = setInterval(fetchLiveRadar, 15000);
    } else {
      setLiveRadarFlights([]);
    }
    return () => clearInterval(interval);
  }, [active]);

  return { liveRadarFlights, fetchLiveRadar };
}
