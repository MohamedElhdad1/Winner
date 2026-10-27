import React, { useState, useEffect, useRef } from 'react';
import { 
  Radio, 
  StopCircle, 
  Camera, 
  Video, 
  Mic, 
  MicOff, 
  MousePointer, 
  PenTool, 
  Trash2, 
  Download, 
  Smartphone, 
  Maximize2, 
  Minimize2, 
  MessageSquare, 
  Send, 
  CheckCircle, 
  Clock, 
  Zap, 
  AlertCircle,
  X,
  Share2
} from 'lucide-react';
import type { SessionConfig, SignalingMessage, ChatMessage, DrawStroke } from '../types/session';
import { SignalingClient } from '../services/signaling';
import { WebRTCManager } from '../services/webrtc';

interface Props {
  session: SessionConfig;
  onEndSession: () => void;
}

export const HostDashboardView: React.FC<Props> = ({ session, onEndSession }) => {
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [sessionStatus, setSessionStatus] = useState<SessionConfig['status']>(session.status || 'waiting');
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  const [toolMode, setToolMode] = useState<'pointer' | 'pen'>('pointer');
  const [penColor, setPenColor] = useState<string>('#ef4444');
  const [isRecording, setIsRecording] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [isPhoneFrame, setIsPhoneFrame] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  // Real-time Chat
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(true);

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<{ x: number; y: number }[]>([]);
  const [allStrokes, setAllStrokes] = useState<DrawStroke[]>([]);

  // References
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const signalingRef = useRef<SignalingClient | null>(null);
  const webrtcRef = useRef<WebRTCManager | null>(null);

  // Timer
  useEffect(() => {
    let timer: any = null;
    if (sessionStatus === 'active') {
      timer = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [sessionStatus]);

  // Connect Signaling Client
  useEffect(() => {
    const client = new SignalingClient(session.id, 'host');
    signalingRef.current = client;

    // Listen for status updates (when guest accepts, rejects, or ends)
    client.onStatus((status, clientDevice) => {
      setSessionStatus(status);
      if (clientDevice) setDeviceInfo(clientDevice);
    });

    // Initialize WebRTC
    const rtc = new WebRTCManager({
      onRemoteStream: (stream) => {
        setRemoteStream(stream);
        setSessionStatus('active');
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      },
      onIceCandidate: (candidate) => {
        client.sendSignal('candidate', candidate);
      },
      onConnectionStateChange: (state) => {
        if (state === 'connected') {
          setSessionStatus('active');
        } else if (state === 'disconnected' || state === 'failed') {
          setSessionStatus('ended');
        }
      },
    });
    webrtcRef.current = rtc;

    // Listen for incoming signals from Guest
    client.onSignal(async (msg: SignalingMessage) => {
      if (msg.type === 'offer') {
        try {
          const answer = await rtc.handleOfferAndCreateAnswer(msg.payload);
          await client.sendSignal('answer', answer);
        } catch (e) {
          console.error('Host error handling offer:', e);
        }
      } else if (msg.type === 'answer') {
        try {
          await rtc.handleAnswer(msg.payload);
        } catch (e) {
          console.error('Host error handling answer:', e);
        }
      } else if (msg.type === 'candidate') {
        rtc.addIceCandidate(msg.payload);
      } else if (msg.type === 'chat') {
        setChatMessages((prev) => [...prev, msg.payload]);
      } else if (msg.type === 'status') {
        if (msg.payload === 'rejected') setSessionStatus('rejected');
        if (msg.payload === 'ended') setSessionStatus('ended');
      }
    });

    return () => {
      client.disconnect();
      rtc.close();
    };
  }, [session.id]);

  // Attach video stream when available
  useEffect(() => {
    if (remoteStream && videoRef.current) {
      videoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Handle pointer tracking on video container
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (sessionStatus !== 'active') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    if (toolMode === 'pointer') {
      // Send normalized pointer coordinate
      signalingRef.current?.sendSignal('pointer', { x, y });
    } else if (toolMode === 'pen' && isDrawing) {
      setCurrentStroke((prev) => [...prev, { x, y }]);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (toolMode !== 'pen' || sessionStatus !== 'active') return;
    setIsDrawing(true);
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setCurrentStroke([{ x, y }]);
  };

  const handleMouseUp = () => {
    if (toolMode === 'pen' && isDrawing && currentStroke.length > 1) {
      const stroke: DrawStroke = {
        color: penColor,
        size: 4,
        points: currentStroke,
      };
      setAllStrokes((prev) => [...prev, stroke]);
      signalingRef.current?.sendSignal('draw', stroke);
    }
    setIsDrawing(false);
    setCurrentStroke([]);
  };

  // Redraw annotations on Host preview canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const renderStroke = (pts: { x: number; y: number }[], color: string) => {
      if (pts.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      pts.forEach((pt, idx) => {
        const px = (pt.x / 100) * canvas.width;
        const py = (pt.y / 100) * canvas.height;
        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();
    };

    allStrokes.forEach((s) => renderStroke(s.points, s.color));
    if (currentStroke.length > 1) {
      renderStroke(currentStroke, penColor);
    }
  }, [allStrokes, currentStroke, penColor]);

  // Clear annotations
  const handleClearAnnotations = () => {
    setAllStrokes([]);
    setCurrentStroke([]);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  // Take Snapshot / Screenshot
  const handleTakeSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const captureCanvas = document.createElement('canvas');
    captureCanvas.width = video.videoWidth || 1280;
    captureCanvas.height = video.videoHeight || 720;
    const ctx = captureCanvas.getContext('2d');
    if (!ctx) return;

    // Draw video frame
    ctx.drawImage(video, 0, 0, captureCanvas.width, captureCanvas.height);

    // Download snapshot
    const link = document.createElement('a');
    link.download = `shareassist_snapshot_${Date.now()}.png`;
    link.href = captureCanvas.toDataURL('image/png');
    link.click();
  };

  // Toggle Video Recording
  const handleToggleRecord = () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      if (!remoteStream) return;
      recordedChunksRef.current = [];
      const recorder = new MediaRecorder(remoteStream, { mimeType: 'video/webm' });
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `support_session_${session.id}_${Date.now()}.webm`;
        a.click();
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    }
  };

  // Toggle Audio Mic
  const handleToggleMic = async () => {
    if (micActive) {
      setMicActive(false);
    } else {
      try {
        await webrtcRef.current?.addMicrophoneTrack();
        setMicActive(true);
      } catch (e) {
        console.warn('Microphone error:', e);
      }
    }
  };

  // Send Chat message
  const handleSendChat = (textToSend?: string) => {
    const text = textToSend || chatInput;
    if (!text.trim()) return;

    const msg: ChatMessage = {
      id: `chat_${Date.now()}`,
      sender: 'host',
      senderName: session.hostName || 'المساعد',
      text: text.trim(),
      timestamp: Date.now(),
    };

    setChatMessages((prev) => [...prev, msg]);
    signalingRef.current?.sendSignal('chat', msg);
    if (!textToSend) setChatInput('');
  };

  const handleEnd = () => {
    signalingRef.current?.sendSignal('status', 'ended');
    signalingRef.current?.updateStatus('ended');
    onEndSession();
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Console Navigation Bar */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">غرفة التحكم والمشاهدة الحية</h2>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold border ${
                sessionStatus === 'active' 
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' 
                  : sessionStatus === 'waiting'
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 animate-pulse'
                  : 'bg-red-500/20 text-red-400 border-red-500/40'
              }`}>
                {sessionStatus === 'active' ? '🟢 متصل - الشاشة معروضة' : sessionStatus === 'waiting' ? '⏳ في انتظار موافقة الطرف الآخر...' : '🔴 انتهت الجلسة'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              الجلسة: <span className="font-mono text-slate-300">{session.pin}</span> • {session.title}
            </p>
          </div>
        </div>

        {/* Center: Session stats */}
        <div className="flex items-center gap-4 bg-slate-950/80 px-4 py-2 rounded-xl border border-slate-800 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span>المدة:</span>
            <span className="font-mono font-bold text-white">{formatTime(elapsedTime)}</span>
          </div>
          <div className="w-px h-4 bg-slate-800"></div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <Zap className="w-4 h-4 text-blue-400" />
            <span>الجودة:</span>
            <span className="font-bold text-blue-300">P2P HD 60fps</span>
          </div>
        </div>

        {/* Right action controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPhoneFrame(!isPhoneFrame)}
            className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border ${
              isPhoneFrame
                ? 'bg-emerald-600 border-emerald-500 text-white'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
            }`}
            title="تبديل إطار الهاتف"
          >
            <Smartphone className="w-4 h-4" />
            <span className="hidden sm:inline">إطار الهاتف</span>
          </button>

          <button
            onClick={handleEnd}
            className="px-3 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-md"
          >
            <StopCircle className="w-4 h-4" />
            <span>إنهاء الجلسة</span>
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Stream Display Area */}
        <div className="flex-1 bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
          {sessionStatus === 'waiting' && !remoteStream && (
            <div className="max-w-md w-full text-center p-8 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl">
              <div className="w-16 h-16 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-bounce">
                <Radio className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">في انتظار فتح الرابط والموافقة</h3>
              <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                الطرف الآخر لم يضغط على زر &quot;أوافق&quot; بعد. بمجرد أن يفتح الرابط على هاتفه أو حاسوبه ويوافق، ستظهر شاشته هنا فوراً بدون أي تأخير.
              </p>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-right text-xs space-y-1 mb-4">
                <div className="flex justify-between text-slate-400">
                  <span>الرسالة المرسلة له:</span>
                  <span className="text-emerald-400 font-semibold truncate max-w-[200px]">{session.message}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>رقم الـ PIN:</span>
                  <span className="font-mono text-white font-bold">{session.pin}</span>
                </div>
              </div>
              <a
                href={`${import.meta.env.BASE_URL}?session=${session.id}&pin=${session.pin}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 hover:text-emerald-300 underline"
              >
                <span>اضغط هنا لفتح شاشة الطرف الآخر في تبويب جديد وتجربة الموافقة</span>
              </a>
            </div>
          )}

          {sessionStatus === 'rejected' && (
            <div className="text-center p-8 bg-slate-900 border border-red-500/30 rounded-3xl max-w-md">
              <div className="w-16 h-16 bg-red-500/10 text-red-400 border border-red-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">رفض الطرف الآخر الطلب</h3>
              <p className="text-xs text-slate-400 mb-6">
                قام الزائر بالضغط على &quot;لا أوافق&quot; وتم إنهاء الطلب لحماية خصوصيته وفقاً لضوابط المتصفح.
              </p>
              <button
                onClick={onEndSession}
                className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold"
              >
                العودة لإنشاء رابط جديد
              </button>
            </div>
          )}

          {/* Active Screen Video Stream */}
          <div
            className={`relative flex items-center justify-center transition-all duration-300 ${
              isPhoneFrame
                ? 'w-[360px] h-[720px] max-h-[85vh] bg-slate-900 rounded-[45px] p-3 border-4 border-slate-700 shadow-[0_0_50px_rgba(0,0,0,0.8)]'
                : 'w-full h-full max-h-[85vh]'
            }`}
          >
            {/* Phone notch mockup if phone frame enabled */}
            {isPhoneFrame && (
              <div className="absolute top-5 left-1/2 -translate-x-1/2 w-28 h-5 bg-slate-800 rounded-full z-30 pointer-events-none flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-slate-900 mr-3"></div>
                <div className="w-2 h-2 rounded-full bg-blue-900"></div>
              </div>
            )}

            <div
              className="relative w-full h-full rounded-2xl overflow-hidden bg-black flex items-center justify-center cursor-crosshair group"
              onMouseMove={handleMouseMove}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
            >
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-contain pointer-events-none select-none"
              />

              {/* Host annotation drawing canvas overlay */}
              <canvas
                ref={canvasRef}
                width={1280}
                height={720}
                className="absolute inset-0 w-full h-full pointer-events-none z-20"
              />

              {/* Laser Pointer tooltip hint */}
              {sessionStatus === 'active' && toolMode === 'pointer' && (
                <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-[11px] text-slate-300 pointer-events-none flex items-center gap-2 z-20">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
                  <span>حرك الماوس لتوجيه الطرف الآخر بمؤشر ليزري أحمر</span>
                </div>
              )}
            </div>
          </div>

          {/* Floating Remote Guidance Toolbox */}
          {sessionStatus === 'active' && (
            <div className="absolute bottom-6 bg-slate-900/90 border border-slate-700/80 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 z-30 animate-in slide-in-from-bottom-4">
              {/* Pointer Mode Button */}
              <button
                onClick={() => setToolMode('pointer')}
                className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                  toolMode === 'pointer'
                    ? 'bg-red-600 text-white shadow-lg shadow-red-950'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
                title="مؤشر ليزر حي"
              >
                <MousePointer className="w-4 h-4" />
                <span className="hidden sm:inline">مؤشر ليزري</span>
              </button>

              {/* Pen Annotation Mode */}
              <button
                onClick={() => setToolMode('pen')}
                className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                  toolMode === 'pen'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
                title="قلم التأشير والرسم"
              >
                <PenTool className="w-4 h-4" />
                <span className="hidden sm:inline">قلم توجيه</span>
              </button>

              {toolMode === 'pen' && (
                <div className="flex items-center gap-1.5 px-2 border-r border-slate-700 mr-2">
                  {['#ef4444', '#eab308', '#10b981', '#3b82f6'].map((c) => (
                    <button
                      key={c}
                      onClick={() => setPenColor(c)}
                      className={`w-5 h-5 rounded-full border-2 transition ${
                        penColor === c ? 'scale-125 border-white' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  <button
                    onClick={handleClearAnnotations}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                    title="مسح الرسومات"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="w-px h-6 bg-slate-700 mx-1"></div>

              {/* Snapshot Button */}
              <button
                onClick={handleTakeSnapshot}
                className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition flex items-center gap-1.5 text-xs"
                title="التقاط صورة للشاشة (Screenshot)"
              >
                <Camera className="w-4 h-4 text-blue-400" />
                <span className="hidden sm:inline">لقطة شاشة</span>
              </button>

              {/* Video Recording */}
              <button
                onClick={handleToggleRecord}
                className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                  isRecording
                    ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
                title="تسجيل فيديو للجلسة"
              >
                <Video className="w-4 h-4" />
                <span className="hidden sm:inline">{isRecording ? 'جاري التسجيل...' : 'تسجيل'}</span>
              </button>

              {/* Mic toggle */}
              <button
                onClick={handleToggleMic}
                className={`p-2 rounded-xl text-xs transition ${
                  micActive
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
                title="تحدث بالصوت"
              >
                {micActive ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              </button>

              {/* Chat Toggle */}
              <button
                onClick={() => setShowChat(!showChat)}
                className={`p-2 rounded-xl text-xs transition ${
                  showChat ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`}
                title="المحادثة المباشرة"
              >
                <MessageSquare className="w-4 h-4 text-emerald-400" />
              </button>
            </div>
          )}
        </div>

        {/* Right Sidebar: Quick Directives & Live Chat */}
        {showChat && (
          <aside className="w-full lg:w-80 bg-slate-900 border-t lg:border-t-0 lg:border-r border-slate-800 flex flex-col h-80 lg:h-auto">
            {/* Quick guidance actions */}
            <div className="p-4 border-b border-slate-800">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                توجيهات سريعة بضغطة زر:
              </h4>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { text: '🔍 افتح قائمة الإعدادات', prompt: 'يرجى فتح قائمة الإعدادات (Settings)' },
                  { text: '⬇️ مرر لأسفل الشاشة', prompt: 'مرر لأسفل الشاشة لرؤية بقية الخيارات' },
                  { text: '✅ اضغط على زر التأكيد', prompt: 'اضغط على زر التأكيد أو الموافقة' },
                  { text: '🔙 ارجع خطوة للخلف', prompt: 'قم بالرجوع خطوة للخلف' },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendChat(item.prompt)}
                    className="p-2 bg-slate-800/60 hover:bg-slate-800 text-[11px] text-slate-300 rounded-lg text-right transition border border-slate-700/50 hover:border-emerald-500/50 truncate"
                  >
                    {item.text}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat message history */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 text-xs">
              {chatMessages.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p>المحادثة فارغة</p>
                  <p className="text-[11px]">يمكنك إرسال رسائل أو توجيهات سريعة لتظهر أمامه فوراً</p>
                </div>
              ) : (
                chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-2.5 rounded-xl max-w-[85%] ${
                      msg.sender === 'host'
                        ? 'bg-emerald-600 text-white mr-auto text-right'
                        : 'bg-slate-800 text-slate-200 ml-auto text-right border border-slate-700'
                    }`}
                  >
                    <span className="text-[10px] text-slate-300 block font-semibold mb-0.5">{msg.senderName}:</span>
                    <span>{msg.text}</span>
                  </div>
                ))
              )}
            </div>

            {/* Chat Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendChat();
              }}
              className="p-3 bg-slate-950 border-t border-slate-800 flex gap-2"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="اكتب توجيه أو تعليمات..."
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </aside>
        )}
      </div>
    </div>
  );
};
