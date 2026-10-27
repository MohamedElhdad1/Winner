import React, { useState, useEffect, useRef } from 'react';
import { 
  Smartphone, 
  Send, 
  MessageCircle, 
  Settings, 
  Image, 
  Home, 
  Camera, 
  Bell, 
  Check, 
  X, 
  Radio, 
  MousePointer, 
  PenTool, 
  Trash2, 
  Download,
  AlertTriangle,
  Lock,
  StopCircle,
  Eye,
  RefreshCw
} from 'lucide-react';
import type { DrawStroke } from '../types/session';

interface Props {
  initialTitle?: string;
  initialMessage?: string;
  onExit: () => void;
}

export const DualDeviceSimulator: React.FC<Props> = ({ 
  initialTitle = 'مبروك كسبت جائزة مميزة!', 
  initialMessage = 'مبروك كسبت كيس قلبظ! دوس علي زر الموافقة لمشاركة الشاشة واستلام الهدية وتأكيد الحساب.', 
  onExit 
}) => {
  // Simulator State
  const [phoneAccepted, setPhoneAccepted] = useState(false);
  const [phoneRejected, setPhoneRejected] = useState(false);
  const [activeApp, setActiveApp] = useState<'home' | 'whatsapp' | 'facebook' | 'settings' | 'gallery'>('home');
  const [whatsappChat, setWhatsappChat] = useState<string[]>(['أهلاً بك! كيف حالك؟', 'تمام الحمد لله، شفت المسابقة الجديدة؟']);
  const [whatsappInput, setWhatsappInput] = useState('');
  
  // Host Tool state
  const [hostTool, setHostTool] = useState<'pointer' | 'pen'>('pointer');
  const [penColor, setPenColor] = useState('#ef4444');
  const [laserPos, setLaserPos] = useState<{ x: number; y: number } | null>(null);
  const [strokes, setStrokes] = useState<DrawStroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<{ x: number; y: number }[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  
  // Custom message inputs for simulator testing
  const [title, setTitle] = useState(initialTitle);
  const [message, setMessage] = useState(initialMessage);

  const phoneScreenRef = useRef<HTMLDivElement | null>(null);

  // Send pointer
  const handleHostMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!phoneAccepted) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    if (hostTool === 'pointer') {
      setLaserPos({ x, y });
    } else if (hostTool === 'pen' && isDrawing) {
      setCurrentStroke((prev) => [...prev, { x, y }]);
    }
  };

  const handleHostMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (hostTool !== 'pen' || !phoneAccepted) return;
    setIsDrawing(true);
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setCurrentStroke([{ x, y }]);
  };

  const handleHostMouseUp = () => {
    if (hostTool === 'pen' && isDrawing && currentStroke.length > 1) {
      setStrokes((prev) => [...prev, { color: penColor, size: 4, points: currentStroke }]);
    }
    setIsDrawing(false);
    setCurrentStroke([]);
  };

  const resetSimulator = () => {
    setPhoneAccepted(false);
    setPhoneRejected(false);
    setActiveApp('home');
    setStrokes([]);
    setLaserPos(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Bar */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-tr from-blue-600 to-emerald-500 rounded-xl text-white shadow-md">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>محاكي الجهازين التفاعلي المباشر (Dual Device Live Simulator)</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                شاشة تفاعلية كاملة
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              جرب بنفسك: انقر على هاتف الضحية/الزائر على اليمين وشاهد كيف تنعكس شاشته لحظياً على لوحة تحكمك على اليسار!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={resetSimulator}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border border-slate-700"
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
            <span>إعادة التجربة من البداية</span>
          </button>
          <button
            onClick={onExit}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
          >
            الخروج
          </button>
        </div>
      </header>

      {/* Simulator Body (2 Columns) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 sm:p-6 max-w-7xl mx-auto w-full items-start">
        
        {/* LEFT COLUMN: Host View (You) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col h-[740px]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              <h3 className="text-sm font-bold text-white">لوحة تحكمك (Host Monitor)</h3>
            </div>
            <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold border ${
              phoneAccepted 
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' 
                : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
            }`}>
              {phoneAccepted ? '🟢 البث المباشر نشط (60 FPS)' : '⏳ في انتظار ضغط الطرف الآخر على أوافق'}
            </span>
          </div>

          {/* Screen mirror viewport */}
          <div 
            className="flex-1 bg-black rounded-2xl relative overflow-hidden border border-slate-800 flex items-center justify-center cursor-crosshair select-none"
            onMouseMove={handleHostMouseMove}
            onMouseDown={handleHostMouseDown}
            onMouseUp={handleHostMouseUp}
          >
            {!phoneAccepted ? (
              <div className="text-center p-6 text-slate-400 max-w-xs">
                <Radio className="w-10 h-10 mx-auto mb-3 text-slate-600 animate-pulse" />
                <p className="text-xs font-bold text-slate-300 mb-1">لا يوجد بث شاشة حالياً</p>
                <p className="text-[11px] text-slate-500">
                  انظر إلى شاشة الهاتف على اليمين واضغط على &quot;أوافق - بدء مشاركة الشاشة&quot; لترى شاشته تنبثق هنا فوراً!
                </p>
              </div>
            ) : (
              /* Mirrored Phone Display on Host */
              <div className="w-[320px] h-[580px] bg-slate-900 rounded-[35px] border-4 border-slate-800 overflow-hidden relative shadow-2xl flex flex-col pointer-events-none select-none">
                {/* Mirroring Content */}
                <div className="bg-slate-950 px-4 py-2 flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800">
                  <span>9:41</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px]">5G</span>
                    <span className="w-3 h-2 border border-slate-400 rounded-sm inline-block"></span>
                  </div>
                </div>

                <div className="flex-1 p-3 overflow-y-auto bg-slate-900">
                  {activeApp === 'home' && (
                    <div className="h-full flex flex-col justify-between">
                      <div className="text-center mt-6">
                        <div className="text-3xl font-black text-white">09:41</div>
                        <div className="text-xs text-slate-400">الثلاثاء، 27 أكتوبر</div>
                      </div>
                      <div className="grid grid-cols-4 gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow">
                            <MessageCircle className="w-6 h-6" />
                          </div>
                          <span className="text-[10px] text-slate-300 mt-1">واتساب</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow">
                            <Bell className="w-6 h-6" />
                          </div>
                          <span className="text-[10px] text-slate-300 mt-1">فيسبوك</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center text-white shadow">
                            <Image className="w-6 h-6" />
                          </div>
                          <span className="text-[10px] text-slate-300 mt-1">الصور</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <div className="w-12 h-12 bg-slate-700 rounded-2xl flex items-center justify-center text-white shadow">
                            <Settings className="w-6 h-6" />
                          </div>
                          <span className="text-[10px] text-slate-300 mt-1">الإعدادات</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeApp === 'whatsapp' && (
                    <div className="space-y-2">
                      <div className="bg-emerald-700 text-white p-2 rounded-xl text-xs font-bold flex items-center justify-between">
                        <span>محادثة واتساب: أحمد علي</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-300"></span>
                      </div>
                      {whatsappChat.map((msg, idx) => (
                        <div key={idx} className={`p-2 rounded-xl text-xs max-w-[80%] ${idx % 2 === 0 ? 'bg-slate-800 text-slate-200' : 'bg-emerald-600 text-white mr-auto'}`}>
                          {msg}
                        </div>
                      ))}
                    </div>
                  )}

                  {activeApp === 'facebook' && (
                    <div className="space-y-3">
                      <div className="bg-blue-600 text-white p-2 rounded-xl text-xs font-bold">
                        أخبار ومنشورات فيسبوك
                      </div>
                      <div className="bg-slate-800 p-2.5 rounded-xl text-xs">
                        <strong className="text-blue-300 block mb-1">أحمد محمد:</strong>
                        <p className="text-slate-300">يوم رائع جداً مع الأصدقاء! 🌟</p>
                      </div>
                      <div className="bg-slate-800 p-2.5 rounded-xl text-xs">
                        <strong className="text-blue-300 block mb-1">عالم التكنولوجيا:</strong>
                        <p className="text-slate-300">إطلاق ميزات جديدة للهواتف الذكية هذا الشهر.</p>
                      </div>
                    </div>
                  )}

                  {activeApp === 'settings' && (
                    <div className="space-y-2 text-xs">
                      <div className="bg-slate-800 p-2 rounded-xl font-bold text-white">إعدادات الهاتف</div>
                      <div className="p-2 bg-slate-800/60 rounded-xl flex justify-between">
                        <span>شبكة Wi-Fi</span>
                        <span className="text-emerald-400 font-bold">متصل</span>
                      </div>
                      <div className="p-2 bg-slate-800/60 rounded-xl flex justify-between">
                        <span>البلوتوث Bluetooth</span>
                        <span className="text-slate-400">غير مفعل</span>
                      </div>
                      <div className="p-2 bg-slate-800/60 rounded-xl flex justify-between">
                        <span>البطارية</span>
                        <span className="text-emerald-400 font-bold">88%</span>
                      </div>
                    </div>
                  )}

                  {activeApp === 'gallery' && (
                    <div>
                      <div className="bg-slate-800 p-2 rounded-xl font-bold text-xs mb-2">ألبوم الصور الشخصية</div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="h-20 bg-gradient-to-tr from-pink-600 to-purple-700 rounded-xl flex items-center justify-center text-xs text-white">صورة 1</div>
                        <div className="h-20 bg-gradient-to-tr from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center text-xs text-white">صورة 2</div>
                        <div className="h-20 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-xl flex items-center justify-center text-xs text-white">صورة 3</div>
                        <div className="h-20 bg-gradient-to-tr from-amber-600 to-orange-500 rounded-xl flex items-center justify-center text-xs text-white">صورة 4</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Laser pointer on host view */}
            {laserPos && phoneAccepted && (
              <div 
                className="absolute pointer-events-none z-30 transition-transform duration-75"
                style={{ left: `${laserPos.x}%`, top: `${laserPos.y}%`, transform: 'translate(-50%, -50%)' }}
              >
                <div className="w-5 h-5 rounded-full bg-red-500/50 animate-ping absolute inset-0"></div>
                <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white shadow-[0_0_15px_#ef4444]"></div>
              </div>
            )}
          </div>

          {/* Host Toolbox */}
          {phoneAccepted && (
            <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setHostTool('pointer')}
                  className={`p-2 rounded-xl font-bold flex items-center gap-1.5 transition ${
                    hostTool === 'pointer' ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  <MousePointer className="w-3.5 h-3.5" />
                  <span>مؤشر ليزري</span>
                </button>
                <button
                  onClick={() => setHostTool('pen')}
                  className={`p-2 rounded-xl font-bold flex items-center gap-1.5 transition ${
                    hostTool === 'pen' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  <PenTool className="w-3.5 h-3.5" />
                  <span>قلم توجيه</span>
                </button>
                {hostTool === 'pen' && (
                  <button
                    onClick={() => setStrokes([])}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <span className="text-[11px] text-slate-400">
                حرك الماوس على الشاشة السوداء ليظهر الليزر على هاتف الزائر 👆
              </span>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: The Target Phone (Guest) */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-2 px-2">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span>هاتف الطرف الآخر (Virtual Smartphone)</span>
            </span>
            <span className="text-[10px] text-slate-400">هاتف تفاعلي حقيقي</span>
          </div>

          {/* Physical Phone Case Frame */}
          <div 
            ref={phoneScreenRef}
            className="w-[340px] h-[690px] bg-slate-950 rounded-[48px] p-3 border-4 border-slate-700 shadow-2xl relative flex flex-col overflow-hidden"
          >
            {/* Notch */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-5 bg-slate-900 rounded-full z-40 pointer-events-none flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-950 mr-2"></div>
              <div className="w-2 h-2 rounded-full bg-blue-950"></div>
            </div>

            {/* Phone Screen Container */}
            <div className="w-full h-full bg-slate-900 rounded-[38px] overflow-hidden flex flex-col relative">
              {/* Laser Pointer overlay on the phone */}
              {laserPos && phoneAccepted && (
                <div 
                  className="absolute pointer-events-none z-50 transition-all duration-75"
                  style={{ left: `${laserPos.x}%`, top: `${laserPos.y}%`, transform: 'translate(-50%, -50%)' }}
                >
                  <div className="w-6 h-6 rounded-full bg-red-500/40 animate-ping absolute inset-0"></div>
                  <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white shadow-[0_0_15px_#ef4444]"></div>
                  <span className="absolute top-4 right-0 bg-red-600 text-[9px] text-white px-1.5 py-0.5 rounded font-bold whitespace-nowrap shadow">
                    اضغط هنا 👆
                  </span>
                </div>
              )}

              {/* Status Bar */}
              <div className="bg-slate-950 px-5 pt-2 pb-1.5 flex items-center justify-between text-[11px] text-slate-400 z-30">
                <span className="font-bold text-white">09:41</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono text-emerald-400">5G</span>
                  <div className="w-4 h-2 border border-slate-400 rounded-sm p-0.5 flex items-center">
                    <div className="h-full w-full bg-emerald-400 rounded-2xs"></div>
                  </div>
                </div>
              </div>

              {/* Case A: Consent Card Pop-up before agreeing */}
              {!phoneAccepted && !phoneRejected ? (
                <div className="flex-1 p-4 flex flex-col justify-center bg-slate-950/90 text-right z-30">
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
                    <div className="flex items-center gap-2 mb-3 bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20">
                      <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-xs">
                        د
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">الدعم الفني المباشر</div>
                        <div className="text-[10px] text-emerald-400">طلب موثّق</div>
                      </div>
                    </div>

                    <h4 className="text-sm font-bold text-white mb-2">{title}</h4>
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-emerald-300 mb-4 leading-relaxed">
                      &quot;{message}&quot;
                    </div>

                    <div className="space-y-1.5 text-[10px] text-slate-400 mb-4">
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>مشاركة شاشة الفيديو فقط بموافقتك</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-emerald-400" />
                        <span>لا وصول لكلمات المرور أو الملفات</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <button
                        onClick={() => setPhoneAccepted(true)}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition shadow-lg shadow-emerald-950 flex items-center justify-center gap-2"
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>أوافق - ابدأ مشاركة الشاشة</span>
                      </button>
                      <button
                        onClick={() => setPhoneRejected(true)}
                        className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-xl text-xs transition"
                      >
                        لا أوافق - رفض الطلب
                      </button>
                    </div>
                  </div>
                </div>
              ) : phoneRejected ? (
                <div className="flex-1 p-6 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 bg-red-500/10 text-red-400 rounded-xl flex items-center justify-center mb-3">
                    <X className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-white text-sm mb-1">تم رفض الطلب</h4>
                  <p className="text-xs text-slate-400 mb-4">لم يتم عرض أي شاشة وحسابك في أمان.</p>
                  <button
                    onClick={() => setPhoneRejected(false)}
                    className="text-xs text-emerald-400 hover:underline"
                  >
                    إعادة تجربة الطلب
                  </button>
                </div>
              ) : (
                /* Case B: Interactive Phone OS while Sharing */
                <div className="flex-1 flex flex-col justify-between overflow-hidden">
                  {/* Top Red Streaming Indicator Banner */}
                  <div className="bg-red-900/90 text-white px-3 py-1.5 flex items-center justify-between text-[10px] font-bold border-b border-red-700">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-400 animate-ping"></span>
                      <span>🔴 البث نشط للمساعد</span>
                    </span>
                    <button
                      onClick={() => setPhoneAccepted(false)}
                      className="px-2 py-0.5 bg-red-700 hover:bg-red-600 rounded text-[9px]"
                    >
                      إيقاف
                    </button>
                  </div>

                  {/* Active App Screen */}
                  <div className="flex-1 p-3 overflow-y-auto">
                    {activeApp === 'home' && (
                      <div className="h-full flex flex-col justify-between py-2">
                        <div className="text-center">
                          <div className="text-3xl font-black text-white">09:41</div>
                          <div className="text-xs text-slate-400">الثلاثاء، 27 أكتوبر</div>
                        </div>

                        {/* Interactive App Icons */}
                        <div className="space-y-4">
                          <p className="text-[10px] text-center text-emerald-400 font-semibold">
                            👇 اضغط على أي تطبيق لفتحه وتجربة انعكاسه:
                          </p>
                          <div className="grid grid-cols-4 gap-2 text-center">
                            <button
                              onClick={() => setActiveApp('whatsapp')}
                              className="flex flex-col items-center p-1 rounded-xl hover:bg-slate-800 transition group"
                            >
                              <div className="w-12 h-12 bg-emerald-600 group-hover:scale-105 rounded-2xl flex items-center justify-center text-white shadow">
                                <MessageCircle className="w-6 h-6" />
                              </div>
                              <span className="text-[10px] text-slate-200 mt-1 font-bold">واتساب</span>
                            </button>

                            <button
                              onClick={() => setActiveApp('facebook')}
                              className="flex flex-col items-center p-1 rounded-xl hover:bg-slate-800 transition group"
                            >
                              <div className="w-12 h-12 bg-blue-600 group-hover:scale-105 rounded-2xl flex items-center justify-center text-white shadow">
                                <Bell className="w-6 h-6" />
                              </div>
                              <span className="text-[10px] text-slate-200 mt-1 font-bold">فيسبوك</span>
                            </button>

                            <button
                              onClick={() => setActiveApp('gallery')}
                              className="flex flex-col items-center p-1 rounded-xl hover:bg-slate-800 transition group"
                            >
                              <div className="w-12 h-12 bg-purple-600 group-hover:scale-105 rounded-2xl flex items-center justify-center text-white shadow">
                                <Image className="w-6 h-6" />
                              </div>
                              <span className="text-[10px] text-slate-200 mt-1 font-bold">الصور</span>
                            </button>

                            <button
                              onClick={() => setActiveApp('settings')}
                              className="flex flex-col items-center p-1 rounded-xl hover:bg-slate-800 transition group"
                            >
                              <div className="w-12 h-12 bg-slate-700 group-hover:scale-105 rounded-2xl flex items-center justify-center text-white shadow">
                                <Settings className="w-6 h-6" />
                              </div>
                              <span className="text-[10px] text-slate-200 mt-1 font-bold">الإعدادات</span>
                            </button>
                          </div>
                        </div>

                        <div className="text-[10px] text-slate-500 text-center">
                          شاشتك تنعكس في الجهة المقابلة بالكامل
                        </div>
                      </div>
                    )}

                    {/* WhatsApp mock */}
                    {activeApp === 'whatsapp' && (
                      <div className="h-full flex flex-col justify-between text-right">
                        <div>
                          <div className="bg-emerald-700 text-white p-2 rounded-xl text-xs font-bold mb-2 flex items-center justify-between">
                            <span>محادثة واتساب: أحمد علي</span>
                            <button onClick={() => setActiveApp('home')} className="text-[10px] bg-emerald-800 px-2 py-0.5 rounded">خروج</button>
                          </div>
                          <div className="space-y-2">
                            {whatsappChat.map((m, i) => (
                              <div key={i} className={`p-2 rounded-xl text-xs max-w-[85%] ${i % 2 === 0 ? 'bg-slate-800 text-slate-200' : 'bg-emerald-600 text-white mr-auto'}`}>
                                {m}
                              </div>
                            ))}
                          </div>
                        </div>
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            if (whatsappInput.trim()) {
                              setWhatsappChat([...whatsappChat, whatsappInput.trim()]);
                              setWhatsappInput('');
                            }
                          }}
                          className="flex gap-1 pt-2 border-t border-slate-800"
                        >
                          <input
                            type="text"
                            value={whatsappInput}
                            onChange={(e) => setWhatsappInput(e.target.value)}
                            placeholder="اكتب في واتساب..."
                            className="flex-1 bg-slate-800 text-xs px-2 py-1.5 rounded-lg text-white"
                          />
                          <button type="submit" className="p-1.5 bg-emerald-600 text-white rounded-lg">
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </form>
                      </div>
                    )}

                    {/* Facebook mock */}
                    {activeApp === 'facebook' && (
                      <div className="space-y-3 text-right">
                        <div className="bg-blue-600 text-white p-2 rounded-xl text-xs font-bold flex justify-between">
                          <span>تطبيق فيسبوك</span>
                          <button onClick={() => setActiveApp('home')} className="text-[10px] bg-blue-700 px-2 py-0.5 rounded">خروج</button>
                        </div>
                        <div className="bg-slate-800 p-2.5 rounded-xl text-xs">
                          <strong className="text-blue-300 block mb-1">أحمد محمد:</strong>
                          <p className="text-slate-300">يوم رائع جداً مع الأصدقاء! 🌟</p>
                        </div>
                        <div className="bg-slate-800 p-2.5 rounded-xl text-xs">
                          <strong className="text-blue-300 block mb-1">عالم التكنولوجيا:</strong>
                          <p className="text-slate-300">إطلاق ميزات جديدة للهواتف الذكية هذا الشهر.</p>
                        </div>
                      </div>
                    )}

                    {/* Settings mock */}
                    {activeApp === 'settings' && (
                      <div className="space-y-2 text-xs text-right">
                        <div className="bg-slate-800 p-2 rounded-xl font-bold text-white flex justify-between">
                          <span>إعدادات الهاتف</span>
                          <button onClick={() => setActiveApp('home')} className="text-[10px] bg-slate-700 px-2 py-0.5 rounded">خروج</button>
                        </div>
                        <div className="p-2 bg-slate-800/60 rounded-xl flex justify-between">
                          <span>شبكة Wi-Fi</span>
                          <span className="text-emerald-400 font-bold">متصل</span>
                        </div>
                        <div className="p-2 bg-slate-800/60 rounded-xl flex justify-between">
                          <span>البلوتوث Bluetooth</span>
                          <span className="text-slate-400">غير مفعل</span>
                        </div>
                        <div className="p-2 bg-slate-800/60 rounded-xl flex justify-between">
                          <span>البطارية</span>
                          <span className="text-emerald-400 font-bold">88%</span>
                        </div>
                      </div>
                    )}

                    {/* Gallery mock */}
                    {activeApp === 'gallery' && (
                      <div className="text-right">
                        <div className="bg-slate-800 p-2 rounded-xl font-bold text-xs mb-2 flex justify-between">
                          <span>ألبوم الصور الشخصية</span>
                          <button onClick={() => setActiveApp('home')} className="text-[10px] bg-slate-700 px-2 py-0.5 rounded">خروج</button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="h-20 bg-gradient-to-tr from-pink-600 to-purple-700 rounded-xl flex items-center justify-center text-xs text-white">صورة 1</div>
                          <div className="h-20 bg-gradient-to-tr from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center text-xs text-white">صورة 2</div>
                          <div className="h-20 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-xl flex items-center justify-center text-xs text-white">صورة 3</div>
                          <div className="h-20 bg-gradient-to-tr from-amber-600 to-orange-500 rounded-xl flex items-center justify-center text-xs text-white">صورة 4</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Phone Bottom Navigation Bar */}
                  <div className="bg-slate-950 p-2 flex items-center justify-around border-t border-slate-800 text-slate-400 z-30">
                    <button
                      onClick={() => setActiveApp('home')}
                      className="p-1 hover:text-white"
                      title="الرئيسية"
                    >
                      <Home className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
