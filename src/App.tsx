/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Map } from './components/Map';
import { FlightRow } from './components/FlightRow';
import { FlightSearch } from './components/FlightSearch';
import { FlightModal } from './components/FlightModal';
import { SettingsModal } from './components/SettingsModal';
import { Flight, UserLocation, UserPreferences } from './types';
import { getInitialFlights, searchFlights, getFlightTelemetry } from './services/geminiService';
import { format } from 'date-fns';
import { Share2, Plane, Radio, Terminal, Activity, Wind, Info, X, Navigation, Plus, Database, RefreshCw, Trash2, Edit2, Loader2, MapPin, Settings, AlertTriangle, Fuel, Clock, CloudRain } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

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
      {/* Sidebar for Flight List */}
      <aside className={cn(
        "fixed inset-y-0 left-0 lg:relative lg:translate-x-0 w-full md:w-[450px] flex flex-col border-r border-gray-800 z-30 bg-[#0B0F19] transition-transform duration-300 ease-in-out",
        !isMobileListOpen && "-translate-x-full lg:translate-x-0"
      )}>
        <header className="p-6 border-b border-gray-800 space-y-4">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded flex items-center justify-center shadow-[0_0_30px_rgba(37,99,235,0.4)] border border-blue-400/20">
                <Plane className="text-white w-7 h-7 -rotate-45" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-[calc(0.05em*-1)] text-white uppercase italic leading-none mb-1">SkyTrack</h1>
                <div className="flex items-center gap-2">
                  <span className={cn("w-1.5 h-1.5 rounded-full", liveRadarActive ? "bg-blue-400 animate-[pulse_1.5s_infinite]" : "bg-emerald-500 animate-pulse")} />
                  <span className={cn("text-[10px] font-mono uppercase tracking-[0.2em] font-bold", liveRadarActive ? "text-blue-400" : "text-emerald-500/80")}>
                    {liveRadarActive ? "RADAR_LIVE" : "SYSTEM_READY"}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setIsMobileListOpen(false)}
                className="lg:hidden p-2 text-gray-500 hover:text-white bg-gray-800 rounded"
              >
                <X className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setShowSettings(true)}
                title="System Settings"
                className="bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white p-2 rounded transition-all shadow-lg border border-gray-800"
              >
                 <Settings className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setLiveRadarActive(!liveRadarActive)}
                title="Toggle Live Radar"
                className={cn(
                  "p-2 rounded transition-all shadow-lg border border-gray-800",
                  liveRadarActive ? "bg-blue-600 text-white border-blue-400" : "bg-gray-800 text-gray-400 hover:text-white"
                )}
              >
                 <Activity className="w-5 h-5" />
              </button>
              <button 
                onClick={() => { setEditingFlight(undefined); setShowModal(true); }}
                className="bg-gray-800 hover:bg-emerald-600 text-white p-2 rounded transition-all shadow-lg group border border-gray-800"
              >
                 <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
              </button>
            </div>
          </div>
          
          <FlightSearch onSearch={handleSearch} onClear={fetchFlights} isSearching={isSearching} />
        </header>

        <section className="flex-1 overflow-y-auto">
          <div className="sticky top-0 bg-[#0B0F19]/90 backdrop-blur-md px-4 py-2 border-b border-gray-800 flex justify-between items-center z-20">
            <div className="flex items-center gap-2">
              {liveRadarActive ? (
                <Radio className="w-3 h-3 text-blue-500 animate-pulse" />
              ) : (
                <Database className="w-3 h-3 text-emerald-500" />
              )}
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                {liveRadarActive ? "Live OpenSky Feed" : "Core Database"}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={() => liveRadarActive ? fetchLiveRadar() : fetchFlights()} className="text-gray-500 hover:text-blue-500 transition-colors">
                 <RefreshCw className={cn("w-3 h-3", (isSearching || liveRadarActive) && "animate-spin")} />
              </button>
              <span className="text-[10px] font-mono text-gray-400">
                {liveRadarActive ? liveRadarFlights.length : flights.length} Entities
              </span>
            </div>
          </div>
          
          {!liveRadarActive && flights.length === 0 && !isSearching && (
             <div className="p-12 text-center space-y-2 opacity-50">
                <Database className="w-8 h-8 text-gray-800 mx-auto mb-4" />
                <p className="text-gray-600 text-sm italic">Database empty. Initiate AI scan or manual entry.</p>
             </div>
          )}

          {liveRadarActive && liveRadarFlights.length === 0 && (
             <div className="p-12 text-center space-y-2 opacity-50">
                <Loader2 className="w-8 h-8 text-blue-900 mx-auto mb-4 animate-spin" />
                <p className="text-gray-600 text-sm italic">Scanning airwaves... Fetching global vectors.</p>
             </div>
          )}

          {liveRadarActive ? (
            liveRadarFlights.length === 0 ? (
               <div className="space-y-4 p-4">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="h-20 bg-white/5 animate-pulse rounded border border-gray-800/50" />
                  ))}
               </div>
            ) : (
              liveRadarFlights.map(f => {
                const mappedFlight: Flight = {
                  id: f.id,
                  flightNumber: (f.callsign && f.callsign !== 'N/A') ? f.callsign : `H-${f.id.slice(0, 4).toUpperCase()}`,
                  airline: f.origin_country || 'Unknown Sector',
                  origin: { code: '---', city: 'RADAR_VEC', lat: f.lat, lng: f.lng },
                  destination: { code: '---', city: 'LIVE_TRACK', lat: f.lat, lng: f.lng },
                  departureTime: new Date().toISOString(),
                  arrivalTime: new Date().toISOString(),
                  status: f.on_ground ? 'landed' : 'on-time',
                  progress: 50,
                  currentPosition: { lat: f.lat, lng: f.lng, altitude: f.altitude, speed: f.velocity, heading: f.heading }
                };
                return (
                  <FlightRow 
                    key={f.id}
                    flight={mappedFlight}
                    isSelected={f.id === selectedFlightId}
                    onSelect={handleSelectFlight}
                  />
                );
              })
            )
          ) : (
            isSearching ? (
              <div className="space-y-4 p-4">
                 {[1,2,3].map(i => (
                   <div key={i} className="h-20 bg-blue-500/5 animate-pulse rounded border border-blue-500/10" />
                 ))}
              </div>
            ) : (
              flights.map(flight => (
                <div key={flight.id} className="relative group/row">
                  <FlightRow 
                    flight={flight} 
                    isSelected={flight.id === selectedFlightId}
                    onSelect={handleSelectFlight}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
                     <button 
                        onClick={(e) => { e.stopPropagation(); setEditingFlight(flight); setShowModal(true); }}
                        className="p-1.5 rounded bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700"
                     >
                        <Edit2 className="w-3.5 h-3.5" />
                     </button>
                     <button 
                        onClick={(e) => handleDeleteFlight(flight.id, e)}
                        className="p-1.5 rounded bg-gray-800 text-gray-400 hover:text-red-500 hover:bg-red-900/20"
                     >
                        <Trash2 className="w-3.5 h-3.5" />
                     </button>
                  </div>
                </div>
              ))
            )
          )}
        </section>

        <footer className="p-4 border-t border-gray-800 bg-[#080B14]">
           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                 <span className="text-[9px] font-mono text-gray-600 uppercase block">
                   {liveRadarActive ? "Signal Strength" : "Memory Buffer"}
                 </span>
                 <div className="h-1 w-full bg-gray-900 rounded-full overflow-hidden">
                    <motion.div 
                      className={cn("h-full", liveRadarActive ? "bg-emerald-500" : "bg-blue-500/50")}
                      animate={{ width: liveRadarActive ? ['70%', '95%', '85%', '100%'] : ['20%', '60%', '40%', '80%', '30%'] }}
                      transition={{ duration: liveRadarActive ? 2 : 10, repeat: Infinity }}
                    />
                 </div>
              </div>
              <div className="space-y-1 text-right">
                 <span className="text-[9px] font-mono text-gray-600 uppercase block">Status</span>
                 <span className="text-[10px] font-mono text-emerald-500/70">
                    {liveRadarActive ? "ADS-B LIVE" : "DB STANDBY"}
                 </span>
              </div>
           </div>
        </footer>
      </aside>

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
           {/* Proximity Warning Overlay */}
           <AnimatePresence>
             {activeAlerts.size > 0 && preferences.notifications.proximityAlerts && (
               <motion.div 
                 initial={{ opacity: 0, y: -20 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -20 }}
                 className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-red-600/90 backdrop-blur-md px-6 py-2 rounded-full border border-red-400 shadow-[0_0_40px_rgba(220,38,38,0.4)] flex items-center gap-3"
               >
                  <AlertTriangle className="w-5 h-5 text-white animate-pulse" />
                  <div className="flex flex-col items-center">
                    <span className="text-xs font-black text-white italic tracking-widest uppercase">
                      PROXIMITY WARNING: {activeAlerts.size} {activeAlerts.size === 1 ? 'OBJECT' : 'OBJECTS'} WITHIN {preferences.notifications.proximityRadius}NM
                    </span>
                    <div className="flex gap-1.5 mt-1 overflow-x-auto max-w-[200px] scrollbar-hide">
                      {Array.from(activeAlerts).map(id => {
                        const f = liveRadarActive 
                          ? liveRadarFlights.find(rf => rf.id === id)
                          : flights.find(df => df.id === id);
                        const fn = liveRadarActive ? (f?.callsign || f?.id) : f?.flightNumber;
                        return (
                          <span key={id} className="text-[10px] bg-white text-red-600 px-2 py-0.5 rounded-sm font-black whitespace-nowrap animate-pulse">
                            {fn}
                          </span>
                        );
                      })}
                    </div>
                  </div>
               </motion.div>
             )}
           </AnimatePresence>

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
           
           {/* Detail Sidebar */}
           <AnimatePresence>
             {isSidebarOpen && (selectedFlight || selectedLiveFlight) && (
               <motion.div 
                 initial={{ x: '100%' }}
                 animate={{ x: 0 }}
                 exit={{ x: '100%' }}
                 transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                 className="fixed lg:absolute top-0 right-0 w-full lg:w-80 h-full bg-[#0B0F19]/95 backdrop-blur-xl border-l border-gray-800 shadow-2xl z-40 flex flex-col"
               >
                  <header className="p-6 border-b border-gray-800 flex justify-between items-start">
                    <div className="space-y-1">
                      <h2 className="text-2xl font-black text-white italic tracking-tighter leading-none">
                        {selectedLiveFlight ? (selectedLiveFlight.callsign || `ICAO:${selectedLiveFlight.id}`) : (selectedFlight?.flightNumber || 'N/A')}
                      </h2>
                      <span className="text-[10px] font-mono text-blue-500 uppercase tracking-widest font-bold">
                        {selectedLiveFlight ? `REG: ${selectedLiveFlight.id.toUpperCase()}` : (selectedFlight?.airline || 'UNKNOWN AIRLINE')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={handleShareFlight}
                        className="p-2 rounded hover:bg-blue-600/10 text-gray-500 hover:text-blue-400 transition-all active:scale-95"
                        title="Share Tracking Data"
                      >
                        <Share2 className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => setIsSidebarOpen(false)}
                        className="p-1 rounded-full hover:bg-gray-800 text-gray-500 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </header>

                  <div className="flex-1 overflow-y-auto p-6 space-y-8">
                     <div className="grid grid-cols-2 gap-px bg-gray-800 rounded overflow-hidden border border-gray-800">
                        {(() => {
                          const isLive = !!selectedLiveFlight;
                          const getAltValue = () => {
                            let value = isLive ? (selectedLiveFlight?.altitude ?? 0) : (selectedFlight?.currentPosition?.altitude ?? 35000);
                            // If live radar, it's in meters. If local DB, it's in feet.
                            if (isLive) {
                              if (preferences.units.altitude === 'ft') {
                                return `${Math.round(value * 3.28084).toLocaleString()} FT`;
                              }
                              return `${Math.round(value).toLocaleString()} M`;
                            } else {
                              if (preferences.units.altitude === 'm') {
                                return `${Math.round(value * 0.3048).toLocaleString()} M`;
                              }
                              return `${value.toLocaleString()} FT`;
                            }
                          };

                          const getSpeedValue = () => {
                            let value = isLive ? (selectedLiveFlight?.velocity ?? 0) : (selectedFlight?.currentPosition?.speed ?? 450);
                            // If live radar, it's in m/s. If local DB, it's in knots.
                            if (isLive) {
                              // m/s to chosen unit
                              const kmh = value * 3.6;
                              if (preferences.units.speed === 'kts') {
                                return `${Math.round(kmh / 1.852)} KTS`;
                              }
                              return `${Math.round(kmh)} KM/H`;
                            } else {
                              // knots to chosen unit
                              if (preferences.units.speed === 'kmh') {
                                return `${Math.round(value * 1.852)} KM/H`;
                              }
                              return `${value} KTS`;
                            }
                          };

                          return [
                            { label: 'ALTITUDE', value: getAltValue(), icon: Activity },
                            { label: 'SPEED', value: getSpeedValue(), icon: Wind },
                            { label: 'HEADING', value: `${(isLive ? selectedLiveFlight?.heading : selectedFlight?.currentPosition?.heading) ?? '0'}°`, icon: Navigation },
                            { label: 'STATUS', value: (isLive ? (selectedLiveFlight?.on_ground ? 'LANDED' : 'AIRBORNE') : selectedFlight?.status.toUpperCase()) || 'N/A', icon: Info },
                          ].map((item, idx) => (
                            <div key={idx} className="bg-[#0B0F19] p-4 flex flex-col gap-1">
                               <div className="flex items-center gap-1.5 opacity-50">
                                  <item.icon className="w-3 h-3" />
                                  <span className="text-[9px] font-mono tracking-widest">{item.label}</span>
                               </div>
                               <span className="text-lg font-bold text-gray-200 tabular-nums tracking-tight">{item.value}</span>
                            </div>
                          ));
                        })()}
                     </div>

                      {selectedLiveFlight ? (
                       <div className="space-y-6">
                          <div className="bg-blue-900/10 border border-blue-900/30 rounded p-4">
                             <div className="flex justify-between items-center mb-3">
                                <p className="text-[10px] font-mono text-blue-400 uppercase tracking-widest font-bold">Signal Telemetry</p>
                                <div className="flex gap-0.5">
                                   {[1, 2, 3, 4, 5].map(i => (
                                     <div key={i} className={cn("w-1 h-2 rounded-full", i <= 4 ? "bg-blue-500" : "bg-gray-800")} />
                                   ))}
                                </div>
                             </div>
                             <div className="grid grid-cols-2 gap-4 text-xs">
                                <div>
                                   <p className="text-gray-500 text-[9px] uppercase">ICAO24 HEX</p>
                                   <p className="text-white font-mono">{selectedLiveFlight.id}</p>
                                </div>
                                <div>
                                   <p className="text-gray-500 text-[9px] uppercase">Source / Class</p>
                                   <div className="flex items-center gap-1.5 translate-y-0.5">
                                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                                      <p className="text-white font-black">ADS-B (GND)</p>
                                   </div>
                                </div>
                                <div>
                                   <p className="text-gray-500 text-[9px] uppercase">Signal Age</p>
                                   <p className="text-blue-400 font-mono">0.4s (REALTIME)</p>
                                </div>
                                <div>
                                   <p className="text-gray-500 text-[9px] uppercase">Radar Coverage</p>
                                   <p className="text-emerald-500">OPTIMAL / SAT</p>
                                </div>
                             </div>
                          </div>
                          
                          <div className="space-y-3">
                             <div className="flex items-center gap-2 text-gray-400">
                                <Radio className="w-3.5 h-3.5 text-blue-500" />
                                <span className="text-[10px] font-mono uppercase tracking-widest">Signal Decryption (ATC)</span>
                             </div>
                             <div className="bg-black/60 border border-gray-800 rounded p-3 font-mono text-[9px] space-y-2 overflow-hidden relative">
                                <div className="absolute top-0 right-0 p-1 bg-blue-500/10 text-[7px] text-blue-400 border-b border-l border-gray-800">UNENCRYPTED</div>
                                {(selectedLiveFlight as any).atcLog ? (selectedLiveFlight as any).atcLog.map((msg: string, i: number) => (
                                  <motion.div 
                                    key={i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.2 }}
                                    className="flex gap-2"
                                  >
                                    <span className="text-gray-600">[{format(new Date(), 'HH:mm:ss')}]</span>
                                    <span className={cn(i === 0 ? "text-emerald-500" : "text-gray-300")}>
                                      {msg.toUpperCase()}
                                    </span>
                                  </motion.div>
                                )) : (
                                  [
                                    "ESTABLISHING LINK...",
                                    `HANDOFF: SECTOR_${selectedLiveFlight.id.slice(0, 4)}`,
                                    "MAINTAIN VECTOR HEADING",
                                    "ADSB_VALIDATED"
                                  ].map((msg, i) => (
                                    <motion.div 
                                      key={i}
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: i * 0.2 }}
                                      className="flex gap-2"
                                    >
                                      <span className="text-gray-600">[{format(new Date(), 'HH:mm:ss')}]</span>
                                      <span className={cn(i === 0 ? "text-emerald-500" : "text-gray-300")}>
                                        {msg.toUpperCase()}
                                      </span>
                                    </motion.div>
                                  ))
                                )}
                                <div className="animate-pulse flex items-center gap-1.5 pt-1 text-[8px] text-blue-500/50">
                                   <div className="w-1 h-1 rounded-full bg-blue-500" />
                                   LISTENING_ON_VECTOR_WAKE
                                </div>
                             </div>
                          </div>

                          <div className="pt-4 border-t border-gray-800 space-y-4">
                             <div className="flex items-center gap-2 text-gray-400">
                                <Activity className="w-3.5 h-3.5 text-blue-500" />
                                <span className="text-[10px] font-mono uppercase tracking-widest">Live Vector Profile</span>
                             </div>
                             <div className="h-28 w-full bg-black/40 rounded border border-gray-800 p-2">
                                <ResponsiveContainer width="100%" height="100%">
                                   <AreaChart data={[
                                      { t: 0, alt: selectedLiveFlight.altitude * 0.98 },
                                      { t: 1, alt: selectedLiveFlight.altitude * 1.02 },
                                      { t: 2, alt: selectedLiveFlight.altitude * 0.99 },
                                      { t: 3, alt: selectedLiveFlight.altitude },
                                   ]}>
                                      <Area type="monotone" dataKey="alt" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.1} strokeWidth={2} isAnimationActive={false} />
                                   </AreaChart>
                                </ResponsiveContainer>
                             </div>
                          </div>

                          <div className="bg-amber-900/10 border border-amber-900/30 rounded p-4">
                             <div className="flex items-start gap-3">
                                <div className="p-2 bg-amber-500/20 rounded">
                                   <Info className="w-4 h-4 text-amber-500" />
                                </div>
                                <div className="space-y-1">
                                   <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">ADSB Convergence Note</p>
                                   <p className="text-[9px] leading-relaxed text-amber-200/60">
                                      Real-time estimated trajectories are computed using localized vector prediction. Route data may drift in non-radar "black hole" zones.
                                   </p>
                                </div>
                             </div>
                          </div>
                       </div>
                     ) : (
                <div className="space-y-6">
                {/* Timeline section */}
                <div className="relative pl-8 space-y-10 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-gray-800">
                  <div className="relative">
                    <div className="absolute -left-[27px] top-1 w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/30">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex justify-between items-baseline">
                        <span className="text-2xl font-black text-white leading-none">{selectedFlight?.origin.code}</span>
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-[9px] text-emerald-500 font-mono font-black rounded border border-emerald-500/20">ACTUAL DEPARTURE</span>
                      </div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest font-medium">{selectedFlight?.origin.city}</p>
                      <div className="pt-3 grid grid-cols-2 gap-4">
                        <div className="flex flex-col">
                          <span className="text-[8px] text-gray-600 uppercase font-mono tracking-tighter">Sch. Gate Out</span>
                          <span className="text-xs text-gray-500 font-bold tabular-nums">
                            {selectedFlight && format(new Date(new Date(selectedFlight.departureTime).getTime() - 15 * 60 * 1000), 'HH:mm')}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[8px] text-emerald-600 uppercase font-mono tracking-tighter">Actual Airborne</span>
                          <span className="text-sm text-emerald-400 font-black tabular-nums">
                            {selectedFlight && format(new Date(selectedFlight.departureTime), 'HH:mm')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="relative">
                    <div className="absolute -left-[27px] top-1 w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/30">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] animate-pulse" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex justify-between items-baseline">
                        <span className="text-2xl font-black text-white leading-none">{selectedFlight?.destination.code}</span>
                        <span className="px-2 py-0.5 bg-blue-500/10 text-[9px] text-blue-400 font-mono font-black rounded border border-blue-500/20">EST. ARRIVAL</span>
                      </div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest font-medium">{selectedFlight?.destination.city}</p>
                      <div className="pt-3 grid grid-cols-2 gap-4">
                        <div className="flex flex-col">
                          <span className="text-[8px] text-gray-600 uppercase font-mono tracking-tighter">Sch. Gate In</span>
                          <span className="text-xs text-gray-500 font-bold tabular-nums">
                            {selectedFlight && format(new Date(new Date(selectedFlight.arrivalTime).getTime() + 5 * 60 * 1000), 'HH:mm')}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[8px] text-blue-600 uppercase font-mono tracking-tighter">Predicted Touchdown</span>
                          <span className="text-sm text-blue-400 font-black tabular-nums underline decoration-blue-500/30 underline-offset-4">
                            {selectedFlight && format(new Date(selectedFlight.arrivalTime), 'HH:mm')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* AI Telemetry Integration */}
                {(selectedFlight?.telemetry || isTelemetryLoading) && (
                   <div className="pt-6 border-t border-gray-800 space-y-4">
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2 text-gray-400">
                            <Terminal className="w-3.5 h-3.5 text-blue-500" />
                            <span className="text-[10px] font-mono uppercase tracking-widest">Tactical Telemetry</span>
                         </div>
                         {isTelemetryLoading && (
                           <div className="flex items-center gap-2">
                             <span className="text-[8px] font-mono text-blue-500 animate-pulse">UPLINKING...</span>
                             <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />
                           </div>
                         )}
                      </div>

                      {isTelemetryLoading && !selectedFlight?.telemetry ? (
                         <div className="space-y-3">
                            <div className="h-10 bg-white/5 animate-pulse rounded border border-white/5" />
                            <div className="h-16 bg-white/5 animate-pulse rounded border border-white/5" />
                         </div>
                      ) : (
                        <div className="space-y-4">
                           <div className="grid grid-cols-2 gap-3">
                              <div className="bg-blue-900/10 p-3 rounded border border-blue-900/30">
                                 <div className="flex items-center gap-2 opacity-60 mb-1">
                                    <Fuel className="w-3 h-3 text-blue-400" />
                                    <span className="text-[8px] font-mono uppercase">Avg Fuel Burn</span>
                                 </div>
                                 <p className="text-xs font-bold text-white">{selectedFlight?.telemetry?.predictedFuelBurn}</p>
                              </div>
                              <div className="bg-blue-900/10 p-3 rounded border border-blue-900/30">
                                 <div className="flex items-center gap-2 opacity-60 mb-1">
                                    <Clock className="w-3 h-3 text-blue-400" />
                                    <span className="text-[8px] font-mono uppercase">Est. ETE</span>
                                 </div>
                                 <p className="text-xs font-bold text-white">{selectedFlight?.telemetry?.estimatedTimeToDestination}</p>
                              </div>
                           </div>

                           {selectedFlight?.telemetry?.weatherAdvisories && selectedFlight.telemetry.weatherAdvisories.length > 0 && (
                              <div className="bg-amber-900/10 border border-amber-900/30 rounded p-4">
                                <div className="flex items-center gap-2 text-amber-500 mb-2">
                                  <CloudRain className="w-4 h-4" />
                                  <span className="text-[9px] font-black uppercase tracking-widest">En-Route Advisories</span>
                                </div>
                                <ul className="space-y-2">
                                  {selectedFlight.telemetry.weatherAdvisories.map((adv, idx) => (
                                    <li key={idx} className="text-[10px] text-amber-200/70 border-l border-amber-500/30 pl-3 leading-tight italic">
                                      {adv}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                           )}
                        </div>
                      )}
                   </div>
                )}

                {/* Additional Info Section */}
                <div className="pt-4 border-t border-gray-800 space-y-4">
                   <div className="flex items-center gap-2 text-gray-400">
                      <Info className="w-3.5 h-3.5 text-blue-500" />
                      <span className="text-[10px] font-mono uppercase tracking-widest">Aircraft Details</span>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-gray-900/50 rounded border border-gray-800 flex flex-col gap-1">
                         <span className="text-[9px] text-gray-600 uppercase font-mono">Type</span>
                         <span className="text-xs text-white font-bold">{selectedFlight?.aircraftType || 'Boeing 787-9'}</span>
                      </div>
                      <div className="p-3 bg-gray-900/50 rounded border border-gray-800 flex flex-col gap-1">
                         <span className="text-[9px] text-gray-600 uppercase font-mono">Gate</span>
                         <span className="text-xs text-white font-bold">{selectedFlight?.gate || 'B42'}</span>
                      </div>
                   </div>
                </div>

                <div className="pt-4 border-t border-gray-800 space-y-4">
                   <div className="flex items-center gap-2 text-gray-400">
                      <Activity className="w-3.5 h-3.5 text-blue-500" />
                      <span className="text-[10px] font-mono uppercase tracking-widest">Flight Profile (Alt/Speed)</span>
                   </div>
                   <div className="h-28 w-full bg-black/40 rounded border border-gray-800 p-2">
                      <ResponsiveContainer width="100%" height="100%">
                         <AreaChart data={[
                            { t: 0, alt: 0, speed: 0 },
                            { t: 10, alt: 10000, speed: 250 },
                            { t: 20, alt: 25000, speed: 380 },
                            { t: 30, alt: 35000, speed: 450 },
                            { t: 40, alt: 35000, speed: 455 },
                            { t: 50, alt: 35000, speed: 440 },
                            { t: 60, alt: 35000, speed: 450 },
                            { t: 70, alt: 35000, speed: 452 },
                            { t: 80, alt: 35000, speed: 448 },
                         ].map(d => ({ 
                           ...d, 
                           alt: d.t > (selectedFlight?.progress || 0) ? null : d.alt,
                           speed: d.t > (selectedFlight?.progress || 0) ? null : d.speed
                         }))}>
                            <defs>
                               <linearGradient id="colorAlt" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                               </linearGradient>
                            </defs>
                            <Area type="monotone" dataKey="alt" stroke="#3B82F6" fillOpacity={1} fill="url(#colorAlt)" strokeWidth={2} isAnimationActive={false} />
                         </AreaChart>
                      </ResponsiveContainer>
                   </div>
                   <p className="text-[9px] text-gray-600 font-mono italic text-center uppercase tracking-tighter">Real-time telemetry trend via system uplink</p>
                </div>
              </div>
                     )}
                  </div>

                  <footer className="p-4 border-t border-gray-800 grid grid-cols-2 gap-2">
                     {!liveRadarActive && (
                       <>
                         <button 
                           onClick={() => { setEditingFlight(selectedFlight); setShowModal(true); }}
                           className="bg-gray-800 hover:bg-gray-700 text-white text-[10px] font-bold uppercase tracking-widest py-3 rounded transition-all flex items-center justify-center gap-2"
                         >
                            <Edit2 className="w-3 h-3" /> Edit
                         </button>
                         <button 
                            onClick={(e) => selectedFlight && handleDeleteFlight(selectedFlight.id, e as any)}
                            className="bg-red-900/20 hover:bg-red-900/40 text-red-500 text-[10px] font-bold uppercase tracking-widest py-3 rounded transition-all border border-red-500/10 flex items-center justify-center gap-2"
                         >
                            <Trash2 className="w-3 h-3" /> Purge
                         </button>
                       </>
                     )}
                     {liveRadarActive && (
                        <button 
                           className="col-span-2 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold uppercase tracking-widest py-3 rounded transition-all flex items-center justify-center gap-2"
                        >
                           <Radio className="w-3 h-3" /> Record Vector Data
                        </button>
                     )}
                  </footer>
               </motion.div>
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

const cn = (...inputs: any[]) => inputs.filter(Boolean).join(' ');

