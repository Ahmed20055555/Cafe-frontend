"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaClock } from 'react-icons/fa';
import api from '@/lib/api';
import { useSettings } from '../contexts/SettingsContext';

const options = [
  {
    id: 'dine-in',
    icon: '🪑',
    title: 'تناول داخل الكافيه',
    subtitle: 'احجز طاولتك واطلب براحتك',
    gradient: 'from-primary/20 to-accent/10',
    border: 'border-primary/30',
    hoverBorder: 'hover:border-primary',
    hoverShadow: 'hover:shadow-[0_8px_30px_rgba(200,149,108,0.25)]',
    badge: 'الأكثر شيوعاً',
    badgeColor: 'bg-primary text-gray-900',
  },
  {
    id: 'takeaway',
    icon: '👜',
    title: 'تيك أوي',
    subtitle: 'طلب وخد معاك براحتك',
    gradient: 'from-green-500/20 to-emerald-500/10',
    border: 'border-green-500/30',
    hoverBorder: 'hover:border-green-400',
    hoverShadow: 'hover:shadow-[0_8px_30px_rgba(34,197,94,0.2)]',
    badge: null,
    badgeColor: '',
  },
  {
    id: 'delivery',
    icon: '🚴',
    title: 'ديليفري',
    subtitle: 'وصلنالك على بابك',
    gradient: 'from-purple-500/20 to-violet-500/10',
    border: 'border-purple-500/30',
    hoverBorder: 'hover:border-purple-400',
    hoverShadow: 'hover:shadow-[0_8px_30px_rgba(168,85,247,0.2)]',
    badge: 'جديد',
    badgeColor: 'bg-purple-500 text-white',
  },
  {
    id: 'browse',
    icon: '📖',
    title: 'تصفح المنيو',
    subtitle: 'شوف أصنافنا بدون طلب',
    gradient: 'from-blue-500/20 to-indigo-500/10',
    border: 'border-blue-500/30',
    hoverBorder: 'hover:border-blue-400',
    hoverShadow: 'hover:shadow-[0_8px_30px_rgba(96,165,250,0.2)]',
    badge: null,
    badgeColor: '',
  },
];

export default function LandingPage() {
  const router = useRouter();
  const { settings } = useSettings();
  const [resumableSession, setResumableSession] = useState(null);

  useEffect(() => {
    const checkPreviousSession = async () => {
      const token = localStorage.getItem('latest_session_token');
      if (!token) return;
      try {
        const res = await api.get(`/sessions/${token}`);
        if (res.data.success && res.data.data.status === 'active') {
          const sessionData = res.data.data;
          const activeOrder = sessionData.orders?.reverse().find(o => ['pending', 'preparing', 'ready'].includes(o.status));
          if (activeOrder) {
            setResumableSession(true);
          }
        }
      } catch (e) {}
    };
    checkPreviousSession();
  }, []);

  const handleSelect = (id) => {
    router.push(`/menu?type=${id}`);
  };

  return (
    <div className="min-h-screen bg-[#070710] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background ambient glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-primary/5 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-[110px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-green-500/4 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-full bg-primary/10 border border-primary/20 mb-4 md:mb-6 shadow-[0_0_40px_rgba(200,149,108,0.15)]">
            <span className="text-4xl md:text-5xl">☕</span>
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-black text-primary mb-2 md:mb-3 tracking-tight">{settings?.cafeName || 'كافيه أرتيزان'}</h1>
          <p className="text-[#9a9aad] text-base md:text-lg">أهلاً بك! كيف تحب تتمتع بتجربتك اليوم؟</p>
        </div>

        {resumableSession && (
          <button
            onClick={() => router.push('/menu?resume=true')}
            className="w-full mb-8 bg-gradient-to-r from-green-500 to-emerald-600 p-4 rounded-2xl shadow-[0_4px_20px_rgba(34,197,94,0.3)] hover:-translate-y-1 transition-all flex items-center justify-between group"
          >
            <div className="text-right flex-1">
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <FaClock className="animate-pulse" /> لديك طلب قيد التحضير!
              </h3>
              <p className="text-green-100 text-sm mt-1">اضغط هنا لمتابعة طلبك ومعرفة الوقت المتبقي</p>
            </div>
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white group-hover:scale-110 transition-transform">
              ←
            </div>
          </button>
        )}

        {/* Options Grid */}
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          {options.map((opt) => (
            <button
              key={opt.id}
              onClick={() => handleSelect(opt.id)}
              className={`relative bg-gradient-to-br ${opt.gradient} border ${opt.border} ${opt.hoverBorder} ${opt.hoverShadow} rounded-2xl md:rounded-3xl p-4 flex flex-col items-center justify-center text-center transition-all duration-300 hover:-translate-y-1 active:scale-95 group min-h-[140px] md:min-h-[180px]`}
            >
              {opt.badge && (
                <span className={`absolute top-2 right-2 md:top-3 md:right-3 text-[9px] md:text-xs font-bold px-2 py-0.5 md:px-2.5 md:py-1 rounded-full whitespace-nowrap shadow-sm ${opt.badgeColor}`}>
                  {opt.badge}
                </span>
              )}
              <span className="text-4xl md:text-5xl mb-3 group-hover:scale-110 transition-transform duration-300 drop-shadow-lg">
                {opt.icon}
              </span>
              <h3 className="text-white font-bold text-sm md:text-base leading-tight">{opt.title}</h3>
              <p className="text-[#9a9aad] text-[10px] md:text-xs leading-relaxed hidden sm:block mt-1">{opt.subtitle}</p>
            </button>
          ))}
        </div>

        <p className="text-center text-[#5e5e72] text-xs mt-10">
          بالمتابعة أنت توافق على شروط الخدمة الخاصة بالكافيه
        </p>
      </div>
    </div>
  );
}
