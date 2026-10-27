import React, { useState } from 'react';
import { 
  Radio, 
  HelpCircle, 
  Smartphone, 
  PlusCircle, 
  ArrowRight, 
  ShieldCheck,
  Search
} from 'lucide-react';

interface Props {
  activeTab: 'create' | 'simulator';
  setActiveTab: (tab: 'create' | 'simulator') => void;
  onOpenLegalInfo: () => void;
  onJoinByPin: (pin: string) => void;
}

export const Header: React.FC<Props> = ({
  activeTab,
  setActiveTab,
  onOpenLegalInfo,
  onJoinByPin,
}) => {
  const [pinInput, setPinInput] = useState('');

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim().length >= 4) {
      onJoinByPin(pinInput.trim());
    }
  };

  return (
    <header className="bg-slate-900/90 border-b border-slate-800 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-950/50">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg text-white tracking-tight">ShareAssist</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                WebRTC P2P
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              منصة مشاركة الشاشة والدعم الفني القانونية بموافقة المستخدم
            </p>
          </div>
        </div>

        {/* Center: Tabs */}
        <div className="hidden md:flex items-center bg-slate-950 p-1 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'create'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>إنشاء رابط مخصص</span>
          </button>

          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'simulator'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>محاكي الجهازين التفاعلي</span>
          </button>
        </div>

        {/* Right side: PIN join + Legal info */}
        <div className="flex items-center gap-2">
          {/* Quick PIN join */}
          <form onSubmit={handlePinSubmit} className="hidden sm:flex items-center bg-slate-950 border border-slate-800 rounded-xl px-2 py-1 focus-within:border-emerald-500">
            <input
              type="text"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="أدخل رمز الـ PIN..."
              className="bg-transparent text-xs text-white placeholder-slate-500 w-28 focus:outline-none text-center font-mono"
              maxLength={8}
            />
            <button
              type="submit"
              disabled={!pinInput.trim()}
              className="p-1 text-slate-400 hover:text-emerald-400 disabled:opacity-30"
              title="دخول الجلسة"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </form>

          <button
            onClick={onOpenLegalInfo}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white text-xs font-semibold rounded-xl transition"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">شرح تقني وقانوني</span>
          </button>
        </div>
      </div>

      {/* Mobile subtabs */}
      <div className="flex md:hidden border-t border-slate-800 px-4 py-2 bg-slate-950/60 justify-center gap-2 text-xs">
        <button
          onClick={() => setActiveTab('create')}
          className={`flex-1 py-1.5 rounded-xl font-bold transition text-center ${
            activeTab === 'create' ? 'bg-emerald-600 text-white' : 'text-slate-400'
          }`}
        >
          إنشاء رابط
        </button>
        <button
          onClick={() => setActiveTab('simulator')}
          className={`flex-1 py-1.5 rounded-xl font-bold transition text-center ${
            activeTab === 'simulator' ? 'bg-emerald-600 text-white' : 'text-slate-400'
          }`}
        >
          المحاكي التفاعلي
        </button>
      </div>
    </header>
  );
};
