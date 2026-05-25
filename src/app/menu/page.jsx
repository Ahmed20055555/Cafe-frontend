"use client";
import { useState, useEffect, useRef } from 'react';
import { FaShoppingCart, FaPlus, FaMinus, FaTrash, FaChair, FaCheckCircle, FaClock, FaFire } from 'react-icons/fa';
import toast from 'react-hot-toast';
import api, { startSession, placeOrder } from '@/lib/api';
import { connectSocket, disconnectSocket } from '@/lib/socket';
import { useSettings } from '@/contexts/SettingsContext';

// ─── Live Countdown Component ───────────────────────────────────────────────
function LiveCountdown({ readyAt, onDone }) {
  const [remaining, setRemaining] = useState(0);
  const doneFired = useRef(false);
  useEffect(() => {
    const update = () => {
      const r = Math.max(0, Math.floor((new Date(readyAt) - Date.now()) / 1000));
      setRemaining(r);
      if (r === 0 && !doneFired.current) {
        doneFired.current = true;
        onDone?.();
      }
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [readyAt, onDone]);
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const done = remaining === 0;
  return (
    <span className={`font-mono font-black text-2xl ${done ? 'text-green-400' : remaining < 60 ? 'text-red-400 animate-pulse' : 'text-primary'
      }`}>
      {done ? 'جاهز الآن!' : `${mins}:${String(secs).padStart(2, '0')}`}
    </span>
  );
}

export default function MenuPage() {
  const { settings } = useSettings();
  const [categories, setCategories] = useState([{ _id: 'all', nameAr: 'الكل', name: 'All' }]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [tableNumber, setTableNumber] = useState(null);
  const [showTableModal, setShowTableModal] = useState(true);
  const [tableInput, setTableInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const [orderTracker, setOrderTracker] = useState(null);
  const [tableStatuses, setTableStatuses] = useState({}); // { 1: 'available', 2: 'occupied', ... }
  const [tableStatusLoading, setTableStatusLoading] = useState(false);
  const [selectedTableInfo, setSelectedTableInfo] = useState(null); // status info for chosen table
  const [confirmStep, setConfirmStep] = useState(false); // show confirm dialog after picking occupied table
  const [orderType, setOrderType] = useState(null);
  const [customerName, setCustomerName] = useState('');
  const [deliveryInfo, setDeliveryInfo] = useState({ name: '', phone: '', address: '' });
  const cartBtnRef = useRef(null);
  const socketRef = useRef(null);

  const TOTAL_TABLES = 10;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tableParam = params.get('table');
    const typeParam = params.get('type');

    if (tableParam) {
      setTableNumber(parseInt(tableParam));
      setOrderType('dine-in');
      setShowTableModal(false);
    } else if (typeParam) {
      // Coming from landing page with a selected type
      if (typeParam === 'browse') {
        setOrderType('browse');
        setTableNumber('browse');
        setShowTableModal(false);
      } else if (typeParam === 'delivery') {
        setOrderType('delivery');
        // Keep showTableModal=true so they fill in the delivery form
      } else {
        setOrderType(typeParam); // 'dine-in' or 'takeaway' → show their sub-modal
      }
      fetchAllTableStatuses();
    } else {
      // Pre-load all table statuses
      fetchAllTableStatuses();
    }
    fetchMenu();
    checkPreviousSession();
  }, []);

  const [resumableSession, setResumableSession] = useState(null);

  const checkPreviousSession = async () => {
    const token = localStorage.getItem('latest_session_token');
    if (!token) return;
    try {
      const res = await api.get(`/sessions/${token}`);
      if (res.data.success && res.data.data.status === 'active') {
        const sessionData = res.data.data;
        const activeOrder = sessionData.orders?.reverse().find(o => ['pending', 'preparing', 'ready'].includes(o.status));
        if (activeOrder) {
          setResumableSession({ sessionData, activeOrder });
          
          // Auto-resume if coming from the landing page resume button
          const params = new URLSearchParams(window.location.search);
          if (params.get('resume') === 'true') {
            const notes = activeOrder.customerNotes || '';
            const isDelivery = notes.includes('ديليفري');
            const isTakeaway = notes.includes('تيك أوي');
            const resumedType = sessionData.tableNumber > 0 ? 'dine-in' : isDelivery ? 'delivery' : isTakeaway ? 'takeaway' : 'dine-in';
            
            setTableNumber(sessionData.tableNumber);
            setupActiveSession(sessionData, activeOrder);
            setOrderType(resumedType); 
            setShowTableModal(false);
          }
        }
      }
    } catch (e) {
      // Token invalid or session ended
    }
  };

  const fetchAllTableStatuses = async () => {
    setTableStatusLoading(true);
    try {
      const res = await api.get('/tables/public/status');
      if (res.data.success) {
        const statuses = {};
        for (let i = 1; i <= TOTAL_TABLES; i++) statuses[i] = 'available';
        Object.assign(statuses, res.data.data);
        setTableStatuses(statuses);
      }
    } catch (e) {
      console.error('Failed to fetch table statuses:', e);
    } finally {
      setTableStatusLoading(false);
    }
  };

  const handleTableSelect = async (num) => {
    try {
      const res = await api.get(`/tables/status/${num}`);
      const info = res.data.data;
      setSelectedTableInfo(info);

      if (info.isBlocked) {
        toast.error('تم حجز هذه الطاولة من قِبَل الإدارة', { icon: '🔒' });
        return;
      }

      if (info.status === 'occupied') {
        // Check if this device owns the active session
        const savedToken = localStorage.getItem(`session_table_${num}`);
        if (savedToken) {
          try {
            const sessionCheck = await api.get(`/sessions/${savedToken}`);
            if (sessionCheck.data.success && sessionCheck.data.data.status === 'active' && sessionCheck.data.data.tableNumber === num) {
              const sessionData = sessionCheck.data.data;
              const activeOrder = sessionData.orders?.reverse().find(o => ['pending', 'preparing', 'ready'].includes(o.status));

              setTableNumber(num);
              setShowTableModal(false);
              setConfirmStep(false);
              
              setupActiveSession(sessionData, activeOrder || null);
              
              if (activeOrder) {
                toast.success('مرحباً بعودتك! جاري تجهيز طلبك.', { icon: '🍳' });
              } else {
                toast.success('مرحباً بعودتك! يمكنك متابعة طلبك الآن.', { icon: '👋' });
              }
              return;
            }
          } catch (e) {
            // Token invalid or session ended
          }
        }

        // Block any other device!
        toast.error('هذه الطاولة مشغولة حالياً 🪑 الرجاء اختيار طاولة أخرى أو انتظر حتى يُنهي الأدمن الجلسة.', {
          duration: 5000,
          icon: '⛔',
        });
        return;
      }

      confirmTable(num);
    } catch {
      confirmTable(num); // fallback
    }
  };

  const confirmTable = (num) => {
    setTableNumber(num);
    setShowTableModal(false);
    setConfirmStep(false);
    toast.success(`أهلاً بك على الطاولة رقم ${num} الآن تقدر تطلب من المنيو فترك!`);
  };


  const fetchMenu = async () => {
    try {
      const [menuRes, catRes] = await Promise.all([
        api.get('/menu'),
        api.get('/categories')
      ]);
      if (menuRes.data.success) {
        setMenuItems(menuRes.data.data);
      }
      if (catRes.data.success) {
        const activeCats = catRes.data.data.filter(c => c.isActive !== false);
        setCategories([{ _id: 'all', nameAr: 'الكل', name: 'All' }, ...activeCats]);
      }
    } catch (error) {
      // Fallback mock data if backend not ready
      setMenuItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTableSubmit = (e) => {
    e.preventDefault();
    const num = parseInt(tableInput);
    if (!num || num < 1) return toast.error('الرجاء إدخال رقم طاولة صحيح');
    handleTableSelect(num);
  };

  const getCartCount = () => cart.reduce((s, i) => s + i.quantity, 0);
  const getCartTotal = () => cart.reduce((s, i) => s + i.price * i.quantity, 0);

  const addToCart = (item, event) => {
    setCart(prev => {
      const ex = prev.find(c => c._id === item._id);
      if (ex) return prev.map(c => c._id === item._id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { ...item, quantity: 1 }];
    });

    // Animate: trigger cart shake
    if (cartBtnRef.current) {
      cartBtnRef.current.classList.add('scale-125');
      setTimeout(() => cartBtnRef.current?.classList.remove('scale-125'), 200);
    }
    toast.success(`✅ أُضيف: ${item.nameAr || item.name}`, { duration: 1500 });
  };

  const updateQty = (id, delta) => {
    setCart(prev =>
      prev.map(c => c._id === id ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c)
        .filter(c => c.quantity > 0)
    );
  };

  const setupActiveSession = (sessionData, orderData = null) => {
    setActiveSession({ token: sessionData.sessionToken, sessionId: sessionData._id });

    const socket = connectSocket();
    socketRef.current = socket;

    // Join room when connected (handles reconnects)
    const joinSession = () => socket.emit('join:session', sessionData._id);
    socket.on('connect', joinSession);
    if (socket.connected) joinSession();

    // Remove old listeners to prevent duplicates
    socket.off('order:preparing');
    socket.off('order:ready');

    socket.on('order:preparing', (data) => {
      setOrderTracker({
        status: 'preparing',
        estimatedMins: data.estimatedMins,
        readyAt: data.readyAt,
        orderNumber: data.orderNumber,
      });
      toast(`⏱️ المطبخ بدأ تحضير طلبك - ${data.estimatedMins} دقيقة`, { icon: '⏳', duration: 4000 });
    });

    socket.on('order:ready', () => {
      setOrderTracker(prev => prev ? { ...prev, status: 'ready' } : null);
      toast.success('🎉 طلبك جاهز! تفضل!', { duration: 6000 });
      // Reset flow after ready
      setOrderSuccess(false);
      setOrderType(null);
      setTableNumber(null);
      setResumableSession(null);
      // Clear stored session data so resume banner disappears
      localStorage.removeItem('latest_session_token');
      if (orderType === 'dine-in') {
        localStorage.removeItem(`session_table_${tableNumber}`);
      }
    });

    if (orderData) {
      setOrderTracker({
        status: orderData.status || 'pending',
        orderNumber: orderData.orderNumber,
        readyAt: orderData.estimatedReadyAt || undefined
      });
      setOrderSuccess(true);
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setSubmitting(true);
    try {
      // 1. Start Session - always use numeric table number
      // Takeaway=0, Delivery=0, Browse=99, Dine-in=actual table number
      const numericTable = (orderType === 'takeaway' || orderType === 'delivery') ? 0
        : (orderType === 'browse') ? 99
          : tableNumber;

      const sessionRes = await startSession(numericTable);
      const sessionData = sessionRes.data.data;
      const sessionToken = sessionData.sessionToken;
      const sessionId = sessionData._id;
      if (!sessionToken) throw new Error('فشل في إنشاء الجلسة');

      // Save session to localStorage for dine-in only
      if (orderType === 'dine-in') {
        localStorage.setItem(`session_table_${tableNumber}`, sessionToken);
      }
      // Save for ALL types to allow resuming
      localStorage.setItem('latest_session_token', sessionToken);

      // 2. Place Order - build notes based on type
      let orderNotes = '';
      if (orderType === 'takeaway') {
        orderNotes = `👜 تيك أوي — ${customerName}`;
      } else if (orderType === 'delivery') {
        orderNotes = `🚴 ديليفري — الاسم: ${deliveryInfo.name} | تيليفون: ${deliveryInfo.phone} | عنوان: ${deliveryInfo.address}`;
      };
      const orderRes = await placeOrder({
        sessionToken,
        items: cart.map(item => ({ menuItemId: item._id, quantity: item.quantity, notes: '' })),
        customerNotes: orderNotes
      });
      const orderData = orderRes.data.data;

      // 3. Setup socket and tracker
      setupActiveSession(sessionData, orderData);

      setCart([]);
      setIsCartOpen(false);
      // Wait room remains open; user can close it manually
    } catch (error) {
      console.error('Checkout error:', error.response?.data || error.message);
      toast.error(error.response?.data?.message || 'حدث خطأ أثناء إرسال الطلب');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredItems = activeCategory === "all"
    ? menuItems
    : menuItems.filter(item => item.category?._id === activeCategory);

  // ─── WELCOME SCREEN ─────────────────────────────────────────────────
  if (!orderType) {
    const options = [
      {
        id: 'dine-in',
        icon: '🪑',
        title: 'تناول داخل الكافيه',
        subtitle: 'احجز طاولتك واطلب براحتك',
        gradient: 'from-primary/20 to-accent/10',
        border: 'border-primary/30',
        hoverBorder: 'hover:border-primary',
        hoverShadow: 'hover:shadow-[0_8px_30px_rgba(200,149,108,0.25)]',
        badge: 'الأكثر شيوعاً',
        badgeColor: 'bg-primary text-gray-900',
      },
      {
        id: 'takeaway',
        icon: '👜',
        title: 'تيك أوي',
        subtitle: 'طلب وخد معاك براحتك',
        gradient: 'from-green-500/20 to-emerald-500/10',
        border: 'border-green-500/30',
        hoverBorder: 'hover:border-green-400',
        hoverShadow: 'hover:shadow-[0_8px_30px_rgba(34,197,94,0.2)]',
        badge: null,
        badgeColor: '',
      },
      {
        id: 'browse',
        icon: '📖',
        title: 'تصفح المنيو',
        subtitle: 'شوف أصنافنا بدون طلب',
        gradient: 'from-blue-500/20 to-indigo-500/10',
        border: 'border-blue-500/30',
        hoverBorder: 'hover:border-blue-400',
        hoverShadow: 'hover:shadow-[0_8px_30px_rgba(96,165,250,0.2)]',
        badge: null,
        badgeColor: '',
      },
      {
        id: 'delivery',
        icon: '🚴',
        title: 'ديليفري',
        subtitle: 'وصلنالك على بابك',
        gradient: 'from-purple-500/20 to-violet-500/10',
        border: 'border-purple-500/30',
        hoverBorder: 'hover:border-purple-400',
        hoverShadow: 'hover:shadow-[0_8px_30px_rgba(168,85,247,0.2)]',
        badge: 'جديد',
        badgeColor: 'bg-purple-500 text-white',
      },
    ];

    const handleOrderTypeSelect = (type) => {
      if (type === 'browse') {
        setOrderType('browse');
        setTableNumber('browse');
        setShowTableModal(false);
      } else {
        // delivery, takeaway, dine-in all go through their own form
        setOrderType(type);
      }
    };

    return (
      <div className="min-h-screen bg-[#070710] flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Background ambient glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 w-full max-w-lg">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 border border-primary/20 mb-5">
              <span className="text-4xl">☕</span>
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-black text-primary mb-3">{settings?.cafeName || 'كافيه أرتيزان'}</h1>
            <p className="text-[#9a9aad] text-base">أهلاً بك! كيف تحب تتمتع بتجربتك اليوم؟</p>
          </div>

          {resumableSession && (
            <button
              onClick={() => {
                const notes = resumableSession.activeOrder?.customerNotes || '';
                const isDelivery = notes.includes('ديليفري');
                const isTakeaway = notes.includes('تيك أوي');
                const resumedType = resumableSession.sessionData.tableNumber > 0 ? 'dine-in' : isDelivery ? 'delivery' : isTakeaway ? 'takeaway' : 'dine-in';

                setTableNumber(resumableSession.sessionData.tableNumber);
                setupActiveSession(resumableSession.sessionData, resumableSession.activeOrder);
                setOrderType(resumedType);
              }}
              className="w-full mb-8 bg-gradient-to-r from-green-500 to-emerald-600 p-4 rounded-2xl shadow-[0_4px_20px_rgba(34,197,94,0.3)] hover:-translate-y-1 transition-all flex items-center justify-between group"
            >
              <div className="text-right flex-1">
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                  <FaClock className="animate-pulse" /> لديك طلب قيد التحضير!
                </h3>
                <p className="text-green-100 text-sm mt-1">اضغط هنا لمتابعة طلبك ومعرفة الوقت المتبقي</p>
              </div>
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                ←
              </div>
            </button>
          )}

          {/* Options Grid */}
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            {options.map((opt) => (
              <button
                key={opt.id}
                onClick={() => handleOrderTypeSelect(opt.id)}
                className={`relative bg-gradient-to-br ${opt.gradient} border ${opt.border} ${opt.hoverBorder} ${opt.hoverShadow} rounded-2xl md:rounded-3xl p-4 flex flex-col items-center justify-center text-center transition-all duration-300 hover:-translate-y-1 active:scale-95 group min-h-[140px] md:min-h-[180px]`}
              >
                {opt.badge && (
                  <span className={`absolute top-2 right-2 md:top-3 md:right-3 text-[9px] md:text-xs font-bold px-2 py-0.5 md:px-2.5 md:py-1 rounded-full whitespace-nowrap shadow-sm ${opt.badgeColor}`}>
                    {opt.badge}
                  </span>
                )}
                <span className="text-4xl md:text-5xl mb-3 group-hover:scale-110 transition-transform duration-300 drop-shadow-lg">
                  {opt.icon}
                </span>
                <h3 className="text-white font-bold text-sm md:text-base leading-tight">{opt.title}</h3>
                <p className="text-[#9a9aad] text-[10px] md:text-xs leading-relaxed hidden sm:block mt-1">{opt.subtitle}</p>
              </button>
            ))}
          </div>

          <p className="text-center text-[#5e5e72] text-xs mt-8">
            بالمتابعة أنت توافق على شروط الخدمة الخاصة بالكافيه
          </p>
        </div>
      </div>
    );
  }

  // ─── TABLE / ORDER INFO MODAL ───────────────────────────────────────────
  if (showTableModal) {
    const isTakeaway = orderType === 'takeaway';
    const isDelivery = orderType === 'delivery';
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#070710] p-4 md:p-6">
        <div className="relative bg-[#13131f] border border-white/10 rounded-3xl p-5 pt-12 md:p-10 max-w-sm w-full text-center shadow-2xl">
          <button
            onClick={() => { setOrderType(null); }}
            className="absolute top-4 left-4 text-[#5e5e72] hover:text-white transition-colors text-sm flex items-center gap-1 z-10"
          >
            ← رجوع
          </button>

          {resumableSession && (
            <button
              onClick={() => {
                const notes = resumableSession.activeOrder?.customerNotes || '';
                const isDelivery = notes.includes('ديليفري');
                const isTakeaway = notes.includes('تيك أوي');
                const resumedType = resumableSession.sessionData.tableNumber > 0 ? 'dine-in' : isDelivery ? 'delivery' : isTakeaway ? 'takeaway' : 'dine-in';

                setTableNumber(resumableSession.sessionData.tableNumber);
                setupActiveSession(resumableSession.sessionData, resumableSession.activeOrder);
                setOrderType(resumedType); 
                setShowTableModal(false);
              }}
              className="w-full mb-6 bg-gradient-to-r from-green-500 to-emerald-600 p-3 rounded-2xl shadow-[0_4px_20px_rgba(34,197,94,0.3)] hover:-translate-y-1 transition-all flex items-center justify-between group relative z-20"
            >
              <div className="text-right flex-1">
                <h3 className="text-white font-bold text-sm flex items-center gap-2">
                  <FaClock className="animate-pulse" /> لديك طلب قيد التحضير!
                </h3>
                <p className="text-green-100 text-xs mt-1">اضغط للمتابعة</p>
              </div>
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                ←
              </div>
            </button>
          )}

          {isTakeaway ? (
            <>
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4 md:mb-6 text-3xl md:text-4xl">
                👜
              </div>
              <h2 className="text-xl md:text-2xl font-bold mb-2">طلب تيك أوي</h2>
              <p className="text-[#9a9aad] mb-6 md:mb-8 text-xs md:text-sm leading-relaxed px-2">
                أدخل رقم جوالك أو اسمك لتتبع طلبك
              </p>
              <form onSubmit={(e) => {
                e.preventDefault();
                const v = tableInput.trim();
                if (!v) return toast.error('من فضلك أدخل اسمك');
                const phone = e.target.phone?.value?.trim() || '';
                setCustomerName(phone ? `${v} - 📱${phone}` : v);
                setTableNumber(0);
                setShowTableModal(false);
              }}>
                <div className="space-y-3 mb-6">
                  <div className="text-right">
                    <label className="text-xs text-[#9a9aad] mb-1 block">الاسم <span className="text-red-400">*</span></label>
                    <input
                      type="text"
                      className="bg-[#0a0a0f] border-2 border-green-500/40 text-center text-lg font-bold rounded-2xl px-4 py-3 focus:outline-none focus:border-green-400 transition-all w-full"
                      placeholder="اسمك"
                      value={tableInput}
                      onChange={(e) => setTableInput(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <div className="text-right">
                    <label className="text-xs text-[#9a9aad] mb-1 block">رقم التليفون <span className="text-[#5e5e72]">(اختياري)</span></label>
                    <input
                      name="phone"
                      type="tel"
                      className="bg-[#0a0a0f] border-2 border-white/10 text-center text-lg font-bold rounded-2xl px-4 py-3 focus:outline-none focus:border-green-400/50 transition-all w-full text-[#9a9aad]"
                      placeholder="01XXXXXXXXX"
                      dir="ltr"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full bg-green-500 text-white font-bold py-3 md:py-4 rounded-2xl text-sm md:text-lg hover:opacity-90 hover:-translate-y-0.5 transition-all shadow-[0_4px_20px_rgba(34,197,94,0.3)]"
                >
                  ابدأ طلب التيك أوي
                </button>
              </form>
            </>
          ) : isDelivery ? (
            <>
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-4 md:mb-6 text-3xl md:text-4xl">
                🚴
              </div>
              <h2 className="text-xl md:text-2xl font-bold mb-2">طلب ديليفري</h2>
              <p className="text-[#9a9aad] mb-4 md:mb-6 text-xs md:text-sm leading-relaxed px-2">
                أدخل بياناتك وسنوصلك طلبك في أسرع وقت!
              </p>
              <form onSubmit={(e) => {
                e.preventDefault();
                const name = deliveryInfo.name.trim();
                const phone = deliveryInfo.phone.trim();
                const address = deliveryInfo.address.trim();
                if (!name) return toast.error('من فضلك أدخل اسمك');
                if (!phone) return toast.error('من فضلك أدخل رقم التليفون');
                if (!address) return toast.error('من فضلك أدخل عنوانك');
                setTableNumber(0);
                setShowTableModal(false);
              }}>
                <div className="space-y-3 mb-6 text-right">
                  <div>
                    <label className="text-xs text-[#9a9aad] mb-1 block">الاسم <span className="text-red-400">*</span></label>
                    <input
                      type="text"
                      className="bg-[#0a0a0f] border-2 border-purple-500/40 text-center text-lg font-bold rounded-2xl px-4 py-3 focus:outline-none focus:border-purple-400 transition-all w-full"
                      placeholder="اسمك الكريم"
                      value={deliveryInfo.name}
                      onChange={(e) => setDeliveryInfo(p => ({ ...p, name: e.target.value }))}
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#9a9aad] mb-1 block">رقم التليفون <span className="text-red-400">*</span></label>
                    <input
                      type="tel"
                      className="bg-[#0a0a0f] border-2 border-purple-500/40 text-center text-lg font-bold rounded-2xl px-4 py-3 focus:outline-none focus:border-purple-400 transition-all w-full"
                      placeholder="01XXXXXXXXX"
                      dir="ltr"
                      value={deliveryInfo.phone}
                      onChange={(e) => setDeliveryInfo(p => ({ ...p, phone: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#9a9aad] mb-1 block">العنوان <span className="text-red-400">*</span></label>
                    <textarea
                      className="bg-[#0a0a0f] border-2 border-purple-500/40 text-center text-base font-bold rounded-2xl px-4 py-3 focus:outline-none focus:border-purple-400 transition-all w-full resize-none"
                      placeholder="شارع... حي... مدينة..."
                      rows={2}
                      value={deliveryInfo.address}
                      onChange={(e) => setDeliveryInfo(p => ({ ...p, address: e.target.value }))}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-violet-600 text-white font-bold py-3 md:py-4 rounded-2xl text-sm md:text-lg hover:opacity-90 hover:-translate-y-0.5 transition-all shadow-[0_4px_20px_rgba(168,85,247,0.4)]"
                >
                  تأكيد الديليفري 🚴
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 md:mb-6">
                <FaChair className="text-primary text-3xl md:text-4xl" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-primary mb-2">أهلاً بك في {settings?.cafeName || 'كافيه أرتيزان'}</h2>
              <p className="text-[#9a9aad] mb-6 md:mb-8 text-xs md:text-sm leading-relaxed px-2">
                أدخل رقم الطاولة الخاصة بك وسنبدأ معاك على الفور!
              </p>
              <form onSubmit={handleTableSubmit}>
                <input
                  type="number"
                  min="1"
                  max="50"
                  className="bg-[#0a0a0f] border-2 border-primary/40 text-center text-3xl md:text-4xl font-bold rounded-2xl px-4 py-3 md:py-5 focus:outline-none focus:border-primary transition-all w-full mb-4 md:mb-6 tracking-widest"
                  placeholder="١"
                  value={tableInput}
                  onChange={(e) => setTableInput(e.target.value)}
                  autoFocus
                />
                <button
                  type="submit"
                  className="w-full bg-gradient-to-br from-primary to-accent text-gray-900 font-bold py-3 md:py-4 rounded-2xl text-base md:text-lg hover:opacity-90 hover:-translate-y-0.5 transition-all shadow-[0_4px_20px_rgba(200,149,108,0.4)] whitespace-nowrap"
                >
                  ابدأ الطلب
                </button>
              </form>

              {/* Quick Table Grid */}
              {!tableStatusLoading && Object.keys(tableStatuses).length > 0 && (
                <div className="mt-8">
                  <p className="text-xs text-[#5e5e72] font-bold mb-3 text-center uppercase tracking-wider">اختر طاولتك بسرعة</p>
                  <div className="grid grid-cols-4 gap-2">
                    {Object.entries(tableStatuses).map(([num, status]) => (
                      <button
                        key={num}
                        onClick={() => status !== 'blocked' && handleTableSelect(parseInt(num))}
                        disabled={status === 'blocked'}
                        className={`h-10 rounded-xl text-sm font-bold transition-all border ${status === 'blocked'
                            ? 'bg-red-500/10 border-red-500/30 text-red-400 cursor-not-allowed'
                            : status === 'occupied'
                              ? 'bg-yellow-400/10 border-yellow-400/40 text-yellow-400 hover:bg-yellow-400/20 shadow-[0_0_10px_rgba(250,204,21,0.2)]'
                              : 'bg-green-400/5 border-white/10 text-white hover:bg-primary/20 hover:border-primary/40 hover:text-primary'
                          }`}
                        title={status === 'blocked' ? 'تم حجز هذه الطاولة' : status === 'occupied' ? 'مشغولة' : 'متاحة'}
                      >
                        {status === 'blocked' ? '🔒' : num}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  // ─── LUXURIOUS ORDER WAITING ROOM ──────────────────────────────────────────
  // Auto-dismiss helper: called when countdown reaches 0
  const handleCountdownDone = () => {
    // Small delay so user sees "جاهز الآن!" briefly
    setTimeout(() => {
      toast.success('🎉 طلبك جاهز! تفضل!', { duration: 5000 });
      setOrderSuccess(false);
      setOrderType(null);
      setTableNumber(null);
      setResumableSession(null);
      localStorage.removeItem('latest_session_token');
    }, 2000);
  };

  if (orderSuccess) {
    const isPreparing = orderTracker?.status === 'preparing';
    const isReady = orderTracker?.status === 'ready';

    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#070710] p-6 relative overflow-hidden">
        {/* Background glow */}
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-[100px] opacity-20 pointer-events-none transition-all duration-1000 ${isReady ? 'bg-green-500' : isPreparing ? 'bg-primary' : 'bg-white/20'
          }`} />

        <div className="text-center animate-slide-up relative z-10 max-w-sm w-full">
          {/* Status Icon */}
          <div className={`w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-8 border-4 shadow-2xl transition-all duration-500 ${isReady
              ? 'bg-green-500/10 border-green-500 text-green-400 shadow-green-500/30 scale-110'
              : isPreparing
                ? 'bg-primary/10 border-primary text-primary shadow-primary/30 scale-100'
                : 'bg-white/5 border-white/10 text-[#9a9aad] scale-95'
            }`}>
            {isReady ? <FaCheckCircle size={64} /> : isPreparing ? <FaFire size={64} className="animate-pulse" /> : <FaClock size={64} className="animate-pulse" />}
          </div>

          <h2 className="text-3xl font-black mb-4">
            {isReady ? 'طلبك جاهز! 🎉' : isPreparing ? 'جاري التحضير ' : 'تم استلام طلبك!'}
          </h2>

          {isPreparing && orderTracker?.readyAt ? (
            <div className="mb-10 p-6 rounded-3xl bg-[#13131f] border border-primary/20 shadow-[0_0_30px_rgba(200,149,108,0.15)] animate-slide-up">
              <p className="text-[#9a9aad] text-sm mb-3">الوقت المتبقي تقريباً</p>
              <div className="text-5xl drop-shadow-xl">
                <LiveCountdown readyAt={orderTracker.readyAt} onDone={handleCountdownDone} />
              </div>
              <p className="text-primary/70 text-xs mt-3">يتم تحضير طلبك الآن بكل حب وعناية</p>
            </div>
          ) : (
            <div className="mb-10">
              <p className="text-[#9a9aad] text-lg mb-2 leading-relaxed">
                {isReady
                  ? 'تفضل باستلام طلبك، نتمنى لك تجربة ممتعة!'
                  : `سيصل طلبك قريباً للطاولة رقم `}
                {!isReady && <strong className="text-primary mx-1 text-2xl">{tableNumber}</strong>}
              </p>
              {!isReady && <p className="text-[#5e5e72] text-sm mt-3 animate-pulse">ننتظر تأكيد المطبخ للبدء في التحضير...</p>}
            </div>
          )}

          <div className="space-y-4 w-full">
            <button
              onClick={() => setOrderSuccess(false)}
              className="w-full py-4 bg-gradient-to-r from-primary to-accent text-gray-900 font-bold rounded-2xl text-lg hover:opacity-90 hover:-translate-y-1 transition-all shadow-[0_4px_20px_rgba(200,149,108,0.4)] flex items-center justify-center gap-2"
            >
              <FaPlus size={14} /> طلب المزيد من المنيو
            </button>
            {!isReady && (
              <button
                onClick={() => setOrderSuccess(false)}
                className="w-full py-4 bg-[#13131f] border border-white/10 text-white font-bold rounded-2xl hover:bg-white/5 transition-all"
              >
                تصفح المنيو فقط
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── MAIN MENU ────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen bg-[#070710]">
      {/* Header */}
      <div className="relative pt-10 pb-8 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
        <div className="text-5xl mb-3">☕</div>
        <h1 className="font-display text-2xl font-bold text-primary mb-1">{settings?.cafeName || 'كافيه أرتيزان'}</h1>
        {orderType === 'browse' ? (
          <div className="inline-flex items-center gap-2 mt-2 bg-blue-500/10 border border-blue-400/30 rounded-full px-4 py-1.5">
            <span className="text-base">📖</span>
            <span className="text-blue-400 font-bold text-sm">وضع التصفح فقط</span>
          </div>
        ) : orderType === 'delivery' ? (
          <div className="inline-flex items-center gap-2 mt-2 bg-purple-500/10 border border-purple-400/30 rounded-full px-4 py-1.5">
            <span className="text-base">🚴</span>
            <span className="text-purple-400 font-bold text-sm">ديليفري</span>
          </div>
        ) : orderType === 'takeaway' ? (
          <div className="inline-flex items-center gap-2 mt-2 bg-green-500/10 border border-green-400/30 rounded-full px-4 py-1.5">
            <span className="text-base">👜</span>
            <span className="text-green-400 font-bold text-sm">تيك أوي{customerName ? ` — ${customerName}` : ''}</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 mt-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-1.5">
            <FaChair size={12} className="text-primary" />
            <span className="text-primary font-bold text-sm">طاولة رقم {tableNumber}</span>
          </div>
        )}
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto px-4 pb-3 scrollbar-hide">
        {categories.map(cat => (
          <button
            key={cat._id}
            onClick={() => setActiveCategory(cat._id)}
            className={`px-5 py-2 flex items-center gap-2 rounded-full border text-sm font-bold whitespace-nowrap transition-all flex-shrink-0 ${activeCategory === cat._id
                ? 'bg-primary border-primary text-gray-900 shadow-[0_0_15px_rgba(200,149,108,0.4)]'
                : 'bg-[#13131f] border-white/10 text-[#9a9aad] hover:border-primary/50'
              }`}
          >
            {cat.icon && <span>{cat.icon}</span>}
            {cat.nameAr || cat.name}
          </button>
        ))}
      </div>

      {/* Menu Grid */}
      <div className="flex-1 px-4 pb-32">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-[#13131f] rounded-2xl overflow-hidden animate-pulse">
                <div className="h-36 bg-white/5" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-white/5 rounded w-2/3" />
                  <div className="h-3 bg-white/5 rounded w-full" />
                  <div className="h-4 bg-white/5 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20 text-[#5e5e72]">
            <div className="text-5xl mb-4">🍽️</div>
            <p className="text-lg font-medium">لا توجد عناصر في هذا القسم</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
            {filteredItems.map(item => {
              const cartItem = cart.find(c => c._id === item._id);
              return (
                <div
                  key={item._id}
                  className="bg-[#13131f] border border-white/5 rounded-2xl overflow-hidden transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_8px_20px_rgba(200,149,108,0.1)] flex flex-col"
                >
                  {/* Image */}
                  <div className="relative h-36 bg-[#1a1a2e] overflow-hidden flex-shrink-0">
                    {item.image
                      ? <img src={item.image} alt={item.nameAr} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-4xl">☕</div>
                    }
                    {item.isPopular && (
                      <span className="absolute top-2 right-2 bg-primary text-gray-900 text-xs font-bold px-2 py-0.5 rounded-full">
                        الأكثر طلباً
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3 flex flex-col flex-1">
                    <h3 className="font-bold text-base mb-1 leading-tight">{item.nameAr || item.name}</h3>
                    <p className="text-[#5e5e72] text-xs mb-3 leading-relaxed line-clamp-2 flex-1">
                      {item.description || ''}
                    </p>

                    {/* Price & Action */}
                    <div className="flex items-center justify-between gap-2 mt-auto">
                      <span className="text-primary font-bold text-base">${item.price}</span>

                      {orderType !== 'browse' && (
                        cartItem ? (
                          /* Quantity Controls */
                          <div className="flex items-center gap-1 bg-[#0a0a0f] border border-primary/40 rounded-xl overflow-hidden">
                            <button
                              onClick={() => updateQty(item._id, -1)}
                              className="w-8 h-8 flex items-center justify-center text-primary hover:bg-primary/10 transition-colors font-bold"
                            >
                              <FaMinus size={10} />
                            </button>
                            <span className="w-6 text-center font-bold text-sm">{cartItem.quantity}</span>
                            <button
                              onClick={() => addToCart(item)}
                              className="w-8 h-8 flex items-center justify-center text-primary hover:bg-primary/10 transition-colors font-bold"
                            >
                              <FaPlus size={10} />
                            </button>
                          </div>
                        ) : (
                          /* Add Button */
                          <button
                            onClick={(e) => addToCart(item, e)}
                            className="w-9 h-9 flex items-center justify-center bg-primary rounded-xl text-gray-900 hover:opacity-90 hover:scale-110 transition-all shadow-[0_2px_10px_rgba(200,149,108,0.4)]"
                          >
                            <FaPlus size={14} />
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {orderType !== 'browse' && (
        <button
          ref={cartBtnRef}
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-gradient-to-r from-primary to-accent text-gray-900 font-bold py-4 px-8 rounded-2xl shadow-[0_4px_30px_rgba(200,149,108,0.5)] transition-all z-40 hover:-translate-y-1 hover:shadow-[0_8px_40px_rgba(200,149,108,0.6)]"
          style={{ transform: getCartCount() === 0 ? 'translateX(-50%) translateY(100px)' : 'translateX(-50%)' }}
        >
          <div className="relative">
            <FaShoppingCart size={20} />
            <span className="absolute -top-2 -right-2 w-5 h-5 bg-gray-900 text-primary rounded-full text-xs font-black flex items-center justify-center">
              {getCartCount()}
            </span>
          </div>
          <span>عرض الطلب</span>
          <span className="bg-gray-900/30 rounded-lg px-2 py-0.5 text-sm">${getCartTotal().toFixed(2)}</span>
        </button>
      )}

      {/* Cart Drawer */}
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            onClick={() => setIsCartOpen(false)}
          />

          {/* Drawer */}
          <div className="fixed bottom-0 left-0 right-0 z-[60] bg-[#13131f] border-t border-white/10 rounded-t-3xl shadow-2xl animate-slide-up max-h-[85vh] flex flex-col">
            {/* Drag Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-white/20 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-white/5">
              <div>
                <h2 className="text-xl font-bold">طلبك الحالي</h2>
                <p className="text-[#9a9aad] text-xs mt-0.5">طاولة رقم {tableNumber} • {getCartCount()} عنصر</p>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="w-10 h-10 flex items-center justify-center bg-[#0a0a0f] rounded-xl text-xl text-[#9a9aad] hover:text-white transition-colors"
              >
                ×
              </button>
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {cart.map(item => (
                <div key={item._id} className="flex items-center gap-4">
                  {/* Thumbnail */}
                  <div className="w-14 h-14 rounded-xl bg-[#0a0a0f] overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {item.image
                      ? <img src={item.image} alt={item.nameAr} className="w-full h-full object-cover" />
                      : <span className="text-2xl">☕</span>
                    }
                  </div>

                  {/* Name & Qty Controls */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{item.nameAr || item.name}</p>
                    <p className="text-primary font-bold text-sm">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>

                  {/* Qty Controls */}
                  <div className="flex items-center gap-1 bg-[#0a0a0f] border border-white/10 rounded-xl">
                    <button
                      onClick={() => updateQty(item._id, -1)}
                      className="w-9 h-9 flex items-center justify-center text-red-400 hover:bg-red-500/10 transition-colors rounded-r-xl"
                    >
                      {item.quantity === 1 ? <FaTrash size={12} /> : <FaMinus size={11} />}
                    </button>
                    <span className="w-6 text-center font-bold text-sm">{item.quantity}</span>
                    <button
                      onClick={() => updateQty(item._id, +1)}
                      className="w-9 h-9 flex items-center justify-center text-green-400 hover:bg-green-500/10 transition-colors rounded-l-xl"
                    >
                      <FaPlus size={11} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-6 pt-4 pb-8 border-t border-white/5 bg-[#13131f]">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <p className="text-[#9a9aad] text-sm">الإجمالي</p>
                  <p className="text-2xl font-bold text-primary">${getCartTotal().toFixed(2)}</p>
                </div>
                <p className="text-[#5e5e72] text-xs text-left">شامل الضرائب</p>
              </div>

              <button
                disabled={submitting || cart.length === 0}
                onClick={handleCheckout}
                className="w-full bg-gradient-to-r from-primary to-accent text-gray-900 font-bold py-4 rounded-2xl text-lg hover:opacity-90 transition-all shadow-[0_4px_20px_rgba(200,149,108,0.4)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting
                  ? <><span className="animate-spin text-xl">⏳</span> جاري الإرسال...</>
                  : <>إرسال للمطبخ </>
                }
              </button>
            </div>
          </div>
        </>
      )}

    </div>
  );
}
