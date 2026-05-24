"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaChartPie, FaUsers, FaBoxOpen, FaCog, FaStore, FaCoffee, FaLock, FaChair, FaBars, FaTimes } from 'react-icons/fa';
import { login, getMe } from '@/lib/api';

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Login Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('cafe_token');
      if (token) {
        try {
          await getMe();
          setIsAuthenticated(true);
        } catch (err) {
          localStorage.removeItem('cafe_token');
          setIsAuthenticated(false);
        }
      }
      setIsChecking(false);
    };
    checkAuth();
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await login({ email, password });
      if (res.data.success) {
        localStorage.setItem('cafe_token', res.data.data.token);
        setIsAuthenticated(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'بيانات الدخول غير صحيحة');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('cafe_token');
    setIsAuthenticated(false);
  };

  const isActive = (path) => pathname === path;
  
  const linkBase = "flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-all text-[#9a9aad] hover:bg-card hover:text-[#f0ece4]";
  const linkActive = "bg-primary-glow text-primary font-bold";

  if (isChecking) {
    return <div className="flex items-center justify-center min-h-screen bg-[#0a0a0f] text-white">جاري التحقق...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0f] p-4">
        <div className="w-full max-w-md bg-[#111118] border border-white/10 rounded-3xl p-8 shadow-2xl animate-slide-up">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-2xl mx-auto mb-6">
            <FaLock />
          </div>
          <h1 className="text-2xl font-bold text-center mb-2">تسجيل دخول الإدارة</h1>
          <p className="text-[#9a9aad] text-center text-sm mb-8">الرجاء إدخال البريد الإلكتروني وكلمة المرور للمتابعة</p>
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm mb-6 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-[#9a9aad] mb-2">البريد الإلكتروني</label>
              <input 
                type="email" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#1a1a24] border border-white/5 rounded-xl px-4 py-3.5 focus:outline-none focus:border-primary transition-colors text-left" 
                dir="ltr"
                placeholder="admin@cafe.com" 
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#9a9aad] mb-2">كلمة المرور</label>
              <input 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#1a1a24] border border-white/5 rounded-xl px-4 py-3.5 focus:outline-none focus:border-primary transition-colors text-left" 
                dir="ltr"
                placeholder="••••••••" 
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary to-accent text-gray-900 font-bold py-4 rounded-xl hover:opacity-90 transition-all shadow-[0_4px_15px_rgba(200,149,108,0.3)] mt-4 disabled:opacity-50"
            >
              {loading ? 'جاري الدخول...' : 'تسجيل الدخول'}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-[#5e5e72]">
            <p>للتجربة: البريد admin@cafe.com - الرمز: admin123</p>
          </div>
        </div>
      </div>
    );
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
          أرتيزان
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
