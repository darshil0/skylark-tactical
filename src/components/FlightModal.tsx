import React, { useState, useEffect } from 'react';
import { Flight, FlightInput } from '../types';
import { X, Loader2 } from 'lucide-react';
import { z } from 'zod';
import { format } from 'date-fns';

const flightInputSchema = z.object({
  flightNumber: z.string().min(1, "Flight number is required"),
  airline: z.string().min(1, "Airline is required"),
  originCode: z.string().length(3, "Must be 3 characters"),
  originCity: z.string().min(1, "City is required"),
  destinationCode: z.string().length(3, "Must be 3 characters"),
  destinationCity: z.string().min(1, "City is required"),
  departureTime: z.string().min(1, "Required"),
  arrivalTime: z.string().min(1, "Required"),
  status: z.enum(["scheduled", "on-time", "delayed", "landed", "diverted"]),
  progress: z.number().min(0).max(100)
});

interface FlightModalProps {
  flight?: Flight;
  onClose: () => void;
  onSave: (data: Partial<Flight>) => Promise<void>;
}

export const FlightModal: React.FC<FlightModalProps> = ({ flight, onClose, onSave }) => {
  // Fix for Issue #4: Default values for all fields
  const [formData, setFormData] = useState<FlightInput>({
    flightNumber: '',
    airline: '',
    originCode: '',
    originCity: '',
    destinationCode: '',
    destinationCity: '',
    departureTime: '',
    arrivalTime: '',
    status: 'scheduled',
    progress: 0
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (flight) {
      // Fix for Issue #5: Proper DateTime formatting for input
      // Convert ISO to yyyy-MM-ddThh:mm for datetime-local input
      const formatForInput = (iso: string) => {
        try {
          return format(new Date(iso), "yyyy-MM-dd'T'HH:mm");
        } catch {
          return '';
        }
      };

      setFormData({
        flightNumber: flight.flightNumber,
        airline: flight.airline,
        originCode: flight.origin.code,
        originCity: flight.origin.city,
        destinationCode: flight.destination.code,
        destinationCity: flight.destination.city,
        departureTime: formatForInput(flight.departureTime),
        arrivalTime: formatForInput(flight.arrivalTime),
        status: flight.status,
        progress: flight.progress
      });
    }
  }, [flight]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    // Fix for Issue #15: Form validation
    const result = flightInputSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach(err => {
        if (err.path[0]) fieldErrors[err.path[0].toString()] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true); // Fix for Issue #12: Loading state
    try {
      // Map back to API structure
      const payload = {
        flightNumber: formData.flightNumber,
        airline: formData.airline,
        origin: { 
          code: formData.originCode, 
          city: formData.originCity,
          lat: 0, lng: 0 // Mock coords
        },
        destination: { 
          code: formData.destinationCode, 
          city: formData.destinationCity,
          lat: 0, lng: 0 // Mock coords
        },
        departureTime: new Date(formData.departureTime).toISOString(),
        arrivalTime: new Date(formData.arrivalTime).toISOString(),
        status: formData.status,
        progress: formData.progress
      };
      await onSave(payload);
      onClose();
    } catch (err) {
      setErrors({ server: 'Failed to save flight' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[#0B0F19] border border-gray-800 rounded-xl overflow-hidden shadow-2xl">
        <header className="px-6 py-4 border-b border-gray-800 flex justify-between items-center bg-gray-900/50">
          <h3 className="text-white font-bold uppercase tracking-widest text-xs">
            {flight ? 'Edit Flight Object' : 'Register New Flight'}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-gray-500 uppercase">Flight No.</label>
              <input 
                value={formData.flightNumber}
                onChange={e => setFormData({...formData, flightNumber: e.target.value})}
                className="w-full bg-black/50 border border-gray-800 rounded px-3 py-2 text-sm text-white focus:border-blue-500 outline-none" 
              />
              {errors.flightNumber && <p className="text-[9px] text-red-500 font-mono">{errors.flightNumber}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-gray-500 uppercase">Airline</label>
              <input 
                value={formData.airline}
                onChange={e => setFormData({...formData, airline: e.target.value})}
                className="w-full bg-black/50 border border-gray-800 rounded px-3 py-2 text-sm text-white focus:border-blue-500 outline-none" 
              />
              {errors.airline && <p className="text-[9px] text-red-500 font-mono">{errors.airline}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
             <div className="space-y-2">
                <span className="text-[9px] font-bold text-blue-500 uppercase tracking-widest">Origin</span>
                <input 
                  placeholder="CODE"
                  value={formData.originCode}
                  onChange={e => setFormData({...formData, originCode: e.target.value.toUpperCase()})}
                  className="w-full bg-black/50 border border-gray-800 rounded px-3 py-2 text-sm text-white font-mono" 
                />
                <input 
                  placeholder="CITY"
                  value={formData.originCity}
                  onChange={e => setFormData({...formData, originCity: e.target.value})}
                  className="w-full bg-black/50 border border-gray-800 rounded px-3 py-2 text-sm text-white" 
                />
             </div>
             <div className="space-y-2">
                <span className="text-[9px] font-bold text-amber-500 uppercase tracking-widest">Destination</span>
                <input 
                  placeholder="CODE"
                  value={formData.destinationCode}
                  onChange={e => setFormData({...formData, destinationCode: e.target.value.toUpperCase()})}
                  className="w-full bg-black/50 border border-gray-800 rounded px-3 py-2 text-sm text-white font-mono" 
                />
                <input 
                  placeholder="CITY"
                  value={formData.destinationCity}
                  onChange={e => setFormData({...formData, destinationCity: e.target.value})}
                  className="w-full bg-black/50 border border-gray-800 rounded px-3 py-2 text-sm text-white" 
                />
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-gray-500 uppercase">Departure</label>
              <input 
                type="datetime-local"
                value={formData.departureTime}
                onChange={e => setFormData({...formData, departureTime: e.target.value})}
                className="w-full bg-black/50 border border-gray-800 rounded px-3 py-2 text-sm text-white" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-gray-500 uppercase">Arrival</label>
              <input 
                type="datetime-local"
                value={formData.arrivalTime}
                onChange={e => setFormData({...formData, arrivalTime: e.target.value})}
                className="w-full bg-black/50 border border-gray-800 rounded px-3 py-2 text-sm text-white" 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-gray-500 uppercase">Status</label>
              <select 
                value={formData.status}
                onChange={e => setFormData({...formData, status: e.target.value as any})}
                className="w-full bg-black/50 border border-gray-800 rounded px-3 py-2 text-sm text-white appearance-none"
              >
                <option value="scheduled">SCHEDULED</option>
                <option value="on-time">ON TIME</option>
                <option value="delayed">DELAYED</option>
                <option value="landed">LANDED</option>
                <option value="diverted">DIVERTED</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-gray-500 uppercase">Progress ({formData.progress}%)</label>
              <input 
                type="range"
                min="0"
                max="100"
                value={formData.progress}
                onChange={e => setFormData({...formData, progress: parseInt(e.target.value)})}
                className="w-full h-8 accent-blue-500" 
              />
            </div>
          </div>

          <div className="pt-4 flex gap-3">
             <button 
                type="button" 
                onClick={onClose}
                className="flex-1 bg-gray-900 hover:bg-gray-800 text-gray-400 font-bold uppercase tracking-widest text-[10px] py-3 rounded border border-gray-800"
             >
                Cancel
             </button>
             <button 
                type="submit" 
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold uppercase tracking-widest text-[10px] py-3 rounded shadow-[0_0_20px_rgba(37,99,235,0.2)] flex items-center justify-center gap-2"
             >
                {loading && <Loader2 className="w-3 h-3 animate-spin" />}
                {flight ? 'Update Matrix' : 'Commit Flight'}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};
