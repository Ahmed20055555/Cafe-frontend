"use client";
import { useEffect, useState } from 'react';
import { FaUserPlus, FaEdit, FaTrash, FaSync } from 'react-icons/fa';
import api from '@/lib/api';

export default function StaffPage() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await api.get('/auth/staff');
      if (res.data.success) {
        setStaff(res.data.data);
      }
    } catch (error) {
      console.error("Error fetching staff:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

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
          <button className="w-full sm:w-auto justify-center px-4 py-2 md:py-2.5 flex items-center gap-2 rounded-lg bg-primary text-gray-900 text-xs md:text-sm font-bold hover:opacity-90 transition-all shadow-[0_4px_15px_rgba(200,149,108,0.3)]">
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
              <p className="text-[#9a9aad] text-xs md:text-sm mb-3 md:mb-4 font-medium uppercase tracking-wider">{member.role === 'admin' ? 'مدير النظام' : member.role === 'waiter' ? 'مقدم طلبات' : 'مطبخ'}</p>
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
    </div>
  );
}
