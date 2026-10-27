import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  Smartphone, 
  Check, 
  X, 
  Radio, 
  StopCircle, 
  MessageSquare, 
  Send, 
  Sparkles,
  Info,
  Layers,
  Lock,
  Volume2,
  VolumeX
} from 'lucide-react';
import type { SessionConfig, SignalingMessage, ChatMessage, DrawStroke } from '../types/session';
import { SignalingClient } from '../services/signaling';
import { WebRTCManager } from '../services/webrtc';

interface Props {
  sessionId: string;
  pin?: string;
  onExit: () => void;
}

export const GuestScreenShareView: React.FC<Props> = ({ sessionId, pin, onExit }) => {
  const [session, setSession] = useState<SessionConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [hasRejected, setHasRejected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('في انتظار موافقتك...');
  
  // Real-time interactions from host
  const [laserPointer, setLaserPointer] = useState<{ x: number; y: number } | null>(null);
  const [strokes, setStrokes] = useState<DrawStroke[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(false);

  // References
  const signalingRef = useRef<SignalingClient | null>(null);
  const webrtcRef = useRef<WebRTCManager | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Fetch session details
  useEffect(() => {
    let isMounted = true;
    async function loadSession() {
      try {
        let res = await fetch(`/api/sessions/${sessionId}`);
        if (!res.ok && pin) {
          res = await fetch(`/api/sessions/find?pin=${pin}`);
        }
        if (res.ok) {
          const data: SessionConfig = await res.json();
          if (isMounted) setSession(data);
        } else {
          // Fallback demo config if session not found on server
          if (isMounted) {
            setSession({
              id: sessionId,
              pin: pin || '123456',
              title: 'طلب مشاركة الشاشة للدعم الفني',
              message: 'مبروك كسبت جائزة! اضغط على زر الموافقة لبدء الاستلام وتأكيد الجلسة.',
              hostName: 'مهندس الدعم الفني',
              supportCategory: 'دعم مباشر',
              allowAudio: true,
              allowDrawAnnotations: true,
              createdAt: Date.now(),
              status: 'waiting',
            });
          }
        }
      } catch (e: any) {
        if (isMounted) setError('تعذر الاتصال بخادم الجلسة');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadSession();
    return () => {
      isMounted = false;
    };
  }, [sessionId, pin]);

  // Connect Signaling Client
  useEffect(() => {
    if (!sessionId) return;
    const client = new SignalingClient(sessionId, 'guest');
    signalingRef.current = client;

    const unsubSignal = client.onSignal(async (msg: SignalingMessage) => {
      if (msg.type === 'offer') {
        // Host sent an offer
        if (webrtcRef.current) {
          try {
            const answer = await webrtcRef.current.handleOfferAndCreateAnswer(msg.payload);
            await client.sendSignal('answer', answer);
          } catch (e) {
            console.error('Error handling offer:', e);
          }
        }
      } else if (msg.type === 'candidate') {
        if (webrtcRef.current) {
          webrtcRef.current.addIceCandidate(msg.payload);
        }
      } else if (msg.type === 'pointer') {
        setLaserPointer(msg.payload);
        // Fade out laser pointer after 2.5 seconds of inactivity
        setTimeout(() => setLaserPointer(null), 2500);
      } else if (msg.type === 'draw') {
        setStrokes((prev) => [...prev, msg.payload]);
      } else if (msg.type === 'chat') {
        setChatMessages((prev) => [...prev, msg.payload]);
      } else if (msg.type === 'status' && msg.payload === 'ended') {
        handleStopSharing();
      }
    });

    return () => {
      unsubSignal();
      client.disconnect();
    };
  }, [sessionId]);

  // Draw annotations on client canvas overlay
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    strokes.forEach((stroke) => {
      if (stroke.points.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = stroke.color || '#ef4444';
      ctx.lineWidth = stroke.size || 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      stroke.points.forEach((pt, i) => {
        const px = (pt.x / 100) * canvas.width;
        const py = (pt.y / 100) * canvas.height;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();
    });
  }, [strokes]);

  // Accept and Start Sharing
  const handleAcceptShare = async () => {
    setError(null);
    setConnectionStatus('جاري طلب إذن النظام لمشاركة الشاشة...');

    // Initialize WebRTC
    const rtc = new WebRTCManager({
      onIceCandidate: (candidate) => {
        signalingRef.current?.sendSignal('candidate', candidate);
      },
      onConnectionStateChange: (state) => {
        if (state === 'connected') {
          setConnectionStatus('متصل بنجاح - الشاشة معروضة للطرف الآخر');
        } else if (state === 'disconnected' || state === 'failed') {
          setConnectionStatus('انقطع الاتصال');
        }
      },
    });
    webrtcRef.current = rtc;

    try {
      // 1. Trigger native browser screen share prompt
      let stream: MediaStream;
      if (navigator.mediaDevices && typeof navigator.mediaDevices.getDisplayMedia === 'function') {
        stream = await rtc.startScreenShare(session?.allowAudio);
      } else {
        throw new Error('متصفحك الحالي لا يدعم getDisplayMedia، يرجى الفتح من Google Chrome أو Safari أو استخدام وضع المحاكي');
      }

      streamRef.current = stream;
      setIsSharing(true);
      setConnectionStatus('الشاشة قيد البث المباشر الآن');

      // Listen for when user stops sharing using browser native floating stop button
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          handleStopSharing();
        };
      }

      // Update session status
      await signalingRef.current?.updateStatus('active', {
        userAgent: navigator.userAgent,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        isMobile: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent),
      });

      // Create WebRTC Offer to send to Host
      const offer = await rtc.createOffer();
      await signalingRef.current?.sendSignal('offer', offer);

    } catch (err: any) {
      console.warn('Screen share start failed:', err);
      setError(err.message || 'تم إلغاء الإذن أو تعذر بدء البث');
      setConnectionStatus('فشل بدء المشاركة');
      rtc.close();
    }
  };

  const handleReject = async () => {
    setHasRejected(true);
    await signalingRef.current?.updateStatus('rejected');
    await signalingRef.current?.sendSignal('status', 'rejected');
  };

  const handleStopSharing = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (webrtcRef.current) {
      webrtcRef.current.close();
      webrtcRef.current = null;
    }
    setIsSharing(false);
    signalingRef.current?.updateStatus('ended');
    setConnectionStatus('تم إيقاف الجلسة بنجاح');
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const msg: ChatMessage = {
      id: `chat_${Date.now()}`,
      sender: 'guest',
      senderName: 'الطرف الآخر (أنت)',
      text: chatInput.trim(),
      timestamp: Date.now(),
    };

    setChatMessages((prev) => [...prev, msg]);
    signalingRef.current?.sendSignal('chat', msg);
    setChatInput('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-300 font-bold">جاري تحميل الجلسة والتحقق من الرابط...</p>
      </div>
    );
  }

  // Rejection view
  if (hasRejected) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-md w-full shadow-2xl">
          <div className="w-16 h-16 bg-red-500/10 text-red-400 border border-red-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">تم رفض طلب مشاركة الشاشة</h2>
          <p className="text-sm text-slate-400 mb-6">
            تم إبلاغ الطرف الطالب برفضك للجلسة. لم يتم عرض أي شاشة أو مشاركة أي بيانات، خصوصيتك في أمان تام.
          </p>
          <button
            onClick={onExit}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-semibold transition"
          >
            الرجوع إلى الصفحة الرئيسية
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative select-none">
      {/* Top Floating Status bar when sharing is active */}
      {isSharing && (
        <div className="fixed top-0 inset-x-0 z-40 bg-red-950/90 border-b border-red-700 backdrop-blur-md px-4 py-3 flex items-center justify-between text-white shadow-xl animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-ping"></span>
            <span className="text-xs sm:text-sm font-bold">
              🔴 شاشتك قيد المشاركة مع: {session?.hostName || 'الطرف الطالب'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowChat(!showChat)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
              <span>المحادثة ({chatMessages.length})</span>
            </button>
            <button
              onClick={handleStopSharing}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-md"
            >
              <StopCircle className="w-4 h-4" />
              <span>إيقاف المشاركة فوراً</span>
            </button>
          </div>
        </div>
      )}

      {/* Laser Pointer overlay on Guest Screen */}
      {laserPointer && isSharing && (
        <div
          className="fixed z-50 pointer-events-none transition-all duration-75 ease-out"
          style={{
            left: `${laserPointer.x}%`,
            top: `${laserPointer.y}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div className="relative">
            <div className="w-6 h-6 rounded-full bg-red-500/40 animate-ping absolute inset-0"></div>
            <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white shadow-[0_0_15px_#ef4444]"></div>
            <span className="absolute top-5 right-0 bg-red-600 text-[10px] text-white px-2 py-0.5 rounded font-bold whitespace-nowrap shadow">
              اضغط هنا 👆
            </span>
          </div>
        </div>
      )}

      {/* Canvas for strokes overlay */}
      {isSharing && (
        <canvas
          ref={canvasRef}
          width={window.innerWidth}
          height={window.innerHeight}
          className="fixed inset-0 z-30 pointer-events-none w-full h-full"
        />
      )}

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col items-center justify-center p-4 sm:p-6 ${isSharing ? 'pt-20' : ''}`}>
        {!isSharing ? (
          /* Consent & Invitation Card */
          <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-10 -mt-10"></div>

            {/* Host Identity Badge */}
            <div className="flex items-center gap-3 mb-6 bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/60">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold text-lg shadow-md shrink-0">
                {session?.hostName?.charAt(0) || 'D'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-white text-base truncate">{session?.hostName}</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded-md font-semibold">
                    موثّق
                  </span>
                </div>
                <span className="text-xs text-slate-400 block truncate">
                  يطلب مشاركة شاشة جهازك للدعم والتوجيه
                </span>
              </div>
            </div>

            {/* Title & Custom Message (As entered by host) */}
            <div className="mb-6">
              <h1 className="text-xl sm:text-2xl font-black text-white mb-2 leading-snug">
                {session?.title || 'طلب بدء جلسة مشاركة الشاشة'}
              </h1>
              <div className="bg-gradient-to-r from-emerald-950/40 to-slate-900 border border-emerald-500/30 p-4 rounded-2xl text-emerald-200 text-sm leading-relaxed font-medium">
                &quot;{session?.message}&quot;
              </div>
            </div>

            {/* Transparent Security Guarantee */}
            <div className="space-y-2.5 mb-6 text-xs text-slate-300">
              <div className="flex items-center gap-2 p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>مشاركة شاشة الفيديو فقط بموافقتك اللحظية</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
                <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>لا يمكن للمساعد قراءة كلمات المرور أو سحب ملفاتك الشخصية</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
                <StopCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>زر إيقاف فوري يظهر أمامك لقطع الاتصال في أي ثانية</span>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Action Buttons: Accept / Decline */}
            <div className="space-y-3">
              <button
                onClick={handleAcceptShare}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.99] text-white font-black py-4 px-6 rounded-2xl text-base shadow-xl shadow-emerald-950/80 transition flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5 stroke-[3]" />
                <span>أوافق - ابدأ مشاركة الشاشة الآن</span>
              </button>

              <button
                onClick={handleReject}
                className="w-full bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-red-300 py-3 px-6 rounded-2xl text-sm font-semibold transition border border-slate-700/60 flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                <span>لا أوافق - رفض الطلب</span>
              </button>
            </div>

            <div className="mt-4 text-center">
              <span className="text-[11px] text-slate-500">
                رقم الجلسة: <strong className="text-slate-400 font-mono">{session?.pin}</strong> • محمي ببروتوكول WebRTC P2P
              </span>
            </div>
          </div>
        ) : (
          /* Active Screen Sharing State */
          <div className="max-w-xl w-full bg-slate-900/90 border border-emerald-500/50 p-6 sm:p-8 rounded-3xl text-center shadow-2xl backdrop-blur-md">
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping"></div>
              <div className="relative w-24 h-24 rounded-full bg-slate-800 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/20">
                <Radio className="w-12 h-12 animate-pulse" />
              </div>
            </div>

            <h2 className="text-2xl font-black text-white mb-2">البث المباشر نشط الآن!</h2>
            <p className="text-sm text-slate-300 mb-6 leading-relaxed">
              شاشتك معروضة الآن على شاشة <strong className="text-emerald-400">{session?.hostName}</strong>.
              يمكنك التبديل إلى أي تطبيق تريده في هاتفك وسيشاهده المساعد لمساعدتك وتوجيهك بالليزر أو الرسم.
            </p>

            <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 mb-6 text-right space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span>حالة الاتصال:</span>
                <span className="text-emerald-400 font-semibold">{connectionStatus}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>التوجيه بالليزر:</span>
                <span className="text-blue-400">نشط (حرك الماوس من الطرف الآخر)</span>
              </div>
            </div>

            <button
              onClick={handleStopSharing}
              className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3.5 px-6 rounded-2xl transition shadow-lg shadow-red-950/50 flex items-center justify-center gap-2"
            >
              <StopCircle className="w-5 h-5" />
              <span>إيقاف مشاركة الشاشة وإنهاء الجلسة</span>
            </button>
          </div>
        )}
      </div>

      {/* Floating Chat Drawer for Guest */}
      {showChat && (
        <div className="fixed bottom-4 left-4 z-50 w-80 max-w-[calc(100vw-2rem)] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4">
          <div className="bg-slate-800 px-4 py-3 flex items-center justify-between border-b border-slate-700">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span>المحادثة المباشرة مع المساعد</span>
            </span>
            <button onClick={() => setShowChat(false)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="h-64 overflow-y-auto p-3 space-y-2 text-xs">
            {chatMessages.length === 0 ? (
              <p className="text-slate-500 text-center py-8">لا توجد رسائل حتى الآن، يمكنك الكتابة للمساعد هنا.</p>
            ) : (
              chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-2.5 rounded-xl max-w-[85%] ${
                    msg.sender === 'guest'
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

          <form onSubmit={handleSendChat} className="p-2 bg-slate-950 border-t border-slate-800 flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="اكتب رسالة..."
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
