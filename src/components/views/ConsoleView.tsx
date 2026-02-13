import React, { useState, useRef, useEffect } from 'react';
import { useGameStore } from '../../store';
import { openClawService } from '../../services/OpenClawService';
import { Terminal, Zap, ChevronUp, ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';
import { INITIAL_SKILLS } from '../../constants';

export const ConsoleView: React.FC = () => {
  const { logs, connectionStatus, playerPos, settings } = useGameStore();
  const [inputValue, setInputValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const isZh = settings.language === 'zh';

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    openClawService.sendCommand(inputValue);
    setInputValue('');
  };

  const activeSkill = INITIAL_SKILLS.find(s => 
    Math.round(s.x) === Math.round(playerPos.x) && 
    Math.round(s.y) === Math.round(playerPos.y)
  );

  return (
    <div className="flex flex-col h-full w-full bg-gray-900/50 text-white font-mono">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 bg-gray-900/50 flex justify-between items-center">
        <h2 className="text-lg font-bold flex items-center gap-2 text-cyan-400">
           <Terminal size={20} /> OpenClaw {isZh ? '控制台' : 'Console'}
        </h2>
        <span className="text-xs text-gray-500">v1.0.0</span>
      </div>

      {/* Logs Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-3 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
        {logs.length === 0 && (
           <div className="text-gray-500 italic text-sm text-center mt-20 opacity-50">
               {isZh ? '系统就绪。暂无活动记录。' : 'System ready. No activity recorded.'}
           </div>
        )}
        {logs.map((log) => (
          <div key={log.id} className={clsx("text-sm break-words leading-relaxed", 
              log.sender === 'user' ? "text-cyan-400" : 
              log.sender === 'agent' ? "text-green-400" : "text-gray-400 italic"
          )}>
              <span className="opacity-40 text-xs mr-3 font-mono">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
              <span className="font-bold mr-2 select-none">
              {log.sender === 'user' ? '❯' : log.sender === 'agent' ? '●' : 'ℹ'}
              </span>
              {log.text}
          </div>
        ))}
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="p-4 bg-black/20 border-t border-gray-700 flex gap-3 items-center">
         <div className={clsx(
           "w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]",
           connectionStatus === 'connected' ? "text-green-500 bg-green-500" :
           connectionStatus === 'mock' ? "text-purple-500 bg-purple-500" :
           "text-red-500 bg-red-500"
         )} />
         
         <input 
           type="text" 
           value={inputValue}
           onChange={(e) => setInputValue(e.target.value)}
           placeholder={activeSkill ? `Execute ${activeSkill.name} command...` : (isZh ? "输入指令..." : "Enter command...")}
           className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-600 font-mono text-base"
           autoFocus
           disabled={connectionStatus === 'connecting'}
         />
         <button 
           type="submit" 
           className="p-2 bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-400 rounded-md transition-colors disabled:opacity-50"
           disabled={connectionStatus === 'connecting'}
         >
            <Zap size={20} />
         </button>
      </form>
    </div>
  );
};