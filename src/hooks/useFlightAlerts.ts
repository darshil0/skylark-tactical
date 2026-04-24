import { useState, useEffect, useCallback } from 'react';
import { Flight, UserLocation, UserPreferences, LiveRadarFlight } from '../types';
import { calculateDistance } from '../lib/utils';

export function useFlightAlerts(
  flights: Flight[],
  liveRadarFlights: LiveRadarFlight[],
  userLocation: UserLocation | undefined,
  preferences: UserPreferences
) {
  const [activeAlerts, setActiveAlerts] = useState<Set<string>>(new Set());

  const playAlertSound = useCallback(() => {
    if (!preferences.notifications.audibleAlerts) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
      console.warn("Audio Context blocked or unsupported");
    }
  }, [preferences.notifications.audibleAlerts]);

  useEffect(() => {
    if (!preferences.notifications.proximityAlerts || !userLocation) return;

    const allFlights = [...flights];
    liveRadarFlights.forEach(f => {
      allFlights.push({
        id: f.id,
        flightNumber: f.callsign || f.id,
        currentPosition: { lat: f.lat, lng: f.lng }
      } as any);
    });

    const newAlerts = new Set<string>();
    let triggered = false;

    allFlights.forEach(flight => {
      if (!flight.currentPosition) return;
      const dist = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        flight.currentPosition.lat,
        flight.currentPosition.lng
      );

      if (dist <= preferences.notifications.proximityRadius) {
        newAlerts.add(flight.id);
        if (!activeAlerts.has(flight.id)) {
          triggered = true;
        }
      }
    });

    if (triggered) {
      playAlertSound();
    }
    setActiveAlerts(newAlerts);
  }, [flights, liveRadarFlights, userLocation, preferences.notifications.proximityAlerts, preferences.notifications.proximityRadius, activeAlerts, playAlertSound]);

  return { activeAlerts };
}
