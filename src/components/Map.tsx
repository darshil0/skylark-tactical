import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { Flight, UserLocation, UserPreferences } from '../types';
import { motion, AnimatePresence, useAnimate } from 'motion/react';
import { getLiveWeatherOverlay, WeatherCell, getAirspaceSectors, AirspaceSector } from '../services/weatherService';
import { RefreshCw } from 'lucide-react';

interface MapProps {
  flights: Flight[];
  selectedFlightId?: string;
  onSelectFlight: (id: string) => void;
  userLocation?: UserLocation;
  preferences: UserPreferences;
  activeAlerts: Set<string>;
}

const TraversedPath: React.FC<{
  d: string;
  progress: number;
  isSelected: boolean;
  strokeWidth: number;
}> = ({ d, progress, isSelected, strokeWidth }) => {
  const [scope, animate] = useAnimate();

  useEffect(() => {
    if (!scope.current) return;
    animate(
      scope.current,
      { 
        pathLength: progress, 
        opacity: isSelected ? 0.8 : 0.3 
      },
      { 
        duration: 2, 
        ease: "easeInOut" 
      }
    );
  }, [progress, isSelected, animate, scope]);

  return (
    <path
      ref={scope}
      d={d}
      fill="none"
      stroke={isSelected ? '#3B82F6' : '#60A5FA'}
      strokeWidth={strokeWidth}
      style={{ pathLength: 0, opacity: 0 }}
      className="pointer-events-none transition-all duration-500"
    />
  );
};

