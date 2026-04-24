/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Share2, X, Activity, Wind, Navigation, Info, Radio } from 'lucide-react';
import { format } from 'date-fns';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { clsx as cn } from 'clsx';
import { Flight, UserPreferences, LiveRadarFlight } from '../../types';

interface FlightDetailSidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  selectedFlight?: Flight;
  selectedLiveFlight?: LiveRadarFlight;
  handleShareFlight: () => void;
  preferences: UserPreferences;
}

export const FlightDetailSidebar: React.FC<FlightDetailSidebarProps> = ({
  isSidebarOpen,
  setIsSidebarOpen,
  selectedFlight,
  selectedLiveFlight,
  handleShareFlight,
  preferences
}) => {
  const isLive = !!selectedLiveFlight;

  const getAltValue = () => {
    let value = isLive ? (selectedLiveFlight?.altitude ?? 0) : (selectedFlight?.currentPosition?.altitude ?? 35000);
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
    if (isLive) {
      const kmh = value * 3.6;
      if (preferences.units.speed === 'kts') {
        return `${Math.round(kmh / 1.852)} KTS`;
      }
      return `${Math.round(kmh)} KM/H`;
    } else {
      if (preferences.units.speed === 'kmh') {
        return `${Math.round(value * 1.852)} KM/H`;
      }
      return `${value} KTS`;
    }
  };

  return (
    <motion.div 
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="fixed lg:absolute top-0 right-0 w-full lg:w-80 h-full bg-[#0B0F19]/95 backdrop-blur-xl border-l border-gray-800 shadow-2xl z-40 flex flex-col overflow-hidden"
    >
      {/* Scanline Effect */}
      <div className="absolute inset-0 pointer-events-none z-50 opacity-[0.03] select-none">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
      </div>

      <motion.div 
        initial={{ top: '-100%' }}
        animate={{ top: '100%' }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        className="absolute left-0 right-0 h-[100px] bg-gradient-to-b from-transparent via-blue-500/5 to-transparent z-10 pointer-events-none"
      />

        <header className="p-6 border-b border-gray-800 flex justify-between items-start relative z-20">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black text-white italic tracking-tighter leading-none">
                {selectedLiveFlight ? (selectedLiveFlight.callsign || `ICAO:${selectedLiveFlight.id}`) : (selectedFlight?.flightNumber || 'N/A')}
              </h2>
              {isLive && (
                <div className="flex items-center gap-1 bg-red-600/20 px-1.5 py-0.5 rounded border border-red-500/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[7px] font-black text-red-500 uppercase tracking-tighter">LIVE</span>
                </div>
              )}
            </div>
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
              {[
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
              ))}
           </div>

            {selectedLiveFlight && (
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
                      {[
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
                      }
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
             </div>
            )}
            
            {/* ... Rest of the details content would go here if needed ... */}
        </div>
      </motion.div>
  );
};
