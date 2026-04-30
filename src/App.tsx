/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Map } from './components/Map';
import { FlightModal } from './components/FlightModal';
import { SettingsModal } from './components/SettingsModal';
import { Sidebar } from './components/layout/Sidebar';
import { FlightDetailSidebar } from './components/layout/FlightDetailSidebar';
import { HUD } from './components/layout/HUD';
import { Terminal, Radio, Activity, AlertTriangle } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { clsx as cn } from 'clsx';
import { useSkyTrack } from './hooks/useSkyTrack';

export default function App() {
  const {
    flights,
    selectedFlightId,
    isSearching,
    isMobileListOpen, setIsMobileListOpen,
    showModal, setShowModal,
    showSettings, setShowSettings,
    editingFlight, setEditingFlight,
    liveRadarActive, setLiveRadarActive,
    liveRadarFlights,
    userLocation,
    locationError,
    preferences,
    activeAlerts,
    isSidebarOpen, setIsSidebarOpen,
    handleSavePreferences,
    handleSelectFlight,
    handleDeleteFlight,
    handleSaveFlight,
    handleSearch,
    fetchFlights,
    fetchLiveRadar,
    getUserLocation
  } = useSkyTrack();

  const selectedFlight = flights.find(f => f.id === selectedFlightId);
  const selectedLiveFlight = liveRadarFlights.find(f => f.id === selectedFlightId);

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
            "lg:hidden absolute top-12 left-4 z-20 p-3 bg-blue-600 text-white rounded-full tactical-glow transition-all active:scale-90",
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
               {locationError && (
                 <div className="flex items-center gap-2 text-red-500/80">
                    <AlertTriangle className="w-3 h-3" />
                    <span className="text-[9px] font-mono uppercase tracking-widest cursor-default">
                      {locationError === 'PERM_DENIED' ? 'LOC_PERM_DENIED' : 'LOC_UNAVAILABLE'}
                    </span>
                    <button 
                      onClick={() => getUserLocation()}
                      className="ml-1 px-1.5 py-0.5 bg-red-500/10 border border-red-500/30 rounded hover:bg-red-500/20 active:scale-95 transition-all text-[8px] font-bold text-red-400"
                    >
                      RETRY_LOCK
                    </button>
                 </div>
               )}
               {userLocation && (
                 <div className="hidden xl:flex items-center gap-2 text-emerald-500/50">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>POS_LOCK: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}</span>
                 </div>
               )}
              <span className="text-white">UTC {new Date().toISOString().split('T')[1].split('.')[0]}</span>
           </div>
        </div>
        
        <div className="absolute inset-0 crt-overlay pointer-events-none opacity-20" />
      </main>

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
