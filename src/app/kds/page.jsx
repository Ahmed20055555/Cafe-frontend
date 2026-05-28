"use client";
import { useState, useEffect, useCallback } from 'react';
import { FaCheck, FaClock, FaFire, FaExclamationTriangle, FaSync } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { getActiveOrders, updateOrderStatus } from '@/lib/api';
import { connectSocket, disconnectSocket } from '@/lib/socket';
import api from '@/lib/api';

const TIME_OPTIONS = [5, 8, 10, 12, 15, 20, 25, 30];

const getUrgency = (createdAt) => {
  const mins = Math.floor((Date.now() - new Date(createdAt)) / 60000);
  if (mins >= 15) return 'critical';
  if (mins >= 8)  return 'warning';
  return 'normal';
};

const getWaitLabel = (createdAt) => {
  const mins = Math.floor((Date.now() - new Date(createdAt)) / 60000);
  if (mins < 1) return 'الآن';
  return `منذ ${mins} د`;
};

// ─── Time Picker Modal ──────────────────────────────────────────────────────
function TimePickerModal({ order, onConfirm, onCancel }) {
  const [selected, setSelected] = useState(10);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#13131f] border border-white/10 rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-slide-up">
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">⏱️</div>
          <h2 className="text-xl font-bold">كم دقيقة يحتاج الطلب؟</h2>
          <div className="flex items-center justify-center gap-2 mt-3">
            <span className="bg-white/10 border border-white/20 text-white px-3 py-1 rounded-lg text-sm font-bold flex items-center gap-1">
              <span className="text-white/50 text-xs">طلب</span>
              #{order.orderNumber || order._id.slice(-4)}
            </span>
            <span className={`px-3 py-1 rounded-lg text-sm font-bold border flex items-center gap-1.5 ${
              order.customerNotes?.includes('ديليفري')
                ? 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                : order.customerNotes?.includes('تيك أوي')
                  ? 'bg-green-500/10 border-green-500/30 text-green-400'
                  : order.tableNumber && order.tableNumber > 0
                    ? 'bg-primary/10 border-primary/30 text-primary'
                    : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
            }`}>
              {order.customerNotes?.includes('ديليفري') ? '🚴 ديليفري'
                : order.customerNotes?.includes('تيك أوي') ? '👜 تيك أوي'
                : order.tableNumber && order.tableNumber > 0 ? `🪑 طاولة ${order.tableNumber}`
                : '🛍️ سفري'}
            </span>
          </div>
        </div>

        {/* Time Grid */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          {TIME_OPTIONS.map(min => (
            <button
              key={min}
              onClick={() => setSelected(min)}
              className={`py-3 rounded-xl font-bold text-sm transition-all ${
                selected === min
                  ? 'bg-primary text-gray-900 scale-105 shadow-[0_0_15px_rgba(200,149,108,0.5)]'
                  : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
              }`}
            >
              {min}<span className="text-xs font-normal"> د</span>
            </button>
          ))}
        </div>

        {/* Custom Input */}
        <div className="flex items-center gap-3 mb-6 bg-white/5 border border-white/10 rounded-xl px-4 py-2">
          <span className="text-[#9a9aad] text-sm">أو اكتب:</span>
          <input
            type="number"
            min="1"
            max="120"
            value={selected}
            onChange={(e) => setSelected(parseInt(e.target.value) || 1)}
            className="flex-1 bg-transparent text-center text-2xl font-bold text-primary focus:outline-none w-16"
          />
          <span className="text-[#9a9aad] text-sm">دقيقة</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl border border-white/10 text-[#9a9aad] hover:bg-white/5 transition-colors font-medium"
          >
            إلغاء
          </button>
          <button
            onClick={() => onConfirm(selected)}
            className="flex-2 flex-grow-[2] py-3 rounded-xl bg-primary text-gray-900 font-bold hover:opacity-90 transition-all shadow-[0_4px_15px_rgba(200,149,108,0.4)]"
          >
            🔥 ابدأ التحضير ({selected} د)
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Live Countdown (inside each card) ─────────────────────────────────────
function LiveCountdown({ targetTime }) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    const update = () => {
      const diff = Math.max(0, Math.floor((new Date(targetTime) - Date.now()) / 1000));
      setRemaining(diff);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [targetTime]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const done = remaining === 0;
  const urgent = remaining < 60;

  return (
    <div className={`text-center py-2 rounded-xl font-mono font-black text-xl ${
      done    ? 'text-green-400 bg-green-500/10 border border-green-500/20' :
      urgent  ? 'text-red-400 bg-red-500/10 border border-red-500/20 animate-pulse' :
                'text-yellow-400 bg-yellow-400/10 border border-yellow-400/20'
    }`}>
      {done ? '✅ جاهز الآن!' : `${mins}:${String(secs).padStart(2,'0')}`}
    </div>
  );
}

// ─── Main KDS Page ──────────────────────────────────────────────────────────
export default function KDSPage() {
  const [orders, setOrders]       = useState([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading]     = useState(true);
  const [timePicker, setTimePicker] = useState(null); // order to pick time for
  const [, tick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => tick(t => t + 1), 30000);
    return () => clearInterval(id);
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await getActiveOrders();
      if (res.data.success) setOrders(res.data.data);
    } catch (e) {
      console.error('Fetch orders failed:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();

    const socket = connectSocket();
    socket.on('connect', () => { setConnected(true); socket.emit('join:kitchen'); });
    socket.on('disconnect', () => setConnected(false));
    socket.on('order:new', (o) => {
      setOrders(prev => prev.find(x => x._id === o._id) ? prev : [o, ...prev]);
      try { new Audio('/notification.mp3').play(); } catch (_) {}
    });
    socket.on('order:statusUpdate', (updated) => {
      setOrders(prev =>
        prev.map(o => o._id === updated._id ? updated : o)
            .filter(o => !['ready', 'served', 'completed'].includes(o.status))
      );
    });

    socket.on('order:kitchenAlerted', (data) => {
      toast(`🔔 تنبيه تأخير: الزبون على طاولة ${data.tableNumber || 'سفري'} بيسأل على الأوردر!`, { 
        icon: '⚠️', duration: 8000, 
        style: { background: '#ef4444', color: '#fff', fontWeight: 'bold' } 
      });
      try { new Audio('/notification.mp3').play(); } catch (_) {}
    });

    return () => {
      socket.off('connect'); socket.off('disconnect');
      socket.off('order:new'); socket.off('order:statusUpdate');
      socket.off('order:kitchenAlerted');
      disconnectSocket();
    };
  }, [fetchOrders]);

  // Chef picks a time → update status to preparing + estimatedMinutes
  const handleStartPreparing = async (estimatedMins) => {
    const order = timePicker;
    setTimePicker(null);

    const readyAt = new Date(Date.now() + estimatedMins * 60 * 1000).toISOString();

    // Optimistic update
    setOrders(prev => prev.map(o =>
      o._id === order._id ? { ...o, status: 'preparing', estimatedReadyAt: readyAt } : o
    ));

    try {
      await api.patch(`/orders/${order._id}/status`, {
        status: 'preparing',
        estimatedMins,
        readyAt,
        // Socket server will emit to session room
        sessionId: order.session,
        tableNumber: order.tableNumber,
      });
    } catch (e) {
      console.error('Update failed:', e);
      fetchOrders();
    }
  };

  const markReady = async (id) => {
    setOrders(prev => prev.filter(o => o._id !== id));
    try { await updateOrderStatus(id, 'ready'); }
    catch (e) { console.error(e); fetchOrders(); }
  };

  const urgencyConfig = {
    critical: { border:'border-red-500/70', header:'bg-red-500/15', badge:'bg-red-500/20 text-red-300', icon:<FaFire className="text-red-400"/>, label:'عاجل', btn:'bg-red-500 hover:bg-red-400' },
    warning:  { border:'border-yellow-400/60', header:'bg-yellow-400/10', badge:'bg-yellow-400/20 text-yellow-300', icon:<FaExclamationTriangle className="text-yellow-400"/>, label:'تأخر', btn:'bg-green-500 hover:bg-green-400' },
    normal:   { border:'border-white/10', header:'bg-white/5', badge:'bg-green-500/15 text-green-300', icon:<FaClock className="text-green-400"/>, label:'جديد', btn:'bg-green-500 hover:bg-green-400' },
  };

  const sorted = [...orders]
    .filter(o => ['pending','preparing'].includes(o.status))
    .sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt));

  return (
    <div className="min-h-screen bg-[#050508] p-4 md:p-6">
      {/* Time Picker Modal */}
      {timePicker && (
        <TimePickerModal
          order={timePicker}
          onConfirm={handleStartPreparing}
          onCancel={() => setTimePicker(null)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white"> شاشة المطبخ</h1>
          <p className="text-[#9a9aad] text-sm mt-1">{sorted.length} طلب نشط</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchOrders} className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors">
            <FaSync size={12}/> تحديث
          </button>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border ${
            connected ? 'bg-green-500/15 text-green-400 border-green-500/30' : 'bg-red-500/15 text-red-400 border-red-500/30'
          }`}>
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}/>
            {connected ? 'مباشر' : 'غير متصل'}
          </div>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_,i) => <div key={i} className="bg-white/5 rounded-2xl h-64 animate-pulse border border-white/5"/>)}
        </div>
      ) : sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <div className="text-7xl mb-6">✅</div>
          <h2 className="text-2xl font-bold text-white mb-2">المطبخ خالي!</h2>
          <p className="text-[#5e5e72] text-lg">لا توجد طلبات نشطة حالياً</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sorted.map(order => {
            const urgency = getUrgency(order.createdAt);
            const cfg = urgencyConfig[urgency];
            const isPreparing = order.status === 'preparing';

            return (
              <div key={order._id} className={`rounded-2xl border-2 overflow-hidden flex flex-col bg-[#0d0d14] transition-all ${cfg.border} ${urgency==='critical' ? 'shadow-[0_0_20px_rgba(239,68,68,0.25)]' : ''}`}>
                {/* Header */}
                <div className={`px-4 py-3 flex justify-between items-center ${cfg.header}`}>
                  <div>
                    <div className="font-black text-lg leading-none">#{order.orderNumber || order._id.slice(-4)}</div>
                    <div className="text-xs mt-0.5 flex items-center gap-1.5 flex-wrap">
                      {order.customerNotes?.includes('ديليفري') ? (
                        <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                          🚴 ديليفري
                        </span>
                      ) : order.customerNotes?.includes('تيك أوي') ? (
                        <span className="bg-green-500/20 text-green-300 border border-green-500/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                          👜 تيك أوي
                        </span>
                      ) : order.tableNumber && order.tableNumber > 0 ? (
                        <span className="text-white/60">🪑 طاولة {order.tableNumber}</span>
                      ) : (
                        <span className="bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 px-2 py-0.5 rounded-full font-bold">🛍️ سفري</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${cfg.badge}`}>
                      {cfg.icon} {isPreparing ? 'قيد التحضير' : cfg.label}
                    </span>
                    <span className="text-xs text-white/50 flex items-center gap-1">
                      <FaClock size={10}/> {getWaitLabel(order.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Items */}
                <div className="flex-1 px-4 py-3 space-y-2.5">
                  {order.items.map((item,idx) => (
                    <div key={idx} className="flex gap-3">
                      <span className="text-primary font-black text-lg w-7 flex-shrink-0 leading-tight">{item.quantity}×</span>
                      <div>
                        <p className="font-bold text-white leading-tight">{item.nameAr||item.name}</p>
                        {item.notes && <p className="text-yellow-400 text-xs mt-0.5">⚠️ {item.notes}</p>}
                      </div>
                    </div>
                  ))}
                  {order.customerNotes && (
                    <div className="mt-3 p-2.5 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                      <p className="text-yellow-300 text-xs font-medium">📝 {order.customerNotes}</p>
                    </div>
                  )}
                </div>

                {/* Countdown (if preparing) */}
                {isPreparing && order.estimatedReadyAt && (
                  <div className="px-3 pb-2">
                    <LiveCountdown targetTime={order.estimatedReadyAt}/>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="p-3 pt-1 space-y-2">
                  {order.status === 'pending' && (
                    <button
                      onClick={() => setTimePicker(order)}
                      className="w-full py-3 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-bold transition-all flex items-center justify-center gap-2 text-sm active:scale-95"
                    >
                      🔥 ابدأ التحضير + حدد الوقت
                    </button>
                  )}
                  <button
                    onClick={() => markReady(order._id)}
                    className={`w-full py-3 rounded-xl text-white font-bold transition-all flex items-center justify-center gap-2 text-sm active:scale-95 ${cfg.btn}`}
                  >
                    <FaCheck/> تحديد كجاهز ✓
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
