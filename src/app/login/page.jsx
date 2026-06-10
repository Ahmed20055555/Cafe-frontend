"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaLock, FaUserShield } from 'react-icons/fa';
import { login, getMe } from '@/lib/api';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('cafe_token');
      if (token) {
        try {
          const res = await getMe();
          if (res.data.success) {
            redirectBasedOnRole(res.data.data.role);
          }
        } catch (err) {
          localStorage.removeItem('cafe_token');
        }
      }
      setIsChecking(false);
    };
    checkAuth();
  }, []);

  const redirectBasedOnRole = (role) => {
    if (role === 'admin') {
      router.push('/admin');
    } else if (role === 'waiter') {
      router.push('/waiter');
    } else if (role === 'kitchen') {
      router.push('/kds');
    } else {
      toast.error('ليس لديك صلاحيات الدخول');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await login({ email, password });
      if (res.data.success) {
        localStorage.setItem('cafe_token', res.data.data.token);
        toast.success('تم تسجيل الدخول بنجاح');
        redirectBasedOnRole(res.data.data.role);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'بيانات الدخول غير صحيحة');
    } finally {
      setLoading(false);
    }
  };

  if (isChecking) {
    return <div className="flex items-center justify-center min-h-screen bg-[#0a0a0f] text-white">جاري التحقق...</div>;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0a0a0f] p-4 relative overflow-hidden" dir="rtl">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="w-full max-w-md bg-[#111118] border border-white/10 rounded-3xl p-8 shadow-2xl relative z-10">
        <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-3xl mx-auto mb-6 shadow-[0_0_30px_rgba(200,149,108,0.2)]">
          <FaUserShield />
        </div>
        
        <h1 className="text-3xl font-black text-center text-white mb-2">تسجيل دخول الموظفين</h1>
        <p className="text-[#9a9aad] text-center text-sm mb-8">الرجاء إدخال بيانات الدخول للوصول إلى لوحة التحكم الخاصة بك</p>
        
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-[#9a9aad] mb-2">البريد الإلكتروني</label>
            <input 
              type="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#1a1a24] border border-white/5 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-primary transition-colors text-left" 
              dir="ltr"
              placeholder="user@cafe.com" 
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-[#9a9aad] mb-2">كلمة المرور</label>
            <input 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#1a1a24] border border-white/5 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-primary transition-colors text-left" 
              dir="ltr"
              placeholder="••••••••" 
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary to-accent text-gray-900 font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-[0_4px_15px_rgba(200,149,108,0.3)] mt-6 disabled:opacity-50"
          >
            {loading ? 'جاري الدخول...' : <><FaLock /> تسجيل الدخول</>}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/5 text-center text-xs text-[#5e5e72] space-y-1">
          <p>للتجربة كمدير: admin@cafe.com / admin123</p>
          <p>للتجربة كمقدم طلبات: waiter@cafe.com / 123456</p>
          <p>للتجربة كمطبخ: kitchen@cafe.com / 123456</p>
        </div>
      </div>
    </div>
  );
}