export const Map: React.FC<MapProps> = ({ flights, selectedFlightId, onSelectFlight, userLocation, preferences, activeAlerts }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [worldData, setWorldData] = useState<any>(null);
  const [transform, setTransform] = useState({ k: 1, x: 0, y: 0 });
  const [weatherData, setWeatherData] = useState<WeatherCell[]>([]);
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);
  const [airspaceData, setAirspaceData] = useState<AirspaceSector[]>([]);

  // Load weather data when layer is enabled
  useEffect(() => {
    if (preferences?.mapLayers?.weather && weatherData.length === 0 && !isWeatherLoading) {
      setIsWeatherLoading(true);
      getLiveWeatherOverlay().then(data => {
        setWeatherData(data);
        setIsWeatherLoading(false);
      });
    }
  }, [preferences?.mapLayers?.weather]);

  // Load airspace data
  useEffect(() => {
    if (preferences?.mapLayers?.airspace && airspaceData.length === 0) {
      getAirspaceSectors().then(setAirspaceData);
    }
  }, [preferences?.mapLayers?.airspace]);

  // Handle Resize
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Set up projection components
  const projection = useMemo(() => {
    return d3.geoNaturalEarth1()
      .scale(dimensions.width / 5)
      .translate([dimensions.width / 2, dimensions.height / 2]);
  }, [dimensions]);

  const pathGenerator = useMemo(() => d3.geoPath().projection(projection), [projection]);

  // Load static map data once
  useEffect(() => {
    d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json').then((data: any) => {
      setWorldData(topojson.feature(data, data.objects.countries));
    });
  }, []);

  // Handle Zoom logic (standard D3 zoom but applied to state for React rendering)
  const zoomBehavior = useMemo(() => {
    return d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 40]) // Extended range for closer inspection
      .tapDistance(40)     // Improved touch recognition
      .on('zoom', (event) => {
        setTransform(event.transform);
      });
  }, []);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    
    // Apply zoom behavior with improved gesture handling
    svg.call(zoomBehavior as any)
       .on('dblclick.zoom', null); // Disable double click zoom to allow for custom double-tap logic if needed
       
    // Ensure we prevent default browser gestures that might conflict
    svg.on('touchstart', (e) => {
      // If two fingers are used, we definitely want our zoom to handle it
      if (e.touches && e.touches.length > 1) {
        e.preventDefault();
      }
    }, { passive: false });

  }, [zoomBehavior, dimensions]);

  // Auto-center on selected flight
  useEffect(() => {
    if (!selectedFlightId || !projection || !svgRef.current) return;
    const flight = flights.find(f => f.id === selectedFlightId);
    if (!flight?.currentPosition) return;

    const [x, y] = projection([flight.currentPosition.lng, flight.currentPosition.lat]);
    const k = transform.k < 4 ? 6 : transform.k; // Deeper zoom for focus
    
    const transition = d3.select(svgRef.current)
      .transition()
      .duration(1000) // Slightly longer for smoother deceleration
      .ease(d3.easeCubicInOut);

    zoomBehavior.transform(transition as any, d3.zoomIdentity
      .translate(dimensions.width / 2, dimensions.height / 2)
      .scale(k)
      .translate(-x, -y));
  }, [selectedFlightId]); // Only re-run when selection changes

  const radarRotation = 0; // Handled by CSS or specific logic if needed, but keeping simple for now

  return (
    <div ref={containerRef} className="w-full h-full bg-[#030712] overflow-hidden relative border-b border-gray-800">
      <svg 
        ref={svgRef} 
        className="w-full h-full cursor-grab active:cursor-grabbing touch-none"
        style={{ touchAction: 'none' }}
      >
        <defs>
          <linearGradient id="radar-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity={0} />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.6} />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.k})`}>
          {/* Compass Rose (Tactical) */}
          <g transform={`translate(${dimensions.width/2}, ${dimensions.height/2}) scale(${1/transform.k})`}>
            <circle r="40" fill="none" stroke="#3B82F6" strokeWidth="0.5" strokeDasharray="1,2" opacity="0.1" />
            <circle r="60" fill="none" stroke="#3B82F6" strokeWidth="0.5" strokeDasharray="2,4" opacity="0.05" />
            {d3.range(0, 360, 45).map(deg => (
              <line
                key={deg}
                x1="0" y1="-65" x2="0" y2="-70"
                stroke="#3B82F6" strokeWidth="1" opacity="0.2"
                transform={`rotate(${deg})`}
              />
            ))}
          </g>

          {/* Static Map Layer */}
          {worldData && (
            <g className="map-base">
              {worldData.features.map((feature: any, i: number) => (
                <path
                  key={`country-${i}`}
                  d={pathGenerator(feature) || ''}
                  fill="#111827"
                  stroke="#1f2937"
                  strokeWidth={0.5 / transform.k}
                />
              ))}
              <path
                d={pathGenerator(d3.geoGraticule().step([10, 10])() as any) || ''}
                fill="none"
                stroke="#3B82F6"
                strokeWidth={0.2 / transform.k}
                opacity={0.1}
              />
            </g>
          )}

          {/* Weather Radar Layer */}
          {preferences?.mapLayers?.weather && (
            <g className="weather-layer">
               <AnimatePresence mode="popLayout">
                 {weatherData.map((cell) => {
                   const pos = projection([cell.lng, cell.lat]);
                   if (!pos) return null;
                   
                   const r = projection([cell.lng + cell.radius, cell.lat])?.[0];
                   const radiusInPixels = r ? Math.abs(r - pos[0]) : 20;

                   return (
                     <motion.g 
                       key={cell.id} 
                       initial={{ opacity: 0, scale: 0 }}
                       animate={{ opacity: 0.4, scale: 1 }}
                       exit={{ opacity: 0, scale: 0 }}
                     >
                        <circle 
                          cx={pos[0]} 
                          cy={pos[1]} 
                          r={radiusInPixels}
                          fill={cell.type === 'storm' ? '#9333ea' : '#10b981'}
                          filter="blur(10px)"
                        />
                        <motion.circle
                          cx={pos[0]} 
                          cy={pos[1]} 
                          r={radiusInPixels}
                          fill="none"
                          stroke={cell.type === 'storm' ? '#a855f7' : '#34d399'}
                          strokeWidth={1 / transform.k}
                          animate={{ 
                            r: [radiusInPixels, radiusInPixels * 1.1, radiusInPixels],
                            opacity: [0.3, 0.6, 0.3]
                          }}
                          transition={{ 
                            duration: 3, 
                            repeat: Infinity,
                            delay: Math.random() * 2
                          }}
                        />
                     </motion.g>
                   );
                 })}
               </AnimatePresence>
            </g>
          )}

          {/* Airspace Layer */}
          {preferences?.mapLayers?.airspace && (
            <g className="airspace-layer">
               {airspaceData.map((sector) => {
                 const pos = projection([sector.center.lng, sector.center.lat]);
                 if (!pos) return null;
                 
                 // Draw a tactical octagonal boundary
                 const radius = 60 / transform.k;
                 const points = [];
                 for (let i = 0; i < 8; i++) {
                   const angle = (i * Math.PI) / 4;
                   points.push([
                     pos[0] + radius * Math.cos(angle),
                     pos[1] + radius * Math.sin(angle)
                   ]);
                 }
                 const polyD = `M ${points.map(p => p.join(',')).join(' L ')} Z `;

                 return (
                   <g key={sector.id}>
                     <path 
                       d={polyD}
                       fill="none"
                       stroke="#3B82F6"
                       strokeWidth={1 / transform.k}
                       strokeDasharray="2,2"
                       opacity={0.3}
                     />
                     <text
                       x={pos[0]}
                       y={pos[1] - radius - (5 / transform.k)}
                       fill="#3B82F6"
                       fontSize={8 / transform.k}
                       fontFamily="monospace"
                       textAnchor="middle"
                       opacity={0.6}
                     >
                       {sector.id}
                     </text>
                   </g>
                 );
               })}
            </g>
          )}

          {/* Dynamic Flights Layer */}
          <g className="flights">
            <AnimatePresence>
              {flights.filter(f => f.currentPosition).map(flight => {
                const isSelected = flight.id === selectedFlightId;
                const pos = projection([flight.currentPosition!.lng, flight.currentPosition!.lat]);
                if (!pos) return null;

                // For trajectories, we still use D3 interpolators but render via React
                const origin = [flight.origin.lng, flight.origin.lat] as [number, number];
                const dest = [flight.destination.lng, flight.destination.lat] as [number, number];
                const hasRoute = flight.origin.lat !== flight.destination.lat;
                
                let flightPathFullD = '';
                if (hasRoute) {
                   const interpolator = d3.geoInterpolate(origin, dest);
                   // Create a smooth arc with more points for the full trajectory
                   const points = d3.range(0, 1.01, 0.02).map(t => interpolator(t));
                   flightPathFullD = pathGenerator({ type: 'LineString', coordinates: points }) || '';
                }

                const progress = (flight.progress || 0) / 100;

                return (
                  <React.Fragment key={flight.id}>
                    {/* Path Line - Background (Projected) */}
                    {hasRoute && (
                      <motion.path
                        initial={{ opacity: 0 }}
                        animate={{ opacity: isSelected ? 0.3 : 0.1 }}
                        d={flightPathFullD}
                        fill="none"
                        stroke={isSelected ? '#3B82F6' : '#4B5563'}
                        strokeWidth={isSelected ? 1 / transform.k : 0.5 / transform.k}
                        strokeDasharray={isSelected ? "4,4" : "2,2"}
                        transition={{ duration: 0.5 }}
                      />
                    )}

                    {/* Path Line - Foreground (Traversed) */}
                    {hasRoute && (
                      <TraversedPath 
                        d={flightPathFullD}
                        progress={progress}
                        isSelected={isSelected}
                        strokeWidth={isSelected ? 2 / transform.k : 1 / transform.k}
                      />
                    )}

                    {/* Aircraft Icon */}
                    <motion.g
                      layoutId={`plane-${flight.id}`}
                      initial={false}
                      animate={{ 
                        x: pos[0], 
                        y: pos[1], 
                        rotate: flight.currentPosition!.heading 
                      }}
                      transition={{ 
                        type: 'spring', 
                        stiffness: 40, // Low stiffness for "gliding" feel
                        damping: 15,
                        mass: 0.8
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectFlight(flight.id);
                      }}
                      className="cursor-pointer"
                    >
                      {activeAlerts.has(flight.id) && (
                         <motion.circle
                           initial={{ r: 8 / transform.k, opacity: 1 }}
                           animate={{ 
                             r: [8 / transform.k, 25 / transform.k, 8 / transform.k],
                             opacity: [1, 0, 1]
                           }}
                           transition={{ repeat: Infinity, duration: 1.2 }}
                           fill="none"
                           stroke="#ef4444"
                           strokeWidth={2 / transform.k}
                         />
                      )}

                      {isSelected && (
                         <motion.circle
                           initial={{ r: 5 / transform.k, opacity: 0.5 }}
                           animate={{ 
                             r: [5 / transform.k, 15 / transform.k, 5 / transform.k],
                             opacity: [0.5, 0.2, 0.5]
                           }}
                           transition={{ repeat: Infinity, duration: 2 }}
                           fill="none"
                           stroke="#3B82F6"
                           strokeWidth={1 / transform.k}
                         />
                      )}
                      
                      <path
                        d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"
                        fill={isSelected ? '#3B82F6' : '#fff'}
                        filter={isSelected ? "url(#glow)" : ""}
                        transform={`scale(${0.8 / transform.k}) translate(-12, -12)`}
                        className="transition-colors duration-300"
                      />
                    </motion.g>
                  </React.Fragment>
                );
              })}
            </AnimatePresence>
          </g>

          {/* User Location Marker */}
          {userLocation && (
            <motion.g
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              x={projection([userLocation.lng, userLocation.lat])?.[0] || 0}
              y={projection([userLocation.lng, userLocation.lat])?.[1] || 0}
            >
              <circle r={4 / transform.k} fill="#EF4444" stroke="#fff" strokeWidth={1 / transform.k} />
              <motion.circle 
                r={10 / transform.k} 
                fill="#EF4444" 
                initial={{ opacity: 0.3 }}
                animate={{ r: [5 / transform.k, 15 / transform.k], opacity: [0.3, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
              />
            </motion.g>
          )}
        </g>
      </svg>

      {/* Flight Detail Overlay (Tactical View) */}
      <AnimatePresence>
        {selectedFlightId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-4 right-4 bg-black/80 backdrop-blur-xl border border-blue-500/30 p-4 rounded-lg shadow-[0_0_50px_rgba(37,99,235,0.2)] z-50 w-64 pointer-events-none"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-xl font-bold text-white tracking-tighter italic">
                  {flights.find(f => f.id === selectedFlightId)?.flightNumber}
                </h3>
                <p className="text-[10px] font-mono text-blue-400">TRACKING_ACTIVE</p>
              </div>
              <div className="bg-blue-500/20 px-2 py-1 rounded">
                <span className="text-[10px] font-mono text-blue-400">FLIGHT_LVL: {flights.find(f => f.id === selectedFlightId)?.altitude}</span>
              </div>
            </div>
            
            <div className="space-y-2 mt-4">
               <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-gray-500">SPD</span>
                  <span className="text-white">{flights.find(f => f.id === selectedFlightId)?.speed} KT</span>
               </div>
               <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-gray-500">HDG</span>
                  <span className="text-white">{flights.find(f => f.id === selectedFlightId)?.currentPosition?.heading}°</span>
               </div>
               <div className="w-full h-[1px] bg-gray-800" />
               <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-gray-500">ORIG</span>
                  <span className="text-white">{flights.find(f => f.id === selectedFlightId)?.origin.code}</span>
               </div>
               <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-gray-500">DEST</span>
                  <span className="text-white">{flights.find(f => f.id === selectedFlightId)?.destination.code}</span>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Radar Overlay Scan (Pure CSS animation for zero JS overhead) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
         <div className="w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1)_0%,transparent_70%)]" />
         <div className="absolute top-1/2 left-1/2 w-[200vw] h-[200vh] -translate-x-1/2 -translate-y-1/2 rounded-full border border-blue-500/10" />
      </div>

      <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md p-3 border border-gray-800 rounded-sm text-[10px] font-mono text-blue-400/80 shadow-2xl">
        <div className="flex items-center gap-2 mb-1 text-gray-500">
           <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
           <span className="tracking-widest">SYSTEM_LINK_ACTIVE</span>
        </div>
        COORD: {selectedFlightId ? (
          <>
            {flights.find(f => f.id === selectedFlightId)?.currentPosition?.lat.toFixed(4)} / {flights.find(f => f.id === selectedFlightId)?.currentPosition?.lng.toFixed(4)}
          </>
        ) : 'WAITING_FOR_LOCK'}
        
        {isWeatherLoading && (
          <div className="mt-2 flex items-center gap-2 text-[8px] text-blue-500 animate-pulse">
             <RefreshCw className="w-2 h-2 animate-spin" />
             <span>FETCHING_WEATHER_DATA...</span>
          </div>
        )}

        <div className="mt-1 h-1 w-full bg-gray-900 rounded-full overflow-hidden">
           <motion.div 
             animate={{ width: ['0%', '100%'] }}
             transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 4 }}
             className="h-full bg-blue-500/50"
           />
        </div>
      </div>
    </div>
  );
};

