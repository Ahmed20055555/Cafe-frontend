"use client";
import { useState, useEffect, useCallback, useRef } from 'react';
import { FaCheckCircle, FaClock, FaConciergeBell, FaSync, FaBell } from 'react-icons/fa';
import api from '@/lib/api';
import { connectSocket, disconnectSocket } from '@/lib/socket';
import toast from 'react-hot-toast';

// ── Alert Banner ──────────────────────────────────────────────────────────────
function AlertBanner({ alerts, onDismiss }) {
  if (alerts.length === 0) return null;
  return (
    <div className="fixed top-0 left-0 right-0 z-[200] flex flex-col gap-2 p-4 pointer-events-none">
      {alerts.map((a) => (
        <div
          key={a.id}
          className={`flex items-center justify-between gap-4 px-5 py-4 rounded-2xl shadow-2xl pointer-events-auto animate-slide-up border ${
            a.type === 'ready'
              ? 'bg-green-500 border-green-400 text-gray-900'
              : 'bg-primary border-primary/80 text-gray-900'
          }`}
        >
          <div className="flex items-center gap-3">
            <FaBell className="text-2xl animate-bounce" />
            <div>
              <p className="font-black text-lg leading-tight">{a.title}</p>
              <p className="text-sm font-medium opacity-80">{a.body}</p>
            </div>
          </div>
          <button
            onClick={() => onDismiss(a.id)}
            className="bg-black/20 hover:bg-black/40 rounded-xl px-3 py-1.5 text-sm font-bold transition-colors"
          >
            إغلاق
          </button>
        </div>
      ))}
    </div>
  );
}

export default function WaiterDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const alertIdRef = useRef(0);

  const addAlert = useCallback((type, title, body) => {
    const id = ++alertIdRef.current;
    setAlerts(prev => [...prev, { id, type, title, body }]);
    // Auto dismiss after 8 seconds
    setTimeout(() => {
      setAlerts(prev => prev.filter(a => a.id !== id));
    }, 8000);
    // Play sound
    try { new Audio('/notification.mp3').play(); } catch (_) {}
  }, []);

  const dismissAlert = useCallback((id) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  }, []);

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

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join:waiter');
    });
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', () => setConnected(false));

    // New order came in
    socket.on('order:new', (o) => {
      setOrders(prev => prev.find(x => x._id === o._id) ? prev : [o, ...prev]);
      addAlert(
        'new',
        `🆕 أوردر جديد!`,
        `طاولة ${o.tableNumber && o.tableNumber > 0 ? o.tableNumber : 'سفري'} — ${o.items?.length || ''} صنف`
      );
    });

    // Order status changed
    socket.on('order:statusUpdate', (updated) => {
      setOrders(prev => {
        if (['completed', 'cancelled'].includes(updated.status)) {
          return prev.filter(o => o._id !== updated._id);
        }
        // If served already, remove from active
        if (updated.status === 'served') {
          return prev.filter(o => o._id !== updated._id);
        }
        return prev.map(o => o._id === updated._id ? updated : o);
      });

      if (updated.status === 'ready') {
        addAlert(
          'ready',
          `✅ أوردر جاهز للتقديم!`,
          `طاولة ${updated.tableNumber && updated.tableNumber > 0 ? updated.tableNumber : 'سفري'} — خلصه المطبخ!`
        );
      }
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('order:new');
      socket.off('order:statusUpdate');
      disconnectSocket();
    };
  }, [fetchOrders, addAlert]);

  const markServed = async (id) => {
    try {
      setOrders(prev => prev.filter(o => o._id !== id));
      await api.patch(`/orders/${id}/status`, { status: 'served' });
      toast.success('تم تقديم الطلب بنجاح ✓');
    } catch (err) {
      toast.error('حدث خطأ أثناء تحديث حالة الطلب');
      fetchOrders();
    }
  };

  const readyOrders = orders.filter(o => o.status === 'ready');
  const activeOrders = orders.filter(o => ['pending', 'preparing'].includes(o.status));

  return (
    <>
      {/* Full-screen Alert Banners */}
      <AlertBanner alerts={alerts} onDismiss={dismissAlert} />

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
              {connected ? 'مباشر 🔴' : 'غير متصل'}
            </div>
          </div>
        </div>

        {/* Ready Orders Section */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center">
              <FaConciergeBell />
            </span>
            طلبات جاهزة للتقديم
            {readyOrders.length > 0 && (
              <span className="bg-green-500 text-gray-900 text-xs font-black rounded-full w-6 h-6 flex items-center justify-center animate-bounce">
                {readyOrders.length}
              </span>
            )}
          </h2>

          {readyOrders.length === 0 ? (
            <div className="bg-[#111118] border border-white/5 rounded-2xl p-8 text-center text-[#5e5e72]">
              لا توجد طلبات جاهزة حالياً.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {readyOrders.map(order => (
                <div key={order._id} className="bg-gradient-to-br from-green-500/10 to-[#111118] border-2 border-green-500/40 rounded-2xl p-5 shadow-[0_4px_20px_rgba(34,197,94,0.2)] animate-slide-up">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-black text-white">
                        {order.tableNumber && order.tableNumber > 0 ? `🪑 طاولة ${order.tableNumber}` : '🛍️ سفري'}
                      </h3>
                      <p className="text-xs text-green-400 mt-1 font-bold animate-pulse">● جاهز للتقديم الآن!</p>
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
                    className="w-full bg-green-500 hover:bg-green-400 text-gray-900 font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-green-500/30"
                  >
                    <FaCheckCircle /> تأكيد التقديم للزبون
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Orders Section */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-yellow-500/20 text-yellow-400 flex items-center justify-center">
              <FaClock />
            </span>
            طلبات قيد التحضير في المطبخ
          </h2>

          {activeOrders.length === 0 ? (
            <div className="bg-[#111118] border border-white/5 rounded-2xl p-8 text-center text-[#5e5e72]">
              لا توجد طلبات قيد التحضير.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeOrders.map(order => (
                <div key={order._id} className="bg-[#111118] border border-white/5 rounded-2xl p-5 hover:border-yellow-500/30 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-white">
                        {order.tableNumber && order.tableNumber > 0 ? `🪑 طاولة ${order.tableNumber}` : '🛍️ سفري'}
                      </h3>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded-md text-xs font-bold ${
                        order.status === 'preparing'
                          ? 'bg-blue-500/10 text-blue-400'
                          : 'bg-yellow-500/10 text-yellow-400'
                      }`}>
                        {order.status === 'preparing' ? '🔥 في المطبخ' : '⏳ بانتظار المطبخ'}
                      </span>
                    </div>
                    <div className="text-left font-mono text-sm text-[#9a9aad]">
                      #{order.orderNumber || order._id.slice(-4)}
                    </div>
                  </div>

                  <div className="space-y-2">
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
    </>
  );
}
