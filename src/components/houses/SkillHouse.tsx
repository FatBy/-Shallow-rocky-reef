import React, { useMemo } from 'react';
import { useGameStore } from '../../store';
import { Brain, Globe, HardDrive, Code, Terminal, Mail, Cpu, Box, Database, Cloud, Lock, Zap, Share2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { MAP_SIZE } from '../../constants';

const IconMap: any = { Globe, HardDrive, Code, Terminal, Mail, Cpu, Brain, Box, Database, Cloud, Lock };

export const SkillHouse: React.FC = () => {
  const { skills } = useGameStore();
  const sortedSkills = useMemo(() => [...skills].sort((a, b) => a.x - b.x), [skills]);
  const normalize = (val: number) => 15 + (val / MAP_SIZE) * 70;
  
  const connections = useMemo(() => {
    const lines: {x1: number, y1: number, x2: number, y2: number, id: string}[] = [];
    sortedSkills.forEach((s1, i) => {
         if (i < 2) lines.push({ x1: 50, y1: 50, x2: normalize(s1.x), y2: normalize(s1.y), id: `core-${s1.id}` });
         const nextSkill = sortedSkills.find((s, idx) => idx > i && s.x > s1.x);
         if (nextSkill) {
             lines.push({ x1: normalize(s1.x), y1: normalize(s1.y), x2: normalize(nextSkill.x), y2: normalize(nextSkill.y), id: `${s1.id}-${nextSkill.id}` });
         }
    });
    return lines;
  }, [sortedSkills]);

  return (
    <div className="w-full h-full p-8 flex flex-col bg-gray-950 text-white overflow-hidden relative selection:bg-cyan-500/30">
      <div className="absolute inset-0 pointer-events-none opacity-20" style={{ backgroundImage: `linear-gradient(to right, #083344 1px, transparent 1px), linear-gradient(to bottom, #083344 1px, transparent 1px)`, backgroundSize: '40px 40px', maskImage: 'radial-gradient(circle at center, black 40%, transparent 100%)' }} />
      <div className="relative z-10 flex justify-between items-center mb-6 border-b border-cyan-900/50 pb-4">
          <h2 className="text-3xl font-bold font-mono text-cyan-400 flex items-center gap-3 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]"><Share2 size={32} /> NEURAL LINK</h2>
          <div className="text-right"><div className="text-xs font-mono text-cyan-600 tracking-widest">DAG.VISUALIZER</div><div className="text-xl font-bold font-mono text-white flex items-center gap-2 justify-end"><span className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" /> ONLINE</div></div>
      </div>
      <div className="flex-1 relative rounded-xl bg-black/40 shadow-inner border border-cyan-900/30 overflow-hidden backdrop-blur-sm">
         <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
             <defs><linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#0e7490" stopOpacity="0.05" /><stop offset="50%" stopColor="#06b6d4" stopOpacity="0.8" /><stop offset="100%" stopColor="#0e7490" stopOpacity="0.05" /></linearGradient></defs>
             {connections.map((line, i) => {
                 const dist = Math.sqrt(Math.pow(line.x2 - line.x1, 2) + Math.pow(line.y2 - line.y1, 2));
                 const cpOffset = dist * 0.5;
                 const d = `M ${line.x1}% ${line.y1}% C ${line.x1 + cpOffset/2}% ${line.y1}%, ${line.x2 - cpOffset/2}% ${line.y2}%, ${line.x2}% ${line.y2}%`;
                 return (<g key={line.id}><path d={d} fill="none" stroke="#164e63" strokeWidth="1" strokeOpacity="0.5" /><motion.path d={d} fill="none" stroke="url(#lineGradient)" strokeWidth="2" initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 2.5, repeat: Infinity, repeatType: "loop", ease: "linear", delay: i * 0.3 }} /></g>)
             })}
         </svg>
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0"><div className="w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-3xl animate-pulse" /></div>
         {sortedSkills.map((skill, i) => {
             const Icon = IconMap[skill.iconName] || Box;
             const left = normalize(skill.x);
             const top = normalize(skill.y);
             const isEnabled = skill.enabled;
             return (
                 <motion.div key={skill.id} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: i * 0.1, type: "spring" }} className="absolute z-20" style={{ left: `${left}%`, top: `${top}%` }}>
                     <div className="relative group -translate-x-1/2 -translate-y-1/2">
                         <div className={`w-16 h-16 flex items-center justify-center transition-all duration-300 relative clip-hexagon ${isEnabled ? 'bg-gray-900 text-cyan-400 drop-shadow-[0_0_15px_rgba(6,182,212,0.6)]' : 'bg-gray-900/50 text-gray-600 grayscale'}`} style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}>
                            <div className="absolute inset-[2px] bg-gray-950 z-10" style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }} /><div className={`absolute inset-0 z-0 ${isEnabled ? 'bg-cyan-500' : 'bg-gray-800'}`} /><div className="relative z-20">{isEnabled ? <Icon size={24} /> : <Lock size={20} />}</div>
                         </div>
                         {isEnabled && (<div className="absolute inset-[-4px] border-2 border-cyan-500/30 rounded-full animate-ping pointer-events-none" />)}
                         <div className="absolute top-full mt-4 left-1/2 -translate-x-1/2 w-52 bg-gray-900/90 border border-cyan-500/30 text-white p-4 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50 scale-95 group-hover:scale-100 backdrop-blur-xl shadow-2xl">
                             <div className="text-[10px] font-mono text-cyan-500 mb-1 tracking-widest">MODULE: {skill.id.toUpperCase()}</div><div className="font-bold text-base mb-1 text-white">{skill.name}</div><div className="text-xs text-gray-400 leading-relaxed">{skill.description}</div><div className="mt-3 flex items-center gap-1 text-[10px] font-mono border-t border-white/10 pt-2"><Zap size={10} className={isEnabled ? "text-green-400" : "text-gray-600"} /> <span className={isEnabled ? "text-green-400" : "text-gray-500"}>{isEnabled ? 'SYSTEM ONLINE' : 'OFFLINE'}</span></div>
                         </div>
                         <div className={`absolute top-16 left-1/2 -translate-x-1/2 text-[10px] font-bold tracking-wider mt-2 whitespace-nowrap px-2 py-0.5 rounded ${isEnabled ? 'text-cyan-200 bg-cyan-900/30' : 'text-gray-600'}`}>{skill.name.toUpperCase()}</div>
                     </div>
                 </motion.div>
             );
         })}
      </div>
    </div>
  );
};