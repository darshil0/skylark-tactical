/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Plane, Radio, Settings, Activity, Plus, Database, RefreshCw, X, Loader2, Edit2, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { clsx as cn } from 'clsx';
import { FlightSearch } from '../FlightSearch';
import { FlightRow } from '../FlightRow';
import { Flight, LiveRadarFlight } from '../../types';

interface SidebarProps {
  isMobileListOpen: boolean;
  setIsMobileListOpen: (open: boolean) => void;
  liveRadarActive: boolean;
  setLiveRadarActive: (active: boolean) => void;
  setShowSettings: (show: boolean) => void;
  setShowModal: (show: boolean) => void;
  setEditingFlight: (flight: Flight | undefined) => void;
  flights: Flight[];
  liveRadarFlights: LiveRadarFlight[];
  isSearching: boolean;
  handleSearch: (query: string) => void;
  fetchFlights: () => void;
  fetchLiveRadar: () => void;
  selectedFlightId?: string;
  handleSelectFlight: (id: string) => void;
  handleDeleteFlight: (id: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isMobileListOpen,
  setIsMobileListOpen,
  liveRadarActive,
  setLiveRadarActive,
  setShowSettings,
  setShowModal,
  setEditingFlight,
  flights,
  liveRadarFlights,
  isSearching,
  handleSearch,
  fetchFlights,
  fetchLiveRadar,
  selectedFlightId,
  handleSelectFlight,
  handleDeleteFlight
}) => {
  return (
    <aside className={cn(
      "fixed inset-y-0 left-0 lg:relative lg:translate-x-0 w-full md:w-[450px] flex flex-col border-r border-gray-800 z-30 bg-[#0B0F19] transition-transform duration-300 ease-in-out overflow-hidden",
      !isMobileListOpen && "-translate-x-full lg:translate-x-0"
    )}>
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] select-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff10_1px,transparent_1px)] bg-[size:20px_20px]" />
      </div>

      <header className="p-6 border-b border-gray-800 space-y-4 relative z-10 bg-[#0B0F19]/50 backdrop-blur-md">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded flex items-center justify-center shadow-[0_0_30px_rgba(37,99,235,0.4)] border border-blue-400/20">
              <Plane className="text-white w-7 h-7 -rotate-45" />
            </div>
            <div>
              <h1 className="text-2xl font-serif font-black tracking-[calc(0.05em*-1)] text-white uppercase italic leading-none mb-1">SkyTrack</h1>
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

      <footer className="p-4 border-t border-gray-800 bg-[#080B14] relative z-20">
         <div className="grid grid-cols-2 gap-4 mb-3">
            <div className="space-y-1">
               <span className="text-[9px] font-mono text-gray-600 uppercase block">
                 {liveRadarActive ? "Signal Strength" : "Memory Buffer"}
               </span>
               <div className="h-1 w-full bg-gray-900 rounded-full overflow-hidden">
                  <motion.div 
                    className={cn("h-full", liveRadarActive ? "bg-blue-400" : "bg-emerald-500/50")}
                    animate={{ width: liveRadarActive ? ['70%', '95%', '85%', '100%'] : ['20%', '60%', '40%', '80%', '30%'] }}
                    transition={{ duration: liveRadarActive ? 2 : 10, repeat: Infinity }}
                  />
               </div>
            </div>
            <div className="space-y-1 text-right">
               <span className="text-[9px] font-mono text-gray-600 uppercase block">Data Integrity</span>
               <span className={cn("text-[10px] font-mono", liveRadarActive ? "text-blue-400" : "text-emerald-500/70")}>
                  {liveRadarActive ? "ENCRYPTED" : "VERIFIED"}
               </span>
            </div>
         </div>
         <div className="flex justify-between items-center text-[8px] font-mono text-gray-700 uppercase tracking-tighter">
            <div className="flex gap-3">
               <span>LAT: {liveRadarFlights[0]?.lat?.toFixed(4) || "0.0000"}</span>
               <span>LNG: {liveRadarFlights[0]?.lng?.toFixed(4) || "0.0000"}</span>
            </div>
            <div className="flex items-center gap-1">
               <div className="w-1.5 h-1.5 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <div className="w-0.5 h-0.5 rounded-full bg-blue-500" />
               </div>
               SYSTEM_UPTIME: 124H_42M
            </div>
         </div>
      </footer>
    </aside>
  );
};
