/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Map } from './components/Map';
import { FlightModal } from './components/FlightModal';
import { SettingsModal } from './components/SettingsModal';
import { Sidebar } from './components/layout/Sidebar';
import { FlightDetailSidebar } from './components/layout/FlightDetailSidebar';
import { HUD } from './components/layout/HUD';
import { Flight, UserLocation, UserPreferences } from './types';
import { getInitialFlights, searchFlights, getFlightTelemetry } from './services/geminiService';
import { Terminal, Radio, Activity } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { clsx as cn } from 'clsx';

const DEFAULT_PREFERENCES: UserPreferences = {
  units: {
    altitude: 'ft',
    speed: 'kts',
    distance: 'nm',
  },
  mapStyle: 'dark',
  notifications: {
    statusChanges: true,
    proximityAlerts: false,
    proximityRadius: 50,
    audibleAlerts: false,
  },
  mapLayers: {
    weather: false,
    airspace: false,
  },
  defaultView: 'global',
};

export default function App() {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [selectedFlightId, setSelectedFlightId] = useState<string | undefined>();
  const [isSearching, setIsSearching] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobileListOpen, setIsMobileListOpen] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editingFlight, setEditingFlight] = useState<Flight | undefined>();
  const [liveRadarActive, setLiveRadarActive] = useState(false);
  const [liveRadarFlights, setLiveRadarFlights] = useState<any[]>([]);
  const [userLocation, setUserLocation] = useState<UserLocation | undefined>();
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

  const [activeAlerts, setActiveAlerts] = useState<Set<string>>(new Set());
  const [isTelemetryLoading, setIsTelemetryLoading] = useState(false);

  // Haversine distance in Nautical Miles
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 3440.065; // Earth radius in NM
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

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

  const handleSavePreferences = (newPrefs: UserPreferences) => {
    setPreferences(newPrefs);
    localStorage.setItem('skytrack_preferences', JSON.stringify(newPrefs));
  };

  const selectedFlight = flights.find(f => f.id === selectedFlightId);
  const selectedLiveFlight = liveRadarFlights.find(f => f.id === selectedFlightId);

  const fetchFlights = async () => {
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
  };

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
    let interval: any;
    if (liveRadarActive) {
      fetchLiveRadar();
      interval = setInterval(fetchLiveRadar, 15000); // 15s polling
    } else {
      setLiveRadarFlights([]);
    }
    return () => clearInterval(interval);
  }, [liveRadarActive]);

  const getUserLocation = useCallback(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Geolocation error:", error);
        }
      );
    }
  }, []);

  useEffect(() => {
    getUserLocation();
    fetchFlights();
    // Keep initial AI load if empty
    const initAI = async () => {
      if (flights.length === 0) {
        setIsSearching(true);
        const data = await getInitialFlights();
        // Sync with backend (mock)
        for (const f of data) {
           await fetch('/api/flights', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify(f)
           });
        }
        fetchFlights();
        setIsSearching(false);
      }
    };
    initAI();
  }, []);

  useEffect(() => {
    // Handle deep linking for shared flights
    const params = new URLSearchParams(window.location.search);
    const sharedFlightId = params.get('flightId');
    if (sharedFlightId) {
      setSelectedFlightId(sharedFlightId);
      setIsSidebarOpen(true);
    }
  }, []);

  useEffect(() => {
    // Handle telemetry fetching for selected flight
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

  const handleShareFlight = async () => {
    const flight = flights.find(f => f.id === selectedFlightId) || 
                   liveRadarFlights.find(f => f.id === selectedFlightId);
    
    if (!flight) return;

    // Use shared URL if available, else current origin
    const shareUrl = `${window.location.origin}${window.location.pathname}?flightId=${flight.id}`;
    const shareTitle = `Track Flight ${flight.flightNumber || flight.id} on SkyTrack`;
    const shareText = `Check out the real-time status of ${flight.flightNumber || flight.id} (${flight.airline}).`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error('Error sharing:', err);
        }
      }
    } else {
      // Fallback: Copy to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert('Tracking link copied to clipboard!');
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  const handleSearch = async (query: string) => {
    setIsSearching(true);
    const data = await searchFlights(query);
    if (data.length > 0) {
      setFlights(data);
      setSelectedFlightId(data[0].id);
      setIsSidebarOpen(true);
    }
    setIsSearching(false);
  };

  const handleSaveFlight = async (payload: any) => {
    const url = editingFlight ? `/api/flights/${editingFlight.id}` : '/api/flights';
    const method = editingFlight ? 'PATCH' : 'POST';
    
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      await fetchFlights();
      setShowModal(false);
      setEditingFlight(undefined);
    }
  };

  const handleDeleteFlight = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Erase flight data from matrix?')) {
      await fetch(`/api/flights/${id}`, { method: 'DELETE' });
      await fetchFlights();
      if (selectedFlightId === id) setSelectedFlightId(undefined);
    }
  };

  const handleSelectFlight = useCallback((id: string) => {
    setSelectedFlightId(id);
    setIsSidebarOpen(true);
  }, []);

  return (
    <div className="flex h-screen w-full bg-[#0B0F19] font-sans selection:bg-blue-500/30 overflow-hidden">
      <Sidebar 
        isMobileListOpen={isMobileListOpen}
        setIsMobileListOpen={setIsMobileListOpen}
        liveRadarActive={liveRadarActive}
        setLiveRadarActive={setLiveRadarActive}
        setShowSettings={setShowSettings}
        setShowModal={setShowModal}
        setEditingFlight={setEditingFlight}
        flights={flights}
        liveRadarFlights={liveRadarFlights}
        isSearching={isSearching}
        handleSearch={handleSearch}
        fetchFlights={fetchFlights}
        fetchLiveRadar={fetchLiveRadar}
        selectedFlightId={selectedFlightId}
        handleSelectFlight={handleSelectFlight}
        handleDeleteFlight={handleDeleteFlight}
      />

      {/* Main Content */}
      <main className="relative flex-1 flex flex-col h-full bg-[#080B14]">
        {/* Mobile Toggle */}
        <button 
          onClick={() => setIsMobileListOpen(true)}
          className={cn(
            "lg:hidden absolute top-4 left-4 z-20 p-3 bg-blue-600 text-white rounded-full shadow-2xl transition-all active:scale-90",
            isMobileListOpen && "opacity-0 pointer-events-none"
          )}
        >
          <Terminal className="w-6 h-6" />
        </button>

        <div className="flex-1 min-h-0 relative">
           <HUD 
             activeAlerts={activeAlerts}
             preferences={preferences}
             liveRadarActive={liveRadarActive}
             liveRadarFlights={liveRadarFlights}
             flights={flights}
           />

           <Map 
            flights={liveRadarActive ? liveRadarFlights.map(f => ({
              id: f.id,
              flightNumber: f.callsign,
              airline: f.origin_country,
              origin: { code: '---', city: 'LIVE', lat: f.lat, lng: f.lng },
              destination: { code: '---', city: 'LIVE', lat: f.lat, lng: f.lng },
              departureTime: new Date().toISOString(),
              arrivalTime: new Date().toISOString(),
              status: f.on_ground ? 'landed' : 'on-time',
              progress: 100,
              currentPosition: { lat: f.lat, lng: f.lng, altitude: f.altitude, speed: f.velocity, heading: f.heading }
            })) : flights} 
            selectedFlightId={selectedFlightId} 
            onSelectFlight={handleSelectFlight}
            userLocation={userLocation}
            preferences={preferences}
            activeAlerts={activeAlerts}
           />
           
           <AnimatePresence>
             {isSidebarOpen && (selectedFlight || selectedLiveFlight) && (
               <FlightDetailSidebar 
                 isSidebarOpen={isSidebarOpen}
                 setIsSidebarOpen={setIsSidebarOpen}
                 selectedFlight={selectedFlight}
                 selectedLiveFlight={selectedLiveFlight}
                 handleShareFlight={handleShareFlight}
                 preferences={preferences}
               />
             )}
           </AnimatePresence>


                          


        </div>

        <div className="h-12 bg-black border-t border-gray-800 flex items-center px-4 justify-between font-mono text-[10px]">
           <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                 <Radio className="w-3 h-3 text-emerald-500" />
                 <span className="text-emerald-500/80 tracking-tighter">DATA LINK: ACTIVE @ {new Date().getSeconds()}s</span>
              </div>
              <div className="hidden md:flex items-center gap-2 text-gray-600">
                 <Activity className="w-3 h-3" />
                 <span className="truncate">PACKET FEED: OK / CRC CHECKED</span>
              </div>
           </div>
           <div className="flex items-center gap-4 text-gray-600">
              <span className="hidden lg:inline text-blue-500/50">SYSTEM_UPTIME: {Math.floor(performance.now()/1000)}s</span>
              <span className="text-white">UTC {new Date().toISOString().split('T')[1].split('.')[0]}</span>
           </div>
        </div>
        
        <div className="absolute inset-0 crt-overlay pointer-events-none opacity-20" />
      </main>

      {/* Modal Integration */}
      <AnimatePresence>
        {showModal && (
          <FlightModal 
            flight={editingFlight}
            onClose={() => { setShowModal(false); setEditingFlight(undefined); }} // Fix Issue #10
            onSave={handleSaveFlight}
          />
        )}
        {showSettings && (
          <SettingsModal 
            isOpen={showSettings}
            onClose={() => setShowSettings(false)}
            preferences={preferences}
            onSave={handleSavePreferences}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

