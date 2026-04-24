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
import { Flight, UserPreferences } from './types';
import { searchFlights } from './services/geminiService';
import { Terminal, Radio, Activity } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { clsx as cn } from 'clsx';
import { useFlights } from './hooks/useFlights';
import { useLiveRadar } from './hooks/useLiveRadar';
import { useFlightAlerts } from './hooks/useFlightAlerts';
import { useUserLocation } from './hooks/useUserLocation';

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
  const {
    flights,
    setFlights,
    isSearching,
    setIsSearching,
    selectedFlightId,
    setSelectedFlightId,
    fetchFlights,
    saveFlight,
    deleteFlight,
  } = useFlights();

  const [liveRadarActive, setLiveRadarActive] = useState(false);
  const { liveRadarFlights, fetchLiveRadar } = useLiveRadar(liveRadarActive);
  const { userLocation } = useUserLocation();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobileListOpen, setIsMobileListOpen] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editingFlight, setEditingFlight] = useState<Flight | undefined>();

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

  const { activeAlerts } = useFlightAlerts(flights, liveRadarFlights, userLocation, preferences);

  const handleSavePreferences = (newPrefs: UserPreferences) => {
    setPreferences(newPrefs);
    localStorage.setItem('skytrack_preferences', JSON.stringify(newPrefs));
  };

  const selectedFlight = flights.find(f => f.id === selectedFlightId);
  const selectedLiveFlight = liveRadarFlights.find(f => f.id === selectedFlightId);

  useEffect(() => {
    // Handle deep linking for shared flights
    const params = new URLSearchParams(window.location.search);
    const sharedFlightId = params.get('flightId');
    if (sharedFlightId) {
      setSelectedFlightId(sharedFlightId);
      setIsSidebarOpen(true);
    }
  }, [setSelectedFlightId]);

  const handleShareFlight = async () => {
    const flight = flights.find(f => f.id === selectedFlightId) || 
                   liveRadarFlights.find(f => f.id === selectedFlightId);
    
    if (!flight) return;

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

  const handleSaveFlight = async (payload: Partial<Flight>) => {
    const success = await saveFlight(payload, editingFlight?.id);
    if (success) {
      setShowModal(false);
      setEditingFlight(undefined);
    }
  };

  const handleDeleteFlight = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Erase flight data from matrix?')) {
      await deleteFlight(id);
    }
  };

  const handleSelectFlight = useCallback((id: string) => {
    setSelectedFlightId(id);
    setIsSidebarOpen(true);
  }, [setSelectedFlightId]);

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
               <div className="flex items-center gap-2">
                  <div className="relative flex h-2 w-2">
                     <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                     <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </div>
                  <span className="text-emerald-500 font-bold text-[9px]">SYSTEMS_OPERATIONAL</span>
               </div>
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
            onClose={() => { setShowModal(false); setEditingFlight(undefined); }}
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
