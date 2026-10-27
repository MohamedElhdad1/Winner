import React from 'react';
import { ShieldCheck, AlertTriangle, Lock, Smartphone, CheckCircle, Info, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const LegalInfoModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl relative text-right">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-4">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">كيف تعمل مشاركة الشاشة قانونياً وتقنياً؟</h2>
            <p className="text-sm text-slate-400">فهم الفرق بين تقنيات الويب وتطبيقات مثل AnyDesk و TeamViewer</p>
          </div>
        </div>

        <div className="space-y-5 text-sm leading-relaxed text-slate-300">
          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60">
            <h3 className="font-bold text-white flex items-center gap-2 mb-2 text-base">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              1. الموافقة الصريحة في المتصفح (WebRTC Consent)
            </h3>
            <p>
              تفرض جميع متصفحات الإنترنت الحديثة (Google Chrome, Safari, Firefox, Edge) بروتوكول أمان صارم:
              <strong className="text-emerald-300"> لا يمكن لأي موقع سحب شاشة المستخدم دون موافقته الصريحة </strong>
              عبر نافذة النظام الرسمية (System Dialog). لهذا السبب، عندما يضغط الطرف الآخر على &quot;أوافق&quot;، يظهر له خيار النظام لاختيار شاشة الهاتف أو النافذة التي يريد مشاركتها.
            </p>
          </div>

          <div className="bg-amber-500/10 p-4 rounded-xl border border-amber-500/30">
            <h3 className="font-bold text-amber-300 flex items-center gap-2 mb-2 text-base">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              2. لماذا لا يمكن لموقع ويب التحكم في تطبيقات الهاتف الأخرى (مثل واتساب وفيسبوك)؟
            </h3>
            <p className="text-slate-200">
              أنظمة تشغيل الهواتف (Android و iOS) تطبق نظام العزل الأمني <span className="text-amber-200 font-mono">(Sandboxing)</span>. 
              تطبيقات مثل <strong>AnyDesk</strong> أو <strong>TeamViewer</strong> لا تعمل من متصفح الويب العادي، بل تتطلب تحميل تطبيق أصلي (Native App) من المتجر مع تفعيل صلاحيات نظام متقدمة تسمى <span className="font-mono text-amber-200">Accessibility Service</span>.
            </p>
          </div>

          <div className="bg-blue-500/10 p-4 rounded-xl border border-blue-500/30">
            <h3 className="font-bold text-blue-300 flex items-center gap-2 mb-2 text-base">
              <Smartphone className="w-5 h-5 text-blue-400" />
              3. الحل التقني الذكي في هذا التطبيق: &quot;التوجيه البصري التفاعلي&quot;
            </h3>
            <p className="text-slate-200">
              لتحقيق نفس هدف المساعدة الفنية بشكل آمن وقانوني عبر المتصفح:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1.5 text-slate-300 mr-2">
              <li><strong>مؤشر ليزر حي (Live Laser Pointer):</strong> حرك الماوس على الشاشة ليظهر مؤشر متوهج ينبه المستخدم لمكان الضغط.</li>
              <li><strong>الرسم والتأشير (Pen Annotations):</strong> ارسم دوائر وأسهم توجيهية فوق شاشته لترشده للزر المطلوب.</li>
              <li><strong>محادثة صوتية وكتابية فورية:</strong> توجيه مباشر بالصوت أو النص.</li>
              <li><strong>التحكم في إنهاء الجلسة:</strong> يستطيع أي طرف إنهاء البث فوراً في أي ثانية.</li>
            </ul>
          </div>

          <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/40 flex items-start gap-3">
            <Lock className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-400">
              الاتصال مشفر طرفياً (P2P Encrypted) عبر بروتوكول WebRTC القياسي ولا يتم تخزين أي فيديوهات أو صور على خوادم خارجية إلا إذا قمت أنت بتحميلها محلياً على جهازك.
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition shadow-lg shadow-emerald-950"
          >
            فهمت ذلك، شكراً لك
          </button>
        </div>
      </div>
    </div>
  );
};
