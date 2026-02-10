import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store';
import { openClawService } from '../services/OpenClawService';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Activity, Zap, Terminal, ChevronDown, ChevronUp, HelpCircle, Globe, AlertTriangle, RotateCcw, Laptop, Cloud, Download, FileJson } from 'lucide-react';
import { clsx } from 'clsx';
import { INITIAL_SKILLS, WS_URL } from '../constants';
import { ConnectionMode } from '../types';
import { getProjectFiles, LOCAL_HUD_SOURCE } from '../installerAssets';

export const HUD: React.FC = () => {
  const { logs, settings, connectionStatus, agentStatus, updateSettings, playerPos } = useGameStore();
  const [inputValue, setInputValue] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  // Mixed content is less of an issue with Proxy/Socket.io over HTTP, but we keep a simplified check for Remote mode
  const [showMixedContentAlert, setShowMixedContentAlert] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
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
    
    // Socket.io prefers http/https. If user types localhost:18789, assume http://
    if (!cleaned.match(/^(http|https|ws|wss):\/\//)) {
        if (cleaned.includes('localhost') || cleaned.includes('127.0.0.1')) {
            cleaned = 'http://' + cleaned;
        } else {
            cleaned = 'https://' + cleaned;
        }
    }

    // Recover from bad pastes
    const match = cleaned.match(/^(http|https|ws|wss):\/\/[\w.-]+(:\d+)?(\/.*)?$/);
    if (!match) {
         const extraction = cleaned.match(/(http|https|ws|wss):\/\/[\w.-]+(:\d+)?(\/[^\s]*)?/);
         if (extraction) {
             cleaned = extraction[0];
         }
    }

    // Strip common REST API suffixes
    if (cleaned.endsWith('/v1/chat/completions')) {
        cleaned = cleaned.replace(/\/v1\/chat\/completions$/, '');
    }
    
    // Remove trailing slash for consistency
    if (cleaned.endsWith('/') && cleaned.length > 10) {
        cleaned = cleaned.slice(0, -1);
    }

    return cleaned;
  };

  const handleConnect = () => {
     // In Local mode, the Service ignores the URL and uses "/" (Proxy).
     // In Remote mode, we use what's typed.
     
     if (settings.mode === 'remote') {
         const clean = sanitizeUrl(settings.wsUrl);
         if (clean !== settings.wsUrl) {
             updateSettings({ wsUrl: clean });
         }
         
         // Mixed content check only for Remote + HTTP
         const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
         const isInsecure = clean.startsWith('http://') || clean.startsWith('ws://');
         
         if (isHttps && isInsecure) {
            setShowMixedContentAlert(true);
            return;
         }
     }
     
     setShowMixedContentAlert(false);
     setTimeout(() => {
        openClawService.disconnect();
        openClawService.connect(settings.apiToken);
     }, 100);
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

  const handleModeChange = (mode: ConnectionMode) => {
      if (mode === 'local') {
          // Reset to default for local to ensure it looks correct, 
          // though Service uses "/" regardless.
          updateSettings({ mode, wsUrl: WS_URL });
      } else {
          updateSettings({ mode });
      }
  };

  const handleDemoMode = () => {
    updateSettings({ apiToken: 'demo-token' });
    setTimeout(() => {
        openClawService.disconnect();
        openClawService.connect('demo-token');
    }, 50);
  };

  const handleDownloadInstaller = () => {
      const packageJson = {
          "name": "openclaw-ui",
          "private": true,
          "version": "1.0.0",
          "type": "module",
          "scripts": {
            "dev": "vite",
            "build": "tsc && vite build",
            "preview": "vite preview"
          },
          "dependencies": {
            "clsx": "^2.1.1",
            "framer-motion": "^12.0.0",
            "lucide-react": "^0.344.0",
            "react": "^18.2.0",
            "react-dom": "^18.2.0",
            "zustand": "^4.5.0",
            "socket.io-client": "^4.7.4"
          },
          "devDependencies": {
            "@types/react": "^18.2.56",
            "@types/react-dom": "^18.2.19",
            "@vitejs/plugin-react": "^4.2.1",
            "autoprefixer": "^10.4.18",
            "postcss": "^8.4.35",
            "tailwindcss": "^3.4.1",
            "typescript": "^5.2.2",
            "vite": "^5.1.4"
          }
      };

      const viteConfig = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:18789',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'ws://localhost:18789',
        ws: true,
        changeOrigin: true,
        secure: false,
      }
    }
  }
})`;

      const tsConfig = `{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"],
  "exclude": ["node_modules"]
}`;

      const projectFiles = getProjectFiles();
      projectFiles["src/components/HUD.tsx"] = LOCAL_HUD_SOURCE;

      const installScript = `
const fs = require('fs');
const path = require('path');

console.log('🚀 Initializing OpenClaw UI Local Environment...');

