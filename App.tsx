import React, { useEffect } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { HUD } from './components/HUD';
import { openClawService } from './services/OpenClawService';
import { useGameStore } from './store';

function App() {
  const { connectionStatus } = useGameStore();

  // Initial connection attempt or setup
  useEffect(() => {
    // We don't auto-connect without a token, but we could initialize simulations
    // For now, we wait for user to input settings
  }, []);

  return (
    <div className="relative w-screen h-screen bg-gray-900 overflow-hidden font-sans select-none">
       {/* Background Grid/Effect could go here */}
       
       {/* Main Game Layer */}
       <div className="absolute inset-0 z-0">
         <GameCanvas />
       </div>

       {/* UI Layer */}
       <div className="absolute inset-0 z-10 pointer-events-none">
         <HUD />
       </div>
       
       {/* Introduction / Startup Overlay if needed */}
       {connectionStatus === 'disconnected' && (
         <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none">
            <div className="bg-blue-600/90 text-white px-4 py-1 rounded-full text-xs font-bold shadow-lg backdrop-blur">
              Click Settings to Configure Connection
            </div>
         </div>
       )}
    </div>
  );
}

export default App;
