/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle } from 'lucide-react';
import { Flight, UserPreferences } from '../../types';

interface HUDProps {
  activeAlerts: Set<string>;
  preferences: UserPreferences;
  liveRadarActive: boolean;
  liveRadarFlights: any[];
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
  );
};
