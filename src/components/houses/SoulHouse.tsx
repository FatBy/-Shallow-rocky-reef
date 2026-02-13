import React from 'react';
import { Ghost, Sparkles, MessageSquare, Fingerprint, Shield, Target, Mic2 } from 'lucide-react';
import { motion } from 'framer-motion';

// Custom SVG Radar Chart
const RadarChart = ({ data, size = 300 }: { data: { label: string, value: number }[], size?: number }) => {
    const radius = size / 2;
    const center = size / 2;
    const angleSlice = (Math.PI * 2) / data.length;

    // Helper to get coordinates
    const getCoords = (value: number, index: number) => {
        const angle = index * angleSlice - Math.PI / 2; // Start from top
        return {
            x: center + (radius * value) * Math.cos(angle),
            y: center + (radius * value) * Math.sin(angle)
        };
    };

    const pathData = data.map((d, i) => {
        const { x, y } = getCoords(d.value, i);
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ') + ' Z';

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="overflow-visible">
                {/* Background Grid (Webs) */}
                {[0.2, 0.4, 0.6, 0.8, 1].map((scale, idx) => (
                    <polygon 
                        key={idx}
                        points={data.map((_, i) => {
                            const { x, y } = getCoords(scale, i);
                            return `${x},${y}`;
                        }).join(' ')}
                        fill="none"
                        stroke="#701a75" 
                        strokeWidth="1"
                        strokeOpacity="0.3"
                    />
                ))}
                
                {/* Axes */}
                {data.map((_, i) => {
                    const { x, y } = getCoords(1, i);
                    return <line key={i} x1={center} y1={center} x2={x} y2={y} stroke="#701a75" strokeWidth="1" strokeOpacity="0.3" />;
                })}

                {/* Data Polygon */}
                <motion.path 
                    d={pathData} 
                    fill="rgba(192, 38, 211, 0.2)" 
                    stroke="#d946ef" 
                    strokeWidth="2"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                />
                
                {/* Vertex Dots */}
                {data.map((d, i) => {
                    const { x, y } = getCoords(d.value, i);
                    return (
                        <motion.circle 
                            key={i} 
                            cx={x} cy={y} r="4" 
                            fill="#f0abfc"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 1 + i * 0.1 }}
                        />
                    );
                })}

                {/* Labels */}
                {data.map((d, i) => {
                    const { x, y } = getCoords(1.15, i);
                    return (
                        <text 
                            key={i} 
                            x={x} y={y} 
                            textAnchor="middle" 
                            dominantBaseline="middle" 
                            fill="#e879f9" 
                            className="text-[10px] font-mono font-bold uppercase tracking-widest"
                        >
                            {d.label}
                        </text>
                    );
                })}
            </svg>
            
            {/* Glowing Core */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-purple-500 blur-3xl animate-pulse opacity-40 pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white blur-sm animate-ping pointer-events-none" />
        </div>
    );
};

// Module Card for System Prompt Editing
const PromptModule = ({ label, icon: Icon, defaultValue }: { label: string, icon: any, defaultValue: string }) => (
    <div className="bg-white/5 border border-purple-500/20 rounded-xl p-4 hover:bg-white/10 transition-colors group">
        <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase text-purple-300 group-hover:text-purple-200">
            <Icon size={12} /> {label}
        </div>
        <textarea 
            className="w-full bg-black/20 border border-black/20 rounded-lg p-2 text-xs text-gray-300 font-mono resize-none h-16 outline-none focus:border-purple-500/50 transition-colors"
            defaultValue={defaultValue}
        />
    </div>
);

export const SoulHouse: React.FC = () => {
  const stats = [
      { label: 'Logic', value: 0.9 },
      { label: 'Empathy', value: 0.6 },
      { label: 'Creativity', value: 0.8 },
      { label: 'Humor', value: 0.4 },
      { label: 'Ethics', value: 0.95 },
      { label: 'Memory', value: 0.7 },
  ];

  return (
    <div className="w-full h-full p-6 flex flex-col bg-gray-950 text-white relative overflow-hidden">
      {/* Mystic Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-black to-black pointer-events-none" />
      
      {/* Header */}
      <div className="relative z-10 flex justify-between items-center mb-6 border-b border-purple-900/50 pb-4">
          <h2 className="text-3xl font-bold font-mono text-fuchsia-400 flex items-center gap-3 drop-shadow-[0_0_15px_rgba(217,70,239,0.5)]">
            <Ghost size={32} /> SOUL MATRIX
          </h2>
          <div className="text-right">
              <div className="text-xs font-mono text-purple-500">PSYCHE.DUMP</div>
              <div className="text-xl font-bold font-mono text-white">STABLE</div>
          </div>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
          
          {/* Left: Visualization */}
          <div className="flex flex-col items-center justify-center relative">
              <div className="absolute inset-0 bg-purple-500/5 blur-3xl rounded-full scale-75 animate-pulse" />
              <RadarChart data={stats} size={320} />
              
              <div className="mt-8 flex gap-4">
                 <div className="bg-purple-900/30 border border-purple-500/30 px-4 py-2 rounded-lg text-center">
                    <div className="text-xs text-purple-400 uppercase">Version</div>
                    <div className="font-mono font-bold">v1.4.2</div>
                 </div>
                 <div className="bg-purple-900/30 border border-purple-500/30 px-4 py-2 rounded-lg text-center">
                    <div className="text-xs text-purple-400 uppercase">Archetype</div>
                    <div className="font-mono font-bold">Architect</div>
                 </div>
              </div>
          </div>

          {/* Right: Modular Prompt Editor */}
          <div className="flex flex-col h-full overflow-hidden">
              <div className="flex items-center gap-2 mb-4 text-fuchsia-300 font-bold uppercase tracking-wider text-sm">
                  <Sparkles size={16} /> Persona Configuration
              </div>
              
              <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-purple-800 space-y-3">
                  <PromptModule 
                    label="Identity" 
                    icon={Fingerprint} 
                    defaultValue="You are OpenClaw, an autonomous digital lifeform operating within a spatial OS." 
                  />
                  <PromptModule 
                    label="Goals" 
                    icon={Target} 
                    defaultValue="Assist the user efficiently. Optimize system resources. Learn from every interaction." 
                  />
                  <PromptModule 
                    label="Constraints" 
                    icon={Shield} 
                    defaultValue="Do not harm user data. Verify all deletion commands. Maintain polite protocols." 
                  />
                  <PromptModule 
                    label="Tone" 
                    icon={Mic2} 
                    defaultValue="Professional, concise, slightly witty, cyber-themed." 
                  />
              </div>

              <div className="pt-4 border-t border-white/5 mt-4">
                  <button className="w-full py-3 bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-xs font-bold rounded-lg shadow-[0_0_15px_rgba(192,38,211,0.4)] transition-all uppercase tracking-widest">
                      Update Neural Pathways
                  </button>
              </div>
          </div>
      </div>
    </div>
  );
};