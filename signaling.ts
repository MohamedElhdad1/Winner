import type { SessionConfig, SignalingMessage } from '../types/session';

type SignalCallback = (message: SignalingMessage) => void;
type StatusCallback = (status: SessionConfig['status'], clientDevice?: any) => void;

export class SignalingClient {
  private sessionId: string;
  private role: 'host' | 'guest';
  private eventSource: EventSource | null = null;
  private pollInterval: any = null;
  private lastTimestamp = 0;
  private signalCallbacks: Set<SignalCallback> = new Set();
  private statusCallbacks: Set<StatusCallback> = new Set();
  private broadcastChannel: BroadcastChannel | null = null;

  constructor(sessionId: string, role: 'host' | 'guest') {
    this.sessionId = sessionId;
    this.role = role;

    // Use BroadcastChannel for zero-latency communication if on same origin (e.g. tabs or dual simulator)
    try {
      this.broadcastChannel = new BroadcastChannel(`shareassist_${sessionId}`);
      this.broadcastChannel.onmessage = (event) => {
        const data = event.data;
        if (!data || data.sender === this.role) return;

        if (data.type === 'status_update') {
          this.statusCallbacks.forEach(cb => cb(data.status, data.clientDevice));
        } else {
          this.signalCallbacks.forEach(cb => cb(data));
        }
      };
    } catch {
      // BroadcastChannel might not be supported in older envs
    }

    this.connect();
  }

  private connect() {
    // 1. Try Server-Sent Events (SSE)
    try {
      this.eventSource = new EventSource(`/api/sessions/${this.sessionId}/events?role=${this.role}`);
      
      this.eventSource.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === 'status') {
            this.statusCallbacks.forEach(cb => cb(msg.status, msg.clientDevice));
          } else {
            this.signalCallbacks.forEach(cb => cb(msg));
          }
        } catch {
          // ignore keepalive comments
        }
      };

      this.eventSource.onerror = () => {
        // Fallback to polling if SSE disconnected
        this.startPolling();
      };
    } catch {
      this.startPolling();
    }
  }

  private startPolling() {
    if (this.pollInterval) return;
    this.pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/sessions/${this.sessionId}/signals?since=${this.lastTimestamp}&role=${this.role}`);
        if (!res.ok) return;
        const messages: SignalingMessage[] = await res.json();
        for (const msg of messages) {
          if (msg.timestamp > this.lastTimestamp) {
            this.lastTimestamp = msg.timestamp;
          }
          this.signalCallbacks.forEach(cb => cb(msg));
        }

        // Also fetch session status occasionally
        const sessRes = await fetch(`/api/sessions/${this.sessionId}`);
        if (sessRes.ok) {
          const sess: SessionConfig = await sessRes.json();
          this.statusCallbacks.forEach(cb => cb(sess.status, sess.clientDevice));
        }
      } catch {
        // network retry
      }
    }, 1000);
  }

  public onSignal(callback: SignalCallback) {
    this.signalCallbacks.add(callback);
    return () => this.signalCallbacks.delete(callback);
  }

  public onStatus(callback: StatusCallback) {
    this.statusCallbacks.add(callback);
    return () => this.statusCallbacks.delete(callback);
  }

  public async sendSignal(type: SignalingMessage['type'], payload: any) {
    const message: SignalingMessage = {
      id: `sig_${Math.random().toString(36).substring(2, 9)}`,
      sessionId: this.sessionId,
      sender: this.role,
      type,
      payload,
      timestamp: Date.now(),
    };

    // Broadcast locally to any peer tabs
    try {
      this.broadcastChannel?.postMessage(message);
    } catch {}

    // Send to backend signaling endpoint
    try {
      await fetch(`/api/sessions/${this.sessionId}/signal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
      });
    } catch (err) {
      console.warn('Failed to send signal over HTTP:', err);
    }
  }

  public async updateStatus(status: SessionConfig['status'], clientDevice?: any) {
    try {
      this.broadcastChannel?.postMessage({
        type: 'status_update',
        sender: this.role,
        status,
        clientDevice,
      });
    } catch {}

    try {
      await fetch(`/api/sessions/${this.sessionId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, clientDevice, sender: this.role }),
      });
    } catch (err) {
      console.warn('Failed to update status over HTTP:', err);
    }
  }

  public disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
      this.broadcastChannel = null;
    }
    this.signalCallbacks.clear();
    this.statusCallbacks.clear();
  }
}
