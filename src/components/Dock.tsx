import React from 'react';
import { useGameStore } from '../store';
import { HOUSES } from '../houses/registry';
import { motion } from 'framer-motion';
import { HouseId } from '../types';

export const Dock: React.FC = () => {
  const { currentView, setCurrentView } = useGameStore();

  return (
    <div className="flex gap-4 p-3 bg-white/5 border border-white/10 rounded-full backdrop-blur-xl shadow-2xl">
      {HOUSES.map((house) => {
        const Icon = house.icon;
        const isActive = currentView === house.id;
        
        return (
          <button
            key={house.id}
            onClick={() => setCurrentView(house.id as HouseId)}
            className={`relative p-3 rounded-full transition-all duration-300 group ${
              isActive ? 'bg-white/10 text-white scale-110 shadow-[0_0_15px_rgba(255,255,255,0.2)]' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Icon size={24} />
            
            {/* Tooltip */}
            <span className="absolute -top-12 left-1/2 -translate-x-1/2 bg-black/80 border border-white/10 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none backdrop-blur-md">
              {house.name}
            </span>

            {isActive && (
              <motion.div 
                layoutId="active-dot"
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full shadow-[0_0_5px_white]"
              />
            )}
          </button>
        );
      })}
    </div>
  );
};