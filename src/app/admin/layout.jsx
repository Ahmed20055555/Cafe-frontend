"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FaChartPie, FaUsers, FaBoxOpen, FaCog, FaStore, FaCoffee, FaLock, FaChair, FaBars, FaTimes, FaMoneyCheckAlt } from 'react-icons/fa';
import { getMe } from '@/lib/api';

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Login Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('cafe_token');
      if (token) {
        try {
          const res = await getMe();
          if (res.data.success && res.data.data.role === 'admin') {
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

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('cafe_token');
    router.push('/login');
  };

  const isActive = (path) => pathname === path;
  
  const linkBase = "flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-all text-[#9a9aad] hover:bg-card hover:text-[#f0ece4]";
  const linkActive = "bg-primary-glow text-primary font-bold";

  if (isChecking) {
    return <div className="flex items-center justify-center min-h-screen bg-[#0a0a0f] text-white">جاري التحقق...</div>;
  }

  if (!isAuthenticated) {
    // If checking finished and not authenticated, Next.js doesn't easily allow router.push during render.
    // So we just return null because the checkAuth function should have redirected them.
    // Wait, the checkAuth needs to do the redirection. Let's update checkAuth logic instead.
    return null;
  }

  return (
    <div className="flex min-h-screen bg-[#0a0a0f] relative overflow-x-hidden">
      {/* Mobile Menu Toggle */}
      <button 
        className="md:hidden fixed top-4 right-4 z-[60] bg-[#1a1a24] text-white p-3 rounded-xl border border-white/10 shadow-lg"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
      </button>

      {/* Overlay for Mobile */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`w-64 fixed right-0 top-0 bottom-0 bg-[#111118] border-l border-white/5 p-6 flex flex-col z-50 transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'} md:translate-x-0`}>
        <div className="font-display text-2xl font-bold text-primary px-3 py-2 mb-8 flex items-center gap-3">
          <FaStore />
         ...
        </div>
        
        <nav className="flex flex-col gap-2 flex-1 overflow-y-auto">
          <Link href="/admin" className={`${linkBase} ${isActive('/admin') ? linkActive : ''}`}>
            <FaChartPie className="text-xl w-6 text-center" />
            الرئيسية
          </Link>
          <Link href="/admin/orders" className={`${linkBase} ${isActive('/admin/orders') ? linkActive : ''}`}>
            <FaBoxOpen className="text-xl w-6 text-center" />
            الطلبات
          </Link>
          <Link href="/admin/payments" className={`${linkBase} ${isActive('/admin/payments') ? linkActive : ''}`}>
            <FaMoneyCheckAlt className="text-xl w-6 text-center" />
            تأكيدات الدفع
          </Link>
          <Link href="/admin/menu" className={`${linkBase} ${isActive('/admin/menu') ? linkActive : ''}`}>
            <FaCoffee className="text-xl w-6 text-center" />
            المنيو
          </Link>
          <Link href="/admin/tables" className={`${linkBase} ${isActive('/admin/tables') ? linkActive : ''}`}>
            <FaChair className="text-xl w-6 text-center" />
            الطاولات
          </Link>
          <Link href="/admin/staff" className={`${linkBase} ${isActive('/admin/staff') ? linkActive : ''}`}>
            <FaUsers className="text-xl w-6 text-center" />
            الموظفين
          </Link>
          <Link href="/admin/settings" className={`${linkBase} ${isActive('/admin/settings') ? linkActive : ''}`}>
            <FaCog className="text-xl w-6 text-center" />
            الإعدادات
          </Link>
        </nav>
        
        <div className="mt-auto pt-6 border-t border-white/5 shrink-0">
          <button onClick={handleLogout} className={linkBase}>
            الخروج من الإدارة
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 w-full md:mr-64 p-4 pt-20 md:p-8 md:pt-8 min-h-screen">
        {children}
      </main>
    </div>
  );
}
