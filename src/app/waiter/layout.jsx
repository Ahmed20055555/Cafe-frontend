"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getMe } from '@/lib/api';
import { FaSignOutAlt, FaUserTie } from 'react-icons/fa';

export default function WaiterLayout({ children }) {
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
          if (res.data.success && ['waiter', 'admin'].includes(res.data.data.role)) {
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

  const handleLogout = () => {
    localStorage.removeItem('cafe_token');
    router.push('/login');
  };

  if (isChecking) {
    return <div className="flex items-center justify-center min-h-screen bg-[#0a0a0f] text-white">جاري التحقق...</div>;
  }

  if (!isAuthenticated) return null;

  return (
    <div className="bg-[#0a0a0f] min-h-screen flex flex-col relative" dir="rtl">
      {/* Waiter Header */}
      <header className="bg-[#111118] border-b border-white/10 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl">
            <FaUserTie />
          </div>
          <div>
            <h1 className="font-bold text-white text-lg leading-tight">لوحة مقدم الطلبات</h1>
            <p className="text-xs text-[#9a9aad]">مرحباً، {user?.name}</p>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors"
        >
          <FaSignOutAlt />
          <span className="hidden md:inline">تسجيل الخروج</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
