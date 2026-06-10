"use client";
import { useEffect, useState } from 'react';
import { FaUserPlus, FaEdit, FaTrash, FaSync, FaTimes, FaSave } from 'react-icons/fa';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';

export default function StaffPage() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'waiter',
    phone: ''
  });

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await api.get('/auth/staff');
      if (res.data.success) {
        setStaff(res.data.data);
      }
    } catch (error) {
      console.error("Error fetching staff:", error);
      toast.error('حدث خطأ أثناء جلب الموظفين');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/auth/register', formData);
      if (res.data.success) {
        toast.success('تم إضافة الموظف بنجاح');
        setIsModalOpen(false);
        setFormData({ name: '', email: '', password: '', role: 'waiter', phone: '' });
        fetchStaff();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'حدث خطأ أثناء إضافة الموظف');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-1">إدارة الموظفين</h1>
          <p className="text-[#9a9aad] text-xs md:text-sm">إضافة وتعديل صلاحيات فريق العمل.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
          <button onClick={fetchStaff} className="w-full sm:w-auto justify-center px-4 py-2 md:py-2.5 flex items-center gap-2 rounded-lg bg-elevated border border-white/10 text-xs md:text-sm font-bold hover:text-primary transition-all">
            <FaSync className={loading ? "animate-spin" : ""} /> تحديث
          </button>
          <button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto justify-center px-4 py-2 md:py-2.5 flex items-center gap-2 rounded-lg bg-primary text-gray-900 text-xs md:text-sm font-bold hover:opacity-90 transition-all shadow-[0_4px_15px_rgba(200,149,108,0.3)]">
            <FaUserPlus /> إضافة موظف
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-[#5e5e72] font-medium text-base md:text-lg">جاري تحميل بيانات الموظفين...</div>
      ) : staff.length === 0 ? (
        <div className="text-center py-20 text-[#5e5e72] font-medium text-base md:text-lg">لا يوجد موظفين مسجلين</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {staff.map((member) => (
            <div key={member._id} className="bg-card border border-white/5 rounded-2xl p-6 md:p-8 flex flex-col items-center text-center transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-[0_8px_30px_rgba(200,149,108,0.1)]">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-elevated border-2 border-white/10 flex items-center justify-center text-2xl md:text-3xl font-bold text-primary mb-3 md:mb-4 shadow-inner">
                {member.name.charAt(0)}
              </div>
              <h3 className="text-lg md:text-xl font-bold mb-1">{member.name}</h3>
              <p className="text-[#9a9aad] text-xs md:text-sm mb-3 md:mb-4 font-medium uppercase tracking-wider">{member.role === 'admin' ? 'مدير النظام' : member.role === 'waiter' ? 'مقدم طلبات' : member.role === 'kitchen' ? 'مطبخ' : member.role}</p>
              <span className={`px-3 py-1 md:px-4 md:py-1 rounded-full text-[10px] md:text-xs font-bold mb-5 md:mb-6 ${member.isActive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                {member.isActive ? 'نشط' : 'غير نشط'}
              </span>
              <div className="flex gap-2 md:gap-3 w-full justify-center">
                <button className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-xl bg-elevated text-[#9a9aad] hover:bg-primary hover:text-gray-900 transition-colors text-sm md:text-base" title="تعديل"><FaEdit /></button>
                <button className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-xl bg-elevated text-[#9a9aad] hover:bg-red-500 hover:text-white transition-colors text-sm md:text-base" title="حذف"><FaTrash /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Staff Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" dir="rtl">
          <div className="bg-[#111118] border border-white/10 rounded-3xl w-full max-w-md p-6 shadow-2xl relative">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 left-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-white/50 hover:bg-red-500 hover:text-white transition-colors"
            >
              <FaTimes />
            </button>
            <h2 className="text-2xl font-bold text-white mb-6">إضافة موظف جديد</h2>
            
            <form onSubmit={handleAddStaff} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-[#9a9aad] mb-2">اسم الموظف</label>
                <input 
                  type="text" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleChange} 
                  required
                  className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                  placeholder="الاسم كامل"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-[#9a9aad] mb-2">البريد الإلكتروني</label>
                <input 
                  type="email" 
                  name="email" 
                  value={formData.email} 
                  onChange={handleChange} 
                  required
                  className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors text-right"
                  placeholder="example@cafe.com"
                  dir="ltr"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-[#9a9aad] mb-2">كلمة المرور</label>
                <input 
                  type="password" 
                  name="password" 
                  value={formData.password} 
                  onChange={handleChange} 
                  required
                  className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors text-right"
                  placeholder="******"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-[#9a9aad] mb-2">رقم الهاتف</label>
                <input 
                  type="text" 
                  name="phone" 
                  value={formData.phone} 
                  onChange={handleChange} 
                  className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors text-right"
                  placeholder="01xxxxxxxxx"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-[#9a9aad] mb-2">الدور</label>
                <select 
                  name="role" 
                  value={formData.role} 
                  onChange={handleChange}
                  className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors appearance-none"
                >
                  <option value="waiter">مقدم طلبات (Waiter)</option>
                  <option value="kitchen">مطبخ (Kitchen)</option>
                  <option value="admin">مدير (Admin)</option>
                </select>
              </div>

              <div className="pt-4">
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="w-full bg-primary text-gray-900 font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-[0_4px_15px_rgba(200,149,108,0.3)] disabled:opacity-50"
                >
                  {submitting ? 'جاري الحفظ...' : <><FaSave /> إضافة الموظف</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
