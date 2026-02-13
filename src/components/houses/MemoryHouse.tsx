import React, { useState, useEffect, useRef } from 'react';
import { Scroll, Database, Clock, Hash, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';

// Visual Effect: Digital Rain
const MatrixRain = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        if(!canvas) return;
        const ctx = canvas.getContext('2d');
        if(!ctx) return;
        
        canvas.width = canvas.parentElement?.clientWidth || 300;
        canvas.height = canvas.parentElement?.clientHeight || 600;

        const letters = "010101XYZA";
        const fontSize = 12;
        const columns = canvas.width / fontSize;
        const drops: number[] = [];
        for(let x=0; x<columns; x++) drops[x] = 1;

        const draw = () => {
            ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "#10b981"; // Emerald Green
            ctx.font = fontSize + "px monospace";
            for(let i=0; i<drops.length; i++) {
                const text = letters.charAt(Math.floor(Math.random()*letters.length));
                ctx.fillText(text, i*fontSize, drops[i]*fontSize);
                if(drops[i]*fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
                drops[i]++;
            }
        };
        const interval = setInterval(draw, 50);
        return () => clearInterval(interval);
    }, []);
    return <canvas ref={canvasRef} className="absolute inset-0 opacity-10 pointer-events-none" />;
};

// Mock Data for "Chronicle"
const MEMORIES = [
    { id: 'm1', time: '10:42:01', date: '2023-10-24', title: 'System Initialization', type: 'system', details: 'Kernel booted successfully. Loaded 5 modules into active memory.' },
    { id: 'm2', time: '10:45:15', date: '2023-10-24', title: 'User Login', type: 'user', details: 'User authenticated via local gateway token. Session established.' },
    { id: 'm3', time: '11:02:33', date: '2023-10-24', title: 'Python Env Setup', type: 'agent', details: 'Sandboxed environment prepared. Installed numpy, pandas from local cache.' },
    { id: 'm4', time: '11:20:00', date: '2023-10-24', title: 'Task Execution', type: 'agent', details: 'Executed "scrape_weather.py". Returned 200 OK with 15kb of data.' },
    { id: 'm5', time: '12:15:00', date: '2023-10-24', title: 'Memory Optimization', type: 'system', details: 'Garbage collection run. Freed 45MB of heap space.' },
];

export const MemoryHouse: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedMemory = MEMORIES.find(m => m.id === selectedId);

  return (
    <div className="w-full h-full p-6 flex flex-col bg-gray-950 text-white overflow-hidden relative">
      <MatrixRain />
      
      {/* Header */}
      <div className="relative z-10 flex justify-between items-center mb-6 border-b border-gray-800 pb-4">
          <h2 className="text-3xl font-bold font-mono text-emerald-400 flex items-center gap-3 drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]">
            <Scroll size={32} /> MEMORY CHRONICLE
          </h2>
          <div className="text-right">
             <div className="text-xs font-mono text-gray-500">ANIMUS.V2</div>
             <div className="text-xl font-bold font-mono text-white">SYNCED</div>
          </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden relative z-10">
          
          {/* Left Column: Timeline */}
          <div className="w-1/3 h-full overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-emerald-900 scrollbar-track-transparent border-r border-white/5 relative">
             {/* Timeline Line */}
             <div className="absolute top-0 bottom-0 left-[19px] w-[2px] bg-gradient-to-b from-transparent via-emerald-500/30 to-transparent" />
             
             <div className="space-y-6 py-4 pl-1">
                 {MEMORIES.map((mem) => (
                     <motion.div 
                        key={mem.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={() => setSelectedId(mem.id)}
                        className={clsx(
                            "relative pl-10 pr-4 py-4 rounded-r-xl cursor-pointer transition-all duration-300 border-l-2 group",
                            selectedId === mem.id 
                                ? "bg-emerald-900/20 border-emerald-400" 
                                : "bg-transparent border-transparent hover:bg-white/5"
                        )}
                     >
                         {/* Timeline Dot */}
                         <div className={clsx(
                             "absolute left-[14px] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 transition-all shadow-[0_0_10px_currentColor]",
                             selectedId === mem.id ? "bg-emerald-400 border-white scale-110" : "bg-gray-900 border-emerald-800 group-hover:border-emerald-500"
                         )} />

                         <div className="flex justify-between items-start mb-1">
                             <span className="text-xs font-mono text-emerald-500/80">{mem.time}</span>
                             <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wide">{mem.type}</span>
                         </div>
                         <div className={clsx("font-bold text-sm", selectedId === mem.id ? "text-white" : "text-gray-400")}>
                             {mem.title}
                         </div>
                     </motion.div>
                 ))}
             </div>
          </div>

          {/* Right Column: Detail View (Glass Card) */}
          <div className="flex-1 relative flex items-center justify-center">
             <AnimatePresence mode="wait">
                 {selectedMemory ? (
                     <motion.div
                        key={selectedMemory.id}
                        initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
                        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                        exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
                        transition={{ duration: 0.3 }}
                        className="w-full max-w-lg bg-gray-900/60 backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-8 shadow-2xl relative overflow-hidden"
                     >
                         {/* Glow Blob */}
                         <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                         
                         <div className="flex items-center gap-4 mb-6">
                             <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/30 text-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.1)]">
                                 <Hash size={32} />
                             </div>
                             <div>
                                 <h1 className="text-2xl font-bold text-white">{selectedMemory.title}</h1>
                                 <div className="text-xs font-mono text-emerald-500 flex items-center gap-2 mt-1">
                                     <Clock size={12} /> {selectedMemory.date} {selectedMemory.time}
                                 </div>
                             </div>
                         </div>

                         <div className="space-y-4">
                             <div className="p-5 bg-black/40 rounded-lg border border-white/5 text-sm text-gray-300 font-mono leading-relaxed">
                                 {selectedMemory.details}
                             </div>
                             
                             <div className="grid grid-cols-2 gap-4">
                                 <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                                     <div className="text-[10px] text-gray-500 uppercase mb-1">Index ID</div>
                                     <div className="text-sm font-mono text-white">0x{selectedMemory.id.toUpperCase()}F2A</div>
                                 </div>
                                 <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                                     <div className="text-[10px] text-gray-500 uppercase mb-1">Source</div>
                                     <div className="text-sm font-mono text-white">VECTOR_DB_SHARD_1</div>
                                 </div>
                             </div>
                         </div>
                         
                         <div className="mt-8 flex justify-end">
                             <button className="flex items-center gap-2 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors uppercase tracking-widest border border-emerald-500/30 px-4 py-2 rounded hover:bg-emerald-500/10">
                                 Retrieve Raw Data <ChevronRight size={14} />
                             </button>
                         </div>
                     </motion.div>
                 ) : (
                     <div className="text-center opacity-30 select-none">
                         <Database size={64} className="mx-auto mb-4 text-emerald-900" />
                         <p className="font-mono text-emerald-700 tracking-widest">SELECT DATA FRAGMENT</p>
                     </div>
                 )}
             </AnimatePresence>
          </div>
      </div>
    </div>
  );
};