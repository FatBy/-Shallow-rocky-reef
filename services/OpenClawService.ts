import { useGameStore } from '../store';
import { WS_URL } from '../constants';

class OpenClawService {
  private ws: WebSocket | null = null;
  private mockTimeout: number | null = null;

  connect(token: string) {
    const { setConnectionStatus, addLog, settings } = useGameStore.getState();
    const targetUrl = settings.wsUrl || WS_URL;

    // VALIDATION LOGIC
    if (settings.mode === 'remote' && !token) {
      addLog({ sender: 'system', text: settings.language === 'en' ? 'Token required for Remote Mode.' : '远程模式需要令牌。' });
      return;
    }

    // In local mode, if token is missing, use a placeholder to ensure headers/params are still formed
    const effectiveToken = token || 'local-dev-mode';

    setConnectionStatus('connecting');
    addLog({ sender: 'system', text: `Attempting connection to ${targetUrl}...` });

    try {
      // SHOTGUN STRATEGY: 
      // Send token in multiple query params to match different backend expectations (FastAPI, Flask, plain Auth).
      const encodedToken = encodeURIComponent(effectiveToken);
      const encodedBearer = encodeURIComponent(`Bearer ${effectiveToken}`);
      
      const fullUrl = `${targetUrl}?token=${encodedToken}&access_token=${encodedToken}&authorization=${encodedBearer}`;

      this.ws = new WebSocket(fullUrl);

      this.ws.onopen = () => {
        setConnectionStatus('connected');
        addLog({ sender: 'system', text: 'OpenClaw Gateway Connected.' });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          // Handle incoming status or messages
          if (data.type === 'log') {
            addLog({ sender: 'agent', text: data.message });
          }
          if (data.type === 'status') {
             useGameStore.getState().setAgentStatus(data.status);
          }
        } catch (e) {
          console.error('Failed to parse WS message', e);
        }
      };

      this.ws.onerror = (e) => {
        console.error('WebSocket error:', e);
        // Trigger diagnostics
        this.startMockMode(true);
      };

      this.ws.onclose = (e) => {
        // If we haven't already switched to mock mode via onerror
        if (useGameStore.getState().connectionStatus !== 'mock') {
           // Code 1006 is usually "Connection Refused" or "Abnormal Closure"
           if (e.code === 1006) {
             this.startMockMode(true);
           } else {
             setConnectionStatus('disconnected');
             addLog({ sender: 'system', text: `Connection closed (Code: ${e.code}).` });
           }
        }
      };

    } catch (e) {
      console.error('Connection setup error:', e);
      this.startMockMode(true);
    }
  }

  startMockMode(showDiagnostics = false) {
    const { setConnectionStatus, addLog, settings, connectionStatus } = useGameStore.getState();
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    // Avoid double-logging if already in mock mode
    if (connectionStatus === 'mock') return;

    setConnectionStatus('mock');
    
    const isZh = settings.language === 'zh';
    
    addLog({ 
      sender: 'system', 
      text: isZh 
        ? '连接失败。已切换至模拟模式。' 
        : 'Connection failed. Switched to Simulation Mode.'
    });

    if (showDiagnostics) {
        const isHttps = window.location.protocol === 'https:';
        const targetUrl = settings.wsUrl || WS_URL;
        const isWs = targetUrl.startsWith('ws://');
        const isLocal = targetUrl.includes('localhost') || targetUrl.includes('127.0.0.1');

        if (isZh) {
             addLog({ sender: 'system', text: '--- 故障排查 ---' });
             addLog({ sender: 'system', text: '1. 请确认后端已在端口 18789 启动。' });
             if(settings.mode === 'remote') {
                 addLog({ sender: 'system', text: '2. 远程模式: 确认 Token 正确且服务器可访问。' });
             }
             
             if (isHttps && isWs && !isLocal) {
                 addLog({ sender: 'system', text: '3. 安全拦截: HTTPS 网页无法连接不安全的 ws:// 地址。请使用 wss:// 或在本地运行前端。' });
             } else {
                 addLog({ sender: 'system', text: '3. 检查防火墙设置。' });
             }
        } else {
             addLog({ sender: 'system', text: '--- Troubleshooting ---' });
             addLog({ sender: 'system', text: '1. Ensure Backend is running on port 18789.' });
             if(settings.mode === 'remote') {
                 addLog({ sender: 'system', text: '2. Remote Mode: Verify Token and network reachability.' });
             }
             
             if (isHttps && isWs && !isLocal) {
                 addLog({ sender: 'system', text: '3. Mixed Content Error: Cannot connect to insecure ws:// from https:// page. Use wss:// or run frontend locally.' });
             } else {
                 addLog({ sender: 'system', text: '3. Check firewall settings.' });
             }
        }
    }
  }

  sendCommand(command: string) {
    const { connectionStatus, addLog, setAgentStatus, settings } = useGameStore.getState();
    const isZh = settings.language === 'zh';

    addLog({ sender: 'user', text: command });

    if (connectionStatus === 'connected' && this.ws) {
      this.ws.send(JSON.stringify({ type: 'command', content: command }));
    } else if (connectionStatus === 'mock') {
      // Mock Logic
      setAgentStatus('processing');
      
      const delay = 500 + Math.random() * 1500;
      
      if (this.mockTimeout) window.clearTimeout(this.mockTimeout);

      this.mockTimeout = window.setTimeout(() => {
        setAgentStatus('idle');
        const responses = isZh 
          ? [
              `OpenClaw 模拟模式：已收到指令 "${command}"`,
              `正在执行: ${command}... 完成。`,
              `分析中... 似乎需要更多上下文。`
            ]
          : [
              `OpenClaw Simulation: Command "${command}" received.`,
              `Executing: ${command}... Done.`,
              `Analyzing... I might need more context.`
            ];
            
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        addLog({ sender: 'agent', text: randomResponse });
      }, delay);
    } else {
      addLog({ sender: 'system', text: isZh ? '未连接。' : 'Not connected.' });
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    useGameStore.getState().setConnectionStatus('disconnected');
  }
}

export const openClawService = new OpenClawService();