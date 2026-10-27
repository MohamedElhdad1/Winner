export interface SessionConfig {
  id: string;
  pin: string;
  title: string;
  message: string;
  hostName: string;
  supportCategory: string;
  allowAudio: boolean;
  allowDrawAnnotations: boolean;
  createdAt: number;
  status: 'waiting' | 'accepted' | 'rejected' | 'active' | 'ended';
  clientDevice?: {
    browser?: string;
    os?: string;
    isMobile?: boolean;
    screenWidth?: number;
    screenHeight?: number;
  };
}

export interface SignalingMessage {
  id: string;
  sessionId: string;
  sender: 'host' | 'guest';
  type: 'offer' | 'answer' | 'candidate' | 'pointer' | 'draw' | 'chat' | 'status' | 'ping';
  payload: any;
  timestamp: number;
}

export interface DrawStroke {
  color: string;
  size: number;
  points: { x: number; y: number }[];
}

export interface ChatMessage {
  id: string;
  sender: 'host' | 'guest';
  senderName: string;
  text: string;
  timestamp: number;
}
