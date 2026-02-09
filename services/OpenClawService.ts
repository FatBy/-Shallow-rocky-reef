import { useGameStore } from '../store';
import { WS_URL } from '../constants';

class OpenClawService {
  private ws: WebSocket | null = null;
  private mockTimeout: number | null = null;
  private pingInterval: number | null = null;

  connect(token: string) {
    const { setConnectionStatus, addLog, settings } = useGameStore.getState();
    const targetUrl = settings.wsUrl || WS_URL;

    // VALIDATION LOGIC
    if (settings.mode === 'remote' && !token) {
      addLog({ sender: 'system', text: settings.language === 'en' ? 'Token required for Remote Mode.' : '远程模式需要令牌。' });
      return;
    }

    setConnectionStatus('connecting');
    
    // Construct URL
    let fullUrl = targetUrl;
    // AUTH LOGIC REFINEMENT:
    // Only append token parameters if:
    // 1. A token is explicitly provided by the user (Local or Remote)
    // 2. OR we are in Remote mode (where we must send something, even if user didn't type it, though validation catches that above)
    // If Local Mode AND Token is empty, we send a clean URL (no params) to support --no-auth backends.
    if (token.trim().length > 0) {
        const encodedToken = encodeURIComponent(token);
        const encodedBearer = encodeURIComponent(`Bearer ${token}`);
        
        // Check if URL already has params
        const separator = targetUrl.includes('?') ? '&' : '?';
        fullUrl = `${targetUrl}${separator}token=${encodedToken}&access_token=${encodedToken}&authorization=${encodedBearer}`;
    }

    addLog({ sender: 'system', text: `Connecting to ${fullUrl}...` });

    try {
      this.ws = new WebSocket(fullUrl);

      this.ws.onopen = () => {
        setConnectionStatus('connected');
        addLog({ sender: 'system', text: 'Gateway Connected.' });
        
        // Send initialization message that some servers might expect to verify protocol
        this.ws?.send(JSON.stringify({ type: "connection_init", payload: { client: "openclaw-web-ui" } }));
        
        // Start Heartbeat to prevent timeouts
        this.startHeartbeat();
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
          // Handle Pong or other system messages if needed
        } catch (e) {
          // It might be a plain string message
          console.log('Received raw message:', event.data);
        }
      };

      this.ws.onerror = (e) => {
        console.error('WebSocket error:', e);
        // Only switch to mock if we are not already in a failed state to avoid loops
        // But for error, we usually wait for onclose to decide final fate
      };

      this.ws.onclose = (e) => {
        this.stopHeartbeat();
        
        const { connectionStatus } = useGameStore.getState();
        const isZh = settings.language === 'zh';

        // Log the specific reason
        const reason = e.reason ? `Reason: ${e.reason}` : '';
        
        // Special handling for Code 1000 (Normal Closure)
        if (e.code === 1000) {
            addLog({ 
                sender: 'system', 
                text: isZh 
                  ? `连接中断 (Code 1000)。服务端关闭了连接。这通常是因为 URL 路径错误。请尝试在设置中将 URL 改为 ${targetUrl}/ws 或 /api/ws` 
                  : `Disconnected (Code 1000). Server closed connection. This often means the URL path is wrong. Try appending /ws or /api/ws to your URL in Settings.` 
            });
            setConnectionStatus('disconnected');
            return;
        }

        // Special handling for Code 1008 (Policy Violation / Auth Failed)
        if (e.code === 1008) {
            addLog({ 
                sender: 'system', 
                text: isZh 
                  ? `鉴权失败 (Code 1008)。服务端拒绝了连接。请在设置中输入正确的 Token (查看后端启动日志)。` 
                  : `Authentication Failed (Code 1008). The server rejected the connection. Please enter the correct Token in settings (check backend startup logs).` 
            });
            setConnectionStatus('disconnected');
            return;
        }

        addLog({ sender: 'system', text: isZh 
            ? `连接断开 (代码: ${e.code}). ${reason}` 
            : `Disconnected (Code: ${e.code}). ${reason}` 
        });

        // If we haven't already switched to mock mode via manual intervention
        if (connectionStatus !== 'mock') {
           // Code 1006: Abnormal Closure (e.g. Server died, Network Refused)
           
           if (e.code === 1006) {
              setConnectionStatus('disconnected');
              
              if (settings.mode === 'local' && !token) {
                  addLog({ sender: 'system', text: isZh ? '提示: 请确认本地服务已启动且端口正确。' : 'Hint: Ensure local server is running.' });
              }
           } else {
             setConnectionStatus('disconnected');
           }
        }
      };

    } catch (e) {
      console.error('Connection setup error:', e);
      this.startMockMode(true);
    }
  }

  startHeartbeat() {
      this.stopHeartbeat();
      // Send a ping every 5 seconds (Aggressive heartbeat to keep unstable local connections alive)
      this.pingInterval = window.setInterval(() => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
              this.ws.send(JSON.stringify({ type: 'ping' }));
          }
      }, 5000);
  }

  stopHeartbeat() {
      if (this.pingInterval) {
          clearInterval(this.pingInterval);
          this.pingInterval = null;
      }
  }

  startMockMode(showDiagnostics = false) {
    const { setConnectionStatus, addLog, settings, connectionStatus } = useGameStore.getState();
    
    this.stopHeartbeat();
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
        ? '已切换至模拟模式。' 
        : 'Switched to Simulation Mode.'
    });

    if (showDiagnostics) {
        // ... existing diagnostics logic ...
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
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    useGameStore.getState().setConnectionStatus('disconnected');
  }
}

export const openClawService = new OpenClawService();