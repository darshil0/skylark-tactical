import React from 'react';
import { Flight } from '../types';
import { Plane, Clock, MapPin, Navigation } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface FlightRowProps {
  flight: Flight;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export const FlightRow: React.FC<FlightRowProps> = ({ flight, isSelected, onSelect }) => {
  const isLive = flight.origin.code === '---' || flight.id.length > 10;

  return (
    <motion.div 
      whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.05)' }}
      whileTap={{ scale: 0.995 }}
      onClick={() => onSelect(flight.id)}
      className={cn(
        "group relative grid grid-cols-[60px_1fr_1.5fr_100px] items-center gap-4 p-4 border-b border-gray-800/50 cursor-pointer transition-all overflow-hidden",
        isSelected && "bg-blue-600/10 border-l-[3px] border-l-blue-500 shadow-[inset_10px_0_20px_-10px_rgba(59,130,246,0.2)]"
      )}
    >
      {isSelected && (
        <motion.div 
          initial={{ top: '-100%' }}
          animate={{ top: '100%' }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="absolute left-0 right-0 h-[2px] bg-blue-500/20 z-10 pointer-events-none"
        />
      )}
      <div className="flex flex-col items-center justify-center bg-gray-900 rounded aspect-square w-10 mx-auto border border-gray-800 relative">
        {isLive && (
          <div className="absolute -top-1 -right-1 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </div>
        )}
        <span className="text-[10px] font-black text-gray-500 opacity-50 uppercase leading-none">
          {flight.airline.slice(0, 2)}
          <br/>
          {flight.airline.slice(2, 4)}
        </span>
      </div>

      <div className="flex flex-col min-w-0">
        <span className="text-lg font-black text-white tracking-tighter tabular-nums leading-none mb-1 truncate uppercase">
          {flight.flightNumber || flight.id.slice(0, 6)}
        </span>
        <span className="text-[10px] font-mono text-blue-500 uppercase tracking-widest truncate">{flight.airline}</span>
      </div>

      <div className="flex items-center gap-3 px-1 overflow-hidden">
        <div className="flex flex-col min-w-[35px]">
          <span className="text-xs font-black text-white leading-none">{flight.origin.code}</span>
        </div>
        
        <div className="flex-1 flex flex-col items-center relative min-w-[40px]">
          <div className="w-full h-[1px] bg-gray-800 rounded-full" />
          <Plane className={cn(
            "w-2.5 h-2.5 absolute top-1/2 -translate-y-1/2 transition-all",
            isSelected ? "text-blue-400" : "text-gray-600"
          )} style={{ left: `calc(${flight.progress}% - 5px)` }} />
        </div>

        <div className="flex flex-col text-right min-w-[35px]">
          <span className="text-xs font-black text-white leading-none">{flight.destination.code}</span>
        </div>
      </div>

      <div className="flex flex-col items-end">
        <span className={cn(
          "px-2 py-0.5 rounded-[2px] text-[9px] font-black uppercase tracking-widest mb-1",
          flight.status === 'on-time' && "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20",
          flight.status === 'delayed' && "bg-amber-500/10 text-amber-500 border border-amber-500/20",
          flight.status === 'scheduled' && "bg-blue-500/10 text-blue-500 border border-blue-500/20",
          flight.status === 'landed' && "bg-gray-800 text-gray-500 border border-gray-700"
        )}>
          {flight.status.replace('-', ' ')}
        </span>
        <span className="text-[10px] font-mono text-gray-500 tabular-nums">
          ETA {format(new Date(flight.arrivalTime), 'HH:mm')}
        </span>
        {flight.gate && (
           <span className="text-[9px] font-mono text-gray-600 mt-0.5 uppercase tracking-tighter">Gate {flight.gate}</span>
        )}
      </div>
    </motion.div>
  );
};
