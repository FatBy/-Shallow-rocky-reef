import { io, Socket } from 'socket.io-client';
import { useGameStore } from '../store';

class OpenClawService {
  private socket: Socket | null = null;
  private mockTimeout: number | null = null;

  connect(token: string) {
    const { setConnectionStatus, addLog, settings } = useGameStore.getState();
    
    if (this.socket && this.socket.connected) {
        return;
    }

    if (settings.mode === 'remote' && !token) {
      addLog({ sender: 'system', text: settings.language === 'en' ? 'Token required for Remote Mode.' : '远程模式需要令牌。' });
      return;
    }

    setConnectionStatus('connecting');
    
    // Determine Connection URL
    // Local: Use "/" to trigger Vite Proxy (bypasses CORS)
    // Remote: Use the exact URL from settings (allows connecting to external servers)
    const connectionUrl = settings.mode === 'local' ? "/" : settings.wsUrl;
    
    const isZh = settings.language === 'zh';
    addLog({ sender: 'system', text: isZh ? `正在连接: ${connectionUrl} (Socket.io)...` : `Connecting to: ${connectionUrl} (Socket.io)...` });

    this.socket = io(connectionUrl, {
      path: "/socket.io",
      transports: ["websocket"], // Force WebSocket transport
      auth: {
        token: token
      },
      reconnection: true,
      reconnectionAttempts: 5,
    });

    this.socket.on("connect", () => {
      console.log("✅ Socket.io Connected! ID:", this.socket?.id);
      setConnectionStatus('connected');
      addLog({ sender: 'system', text: 'Gateway Connected (Socket.io).' });
    });

    this.socket.on("disconnect", (reason) => {
      console.log("❌ Socket.io Disconnected:", reason);
      
      setConnectionStatus('disconnected');
      let msg = isZh ? `连接断开: ${reason}` : `Disconnected: ${reason}`;
      if (reason === "io server disconnect") {
          msg += isZh ? " (服务端主动断开，可能是 Token 无效)" : " (Server disconnected you, possibly invalid Token)";
      }
      addLog({ sender: 'system', text: msg });
    });

    this.socket.on("connect_error", (err) => {
      console.error("⚠️ Connection Error:", err.message);
      const msg = isZh ? `连接错误: ${err.message}` : `Connection Error: ${err.message}`;
      addLog({ sender: 'system', text: msg });
    });

    this.socket.on("message", (data: any) => {
      console.log("Received:", data);
      let text = "";
      if (typeof data === 'string') text = data;
      else if (data.content) text = data.content;
      else if (data.message) text = data.message;
      else text = JSON.stringify(data);

      addLog({ sender: 'agent', text: text });
      useGameStore.getState().setAgentStatus('idle'); 
    });

    this.socket.on("status", (data: any) => {
        if (data && data.status) {
            useGameStore.getState().setAgentStatus(data.status);
        }
    });
  }

  sendCommand(command: string) {
    const { connectionStatus, addLog, setAgentStatus, settings } = useGameStore.getState();
    const isZh = settings.language === 'zh';

    addLog({ sender: 'user', text: command });

    if (this.socket && this.socket.connected) {
      setAgentStatus('processing');
      this.socket.emit("message", { content: command });
    } else if (connectionStatus === 'mock') {
      this.handleMockCommand(command, isZh);
    } else {
      addLog({ sender: 'system', text: isZh ? '未连接。' : 'Not connected.' });
    }
  }

  handleMockCommand(command: string, isZh: boolean) {
      const { setAgentStatus, addLog } = useGameStore.getState();
      setAgentStatus('processing');
      
      const delay = 500 + Math.random() * 1500;
      if (this.mockTimeout) window.clearTimeout(this.mockTimeout);

      this.mockTimeout = window.setTimeout(() => {
        setAgentStatus('idle');
        const responses = isZh 
          ? [
              `[模拟] 收到指令: "${command}"`,
              `[模拟] 执行中... 完成。`,
              `[模拟] 系统一切正常。`,
            ]
          : [
              `[Mock] Command received: "${command}"`,
              `[Mock] Executing... Done.`,
              `[Mock] Systems nominal.`,
            ];
            
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        addLog({ sender: 'agent', text: randomResponse });
      }, delay);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    useGameStore.getState().setConnectionStatus('disconnected');
  }

  startMockMode() {
    const { setConnectionStatus, addLog, settings } = useGameStore.getState();
    this.disconnect();
    setConnectionStatus('mock');
    addLog({ 
      sender: 'system', 
      text: settings.language === 'zh' ? '已切换至模拟模式。' : 'Switched to Simulation Mode.'
    });
  }
}

export const openClawService = new OpenClawService();