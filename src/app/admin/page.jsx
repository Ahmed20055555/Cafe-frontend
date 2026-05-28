"use client";
import { useEffect, useState } from 'react';
import { FaDollarSign, FaShoppingBag, FaUsers, FaChartLine } from 'react-icons/fa';
import api, { login } from '@/lib/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ todayRevenue: 0, todayOrders: 0, activeSessions: 0, conversionRate: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [popularItems, setPopularItems] = useState([]);
  const [recentFeedback, setRecentFeedback] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Overview
        const overviewRes = await api.get('/analytics/overview');
        if (overviewRes.data.success) {
          setStats({
            ...overviewRes.data.data,
            conversionRate: 64 // Mock conversion rate as backend doesn't provide it
          });
        }

        // Fetch Popular Items
        const popularRes = await api.get('/analytics/popular-items');
        if (popularRes.data.success) {
          setPopularItems(popularRes.data.data.slice(0, 3));
        }

        // Fetch Recent Orders
        const ordersRes = await api.get('/orders?limit=5&sort=-createdAt');
        if (ordersRes.data.success) {
          setRecentOrders(ordersRes.data.data);
        }

        // Fetch Recent Feedback
        const feedbackRes = await api.get('/extras/feedback');
        if (feedbackRes.data.success) {
          setRecentFeedback(feedbackRes.data.data.slice(0, 5));
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">جاري التحميل...</div>;
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-1">نظرة عامة على لوحة القيادة</h1>
          <p className="text-[#9a9aad] text-xs md:text-sm">مرحباً بعودتك، إليك ملخص لأداء اليوم.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
          <button className="w-full sm:w-auto justify-center px-4 py-2 md:px-5 md:py-2.5 rounded-lg bg-elevated border border-white/10 text-xs md:text-sm font-bold hover:text-primary hover:border-primary transition-all">تصدير تقرير</button>
          <button className="w-full sm:w-auto justify-center px-4 py-2 md:px-5 md:py-2.5 rounded-lg bg-gradient-to-br from-primary to-accent text-gray-900 text-xs md:text-sm font-bold shadow-[0_4px_15px_rgba(200,149,108,0.3)] hover:-translate-y-0.5 transition-all">حملة جديدة</button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
        <div className="bg-card border border-white/5 rounded-2xl p-4 md:p-6 transition-all hover:border-primary/50 hover:shadow-[0_0_30px_rgba(200,149,108,0.1)]">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] md:text-xs text-[#9a9aad] font-bold uppercase tracking-wider">إجمالي الأرباح</span>
            <span className="text-xl md:text-2xl text-green-400"><FaDollarSign /></span>
          </div>
          <div className="text-2xl md:text-3xl font-bold bg-gradient-to-br from-white to-primary-light bg-clip-text text-transparent" dir="ltr">${stats.todayRevenue.toFixed(2)}</div>
          <div className="text-[10px] md:text-xs text-green-400 mt-2 font-medium">إيرادات اليوم</div>
        </div>
        
        <div className="bg-card border border-white/5 rounded-2xl p-4 md:p-6 transition-all hover:border-primary/50 hover:shadow-[0_0_30px_rgba(200,149,108,0.1)]">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] md:text-xs text-[#9a9aad] font-bold uppercase tracking-wider">طلبات اليوم</span>
            <span className="text-xl md:text-2xl text-blue-400"><FaShoppingBag /></span>
          </div>
          <div className="text-2xl md:text-3xl font-bold bg-gradient-to-br from-white to-primary-light bg-clip-text text-transparent">{stats.todayOrders}</div>
          <div className="text-[10px] md:text-xs text-green-400 mt-2 font-medium">إجمالي عدد الطلبات</div>
        </div>
        
        <div className="bg-card border border-white/5 rounded-2xl p-4 md:p-6 transition-all hover:border-primary/50 hover:shadow-[0_0_30px_rgba(200,149,108,0.1)]">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] md:text-xs text-[#9a9aad] font-bold uppercase tracking-wider">الجلسات النشطة</span>
            <span className="text-xl md:text-2xl text-yellow-400"><FaUsers /></span>
          </div>
          <div className="text-2xl md:text-3xl font-bold bg-gradient-to-br from-white to-primary-light bg-clip-text text-transparent">{stats.activeSessions}</div>
          <div className="text-[10px] md:text-xs text-[#5e5e72] mt-2 font-medium">متواجدين حالياً</div>
        </div>
        
        <div className="bg-card border border-white/5 rounded-2xl p-4 md:p-6 transition-all hover:border-primary/50 hover:shadow-[0_0_30px_rgba(200,149,108,0.1)]">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] md:text-xs text-[#9a9aad] font-bold uppercase tracking-wider">نسبة التحويل</span>
            <span className="text-xl md:text-2xl text-primary"><FaChartLine /></span>
          </div>
          <div className="text-2xl md:text-3xl font-bold bg-gradient-to-br from-white to-primary-light bg-clip-text text-transparent">{stats.conversionRate}%</div>
          <div className="text-[10px] md:text-xs text-red-400 mt-2 font-medium">معدل تقريبي</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Recent Orders Table */}
        <div className="lg:col-span-2 bg-card border border-white/5 rounded-2xl p-4 md:p-6">
          <div className="flex justify-between items-center mb-4 md:mb-6">
            <h2 className="text-lg md:text-xl font-bold">أحدث الطلبات</h2>
            <button className="text-xs md:text-sm font-medium text-[#9a9aad] hover:text-white transition-colors">عرض الكل</button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-start border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-[#5e5e72] text-[10px] md:text-xs uppercase tracking-wider">
                  <th className="py-2 md:py-3 px-3 md:px-4 text-start font-bold">رقم الطلب</th>
                  <th className="py-2 md:py-3 px-3 md:px-4 text-start font-bold">العميل</th>
                  <th className="py-2 md:py-3 px-3 md:px-4 text-start font-bold">العناصر</th>
                  <th className="py-2 md:py-3 px-3 md:px-4 text-start font-bold">الحالة</th>
                  <th className="py-2 md:py-3 px-3 md:px-4 text-start font-bold">القيمة</th>
                </tr>
              </thead>
              <tbody className="text-xs md:text-sm">
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-[#5e5e72]">لا توجد طلبات بعد</td>
                  </tr>
                ) : (
                  recentOrders.map(order => (
                    <tr key={order._id} className="border-b border-white/5 hover:bg-card-hover transition-colors last:border-0">
                      <td className="py-3 md:py-4 px-3 md:px-4 font-bold" dir="ltr">#{order.orderNumber || order._id.slice(-4)}</td>
                      <td className="py-3 md:py-4 px-3 md:px-4">{order.type === 'dine-in' ? `طاولة ${order.session?.tableNumber || '?'}` : 'سفري'}</td>
                      <td className="py-3 md:py-4 px-3 md:px-4">{order.items.reduce((sum, item) => sum + item.quantity, 0)} عناصر</td>
                      <td className="py-3 md:py-4 px-3 md:px-4">
                        <span className={`px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[10px] md:text-xs font-bold ${
                          order.status === 'pending' ? 'bg-yellow-400/10 text-yellow-400' :
                          order.status === 'preparing' ? 'bg-blue-400/10 text-blue-400' :
                          order.status === 'ready' ? 'bg-green-400/10 text-green-400' :
                          'bg-gray-400/10 text-gray-400'
                        }`}>
                          {order.status === 'pending' ? 'قيد الانتظار' : order.status === 'preparing' ? 'قيد التحضير' : order.status === 'ready' ? 'جاهز' : order.status}
                        </span>
                      </td>
                      <td className="py-3 md:py-4 px-3 md:px-4 font-medium" dir="ltr">${order.total.toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Trending Items */}
        <div className="bg-card border border-white/5 rounded-2xl p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-bold mb-4 md:mb-6">الأكثر مبيعاً</h2>
          <div className="flex flex-col gap-4 md:gap-5">
            {popularItems.length === 0 ? (
              <div className="text-center text-[#5e5e72] py-8 text-xs md:text-sm">لا توجد بيانات</div>
            ) : (
              popularItems.map((item, idx) => (
                <div key={item._id} className="flex items-center gap-3 md:gap-4">
                  <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl bg-elevated flex items-center justify-center text-lg md:text-xl font-bold shadow-inner ${
                    idx === 0 ? 'text-primary' : idx === 1 ? 'text-[#9a9aad]' : 'text-accent'
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold mb-0.5 text-sm md:text-base">{item.nameAr || item.name}</div>
                    <div className="text-[10px] md:text-xs text-[#9a9aad]">{item.totalOrdered} طلب</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Feedback */}
      <div className="mt-4 md:mt-6 bg-card border border-white/5 rounded-2xl p-4 md:p-6">
        <h2 className="text-lg md:text-xl font-bold mb-4 md:mb-6">أحدث آراء العملاء</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recentFeedback.length === 0 ? (
            <div className="col-span-full text-center text-[#5e5e72] py-8 text-xs md:text-sm">لا توجد تقييمات حتى الآن</div>
          ) : (
            recentFeedback.map(fb => (
              <div key={fb._id} className="bg-elevated p-4 rounded-xl flex flex-col gap-3 border border-white/5 shadow-md">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-sm md:text-base flex items-center gap-2">
                      {fb.customerName || 'عميل غير معروف'}
                      <span className="bg-primary/20 text-primary text-[10px] px-2 py-0.5 rounded-full font-bold">طاولة {fb.tableNumber || '-'}</span>
                    </div>
                  </div>
                  <div className="flex gap-0.5" dir="ltr">
                    {[1, 2, 3, 4, 5].map(star => (
                      <span key={star} className={`text-sm ${star <= fb.rating ? 'text-yellow-400' : 'text-gray-600'}`}>★</span>
                    ))}
                  </div>
                </div>
                <div className="text-xs md:text-sm text-[#9a9aad] italic bg-[#0a0a0f] p-3 rounded-lg border border-white/5">
                  "{fb.comment || 'لم يترك تعليقاً'}"
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
