"use client";
import { useEffect, useState } from 'react';
import { FaBoxOpen, FaFilter, FaSearch, FaSync } from 'react-icons/fa';
import api from '@/lib/api';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/orders?sort=-createdAt');
      if (res.data.success) {
        setOrders(res.data.data);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order._id.toLowerCase().includes(search.toLowerCase()) || 
                          (order.orderNumber && order.orderNumber.toString().includes(search));
    const matchesFilter = filterType === 'all' || order.type === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <div>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-1">إدارة الطلبات</h1>
          <p className="text-[#9a9aad] text-xs md:text-sm">عرض وتتبع جميع الطلبات السابقة والحالية.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
          <div className="flex gap-2 w-full sm:w-auto">
            <button onClick={fetchOrders} className="flex-1 sm:flex-none justify-center px-3 py-2 md:px-4 md:py-2.5 flex items-center gap-2 rounded-lg bg-elevated border border-white/10 text-xs md:text-sm font-bold hover:text-primary transition-all">
              <FaSync className={loading ? "animate-spin" : ""} /> تحديث
            </button>
            <button className="flex-1 sm:flex-none justify-center px-3 py-2 md:px-5 md:py-2.5 flex items-center gap-2 rounded-lg bg-elevated border border-white/10 text-xs md:text-sm font-bold hover:text-primary hover:border-primary transition-all">
              <FaFilter /> تصفية
            </button>
          </div>
          <div className="relative w-full sm:w-auto mt-1 sm:mt-0">
            <FaSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5e5e72] text-sm" />
            <input 
              type="text" 
              className="bg-[#111118] border border-white/10 rounded-lg py-2 md:py-2.5 pr-9 md:pr-10 pl-4 w-full sm:w-64 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-xs md:text-sm" 
              placeholder="ابحث برقم الطلب..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-row gap-2 md:gap-4 mb-6 md:mb-8 border-b border-white/10 pb-4 overflow-x-auto">
        <button onClick={() => setFilterType('all')} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-2 md:py-3 rounded-xl text-xs md:text-base font-bold transition-all whitespace-nowrap ${filterType === 'all' ? 'bg-primary text-gray-900 shadow-lg' : 'bg-elevated text-[#9a9aad] hover:text-white'}`}>
          كل الطلبات
        </button>
        <button onClick={() => setFilterType('dine-in')} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-2 md:py-3 rounded-xl text-xs md:text-base font-bold transition-all whitespace-nowrap ${filterType === 'dine-in' ? 'bg-primary text-gray-900 shadow-lg' : 'bg-elevated text-[#9a9aad] hover:text-white'}`}>
          طاولة
        </button>
        <button onClick={() => setFilterType('takeaway')} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-2 md:py-3 rounded-xl text-xs md:text-base font-bold transition-all whitespace-nowrap ${filterType === 'takeaway' ? 'bg-primary text-gray-900 shadow-lg' : 'bg-elevated text-[#9a9aad] hover:text-white'}`}>
          تيك أوي
        </button>
        <button onClick={() => setFilterType('delivery')} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-2 md:py-3 rounded-xl text-xs md:text-base font-bold transition-all whitespace-nowrap ${filterType === 'delivery' ? 'bg-primary text-gray-900 shadow-lg' : 'bg-elevated text-[#9a9aad] hover:text-white'}`}>
          دليفري
        </button>
      </div>

      <div className="bg-card border border-white/5 rounded-2xl p-4 md:p-6">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-start border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-[#5e5e72] text-xs uppercase tracking-wider">
                <th className="py-3 px-4 text-start font-bold">رقم الطلب</th>
                <th className="py-3 px-4 text-start font-bold">التاريخ</th>
                <th className="py-3 px-4 text-start font-bold">العميل</th>
                <th className="py-3 px-4 text-start font-bold">العناصر</th>
                <th className="py-3 px-4 text-start font-bold">الحالة</th>
                <th className="py-3 px-4 text-start font-bold">الإجمالي</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading && orders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-[#5e5e72]">جاري تحميل الطلبات...</td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-[#5e5e72]">لا توجد طلبات تطابق بحثك</td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order._id} className="border-b border-white/5 hover:bg-card-hover transition-colors last:border-0">
                    <td className="py-4 px-4 font-bold" dir="ltr">#{order.orderNumber || order._id.slice(-4)}</td>
                    <td className="py-4 px-4 text-[#9a9aad]">
                      {new Date(order.createdAt).toLocaleDateString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-4 px-4 font-medium">
                      <div className="font-bold">{order.type === 'dine-in' ? `طاولة ${order.session?.tableNumber || '?'}` : order.type === 'delivery' ? 'دليفري' : 'تيك أوي'}</div>
                      {order.customerNotes && (
                        <div className="text-[11px] text-[#9a9aad] mt-1 leading-relaxed max-w-[200px]">
                          {order.customerNotes.replace(/^(👜 تيك أوي — |🚴 ديليفري — )/, '')}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4">{order.items.reduce((sum, item) => sum + item.quantity, 0)} عناصر</td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        order.status === 'pending' ? 'bg-yellow-400/10 text-yellow-400' :
                        order.status === 'preparing' ? 'bg-blue-400/10 text-blue-400' :
                        order.status === 'ready' ? 'bg-green-400/10 text-green-400' :
                        'bg-gray-400/10 text-gray-400'
                      }`}>
                        {order.status === 'pending' ? 'قيد الانتظار' : order.status === 'preparing' ? 'قيد التحضير' : order.status === 'ready' ? 'جاهز' : order.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-bold text-primary" dir="ltr">${order.total.toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
