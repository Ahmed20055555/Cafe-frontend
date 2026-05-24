"use client";
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  FaSync, FaChair, FaLock, FaLockOpen, FaTimesCircle,
  FaCheckCircle, FaShoppingBag, FaSpinner, FaClock
} from 'react-icons/fa';

const STATUS_LABELS = {
  available: { label: 'متاحة', color: 'text-green-400', bg: 'bg-green-400/10 border-green-400/30' },
  occupied:  { label: 'مشغولة', color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/30' },
  reserved:  { label: 'محجوزة', color: 'text-blue-400',  bg: 'bg-blue-400/10 border-blue-400/30'   },
  cleaning:  { label: 'تنظيف',  color: 'text-purple-400', bg: 'bg-purple-400/10 border-purple-400/30' },
};

const ORDER_STATUS = {
  pending:   { label: 'انتظار', color: 'bg-yellow-400/20 text-yellow-400' },
  preparing: { label: 'تحضير', color: 'bg-blue-400/20 text-blue-400' },
  ready:     { label: 'جاهز',  color: 'bg-green-400/20 text-green-400' },
  delivered: { label: 'تم التوصيل', color: 'bg-gray-400/20 text-gray-400' },
};

export default function AdminTablesPage() {
  const [tables, setTables] = useState([]);
  const [sessions, setSessions] = useState({});   // tableId → session with orders
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({}); // tableId → bool

  const fetchTables = useCallback(async () => {
    setLoading(true);
    try {
      const [tablesRes, sessionsRes] = await Promise.all([
        api.get('/tables'),
        api.get('/sessions?status=active')
      ]);
      if (tablesRes.data.success) {
        setTables(tablesRes.data.data);
      }
      if (sessionsRes.data.success) {
        const sessionMap = {};
        sessionsRes.data.data.forEach(s => {
          if (s.table?._id) sessionMap[s.table._id] = s;
        });
        setSessions(sessionMap);
      }
    } catch (error) {
      toast.error('خطأ في تحميل الطاولات');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTables(); }, [fetchTables]);

  // ── Block / Unblock ────────────────────────────────────────────────────────
  const toggleBlock = async (table) => {
    setActionLoading(p => ({ ...p, [table._id]: true }));
    try {
      const res = await api.patch(`/tables/${table._id}/block`, {
        isBlocked: !table.isBlocked
      });
      if (res.data.success) {
        setTables(prev => prev.map(t => t._id === table._id ? res.data.data : t));
        toast.success(table.isBlocked ? 'تم فتح الطاولة' : 'تم إغلاق الطاولة');
      }
    } catch (error) {
      toast.error('خطأ في تحديث حالة الطاولة');
    } finally {
      setActionLoading(p => ({ ...p, [table._id]: false }));
    }
  };

  // ── Close active session ───────────────────────────────────────────────────
  const closeSession = async (table) => {
    if (!confirm(`هل أنت متأكد من إنهاء جلسة الطاولة ${table.number}؟`)) return;
    setActionLoading(p => ({ ...p, [table._id]: true }));
    try {
      const res = await api.patch(`/tables/${table._id}/close-session`);
      if (res.data.success) {
        setTables(prev => prev.map(t => t._id === table._id ? { ...t, status: 'available', currentSession: null } : t));
        setSessions(prev => { const n = { ...prev }; delete n[table._id]; return n; });
        // Clear localStorage so customer cannot re-enter this table
        localStorage.removeItem(`session_table_${table.number}`);
        toast.success(`تم إنهاء جلسة الطاولة ${table.number} ✅`);
      }
    } catch (error) {
      toast.error('خطأ في إنهاء الجلسة');
    } finally {
      setActionLoading(p => ({ ...p, [table._id]: false }));
    }
  };

  const occupied = tables.filter(t => t.status === 'occupied').length;
  const available = tables.filter(t => t.status === 'available' && !t.isBlocked).length;
  const blocked  = tables.filter(t => t.isBlocked).length;

  return (
    <div>
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-1">إدارة الطاولات</h1>
          <p className="text-[#9a9aad] text-xs md:text-sm">تتبع حالة الطاولات والطلبات في الوقت الفعلي.</p>
        </div>
        <button onClick={fetchTables} className="px-3 py-2 md:px-4 md:py-2.5 flex items-center justify-center gap-2 rounded-lg bg-elevated border border-white/10 text-xs md:text-sm font-bold hover:text-primary transition-all">
          <FaSync className={loading ? "animate-spin" : ""} /> تحديث
        </button>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
        <div className="bg-card border border-yellow-400/20 rounded-2xl p-3 md:p-4 text-center">
          <div className="text-2xl md:text-3xl font-bold text-yellow-400 mb-1">{occupied}</div>
          <div className="text-[10px] md:text-xs text-[#9a9aad] font-bold">طاولات مشغولة</div>
        </div>
        <div className="bg-card border border-green-400/20 rounded-2xl p-3 md:p-4 text-center">
          <div className="text-2xl md:text-3xl font-bold text-green-400 mb-1">{available}</div>
          <div className="text-[10px] md:text-xs text-[#9a9aad] font-bold">طاولات متاحة</div>
        </div>
        <div className="bg-card border border-red-400/20 rounded-2xl p-3 md:p-4 text-center">
          <div className="text-2xl md:text-3xl font-bold text-red-400 mb-1">{blocked}</div>
          <div className="text-[10px] md:text-xs text-[#9a9aad] font-bold">طاولات مغلقة</div>
        </div>
      </div>

      {/* ── Tables Grid ── */}
      {loading ? (
        <div className="flex items-center justify-center py-32 text-[#5e5e72]">
          <FaSpinner className="animate-spin text-2xl md:text-3xl mr-3" />
          <span className="text-base md:text-lg font-medium">جاري التحميل...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
          {tables.map(table => {
            const st = STATUS_LABELS[table.status] || STATUS_LABELS.available;
            const session = sessions[table._id];
            const orders = session?.orders || [];
            const isLoading = actionLoading[table._id];
            const totalItems = orders.reduce((sum, o) => sum + o.items?.reduce((s, i) => s + i.quantity, 0), 0);
            const totalPrice = orders.reduce((sum, o) => sum + (o.total || 0), 0);

            return (
              <div
                key={table._id}
                className={`bg-card rounded-2xl border overflow-hidden transition-all flex flex-col ${
                  table.isBlocked
                    ? 'border-red-500/30 opacity-75'
                    : table.status === 'occupied'
                    ? 'border-yellow-400/30 shadow-[0_0_25px_rgba(250,204,21,0.08)]'
                    : 'border-white/5'
                }`}
              >
                {/* Card Header */}
                <div className={`px-4 py-3 md:px-5 md:py-4 flex items-center justify-between ${
                  table.isBlocked ? 'bg-red-500/10' :
                  table.status === 'occupied' ? 'bg-yellow-400/5' : 'bg-elevated/50'
                }`}>
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center font-black text-base md:text-lg ${
                      table.isBlocked ? 'bg-red-500/20 text-red-400' :
                      table.status === 'occupied' ? 'bg-yellow-400/20 text-yellow-400' :
                      'bg-green-400/10 text-green-400'
                    }`}>
                      {table.number}
                    </div>
                    <div>
                      <div className="font-bold text-xs md:text-sm">طاولة {table.number}</div>
                      <div className="text-[10px] md:text-xs text-[#5e5e72]">{table.capacity} أشخاص · {table.location}</div>
                    </div>
                  </div>

                  {table.isBlocked ? (
                    <span className="flex items-center gap-1.5 text-[10px] md:text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 md:px-2.5 md:py-1 rounded-full">
                      <FaLock size={8} className="md:w-2.5 md:h-2.5" /> مغلقة
                    </span>
                  ) : (
                    <span className={`text-[10px] md:text-xs font-bold border px-2 py-0.5 md:px-2.5 md:py-1 rounded-full ${st.bg} ${st.color}`}>
                      {st.label}
                    </span>
                  )}
                </div>

                {/* Session / Orders */}
                <div className="flex-1 p-4 md:p-5">
                  {table.isBlocked ? (
                    <div className="text-center py-4">
                      <FaLock className="text-red-400 text-xl md:text-2xl mx-auto mb-2" />
                      <p className="text-red-400 font-bold text-xs md:text-sm">تم حجز هذه الطاولة</p>
                      <p className="text-[#5e5e72] text-[10px] md:text-xs mt-1">مغلقة من قِبل الإدارة</p>
                    </div>
                  ) : table.status === 'occupied' && orders.length > 0 ? (
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] md:text-xs text-[#9a9aad] mb-2 md:mb-3">
                        <span className="flex items-center gap-1"><FaShoppingBag size={10} /> {orders.length} طلب · {totalItems} عنصر</span>
                        <span className="text-primary font-bold">${totalPrice.toFixed(2)}</span>
                      </div>
                      {orders.slice(0, 3).map(order => (
                        <div key={order._id} className="flex items-center justify-between bg-elevated/50 rounded-xl px-2 py-1.5 md:px-3 md:py-2 border border-white/5">
                          <div>
                            <span className="text-[10px] md:text-xs font-bold text-white/80">
                              #{order.orderNumber || order._id?.slice(-4)}
                            </span>
                            <span className="text-[#5e5e72] text-[10px] md:text-xs mr-2">
                              {order.items?.reduce((s, i) => s + i.quantity, 0)} عنصر
                            </span>
                          </div>
                          <span className={`text-[10px] md:text-xs font-bold px-2 py-0.5 rounded-full ${ORDER_STATUS[order.status]?.color || 'bg-gray-400/20 text-gray-400'}`}>
                            {ORDER_STATUS[order.status]?.label || order.status}
                          </span>
                        </div>
                      ))}
                      {orders.length > 3 && (
                        <p className="text-[10px] md:text-xs text-[#5e5e72] text-center">+{orders.length - 3} طلبات أخرى</p>
                      )}
                    </div>
                  ) : table.status === 'occupied' ? (
                    <div className="text-center py-4 text-[#5e5e72]">
                      <FaClock className="mx-auto mb-2 text-lg md:text-xl text-yellow-400" />
                      <p className="text-xs md:text-sm">جلسة نشطة · لا يوجد طلبات بعد</p>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-[#5e5e72]">
                      <FaChair className="mx-auto mb-2 text-lg md:text-xl text-green-400" />
                      <p className="text-xs md:text-sm">الطاولة فارغة</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="px-4 pb-4 md:px-5 flex flex-col sm:flex-row gap-2">
                  {/* Lock / Unlock */}
                  <button
                    onClick={() => toggleBlock(table)}
                    disabled={isLoading}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all border ${
                      table.isBlocked
                        ? 'bg-green-400/10 text-green-400 border-green-400/20 hover:bg-green-400/20'
                        : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
                    } disabled:opacity-50`}
                  >
                    {isLoading ? <FaSpinner className="animate-spin" /> :
                      table.isBlocked ? <><FaLockOpen size={10} className="md:w-3 md:h-3" /> فتح الطاولة</> : <><FaLock size={10} className="md:w-3 md:h-3" /> إغلاق الطاولة</>
                    }
                  </button>

                  {/* Close Session — only when occupied */}
                  {table.status === 'occupied' && !table.isBlocked && (
                    <button
                      onClick={() => closeSession(table)}
                      disabled={isLoading}
                      className="flex-1 flex items-center justify-center gap-2 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-bold bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 hover:bg-yellow-400/20 transition-all disabled:opacity-50"
                    >
                      {isLoading ? <FaSpinner className="animate-spin" /> : <><FaTimesCircle size={10} className="md:w-3 md:h-3" /> إنهاء الجلسة</>}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
