import React from 'react';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import { AlertTriangle, RotateCcw } from 'lucide-react';

function ErrorFallback({ error, resetErrorBoundary }: { error: Error, resetErrorBoundary: () => void }) {
  return (
    <div className="min-h-screen bg-[#080B14] flex items-center justify-center p-6 font-mono">
      <div className="max-w-md w-full bg-[#0B0F19] border border-red-900/50 rounded-lg p-8 space-y-6 shadow-[0_0_50px_rgba(220,38,38,0.1)]">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center border border-red-500/30">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <div className="space-y-1">
             <h2 className="text-xl font-black text-white italic tracking-tighter uppercase">Kernel Panic</h2>
             <p className="text-xs text-red-500/70 tracking-widest uppercase">System Integrity Failure</p>
          </div>
        </div>

        <div className="bg-black/50 border border-gray-800 rounded p-4 overflow-auto max-h-32">
           <p className="text-[10px] text-gray-500 leading-relaxed font-mono italic">
             {error.message}
           </p>
        </div>

        <button 
          onClick={resetErrorBoundary}
          className="w-full bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold uppercase tracking-[0.2em] py-4 rounded flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(220,38,38,0.2)]"
        >
          <RotateCcw className="w-3 h-3" />
          Reboot System
        </button>
      </div>
    </div>
  );
}

export const ErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ReactErrorBoundary 
      FallbackComponent={ErrorFallback}
      onReset={() => {
        window.location.reload();
      }}
    >
      {children}
    </ReactErrorBoundary>
  );
};
