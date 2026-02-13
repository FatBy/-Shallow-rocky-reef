import React from 'react';
import { ListTodo, Play, Clock, CheckCircle2, MoreHorizontal, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

// Waveform Animation for executing tasks
const Waveform = () => (
    <div className="flex items-end gap-[2px] h-4">
        {[...Array(6)].map((_, i) => (
            <motion.div 
                key={i}
                className="w-1 bg-yellow-400 rounded-full"
                animate={{ height: ["20%", "100%", "20%"] }}
                transition={{ 
                    duration: 0.8, 
                    repeat: Infinity, 
                    delay: i * 0.1,
                    ease: "easeInOut" 
                }}
            />
        ))}
    </div>
);

interface Task {
    id: string;
    title: string;
    priority: 'high' | 'medium' | 'low';
    tags: string[];
}

const TASKS_PENDING: Task[] = [
    { id: 't1', title: 'Analyze Stock Market Data', priority: 'high', tags: ['finance', 'python'] },
    { id: 't2', title: 'Backup System Logs', priority: 'low', tags: ['maintenance'] },
];

const TASKS_EXECUTING: Task[] = [
    { id: 't3', title: 'Scrape TechCrunch News', priority: 'medium', tags: ['browser', 'scraping'] },
];

const TASKS_HISTORY: Task[] = [
    { id: 't4', title: 'Initialize Core Systems', priority: 'high', tags: ['system'] },
];

// Kanban Column Component
const KanbanColumn = ({ title, color, tasks, icon: Icon, isExecuting = false }: { title: string, color: string, tasks: Task[], icon: any, isExecuting?: boolean }) => (
    <div className="flex-1 flex flex-col min-h-0 bg-gray-900/40 border border-white/5 rounded-2xl p-4 backdrop-blur-sm shadow-xl">
        <div className={`flex items-center gap-2 mb-4 text-xs font-bold uppercase tracking-widest ${color}`}>
            <Icon size={14} /> {title} <span className="ml-auto bg-white/5 border border-white/5 px-2 rounded text-white">{tasks.length}</span>
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-gray-700">
            {tasks.map((task) => (
                <motion.div 
                    key={task.id}
                    layoutId={task.id}
                    className={clsx(
                        "p-4 rounded-xl border backdrop-blur-md relative overflow-hidden group hover:bg-white/5 transition-colors cursor-grab active:cursor-grabbing",
                        isExecuting ? "bg-yellow-500/10 border-yellow-500/50" : "bg-white/5 border-white/10"
                    )}
                >
                    {isExecuting && (
                        <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500 shadow-[0_0_10px_#eab308]" />
                    )}
                    
                    <div className="flex justify-between items-start mb-2">
                        <span className={clsx(
                            "text-[10px] font-bold px-1.5 py-0.5 rounded uppercase border",
                            task.priority === 'high' ? "bg-red-500/20 text-red-300 border-red-500/30" :
                            task.priority === 'medium' ? "bg-blue-500/20 text-blue-300 border-blue-500/30" :
                            "bg-gray-500/20 text-gray-300 border-gray-500/30"
                        )}>
                            {task.priority}
                        </span>
                        <MoreHorizontal size={14} className="text-gray-500 cursor-pointer hover:text-white" />
                    </div>
                    
                    <h3 className="text-sm font-bold text-white mb-3 leading-tight">{task.title}</h3>
                    
                    <div className="flex justify-between items-end">
                        <div className="flex gap-1">
                            {task.tags.map(tag => (
                                <span key={tag} className="text-[9px] text-gray-400 bg-black/30 px-1.5 py-0.5 rounded border border-white/5">#{tag}</span>
                            ))}
                        </div>
                        {isExecuting && <Waveform />}
                    </div>
                </motion.div>
            ))}
            {tasks.length === 0 && (
                <div className="h-24 border-2 border-dashed border-white/5 rounded-xl flex items-center justify-center text-xs text-gray-600 font-mono">
                    SLOT_EMPTY
                </div>
            )}
        </div>
    </div>
);

export const TaskHouse: React.FC = () => {
  return (
    <div className="w-full h-full p-6 flex flex-col bg-gray-950 text-white relative">
      {/* Texture Overlay */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none" />
      
      {/* Header */}
      <div className="relative z-10 flex justify-between items-center mb-6 border-b border-gray-800 pb-4">
          <h2 className="text-3xl font-bold font-mono text-yellow-400 flex items-center gap-3 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]">
            <ListTodo size={32} /> MISSION CONTROL
          </h2>
          <div className="text-right">
             <div className="text-xs font-mono text-gray-500">KANBAN.SYS</div>
             <div className="text-xl font-bold font-mono text-white flex items-center gap-2 justify-end">
                 <Activity size={18} className="text-yellow-500 animate-pulse" /> ONLINE
             </div>
          </div>
      </div>

      {/* Board */}
      <div className="flex-1 flex gap-4 overflow-hidden relative z-10">
          <KanbanColumn title="Queued" color="text-gray-400" icon={Clock} tasks={TASKS_PENDING} />
          <KanbanColumn title="Executing" color="text-yellow-400" icon={Play} tasks={TASKS_EXECUTING} isExecuting={true} />
          <KanbanColumn title="History" color="text-green-400" icon={CheckCircle2} tasks={TASKS_HISTORY} />
      </div>
    </div>
  );
};