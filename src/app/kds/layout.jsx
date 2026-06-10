"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getMe } from '@/lib/api';

export default function KDSLayout({ children }) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('cafe_token');
      if (token) {
        try {
          const res = await getMe();
          // Allow kitchen and admin to access KDS
          if (res.data.success && ['kitchen', 'admin'].includes(res.data.data.role)) {
            setUser(res.data.data);
            setIsAuthenticated(true);
          } else {
            router.push('/login');
          }
        } catch (err) {
          localStorage.removeItem('cafe_token');
          router.push('/login');
        }
      } else {
        router.push('/login');
      }
      setIsChecking(false);
    };
    checkAuth();
  }, [router]);

  if (isChecking) {
    return <div className="flex items-center justify-center min-h-screen bg-[#050508] text-white">جاري التحقق...</div>;
  }

  if (!isAuthenticated) return null;

  return (
    <div className="bg-[#050508] min-h-screen relative" dir="rtl">
      {/* KDS Header with logout */}
      <header className="absolute top-4 left-4 right-4 z-50 flex items-center justify-between pointer-events-none">
        <div className="bg-[#111118]/80 backdrop-blur-sm border border-white/10 px-4 py-2 rounded-xl flex items-center gap-3 pointer-events-auto">
          <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500 text-lg">
            👨‍🍳
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">مطبخ - شيف {user?.name}</p>
            <p className="text-xs text-green-400">متصل</p>
          </div>
        </div>

        <button 
          onClick={() => {
            localStorage.removeItem('cafe_token');
            router.push('/login');
          }}
          className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 px-4 py-2 rounded-xl text-sm font-bold transition-colors pointer-events-auto flex items-center gap-2"
        >
          تسجيل الخروج
        </button>
      </header>
      {/* Add padding top to children so header doesn't overlap content completely if needed, 
          though KDS page has its own header. Let's wrap children in a pt-16 div */}
      <div className="pt-16">
        {children}
      </div>
    </div>
  );
}
