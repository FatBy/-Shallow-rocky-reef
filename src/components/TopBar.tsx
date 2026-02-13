import React from 'react';
import { useGameStore } from '../store';
import { Activity } from 'lucide-react';
import { clsx } from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';

export const TopBar: React.FC = () => {
  const { connectionStatus, agentStatus, settings } = useGameStore();
  const isZh = settings.language === 'zh';

  const statusLabels = {
    connected: isZh ? '已连接' : 'CONNECTED',
    connecting: isZh ? '连接中...' : 'CONNECTING',
    disconnected: isZh ? '未连接' : 'DISCONNECTED',
    mock: isZh ? '模拟模式' : 'SIMULATION',
    error: isZh ? '错误' : 'ERROR'
  };

  const statusColors = {
    connected: "bg-green-500 shadow-[0_0_10px_#22c55e]",
    connecting: "bg-yellow-500 animate-pulse",
    disconnected: "bg-red-500",
    mock: "bg-purple-500 shadow-[0_0_10px_#a855f7]",
    error: "bg-red-700"
  };

  return (
    <div className="absolute top-4 left-4 z-50 pointer-events-none flex flex-col gap-2">
       <div className="bg-black/60 backdrop-blur-md p-3 rounded-lg border border-gray-700 text-white shadow-xl flex items-center gap-3 pointer-events-auto">
          <div className={clsx("w-3 h-3 rounded-full", statusColors[connectionStatus] || "bg-gray-500")} />
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 leading-none mb-1">
                {isZh ? '系统状态' : 'SYSTEM STATUS'}
            </span>
            <span className="text-xs font-bold leading-none tracking-wide">
                {statusLabels[connectionStatus]}
            </span>
          </div>
       </div>
       
       <AnimatePresence>
       {agentStatus !== 'idle' && (
         <motion.div 
           initial={{ opacity: 0, x: -20 }}
           animate={{ opacity: 1, x: 0 }}
           exit={{ opacity: 0 }}
           className="bg-yellow-500/20 backdrop-blur-md p-2 rounded-lg border border-yellow-500/50 text-yellow-200 flex items-center gap-2 pointer-events-auto"
         >
            <Activity size={16} className="animate-spin" />
            <span className="text-xs font-bold">
                {isZh ? 'Agent 运行中...' : 'AGENT PROCESSING...'}
            </span>
         </motion.div>
       )}
       </AnimatePresence>
    </div>
  );
};