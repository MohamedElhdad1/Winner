/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { CreateSessionForm } from './components/CreateSessionForm';
import { HostDashboardView } from './components/HostDashboardView';
import { GuestScreenShareView } from './components/GuestScreenShareView';
import { DualDeviceSimulator } from './components/DualDeviceSimulator';
import { LegalInfoModal } from './components/LegalInfoModal';
import type { SessionConfig } from './types/session';
import { 
  ShieldCheck, 
  Sparkles, 
  Tv, 
  Smartphone, 
  MousePointer, 
  Lock, 
  CheckCircle2, 
  ExternalLink,
  Radio
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'create' | 'simulator'>('create');
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  
  // Router / Mode State
  const [guestSessionId, setGuestSessionId] = useState<string | null>(null);
  const [guestPin, setGuestPin] = useState<string | null>(null);
  const [hostActiveSession, setHostActiveSession] = useState<SessionConfig | null>(null);

  // Check URL parameters on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionParam = params.get('session');
    const pinParam = params.get('pin');
    const modeParam = params.get('mode');

    if (sessionParam) {
      if (modeParam === 'host') {
        // If mode=host, enter host dashboard
        setHostActiveSession({
          id: sessionParam,
          pin: pinParam || '000000',
          title: 'جلسة دعم فني ومشاركة الشاشة',
          message: '',
          hostName: 'المساعد',
          supportCategory: 'دعم',
          allowAudio: true,
          allowDrawAnnotations: true,
          createdAt: Date.now(),
          status: 'waiting',
        });
      } else {
        // Default when someone clicks a shared link: they are the Guest/Participant
        setGuestSessionId(sessionParam);
        if (pinParam) setGuestPin(pinParam);
      }
    }
  }, []);

  // Quick Join by PIN
  const handleJoinByPin = async (pin: string) => {
    try {
      const res = await fetch(`/api/sessions/find?pin=${pin}`);
      if (res.ok) {
        const session: SessionConfig = await res.json();
        setGuestSessionId(session.id);
        setGuestPin(pin);
      } else {
        // Fallback: create virtual guest view with this PIN
        setGuestSessionId(`sess_${pin}`);
        setGuestPin(pin);
      }
    } catch {
      setGuestSessionId(`sess_${pin}`);
      setGuestPin(pin);
    }
  };

  // If in Guest Screen Share Mode (the person opening the link)
  if (guestSessionId) {
    return (
      <GuestScreenShareView
        sessionId={guestSessionId}
        pin={guestPin || undefined}
        onExit={() => {
          setGuestSessionId(null);
          setGuestPin(null);
          // clear query string from url without reload
          window.history.replaceState({}, '', window.location.pathname);
        }}
      />
    );
  }

  // If in Host Controller Mode (the person watching the stream)
  if (hostActiveSession) {
    return (
      <HostDashboardView
        session={hostActiveSession}
        onEndSession={() => {
          setHostActiveSession(null);
          window.history.replaceState({}, '', window.location.pathname);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Cairo',sans-serif]">
      {import.meta.env.VITE_STATIC_DEMO === 'true' && (
        <div role="status" className="mx-4 mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          <strong>نسخة GitHub Pages:</strong> هذه استضافة للواجهة فقط. جلسات المشاركة الحية وتبادل الإشارات لن تعمل على GitHub Pages وحده؛ لا ترسل الرابط باعتباره جلسة دعم مباشرة قبل إعداد خادم اتصال آمن. مشاركة الشاشة لا تبدأ إلا باختيار المستخدم وموافقته من المتصفح.
        </div>
      )}

      {/* Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenLegalInfo={() => setIsLegalModalOpen(true)}
        onJoinByPin={handleJoinByPin}
      />

      {/* Main Content Area */}
      <main className="flex-1 py-8 px-4 sm:px-6 max-w-7xl mx-auto w-full">
        {activeTab === 'create' ? (
          <div className="space-y-12">
            {/* Hero Banner */}
            <div className="text-center max-w-3xl mx-auto pt-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-4 shadow-sm">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>حل قانوني وآمن 100% عبر تقنية WebRTC بموافقة صريحة</span>
              </div>
              
              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight mb-4">
                شارك الشاشة وقدّم الدعم الفني <br />
                <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                  برابط مخصص وموافقة صريحة
                </span>
              </h1>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-6">
                قم بكتابة الرسالة التي تريدها (سواء كانت رسالة دعم فني، أو مفاجأة مسابقة، أو فحص إعدادات). 
                عندما يفتح الطرف الآخر الرابط ويوافق، ستشاهد شاشة هاتفه مباشرة وتستطيع توجيهه بمؤشر ليزري تفاعلي وقلم تأشير كما في أدوات الدعم العالمية.
              </p>

              {/* Feature Highlights Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-right max-w-2xl mx-auto">
                <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs mb-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>موافقة مسبقة ومحمية</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    يعرض المتصفح شاشة التأكيد الرسمية ولا يمكن سحب الشاشة دون موافقته.
                  </p>
                </div>

                <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs mb-1">
                    <MousePointer className="w-4 h-4" />
                    <span>مؤشر ليزري وتوجيه</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    حرك الماوس ليظهر مؤشر ليزري أحمر على شاشته يرشده للزر الصحيح.
                  </p>
                </div>

                <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs mb-1">
                    <Lock className="w-4 h-4" />
                    <span>تشفير P2P مباشر</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    البث مباشر بين الجهازين دون تخزين أي فيديو على سيرفرات خارجية.
                  </p>
                </div>
              </div>
            </div>

            {/* Session Creator Form & Link Generator */}
            <CreateSessionForm
              onSessionCreated={(session) => setHostActiveSession(session)}
              onOpenLegalInfo={() => setIsLegalModalOpen(true)}
            />

            {/* Quick Teaser for Dual Device Simulator */}
            <div className="bg-gradient-to-r from-blue-950/60 to-slate-900 border border-blue-500/30 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
              <div>
                <div className="flex items-center gap-2 text-blue-400 text-xs font-bold mb-2">
                  <Smartphone className="w-4 h-4" />
                  <span>ليس لديك هاتف إضافي الآن؟</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-1">جرب &quot;محاكي الجهازين التفاعلي&quot; مباشرة</h3>
                <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                  افتح المحاكي التفاعلي في نفس الشاشة: هاتف افتراضي على اليمين مع تطبيقات واتساب وفيسبوك والصور، ولوحة تحكمك على اليسار لمشاهدة تفاعل الشاشة في ثوانٍ!
                </p>
              </div>

              <button
                onClick={() => setActiveTab('simulator')}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-xl text-xs sm:text-sm transition shadow-lg shrink-0 flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>فتح المحاكي التفاعلي الآن</span>
              </button>
            </div>
          </div>
        ) : (
          /* Tab 2: Dual Device Simulator */
          <DualDeviceSimulator
            onExit={() => setActiveTab('create')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800/80 py-6 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-500" />
            <span className="text-slate-400 font-semibold">ShareAssist</span>
            <span>— منصة مشاركة الشاشة الآمنة والقانونية للدعم الفني</span>
          </div>
          <button
            onClick={() => setIsLegalModalOpen(true)}
            className="text-slate-400 hover:text-emerald-400 transition underline underline-offset-4"
          >
            الضوابط الأمنية والقانونية لبروتوكول WebRTC
          </button>
        </div>
      </footer>

      {/* Legal & Technical Explanation Modal */}
      <LegalInfoModal
        isOpen={isLegalModalOpen}
        onClose={() => setIsLegalModalOpen(false)}
      />
    </div>
  );
}
