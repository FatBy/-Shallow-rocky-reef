import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store';
import { openClawService } from '../services/OpenClawService';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Command, Activity, Zap, Terminal } from 'lucide-react';
import { clsx } from 'clsx';
import { INITIAL_SKILLS } from '../constants';

export const HUD: React.FC = () => {
  const { logs, settings, connectionStatus, agentStatus, updateSettings, playerPos } = useGameStore();
  const [inputValue, setInputValue] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll chat
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

  const handleConnect = () => {
     openClawService.disconnect();
     openClawService.connect(settings.apiToken);
  };
  
  const activeSkill = INITIAL_SKILLS.find(s => 
    Math.round(s.x) === Math.round(playerPos.x) && 
    Math.round(s.y) === Math.round(playerPos.y)
  );

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4">
      
      {/* Top Bar */}
      <div className="flex justify-between items-start pointer-events-auto">
        <div className="flex flex-col gap-2">
           <div className="bg-black/60 backdrop-blur-md p-3 rounded-lg border border-gray-700 text-white shadow-xl flex items-center gap-3">
              <div className={clsx(
                "w-3 h-3 rounded-full",
                connectionStatus === 'connected' ? "bg-green-500 shadow-[0_0_10px_#22c55e]" :
                connectionStatus === 'mock' ? "bg-purple-500 shadow-[0_0_10px_#a855f7]" :
                connectionStatus === 'connecting' ? "bg-yellow-500 animate-pulse" :
                "bg-red-500"
              )} />
              <div className="flex flex-col">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Status</span>
                <span className="text-sm font-semibold">
                    {connectionStatus === 'mock' ? 'SIMULATION' : connectionStatus.toUpperCase()}
                </span>
              </div>
           </div>
           
           <AnimatePresence>
           {agentStatus !== 'idle' && (
             <motion.div 
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0 }}
               className="bg-yellow-500/20 backdrop-blur-md p-2 rounded-lg border border-yellow-500/50 text-yellow-200 flex items-center gap-2"
             >
                <Activity size={16} className="animate-spin" />
                <span className="text-xs font-bold">AGENT PROCESSING...</span>
             </motion.div>
           )}
           </AnimatePresence>
        </div>

        <button 
          onClick={() => setIsSettingsOpen(true)}
          className="bg-black/60 backdrop-blur-md p-3 rounded-lg border border-gray-700 text-white hover:bg-gray-800 transition-colors"
        >
          <Settings size={20} />
        </button>
      </div>

      {/* Center Notification (if nearby active skill) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          {/* Visuals handled by GameCanvas overlays, this space reserved for modal prompts if needed */}
      </div>

      {/* Bottom Section */}
      <div className="flex gap-4 items-end pointer-events-auto h-1/3 w-full max-w-5xl mx-auto">
        
        {/* Chat Log */}
        <div className="flex-1 h-full bg-black/60 backdrop-blur-md rounded-lg border border-gray-700 flex flex-col overflow-hidden shadow-2xl">
          <div className="bg-gray-900/50 p-2 border-b border-gray-700 flex justify-between items-center">
             <span className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Terminal size={14} /> OpenClaw Console
             </span>
             <span className="text-[10px] text-gray-500">v1.0.0</span>
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
            {logs.length === 0 && (
                <div className="text-gray-500 italic text-sm text-center mt-10">No activity recorded.</div>
            )}
            {logs.map((log) => (
              <div key={log.id} className={clsx("text-sm break-words", 
                log.sender === 'user' ? "text-cyan-400" : 
                log.sender === 'agent' ? "text-green-400" : "text-gray-400 italic"
              )}>
                <span className="opacity-50 text-xs mr-2">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                <span className="font-bold mr-2">
                  {log.sender === 'user' ? '>' : log.sender === 'agent' ? '●' : '!'}
                </span>
                {log.text}
              </div>
            ))}
          </div>
          
          {/* Input Bar */}
          <form onSubmit={handleSubmit} className="p-2 bg-gray-900/80 border-t border-gray-700 flex gap-2">
             <input 
               type="text" 
               value={inputValue}
               onChange={(e) => setInputValue(e.target.value)}
               placeholder={activeSkill ? `Execute ${activeSkill.name} command...` : "Enter command..."}
               className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-500 font-mono text-sm"
               autoFocus
             />
             <button type="submit" className="text-cyan-500 hover:text-cyan-400 disabled:opacity-50">
                <Zap size={18} />
             </button>
          </form>
        </div>
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center pointer-events-auto">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 border border-gray-700 p-6 rounded-xl w-96 shadow-2xl"
            >
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                 <Settings className="text-cyan-500" /> Settings
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Authorization Token</label>
                  <input 
                    type="password"
                    value={settings.apiToken}
                    onChange={(e) => updateSettings({ apiToken: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white focus:border-cyan-500 outline-none text-sm"
                    placeholder="Enter Bearer Token"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Language</label>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => updateSettings({ language: 'en' })}
                      className={clsx("flex-1 p-2 rounded border text-sm", settings.language === 'en' ? "bg-cyan-600 border-cyan-500 text-white" : "bg-gray-800 border-gray-700 text-gray-400")}
                    >
                      English
                    </button>
                    <button 
                      onClick={() => updateSettings({ language: 'zh' })}
                      className={clsx("flex-1 p-2 rounded border text-sm", settings.language === 'zh' ? "bg-cyan-600 border-cyan-500 text-white" : "bg-gray-800 border-gray-700 text-gray-400")}
                    >
                      中文
                    </button>
                  </div>
                </div>

                <div className="pt-4 flex gap-2">
                    <button 
                        onClick={handleConnect}
                        className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded transition-colors"
                    >
                        Connect / Reconnect
                    </button>
                    <button 
                        onClick={() => setIsSettingsOpen(false)}
                        className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition-colors"
                    >
                        Close
                    </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
