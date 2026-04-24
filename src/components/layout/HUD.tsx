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
      <div className="absolute inset-0 pointer-events-none z-30 opacity-20">
        <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-blue-500 rounded-tl-sm" />
        <div className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-blue-500 rounded-tr-sm" />
        <div className="absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 border-blue-500 rounded-bl-sm" />
        <div className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-blue-500 rounded-br-sm" />
      </div>

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
    </>
  );
};
