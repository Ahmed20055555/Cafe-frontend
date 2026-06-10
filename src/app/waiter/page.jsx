"use client";
import { useState, useEffect, useCallback } from 'react';
import { FaCheckCircle, FaClock, FaConciergeBell, FaSync } from 'react-icons/fa';
import api from '@/lib/api';
import { connectSocket, disconnectSocket } from '@/lib/socket';
import toast from 'react-hot-toast';

export default function WaiterDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/orders/active');
      if (res.data.success) {
        setOrders(res.data.data);
      }
    } catch (e) {
      toast.error('حدث خطأ أثناء جلب الطلبات');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();

    const socket = connectSocket();
    socket.on('connect', () => { setConnected(true); socket.emit('join:waiter'); });
    socket.on('disconnect', () => setConnected(false));
    socket.on('order:new', (o) => {
      setOrders(prev => prev.find(x => x._id === o._id) ? prev : [o, ...prev]);
      try { new Audio('/notification.mp3').play(); } catch (_) {}
    });
    socket.on('order:statusUpdate', (updated) => {
      setOrders(prev => {
        if (['completed', 'cancelled'].includes(updated.status)) {
          return prev.filter(o => o._id !== updated._id);
        }
        return prev.map(o => o._id === updated._id ? updated : o);
      });
      if (updated.status === 'ready') {
        toast.success(`الطلب للطاولة ${updated.tableNumber || 'سفري'} جاهز للتقديم!`);
        try { new Audio('/notification.mp3').play(); } catch (_) {}
      }
    });

    return () => {
      socket.off('connect'); socket.off('disconnect');
      socket.off('order:new'); socket.off('order:statusUpdate');
      disconnectSocket();
    };
  }, [fetchOrders]);

  const markServed = async (id) => {
    try {
      // Optimistic update
      setOrders(prev => prev.map(o => o._id === id ? { ...o, status: 'served' } : o));
      await api.patch(`/orders/${id}/status`, { status: 'served' });
      toast.success('تم تقديم الطلب بنجاح');
    } catch (err) {
      toast.error('حدث خطأ أثناء تحديث حالة الطلب');
      fetchOrders();
    }
  };

  // Filter orders that a waiter needs to care about:
  // pending (just created, needs review or just waiting for kitchen)
  // preparing (in kitchen)
  // ready (needs to be served by waiter)
  // served (served, waiting for payment/session end)
  
  const readyOrders = orders.filter(o => o.status === 'ready');
  const activeOrders = orders.filter(o => ['pending', 'preparing'].includes(o.status));

  return (
    <div className="space-y-8">
      {/* Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#111118] border border-white/5 rounded-2xl p-4">
        <div className="flex gap-4">
          <div className="text-center px-4 py-2 bg-green-500/10 rounded-xl border border-green-500/20 min-w-[100px]">
            <div className="text-2xl font-black text-green-400 mb-1">{readyOrders.length}</div>
            <div className="text-xs text-green-300 font-bold">جاهز للتقديم</div>
          </div>
          <div className="text-center px-4 py-2 bg-yellow-500/10 rounded-xl border border-yellow-500/20 min-w-[100px]">
            <div className="text-2xl font-black text-yellow-400 mb-1">{activeOrders.length}</div>
            <div className="text-xs text-yellow-300 font-bold">قيد التحضير</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={fetchOrders} className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors">
            <FaSync size={12} className={loading ? "animate-spin" : ""} /> تحديث
          </button>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border ${
            connected ? 'bg-green-500/15 text-green-400 border-green-500/30' : 'bg-red-500/15 text-red-400 border-red-500/30'
          }`}>
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}/>
            {connected ? 'مباشر' : 'غير متصل'}
          </div>
        </div>
      </div>

      {/* Ready Orders Section */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center"><FaConciergeBell /></span>
          طلبات جاهزة للتقديم
        </h2>
        
        {readyOrders.length === 0 ? (
          <div className="bg-[#111118] border border-white/5 rounded-2xl p-8 text-center text-[#5e5e72]">
            لا توجد طلبات جاهزة حالياً.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {readyOrders.map(order => (
              <div key={order._id} className="bg-gradient-to-br from-green-500/10 to-[#111118] border border-green-500/30 rounded-2xl p-5 shadow-[0_4px_20px_rgba(34,197,94,0.15)] animate-slide-up">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-black text-white">
                      {order.tableNumber && order.tableNumber > 0 ? `طاولة ${order.tableNumber}` : 'سفري'}
                    </h3>
                    <p className="text-xs text-green-400 mt-1 font-bold">جاهز للتقديم الآن!</p>
                  </div>
                  <div className="text-left font-mono text-sm text-[#9a9aad]">
                    #{order.orderNumber || order._id.slice(-4)}
                  </div>
                </div>

                <div className="space-y-2 mb-6">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex gap-2 text-sm">
                      <span className="font-bold text-green-400">{item.quantity}×</span>
                      <span className="text-white">{item.nameAr || item.name}</span>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={() => markServed(order._id)}
                  className="w-full bg-green-500 hover:bg-green-400 text-gray-900 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg"
                >
                  <FaCheckCircle /> تأكيد التقديم
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Orders Section */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-yellow-500/20 text-yellow-400 flex items-center justify-center"><FaClock /></span>
          طلبات قيد التحضير
        </h2>
        
        {activeOrders.length === 0 ? (
          <div className="bg-[#111118] border border-white/5 rounded-2xl p-8 text-center text-[#5e5e72]">
            لا توجد طلبات قيد التحضير.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeOrders.map(order => (
              <div key={order._id} className="bg-[#111118] border border-white/5 rounded-2xl p-5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {order.tableNumber && order.tableNumber > 0 ? `طاولة ${order.tableNumber}` : 'سفري'}
                    </h3>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-md text-xs font-bold bg-yellow-500/10 text-yellow-400">
                      {order.status === 'preparing' ? 'في المطبخ' : 'بانتظار التأكيد'}
                    </span>
                  </div>
                  <div className="text-left font-mono text-sm text-[#9a9aad]">
                    #{order.orderNumber || order._id.slice(-4)}
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex gap-2 text-sm">
                      <span className="font-bold text-primary">{item.quantity}×</span>
                      <span className="text-[#9a9aad]">{item.nameAr || item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
