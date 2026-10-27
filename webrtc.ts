export interface WebRTCConfig {
  onRemoteStream?: (stream: MediaStream) => void;
  onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
  onIceCandidate?: (candidate: RTCIceCandidate) => void;
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export class WebRTCManager {
  public pc: RTCPeerConnection | null = null;
  public localStream: MediaStream | null = null;
  private config: WebRTCConfig;

  constructor(config: WebRTCConfig) {
    this.config = config;
    this.initPeerConnection();
  }

  private initPeerConnection() {
    this.pc = new RTCPeerConnection(ICE_SERVERS);

    this.pc.onicecandidate = (event) => {
      if (event.candidate && this.config.onIceCandidate) {
        this.config.onIceCandidate(event.candidate);
      }
    };

    this.pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        this.config.onRemoteStream?.(event.streams[0]);
      }
    };

    this.pc.onconnectionstatechange = () => {
      if (this.pc) {
        this.config.onConnectionStateChange?.(this.pc.connectionState);
      }
    };
  }

  public async startScreenShare(withAudio = false): Promise<MediaStream> {
    if (!navigator.mediaDevices || typeof navigator.mediaDevices.getDisplayMedia !== 'function') {
      throw new Error('ميزة مشاركة الشاشة غير مدعومة في هذا المتصفح');
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'monitor',
          frameRate: { ideal: 30, max: 60 },
        },
        audio: withAudio,
      });

      this.localStream = stream;

      // Add tracks to connection
      if (this.pc) {
        stream.getTracks().forEach((track) => {
          this.pc!.addTrack(track, stream);
        });
      }

      return stream;
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        throw new Error('تم إلغاء أو رفض إذن مشاركة الشاشة من قبل المستخدم');
      }
      throw err;
    }
  }

  public async addMicrophoneTrack(): Promise<MediaStream | null> {
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioTrack = audioStream.getAudioTracks()[0];
      if (audioTrack && this.pc) {
        this.pc.addTrack(audioTrack, audioStream);
      }
      return audioStream;
    } catch {
      return null;
    }
  }

  public async createOffer(): Promise<RTCSessionDescriptionInit> {
    if (!this.pc) throw new Error('PeerConnection not initialized');
    const offer = await this.pc.createOffer({
      offerToReceiveVideo: true,
      offerToReceiveAudio: true,
    });
    await this.pc.setLocalDescription(offer);
    return offer;
  }

  public async handleOfferAndCreateAnswer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    if (!this.pc) throw new Error('PeerConnection not initialized');
    await this.pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);
    return answer;
  }

  public async handleAnswer(answer: RTCSessionDescriptionInit) {
    if (!this.pc) throw new Error('PeerConnection not initialized');
    await this.pc.setRemoteDescription(new RTCSessionDescription(answer));
  }

  public async addIceCandidate(candidate: RTCIceCandidateInit) {
    if (!this.pc) return;
    try {
      await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.warn('Error adding ice candidate:', err);
    }
  }

  public stopLocalStream() {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }
  }

  public close() {
    this.stopLocalStream();
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }
  }
}
