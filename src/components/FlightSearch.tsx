import React, { useState } from 'react';
import { Search as SearchIcon, Loader2, Sparkles, X } from 'lucide-react';

interface FlightSearchProps {
  onSearch: (query: string) => void;
  onClear: () => void;
  isSearching: boolean;
}

export const FlightSearch: React.FC<FlightSearchProps> = ({ onSearch, onClear, isSearching }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
    }
  };

  const handleClear = () => {
    setQuery('');
    onClear();
  };

  return (
    <form onSubmit={handleSubmit} className="relative group">
      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
        {isSearching ? (
          <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
        ) : (
          <SearchIcon className="w-5 h-5 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
        )}
      </div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Enter flight #, airport, or natural language query..."
        className="w-full bg-black/40 border border-gray-800 rounded py-4 pl-12 pr-32 text-base font-black tracking-tight text-white placeholder-gray-700 shadow-inner focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all"
      />
      <div className="absolute inset-y-0 right-4 flex items-center gap-2">
        {query && !isSearching && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1.5 rounded hover:bg-white/5 text-gray-500 hover:text-white transition-colors"
            title="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <button
          type="submit"
          disabled={isSearching || !query.trim()}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded shadow-lg transition-all active:scale-95"
        >
          Track
        </button>
      </div>
    </form>
  );
};