const rootFiles = {
  'package.json': ${JSON.stringify(JSON.stringify(packageJson, null, 2))},
  'vite.config.ts': ${JSON.stringify(viteConfig)},
  'tsconfig.json': ${JSON.stringify(tsConfig)},
  'index.html': \`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>OpenClaw Game OS</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>body { margin: 0; overflow: hidden; background-color: #111827; } .scrollbar-thin::-webkit-scrollbar { width: 6px; } .scrollbar-thin::-webkit-scrollbar-track { background: transparent; } .scrollbar-thin::-webkit-scrollbar-thumb { background-color: #4b5563; border-radius: 20px; }</style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/index.tsx"></script>
  </body>
</html>\`
};

const srcFiles = ${JSON.stringify(projectFiles)};

if (!fs.existsSync('src')) {
    fs.mkdirSync('src');
    console.log('📂 Created src/ directory');
}

const subdirs = ['src/components', 'src/services'];
subdirs.forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

for (const [name, content] of Object.entries(rootFiles)) {
    if (!fs.existsSync(name)) fs.writeFileSync(name, content);
}

for (const [pathName, content] of Object.entries(srcFiles)) {
    const dir = path.dirname(pathName);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(pathName)) fs.writeFileSync(pathName, content);
}

console.log('\\n✅ PROJECT SETUP COMPLETE!');
console.log('=============================================');
console.log('👉 Step 1: Run "npm install"');
console.log('👉 Step 2: Run "npm run dev"');
console.log('=============================================');
`;

      const blob = new Blob([installScript], { type: 'text/javascript' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'install.js';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };
  
  const activeSkill = INITIAL_SKILLS.find(s => 
    Math.round(s.x) === Math.round(playerPos.x) && 
    Math.round(s.y) === Math.round(playerPos.y)
  );

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
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4">
      
      {/* Top Bar */}
      <div className="flex justify-between items-start pointer-events-auto">
        <div className="flex flex-col gap-2">
           <div className="bg-black/60 backdrop-blur-md p-3 rounded-lg border border-gray-700 text-white shadow-xl flex items-center gap-3">
              <div className={clsx(
                "w-3 h-3 rounded-full",
                statusColors[connectionStatus] || "bg-gray-500"
              )} />
              <div className="flex flex-col">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    {isZh ? '系统状态' : 'Status'}
                </span>
                <span className="text-sm font-semibold">
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
               className="bg-yellow-500/20 backdrop-blur-md p-2 rounded-lg border border-yellow-500/50 text-yellow-200 flex items-center gap-2"
             >
                <Activity size={16} className="animate-spin" />
                <span className="text-xs font-bold">
                    {isZh ? 'Agent 运行中...' : 'AGENT PROCESSING...'}
                </span>
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
                <Terminal size={14} /> OpenClaw {isZh ? '控制台' : 'Console'}
             </span>
             <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-500">v1.0.0</span>
                <button className="text-gray-400 hover:text-white">
                  {isChatMinimized ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
             </div>
          </div>
          
          {/* Main Chat Content */}
          {!isChatMinimized && (
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
                {logs.length === 0 && (
                    <div className="text-gray-500 italic text-sm text-center mt-10">
                        {isZh ? '暂无记录' : 'No activity recorded.'}
                    </div>
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
          <form onSubmit={handleSubmit} className="p-2 bg-gray-900/80 border-t border-gray-700 flex gap-2 items-center">
             <div 
                className={clsx(
                    "hidden md:flex items-center gap-2 px-2 py-1 rounded border text-[10px] font-bold uppercase select-none mr-1 transition-colors",
                    connectionStatus === 'connected' ? "bg-green-900/30 border-green-700 text-green-400" :
                    connectionStatus === 'mock' ? "bg-purple-900/30 border-purple-700 text-purple-400" :
                    "bg-red-900/30 border-red-700 text-red-400"
                )}
             >
                 <div className={clsx("w-1.5 h-1.5 rounded-full", statusColors[connectionStatus])} />
                 <span>{statusLabels[connectionStatus]}</span>
             </div>

             <input 
               type="text" 
               value={inputValue}
               onChange={(e) => setInputValue(e.target.value)}
               placeholder={activeSkill ? `Execute ${activeSkill.name} command...` : (isZh ? "输入指令..." : "Enter command...")}
               className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-500 font-mono text-sm"
               autoFocus
               disabled={connectionStatus === 'connecting'}
             />
             <button type="submit" className="text-cyan-500 hover:text-cyan-400 disabled:opacity-50" disabled={connectionStatus === 'connecting'}>
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
              className="bg-gray-900 border border-gray-700 p-6 rounded-xl w-96 shadow-2xl max-h-[90vh] overflow-y-auto flex flex-col gap-4"
            >
              <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                     <Settings className="text-cyan-500" /> {isZh ? '设置' : 'Settings'}
                  </h2>
                  <div className="flex bg-gray-800 rounded p-1">
                      <button 
                        onClick={() => handleModeChange('local')}
                        className={clsx(
                            "px-3 py-1 rounded text-xs font-bold flex items-center gap-1 transition-all",
                            settings.mode === 'local' ? "bg-cyan-600 text-white shadow" : "text-gray-400 hover:text-white"
                        )}
                      >
                          <Laptop size={12} /> Local
                      </button>
                      <button 
                        onClick={() => handleModeChange('remote')}
                        className={clsx(
                            "px-3 py-1 rounded text-xs font-bold flex items-center gap-1 transition-all",
                            settings.mode === 'remote' ? "bg-purple-600 text-white shadow" : "text-gray-400 hover:text-white"
                        )}
                      >
                          <Cloud size={12} /> Remote
                      </button>
                  </div>
              </div>
              
              <div className="space-y-4">
                {/* Local Deployment Section */}
                <div className="p-3 bg-cyan-900/20 border border-cyan-800 rounded">
                    <h3 className="text-xs font-bold text-cyan-400 uppercase mb-2 flex items-center gap-2">
                        <Download size={12} /> {isZh ? '本地部署 (推荐)' : 'Local Deployment (Recommended)'}
                    </h3>
                    <p className="text-xs text-gray-400 mb-2 leading-relaxed">
                        {isZh 
                          ? "为了绕过浏览器跨域限制，强烈建议下载安装脚本并在本地运行。" 
                          : "To bypass browser CORS/Security restrictions, download and run locally."}
                    </p>
                    <button 
                        onClick={handleDownloadInstaller}
                        className="w-full flex items-center justify-center gap-2 bg-cyan-700 hover:bg-cyan-600 text-white text-xs font-bold py-2 rounded transition-colors"
                    >
                        <FileJson size={14} /> {isZh ? '下载安装脚本 (install.js)' : 'Download Installer (install.js)'}
                    </button>
                </div>

                <div>
                   <div className="flex justify-between items-center mb-1">
                        <label className="block text-xs font-bold text-gray-400 uppercase flex items-center gap-2">
                            <Globe size={12} /> {settings.mode === 'local' ? 'Gateway (Proxy Active)' : 'Gateway URL'}
                        </label>
                        {settings.mode === 'remote' && (
                            <button 
                                onClick={handleResetUrl}
                                title="Reset to Default"
                                className="text-gray-500 hover:text-white transition-colors"
                            >
                                <RotateCcw size={12} />
                            </button>
                        )}
                   </div>
                   
                   {settings.mode === 'local' ? (
                        <div className="p-2 bg-gray-800/50 border border-gray-700 rounded text-xs text-gray-400 font-mono">
                             /api (Proxied to http://localhost:18789)
                        </div>
                   ) : (
                       <input 
                        type="text"
                        value={settings.wsUrl}
                        onChange={(e) => updateSettings({ wsUrl: e.target.value })}
                        onBlur={handleUrlBlur}
                        className={clsx(
                            "w-full bg-gray-800 border rounded p-2 text-white outline-none text-sm font-mono transition-colors",
                            showMixedContentAlert ? "border-red-500 focus:border-red-500 bg-red-900/10" : "border-gray-700 focus:border-cyan-500"
                        )}
                        placeholder="http://your-server-ip:8080"
                       />
                   )}
                   
                   <AnimatePresence>
                   {showMixedContentAlert && (
                       <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-2 text-xs bg-red-500/20 text-red-200 p-2 rounded border border-red-500/50 flex gap-2 items-start"
                       >
                           <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                           <span>
                               {settings.language === 'zh' 
                               ? "HTTPS 网页无法直接连接不安全(HTTP)的远程服务器。请使用 HTTPS URL。"
                               : "HTTPS pages cannot connect to insecure HTTP remote servers. Use HTTPS."}
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
                    placeholder={settings.mode === 'local' ? "(无需 Token / No Token needed)" : "Auth Token"}
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Authorization Token</label>
                  <input 
                    type="password"
                    value={settings.apiToken}
                    onChange={(e) => updateSettings({ apiToken: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white focus:border-cyan-500 outline-none text-sm"
                    placeholder={settings.mode === 'local' ? "(无需 Token / No Token needed)" : "Auth Token"}
                  />
                  <div className="mt-2 flex items-start gap-2 text-xs text-gray-500 bg-gray-800/50 p-2 rounded border border-gray-700/50">
                      <HelpCircle size={14} className="mt-0.5 shrink-0" />
                      <span>
                        {settings.language === 'zh' 
                           ? (settings.mode === 'local' ? "本地模式通常默认不需鉴权，留空即可。" : "真实 Token 请在 OpenClaw 后端启动时的终端日志中查看。")
                           : (settings.mode === 'local' ? "Local mode usually requires no token. Leave empty." : "Find the real Token in your OpenClaw backend terminal logs on startup.")}
                      </span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Language / 语言</label>
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
                        className={clsx(
                            "flex-1 font-bold py-2 rounded transition-colors text-white",
                            "bg-green-600 hover:bg-green-500"
                        )}
                    >
                        {isZh ? "连接" : "Connect"}
                    </button>
                    <button 
                        type="button"
                        onClick={handleDemoMode}
                        className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded transition-colors"
                    >
                        {settings.language === 'zh' ? "模拟" : "Demo"}
                    </button>
                    <button 
                        onClick={() => setIsSettingsOpen(false)}
                        className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition-colors"
                    >
                        {isZh ? "关闭" : "Close"}
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