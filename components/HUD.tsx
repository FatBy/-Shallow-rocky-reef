import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store';
import { openClawService } from '../services/OpenClawService';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Command, Activity, Zap, Terminal, ChevronDown, ChevronUp, PlayCircle, HelpCircle, Globe, AlertTriangle, RotateCcw } from 'lucide-react';
import { clsx } from 'clsx';
import { INITIAL_SKILLS, WS_URL } from '../constants';

export const HUD: React.FC = () => {
  const { logs, settings, connectionStatus, agentStatus, updateSettings, playerPos } = useGameStore();
  const [inputValue, setInputValue] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isChatMinimized, setIsChatMinimized] = useState(false);
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

  const sanitizeUrl = (url: string) => {
    let cleaned = url.trim();
    
    // 1. Recover from bad pastes (e.g. "ws://localhost:18http://...")
    // Look for a valid http/https pattern inside the string if the start is messy
    if (!cleaned.match(/^(ws|wss):\/\/[\w.-]+(:\d+)?$/)) {
         const extraction = cleaned.match(/(https?|wss?):\/\/[\w.-]+(:\d+)?/);
         if (extraction) {
             cleaned = extraction[0];
         }
    }

    // 2. Protocol Conversion (http -> ws, https -> wss)
    if (cleaned.startsWith('http://')) cleaned = cleaned.replace('http://', 'ws://');
    if (cleaned.startsWith('https://')) cleaned = cleaned.replace('https://', 'wss://');
    
    // 3. Strip common API suffixes (OpenClaw uses raw WS on the root or specific path, not OpenAI paths)
    // Remove /v1/chat/completions etc.
    cleaned = cleaned.replace(/\/v1\/.*$/, '');
    
    // 4. Ensure no trailing slash unless it's just the root (optional, but cleaner)
    if (cleaned.length > 15 && cleaned.endsWith('/')) {
        cleaned = cleaned.slice(0, -1);
    }

    return cleaned;
  };

  const handleConnect = () => {
     // Sanitize before connecting
     const clean = sanitizeUrl(settings.wsUrl);
     if (clean !== settings.wsUrl) {
         updateSettings({ wsUrl: clean });
     }
     
     // Small delay to ensure store updates if we changed it
     setTimeout(() => {
        openClawService.disconnect();
        openClawService.connect(settings.apiToken);
     }, 0);
  };

  const handleUrlBlur = () => {
      const clean = sanitizeUrl(settings.wsUrl);
      if (clean !== settings.wsUrl) {
          updateSettings({ wsUrl: clean });
      }
  };

  const handleResetUrl = () => {
      updateSettings({ wsUrl: WS_URL });
  };

  const handleDemoMode = () => {
    updateSettings({ apiToken: 'demo-token' });
    setTimeout(() => {
        openClawService.disconnect();
        openClawService.connect('demo-token');
    }, 50);
  };
  
  const activeSkill = INITIAL_SKILLS.find(s => 
    Math.round(s.x) === Math.round(playerPos.x) && 
    Math.round(s.y) === Math.round(playerPos.y)
  );

  // Security Check Logic
  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
  // Check against the SANITIZED version for the warning logic to be accurate
  const displayUrl = settings.wsUrl;
  const isInsecureWs = displayUrl.trim().startsWith('ws://');
  const showSecurityWarning = isHttps && isInsecureWs;

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
          {/* Visuals handled by GameCanvas overlays */}
      </div>

      {/* Bottom Section */}
      <div className={clsx(
        "flex gap-4 items-end pointer-events-auto w-full max-w-5xl mx-auto transition-all duration-300",
        isChatMinimized ? "h-auto" : "h-1/3"
      )}>
        
        {/* Chat Log */}
        <div className="flex-1 h-full bg-black/60 backdrop-blur-md rounded-lg border border-gray-700 flex flex-col overflow-hidden shadow-2xl transition-all duration-300">
          <div className="bg-gray-900/50 p-2 border-b border-gray-700 flex justify-between items-center cursor-pointer" onClick={() => setIsChatMinimized(!isChatMinimized)}>
             <span className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Terminal size={14} /> OpenClaw Console
             </span>
             <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-500">v1.0.0</span>
                <button className="text-gray-400 hover:text-white">
                  {isChatMinimized ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
             </div>
          </div>
          
          {/* Main Chat Content - Hidden when minimized */}
          {!isChatMinimized && (
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
          )}
          
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
              className="bg-gray-900 border border-gray-700 p-6 rounded-xl w-96 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                 <Settings className="text-cyan-500" /> Settings
              </h2>
              
              <div className="space-y-4">
                <div>
                   <div className="flex justify-between items-center mb-1">
                        <label className="block text-xs font-bold text-gray-400 uppercase flex items-center gap-2">
                            <Globe size={12} /> Gateway URL
                        </label>
                        <button 
                            onClick={handleResetUrl}
                            title="Reset to Default"
                            className="text-gray-500 hover:text-white transition-colors"
                        >
                            <RotateCcw size={12} />
                        </button>
                   </div>
                   <input 
                    type="text"
                    value={settings.wsUrl}
                    onChange={(e) => updateSettings({ wsUrl: e.target.value })}
                    onBlur={handleUrlBlur}
                    className={clsx(
                        "w-full bg-gray-800 border rounded p-2 text-white outline-none text-sm font-mono transition-colors",
                        showSecurityWarning ? "border-red-500 focus:border-red-500 bg-red-900/10" : "border-gray-700 focus:border-cyan-500"
                    )}
                    placeholder="ws://localhost:18789"
                   />
                   
                   {/* Security Warning Alert */}
                   <AnimatePresence>
                   {showSecurityWarning && (
                       <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-2 text-xs bg-red-500/20 text-red-200 p-2 rounded border border-red-500/50 flex gap-2 items-start"
                       >
                           <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                           <span>
                               {settings.language === 'zh' 
                               ? "安全阻挡：您正在使用 HTTPS 访问网页，浏览器禁止连接不安全的 ws://。请配置 wss:// 或改用本地 HTTP 访问。"
                               : "Security Block: You are on HTTPS. Browsers block connections to insecure ws://. Use wss:// or run this app locally on HTTP."}
                           </span>
                       </motion.div>
                   )}
                   </AnimatePresence>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Authorization Token</label>
                  <input 
                    type="password"
                    value={settings.apiToken}
                    onChange={(e) => updateSettings({ apiToken: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white focus:border-cyan-500 outline-none text-sm"
                    placeholder="e.g. oc_8x9s..."
                  />
                  <div className="mt-2 flex items-start gap-2 text-xs text-gray-500 bg-gray-800/50 p-2 rounded border border-gray-700/50">
                      <HelpCircle size={14} className="mt-0.5 shrink-0" />
                      <span>
                        {settings.language === 'zh' 
                           ? "真实 Token 请在 OpenClaw 后端启动时的终端日志中查看。"
                           : "Find the real Token in your OpenClaw backend terminal logs on startup."}
                      </span>
                  </div>
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
                        disabled={showSecurityWarning}
                        className={clsx(
                            "flex-1 font-bold py-2 rounded transition-colors text-white",
                            showSecurityWarning ? "bg-gray-600 opacity-50 cursor-not-allowed" : "bg-green-600 hover:bg-green-500"
                        )}
                    >
                        Connect
                    </button>
                    <button 
                        type="button"
                        onClick={handleDemoMode}
                        className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded transition-colors"
                    >
                        {settings.language === 'zh' ? "模拟模式" : "Demo Mode"}
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