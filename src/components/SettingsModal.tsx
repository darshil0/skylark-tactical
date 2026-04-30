import React from 'react';
import { X, Settings, Ruler, Map as MapIcon, Bell, Monitor, Layers } from 'lucide-react';
import { UserPreferences } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: UserPreferences;
  onSave: (prefs: UserPreferences) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, preferences, onSave }) => {
  const [localPrefs, setLocalPrefs] = React.useState<UserPreferences>(preferences);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
      />
      
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative w-full max-w-md glass-panel rounded-xl tactical-glow overflow-hidden"
      >
        <header className="p-4 border-b border-gray-800 flex justify-between items-center bg-[#0D121F]">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-blue-500" />
            <h2 className="text-sm font-black text-white uppercase italic tracking-widest">System Protocols</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Units of Measurement */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-gray-400">
               <Ruler className="w-3.5 h-3.5" />
               <span className="text-[10px] font-mono uppercase tracking-widest">Units of Measurement</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[9px] text-gray-500 uppercase font-mono">Altitude</label>
                <div className="flex bg-gray-900 rounded p-0.5 border border-gray-800">
                  <button 
                    onClick={() => setLocalPrefs(p => ({ ...p, units: { ...p.units, altitude: 'ft' } }))}
                    className={`flex-1 text-[10px] py-1 rounded font-mono ${localPrefs.units.altitude === 'ft' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                  >
                    FEET
                  </button>
                  <button 
                    onClick={() => setLocalPrefs(p => ({ ...p, units: { ...p.units, altitude: 'm' } }))}
                    className={`flex-1 text-[10px] py-1 rounded font-mono ${localPrefs.units.altitude === 'm' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                  >
                    METERS
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-gray-500 uppercase font-mono">Speed</label>
                <div className="flex bg-gray-900 rounded p-0.5 border border-gray-800">
                  <button 
                    onClick={() => setLocalPrefs(p => ({ ...p, units: { ...p.units, speed: 'kts' } }))}
                    className={`flex-1 text-[10px] py-1 rounded font-mono ${localPrefs.units.speed === 'kts' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                  >
                    KNOTS
                  </button>
                  <button 
                    onClick={() => setLocalPrefs(p => ({ ...p, units: { ...p.units, speed: 'kmh' } }))}
                    className={`flex-1 text-[10px] py-1 rounded font-mono ${localPrefs.units.speed === 'kmh' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                  >
                    KM/H
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Map Preferences */}
          <section className="space-y-3">
             <div className="flex items-center gap-2 text-gray-400">
               <MapIcon className="w-3.5 h-3.5" />
               <span className="text-[10px] font-mono uppercase tracking-widest">Navigation Interface</span>
            </div>
            <div className="space-y-1">
                <label className="text-[9px] text-gray-500 uppercase font-mono">Default View Overlay</label>
                <div className="grid grid-cols-3 gap-2">
                  {['dark', 'satellite', 'navigation'].map((style) => (
                    <button 
                      key={style}
                      onClick={() => setLocalPrefs(p => ({ ...p, mapStyle: style as UserPreferences['mapStyle'] }))}
                      className={`text-[9px] py-2 rounded font-mono uppercase border border-gray-800 ${localPrefs.mapStyle === style ? 'bg-blue-900/40 text-blue-400 border-blue-500' : 'bg-gray-900 text-gray-600'}`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
            </div>
          </section>

          {/* Tactical Layers */}
          <section className="space-y-3">
             <div className="flex items-center gap-2 text-gray-400">
               <Layers className="w-3.5 h-3.5" />
               <span className="text-[10px] font-mono uppercase tracking-widest">Tactical Layers</span>
            </div>
            <div className="space-y-2">
               {[
                 { key: 'weather', label: 'Weather Radar' },
                 { key: 'airspace', label: 'Airspace Sectors' }
               ].map((item) => (
                 <div key={item.key} className="flex justify-between items-center bg-gray-900/50 p-2 rounded border border-gray-800">
                    <span className="text-[11px] text-gray-400 font-mono italic">{item.label}</span>
                    <button 
                      onClick={() => setLocalPrefs(p => ({ 
                        ...p, 
                        mapLayers: { 
                          ...(p.mapLayers || { weather: false, airspace: false }), 
                          [item.key]: !(p.mapLayers?.[item.key as keyof typeof p.mapLayers]) 
                        } 
                      }))}
                      className={`w-8 h-4 rounded-full relative transition-colors ${localPrefs.mapLayers?.[item.key as keyof typeof localPrefs.mapLayers] ? 'bg-blue-600' : 'bg-gray-800'}`}
                    >
                       <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${localPrefs.mapLayers?.[item.key as keyof typeof localPrefs.mapLayers] ? 'left-4.5' : 'left-0.5'}`} />
                    </button>
                 </div>
               ))}
            </div>
          </section>

          {/* Notifications */}
          <section className="space-y-3">
             <div className="flex items-center gap-2 text-gray-400">
               <Bell className="w-3.5 h-3.5" />
               <span className="text-[10px] font-mono uppercase tracking-widest">Alert Protocols</span>
            </div>
            <div className="space-y-2">
               {[
                 { key: 'statusChanges', label: 'Flight Status Changes' },
                 { key: 'proximityAlerts', label: 'User Proximity Alerts' },
                 { key: 'audibleAlerts', label: 'Audible Signal Tones' }
               ].map((item) => (
                 <div key={item.key} className="flex justify-between items-center bg-gray-900/50 p-2 rounded border border-gray-800">
                    <span className="text-[11px] text-gray-400 font-mono italic">{item.label}</span>
                    <button 
                      onClick={() => setLocalPrefs(p => ({ ...p, notifications: { ...p.notifications, [item.key]: !p.notifications[item.key as keyof typeof p.notifications] } }))}
                      className={`w-8 h-4 rounded-full relative transition-colors ${localPrefs.notifications[item.key as keyof typeof localPrefs.notifications] ? 'bg-blue-600' : 'bg-gray-800'}`}
                    >
                       <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${localPrefs.notifications[item.key as keyof typeof localPrefs.notifications] ? 'left-4.5' : 'left-0.5'}`} />
                    </button>
                 </div>
               ))}
               
               {localPrefs.notifications.proximityAlerts && (
                 <div className="bg-gray-900/50 p-3 rounded border border-gray-800 space-y-2">
                    <div className="flex justify-between items-center">
                       <span className="text-[9px] text-gray-500 uppercase font-mono">Detection Radius</span>
                       <span className="text-[10px] text-blue-400 font-mono">{localPrefs.notifications.proximityRadius} NM</span>
                    </div>
                    <input 
                      type="range"
                      min="10"
                      max="250"
                      step="10"
                      value={localPrefs.notifications.proximityRadius}
                      onChange={(e) => setLocalPrefs(p => ({ ...p, notifications: { ...p.notifications, proximityRadius: parseInt(e.target.value) } }))}
                      className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                    <div className="flex justify-between text-[8px] text-gray-600 font-mono">
                       <span>10NM</span>
                       <span>250NM</span>
                    </div>
                 </div>
               )}
            </div>
          </section>

           {/* Default View */}
           <section className="space-y-3">
             <div className="flex items-center gap-2 text-gray-400">
               <Monitor className="w-3.5 h-3.5" />
               <span className="text-[10px] font-mono uppercase tracking-widest">Initialization State</span>
            </div>
            <div className="flex bg-gray-900 rounded p-1 border border-gray-800">
                <button 
                  onClick={() => setLocalPrefs(p => ({ ...p, defaultView: 'global' }))}
                  className={`flex-1 text-[10px] py-1.5 rounded font-mono ${localPrefs.defaultView === 'global' ? 'bg-gray-800 text-white' : 'text-gray-500'}`}
                >
                  GLOBAL RADAR
                </button>
                <button 
                  onClick={() => setLocalPrefs(p => ({ ...p, defaultView: 'local' }))}
                  className={`flex-1 text-[10px] py-1.5 rounded font-mono ${localPrefs.defaultView === 'local' ? 'bg-gray-800 text-white' : 'text-gray-500'}`}
                >
                  LOCAL VECTORS
                </button>
            </div>
          </section>
        </div>

        <footer className="p-4 border-t border-gray-800 bg-[#0D121F]">
           <button 
             onClick={() => { onSave(localPrefs); onClose(); }}
             className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded text-[10px] font-black uppercase tracking-[0.2em] transition-all"
           >
             Commit Changes
           </button>
        </footer>
      </motion.div>
    </div>
  );
};
