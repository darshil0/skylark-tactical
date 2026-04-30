/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle } from 'lucide-react';
import { Flight, UserPreferences, LiveRadarFlight } from '../../types';

interface HUDProps {
  activeAlerts: Set<string>;
  preferences: UserPreferences;
  liveRadarActive: boolean;
  liveRadarFlights: LiveRadarFlight[];
  flights: Flight[];
}

export const HUD: React.FC<HUDProps> = ({ 
  activeAlerts, 
  preferences, 
  liveRadarActive, 
  liveRadarFlights, 
  flights 
}) => {
  return (
    <>
      {/* Tactical Corner Brackets */}
      <div className="absolute inset-0 pointer-events-none z-10 opacity-20">
        <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-blue-500 rounded-tl-sm" />
        <div className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-blue-500 rounded-tr-sm" />
        <div className="absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 border-blue-500 rounded-bl-sm" />
        <div className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-blue-500 rounded-br-sm" />
      </div>

      {/* Telemetry Ticker Overlay */}
      <div className="absolute top-0 left-0 right-0 h-8 bg-blue-500/5 backdrop-blur-sm border-b border-blue-500/10 flex items-center overflow-hidden z-40 px-4">
         <motion.div 
           animate={{ x: [0, -1000] }}
           transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
           className="flex whitespace-nowrap text-[8px] font-mono text-blue-400 gap-8 uppercase tracking-[0.2em]"
         >
            <span>ACTIVE_RADAR_FEED_CONNECTED</span>
            <span>•</span>
            <span>ENCRYPTED_DATA_LINK_ESTABLISHED</span>
            <span>•</span>
            <span>SATELLITE_UPLINK_STABLE</span>
            <span>•</span>
            <span>ADS-B_DECODING_NORMAL</span>
            <span>•</span>
            <span>TERRAIN_AVOIDANCE_ACTIVE</span>
            <span>•</span>
            <span>SYSTEM_READY</span>
            <span>•</span>
            <span>LAT_LNG_LOCK_CONFIRMED</span>
            <span>•</span>
            <span>VIRTUAL_AIRSPACE_SYNCED</span>
            <span>•</span>
            <span>WEATHER_OVERLAY_SYNCHRONIZED</span>
         </motion.div>
      </div>

      <AnimatePresence>
      {activeAlerts.size > 0 && preferences.notifications.proximityAlerts && (
        <motion.div 
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -40 }}
          className="absolute top-12 left-1/2 -translate-x-1/2 z-40 bg-red-600/90 backdrop-blur-md px-6 py-2 rounded-sm border border-red-400 shadow-[0_0_40px_rgba(220,38,38,0.4)] flex items-center gap-3"
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
    </>
  );
};
