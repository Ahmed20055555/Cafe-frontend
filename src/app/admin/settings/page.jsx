"use client";
import { useState, useEffect } from 'react';
import { FaSave, FaCheck } from 'react-icons/fa';
import { useSettings } from '@/contexts/SettingsContext';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { settings, updateSettings, loading } = useSettings();
  const [formData, setFormData] = useState({ cafeName: '', primaryColor: '#c8956c' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && settings) {
      setFormData({
        cafeName: settings.cafeName || 'كافيه أرتيزان',
        primaryColor: settings.primaryColor || '#c8956c'
      });
    }
  }, [settings, loading]);

  const handleSave = async () => {
    setSaving(true);
    const success = await updateSettings(formData);
    if (success) {
      toast.success('تم حفظ الإعدادات بنجاح');
    } else {
      toast.error('فشل في حفظ الإعدادات');
    }
    setSaving(false);
  };

  if (loading) return <div className="p-8 text-center animate-pulse">جاري تحميل الإعدادات...</div>;

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-1">إعدادات النظام</h1>
          <p className="text-[#9a9aad] text-xs md:text-sm">تكوين وتخصيص إعدادات الكافيه العامة.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2 md:px-6 md:py-2.5 flex items-center justify-center gap-2 rounded-lg bg-primary text-gray-900 text-sm md:text-base font-bold hover:opacity-90 transition-all shadow-[0_4px_15px_rgba(200,149,108,0.3)] hover:-translate-y-0.5 disabled:opacity-50"
        >
          <FaSave /> {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
        {/* General Settings */}
        <div className="bg-card border border-white/5 rounded-2xl p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-bold mb-4 md:mb-6">الإعدادات العامة</h2>
          <div className="flex flex-col gap-4 md:gap-5">
            <div className="flex flex-col gap-1.5 md:gap-2">
              <label className="text-xs md:text-sm font-bold text-[#9a9aad]">اسم الكافيه</label>
              <input 
                type="text" 
                value={formData.cafeName}
                onChange={(e) => setFormData(p => ({ ...p, cafeName: e.target.value }))}
                className="bg-[#111118] border border-white/10 rounded-xl px-3 py-2 md:px-4 md:py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-xs md:text-sm w-full" 
              />
            </div>
            <div className="flex flex-col gap-1.5 md:gap-2">
              <label className="text-xs md:text-sm font-bold text-[#9a9aad]">اللون الأساسي (Primary Color)</label>
              <div className="flex items-center gap-3 md:gap-4">
                <input 
                  type="color" 
                  value={formData.primaryColor}
                  onChange={(e) => setFormData(p => ({ ...p, primaryColor: e.target.value }))}
                  className="w-10 h-10 md:w-12 md:h-12 rounded-xl cursor-pointer bg-transparent border-0 shrink-0" 
                />
                <input 
                  type="text" 
                  value={formData.primaryColor}
                  onChange={(e) => setFormData(p => ({ ...p, primaryColor: e.target.value }))}
                  className="bg-[#111118] border border-white/10 rounded-xl px-3 py-2 md:px-4 md:py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-xs md:text-sm flex-1 dir-ltr" 
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5 md:gap-2">
              <label className="text-xs md:text-sm font-bold text-[#9a9aad]">رقم الهاتف</label>
              <input type="text" className="bg-[#111118] border border-white/10 rounded-xl px-3 py-2 md:px-4 md:py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-xs md:text-sm w-full text-start" defaultValue="+966 50 123 4567" dir="ltr" />
            </div>
            <div className="flex flex-col gap-1.5 md:gap-2">
              <label className="text-xs md:text-sm font-bold text-[#9a9aad]">العنوان</label>
              <textarea className="bg-[#111118] border border-white/10 rounded-xl px-3 py-2 md:px-4 md:py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-xs md:text-sm w-full min-h-[80px] md:min-h-[100px] resize-y" defaultValue="شارع الأمير سلطان، جدة، المملكة العربية السعودية"></textarea>
            </div>
          </div>
        </div>

        {/* Operation Settings */}
        <div className="bg-card border border-white/5 rounded-2xl p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-bold mb-4 md:mb-6">ساعات العمل</h2>
          <div className="flex flex-col gap-3 md:gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 md:p-4 bg-elevated rounded-xl gap-3 md:gap-4">
              <span className="font-bold text-sm md:text-base text-center sm:text-start mb-1 sm:mb-0">أيام الأسبوع</span>
              <div className="flex flex-col sm:flex-row items-center gap-2 md:gap-3 w-full sm:w-auto">
                <input type="time" className="w-full sm:w-auto bg-[#111118] border border-white/10 rounded-lg px-3 py-2 text-xs md:text-sm focus:outline-none focus:border-primary text-center" defaultValue="07:00" />
                <span className="text-[#5e5e72] font-medium text-xs md:text-sm">إلى</span>
                <input type="time" className="w-full sm:w-auto bg-[#111118] border border-white/10 rounded-lg px-3 py-2 text-xs md:text-sm focus:outline-none focus:border-primary text-center" defaultValue="23:00" />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 md:p-4 bg-elevated rounded-xl gap-3 md:gap-4">
              <span className="font-bold text-sm md:text-base text-center sm:text-start mb-1 sm:mb-0">عطلة نهاية الأسبوع</span>
              <div className="flex flex-col sm:flex-row items-center gap-2 md:gap-3 w-full sm:w-auto">
                <input type="time" className="w-full sm:w-auto bg-[#111118] border border-white/10 rounded-lg px-3 py-2 text-xs md:text-sm focus:outline-none focus:border-primary text-center" defaultValue="08:00" />
                <span className="text-[#5e5e72] font-medium text-xs md:text-sm">إلى</span>
                <input type="time" className="w-full sm:w-auto bg-[#111118] border border-white/10 rounded-lg px-3 py-2 text-xs md:text-sm focus:outline-none focus:border-primary text-center" defaultValue="01:00" />
              </div>
            </div>
          </div>

          <h2 className="text-lg md:text-xl font-bold mt-6 md:mt-8 mb-4 md:mb-6">إعدادات الطلبات</h2>
          <div className="flex flex-col gap-3 md:gap-4">
            <label className="flex items-center gap-2 md:gap-3 cursor-pointer group">
              <div className="relative flex items-center justify-center shrink-0">
                <input type="checkbox" className="peer appearance-none w-4 h-4 md:w-5 md:h-5 border-2 border-white/20 rounded checked:bg-primary checked:border-primary transition-colors cursor-pointer" defaultChecked />
                <FaCheck className="absolute text-gray-900 text-[10px] md:text-xs opacity-0 peer-checked:opacity-100 pointer-events-none" />
              </div>
              <span className="font-medium text-xs md:text-sm group-hover:text-primary transition-colors">السماح بالطلبات الذاتية (QR)</span>
            </label>
            <label className="flex items-center gap-2 md:gap-3 cursor-pointer group">
              <div className="relative flex items-center justify-center shrink-0">
                <input type="checkbox" className="peer appearance-none w-4 h-4 md:w-5 md:h-5 border-2 border-white/20 rounded checked:bg-primary checked:border-primary transition-colors cursor-pointer" defaultChecked />
                <FaCheck className="absolute text-gray-900 text-[10px] md:text-xs opacity-0 peer-checked:opacity-100 pointer-events-none" />
              </div>
              <span className="font-medium text-xs md:text-sm group-hover:text-primary transition-colors">تفعيل إشعارات الصوت في المطبخ</span>
            </label>
            <label className="flex items-center gap-2 md:gap-3 cursor-pointer group">
              <div className="relative flex items-center justify-center shrink-0">
                <input type="checkbox" className="peer appearance-none w-4 h-4 md:w-5 md:h-5 border-2 border-white/20 rounded checked:bg-primary checked:border-primary transition-colors cursor-pointer" />
                <FaCheck className="absolute text-gray-900 text-[10px] md:text-xs opacity-0 peer-checked:opacity-100 pointer-events-none" />
              </div>
              <span className="font-medium text-xs md:text-sm group-hover:text-primary transition-colors">استقبال الطلبات الخارجية (Delivery)</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
