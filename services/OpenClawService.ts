import { useGameStore } from '../store';
import { WS_URL } from '../constants';

class OpenClawService {
  private ws: WebSocket | null = null;
  private mockTimeout: number | null = null;

  connect(token: string) {
    const { setConnectionStatus, addLog, settings } = useGameStore.getState();

    if (!token) {
      addLog({ sender: 'system', text: settings.language === 'en' ? 'Token required to connect.' : '连接需要令牌。' });
      return;
    }

    setConnectionStatus('connecting');
    addLog({ sender: 'system', text: `Attempting connection to ${WS_URL}...` });

    try {
      // In a real scenario, we might pass the token in query params or initial handshake if headers aren't supported by browser WS API directly (standard WS API doesn't support custom headers easily, but we assume the environment might proxy it or we use a library. For this code, we simulate standard behavior).
      // Note: Browser WebSocket API does NOT support custom headers. 
      // Often tokens are passed via "Sec-WebSocket-Protocol" or Query Params: ?token=...
      // We will assume Query Param for this implementation as it's the standard workaround.
      
      this.ws = new WebSocket(`${WS_URL}?token=${encodeURIComponent(token)}`);

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

      this.ws.onerror = () => {
        // Fallback to mock immediately on error for smooth DX
        this.startMockMode();
      };

      this.ws.onclose = () => {
        if (useGameStore.getState().connectionStatus !== 'mock') {
           setConnectionStatus('disconnected');
           addLog({ sender: 'system', text: 'Connection closed.' });
        }
      };

    } catch (e) {
      this.startMockMode();
    }
  }

  startMockMode() {
    const { setConnectionStatus, addLog, settings } = useGameStore.getState();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    setConnectionStatus('mock');
    addLog({ 
      sender: 'system', 
      text: settings.language === 'en' 
        ? 'Connection failed. Falling back to OpenClaw Simulation Mode.' 
        : '连接失败。切换至 OpenClaw 模拟模式。'
    });
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
