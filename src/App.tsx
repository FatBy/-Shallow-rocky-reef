import React, { useEffect } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { Dock } from './components/Dock';
import { TopBar } from './components/TopBar';
import { useGameStore } from './store';
import { HOUSES } from './houses/registry';
import { INITIAL_SKILLS } from './constants';
import { AnimatePresence, motion } from 'framer-motion';

function App() {
  const { currentView, skills } = useGameStore();
  
  // STATE MIGRATION:
  // Detect if the store is holding old "Tool" skills (like browser, gmail) 
  // instead of the new "House" skills (skills, memory, tasks, soul).
  // If so, force a reset to the new configuration.
  useEffect(() => {
    const hasOldSkills = skills.some(s => ['browser', 'gmail', 'fs', 'terminal', 'python'].includes(s.id));
    // Also check if we are missing any of the core new houses
    const missingNewHouses = !skills.some(s => s.id === 'soul');
    
    if (hasOldSkills || missingNewHouses) {
      console.log("Migration: Updating World State to Digital Lifeform Architecture...");
      useGameStore.setState({ skills: INITIAL_SKILLS });
    }
  }, [skills]);

  // Find current component based on ID in the Registry
  const activeHouse = HOUSES.find(h => h.id === currentView);
  const ActiveComponent = activeHouse?.component;

  return (
    <div className="relative w-screen h-screen bg-gray-950 overflow-hidden font-sans select-none text-white">
       
       {/* Background Layer: GameCanvas always renders to maintain connection/state */}
       <div className="absolute inset-0 z-0">
         <GameCanvas />
         
         {/* Blur Overlay when not in World view */}
         <AnimatePresence>
           {currentView !== 'world' && (
             <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0 bg-gray-950/80 backdrop-blur-md z-10"
             />
           )}
         </AnimatePresence>
       </div>

       {/* Top Status Bar */}
       <TopBar />

       {/* Main Content Area (Modal for non-world views) */}
       <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center p-6 pb-28">
          <AnimatePresence mode="wait">
             {currentView !== 'world' && ActiveComponent && (
                <motion.div 
                   key={currentView}
                   initial={{ opacity: 0, scale: 0.95, y: 20, filter: 'blur(10px)' }}
                   animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
                   exit={{ opacity: 0, scale: 1.05, y: -20, filter: 'blur(10px)' }}
                   transition={{ type: "spring", stiffness: 200, damping: 25 }}
                   className="pointer-events-auto w-full max-w-6xl h-full max-h-[85vh] bg-black/40 border border-white/5 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-2xl"
                >
                   <ActiveComponent />
                </motion.div>
             )}
          </AnimatePresence>
       </div>

       {/* Bottom Dock */}
       <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
          <Dock />
       </div>
    </div>
  );
}

export default App;