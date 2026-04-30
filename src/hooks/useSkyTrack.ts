import { useState, useEffect, useCallback } from 'react';
import { Flight, UserLocation, UserPreferences, LiveRadarFlight } from '../types';
import { getInitialFlights, getFlightTelemetry } from '../services/geminiService';
import { calculateDistance, playAlertTone } from '../utils/tactical';
import { DEFAULT_PREFERENCES } from '../constants/preferences';

export function useSkyTrack() {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [selectedFlightId, setSelectedFlightId] = useState<string | undefined>();
  const [isSearching, setIsSearching] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobileListOpen, setIsMobileListOpen] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editingFlight, setEditingFlight] = useState<Flight | undefined>();
  const [liveRadarActive, setLiveRadarActive] = useState(false);
  const [liveRadarFlights, setLiveRadarFlights] = useState<LiveRadarFlight[]>([]);
  const [userLocation, setUserLocation] = useState<UserLocation | undefined>();
  const [locationError, setLocationError] = useState<string | undefined>();
  const [isTelemetryLoading, setIsTelemetryLoading] = useState(false);
  const [activeAlerts, setActiveAlerts] = useState<Set<string>>(new Set());
  const [lastAlertCount, setLastAlertCount] = useState(0);

  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    const saved = localStorage.getItem('skytrack_preferences');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_PREFERENCES,
          ...parsed,
          units: { ...DEFAULT_PREFERENCES.units, ...parsed.units },
          notifications: { ...DEFAULT_PREFERENCES.notifications, ...parsed.notifications },
          mapLayers: { ...DEFAULT_PREFERENCES.mapLayers, ...(parsed.mapLayers || {}) },
        };
      } catch (e) {
        console.error("Failed to parse preferences", e);
        return DEFAULT_PREFERENCES;
      }
    }
    return DEFAULT_PREFERENCES;
  });

  const fetchFlights = useCallback(async () => {
    try {
      const res = await fetch('/api/flights');
      if (res.ok) {
        const data = await res.json();
        setFlights(data);
        if (data.length > 0 && !selectedFlightId && !liveRadarActive) setSelectedFlightId(data[0].id);
      }
    } catch (err) {
      console.error("Failed to fetch from API", err);
    }
  }, [selectedFlightId, liveRadarActive]);

  const fetchLiveRadar = useCallback(async () => {
    try {
      const res = await fetch('/api/external/live-flights');
      if (res.ok) {
        const data = await res.json();
        setLiveRadarFlights(data);
      }
    } catch (err) {
      console.error("Live Radar fetch failed", err);
    }
  }, []);

  const getUserLocation = useCallback(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setLocationError(undefined);
        },
        (error) => {
          const msg = error.code === 1 ? 'PERM_DENIED' : `ERR_CODE_${error.code}`;
          if (error.code !== 1) console.error(`Geolocation error (${error.code}): ${error.message}`);
          setLocationError(msg);
        },
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
      );
    } else {
      setLocationError("Geolocation not supported by browser");
    }
  }, []);

  useEffect(() => {
    getUserLocation();
    
    const initializeData = async () => {
      try {
        await fetchFlights();
        const res = await fetch('/api/flights');
        const data = await res.json();
        
        if (data.length === 0) {
          setIsSearching(true);
          const aiData = await getInitialFlights();
          for (const f of aiData) {
            await fetch('/api/flights', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(f)
            });
          }
          await fetchFlights();
          setIsSearching(false);
        }
      } catch (err) {
        console.error("Initialization failed", err);
      }
    };
    
    initializeData();
  }, [getUserLocation, fetchFlights]);

  // Proximity Alert Logic
  useEffect(() => {
    if (!preferences.notifications.proximityAlerts || !userLocation) {
      if (activeAlerts.size > 0) setActiveAlerts(new Set());
      return;
    }

    const newAlerts = new Set<string>();
    let hasBrandNewAlert = false;

    const allFlightsToCheck = liveRadarActive 
      ? liveRadarFlights.map(f => ({ id: f.id, currentPosition: { lat: f.lat, lng: f.lng } }))
      : flights.filter(f => f.currentPosition);

    allFlightsToCheck.forEach(flight => {
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
          hasBrandNewAlert = true;
        }
      }
    });

    if (hasBrandNewAlert) {
      playAlertTone(preferences.notifications.audibleAlerts);
    }

    const alertsChanged = newAlerts.size !== activeAlerts.size || Array.from(newAlerts).some(id => !activeAlerts.has(id));
    if (alertsChanged) {
      setActiveAlerts(newAlerts);
    }
  }, [flights, liveRadarFlights, userLocation, preferences.notifications.proximityAlerts, preferences.notifications.proximityRadius, preferences.notifications.audibleAlerts, liveRadarActive, activeAlerts]);

  const handleSavePreferences = (newPrefs: UserPreferences) => {
    setPreferences(newPrefs);
    localStorage.setItem('skytrack_preferences', JSON.stringify(newPrefs));
  };

  const handleSelectFlight = (id: string) => {
    setSelectedFlightId(id);
    setIsSidebarOpen(true);
    setIsMobileListOpen(false);
  };

  const handleSearch = async (query: string) => {
    setIsSearching(true);
    const results = await getInitialFlights(); // In real app, searchFlights(query)
    setFlights(results);
    setIsSearching(false);
  };

  const handleDeleteFlight = async (id: string) => {
    await fetch(`/api/flights/${id}`, { method: 'DELETE' });
    fetchFlights();
    if (selectedFlightId === id) setSelectedFlightId(undefined);
  };

  const handleSaveFlight = async (flight: any) => {
    const method = editingFlight ? 'PATCH' : 'POST';
    const url = editingFlight ? `/api/flights/${editingFlight.id}` : '/api/flights';
    
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(flight)
    });

    if (res.ok) {
      fetchFlights();
      setShowModal(false);
      setEditingFlight(undefined);
    }
  };

  return {
    flights, setFlights,
    selectedFlightId, setSelectedFlightId,
    isSearching, setIsSearching,
    isSidebarOpen, setIsSidebarOpen,
    isMobileListOpen, setIsMobileListOpen,
    showModal, setShowModal,
    showSettings, setShowSettings,
    editingFlight, setEditingFlight,
    liveRadarActive, setLiveRadarActive,
    liveRadarFlights, setLiveRadarFlights,
    userLocation, setUserLocation,
    locationError, setLocationError,
    preferences, setPreferences,
    activeAlerts, setActiveAlerts,
    isTelemetryLoading, setIsTelemetryLoading,
    fetchFlights, fetchLiveRadar, getUserLocation,
    handleSavePreferences, handleSelectFlight, handleSearch, handleDeleteFlight, handleSaveFlight
  };
}
