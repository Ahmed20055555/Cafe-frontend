"use client";
import { useState, useEffect } from 'react';
import { FaCheckCircle, FaSearch, FaImage, FaTimes } from 'react-icons/fa';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';

export default function PaymentsConfirmation() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [submitting, setSubmitting] = useState(null);

  useEffect(() => {
    fetchPendingReceipts();
  }, []);

  const fetchPendingReceipts = async () => {
    try {
      const res = await api.get('/bills/pending-receipts');
      if (res.data.success) {
        setBills(res.data.data);
      }
    } catch (err) {
      toast.error('حدث خطأ أثناء جلب الدفعات المعلقة');
    } finally {
      setLoading(false);
    }
  };

  const confirmPayment = async (billId) => {
    if (!window.confirm('هل أنت متأكد من تأكيد هذا الدفع وإنهاء الجلسة؟')) return;
    setSubmitting(billId);
    try {
      await api.post(`/bills/${billId}/pay`, { paymentMethod: 'card' });
      toast.success('تم تأكيد الدفع وإغلاق الجلسة بنجاح!');
      setBills(bills.filter(b => b._id !== billId));
    } catch (err) {
      toast.error('حدث خطأ أثناء تأكيد الدفع');
    } finally {
      setSubmitting(null);
    }
  };

  if (loading) {
    return <div className="text-white text-center py-20">جاري التحميل...</div>;
  }

  return (
    <div dir="rtl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-white mb-2">تأكيدات الدفع</h1>
          <p className="text-[#9a9aad]">العملاء الذين قاموا برفع إيصالات الدفع بانتظار التأكيد.</p>
        </div>
      </div>

      {bills.length === 0 ? (
        <div className="bg-[#111118] border border-white/5 rounded-3xl p-12 text-center flex flex-col items-center">
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center text-primary text-4xl mb-6">
            <FaCheckCircle />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">لا توجد إيصالات معلقة</h3>
          <p className="text-[#9a9aad]">جميع الدفعات مؤكدة أو لم يقم أحد برفع إيصال جديد.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bills.map(bill => (
            <div key={bill._id} className="bg-[#111118] border border-white/10 rounded-3xl overflow-hidden hover:border-primary/40 transition-all shadow-lg flex flex-col">
              {/* Receipt Image Area */}
              <div 
                className="h-48 bg-[#0a0a0f] relative group cursor-pointer border-b border-white/10 flex items-center justify-center overflow-hidden"
                onClick={() => setSelectedImage(bill.receiptUrl)}
              >
                {bill.receiptUrl ? (
                  <>
                    <img src={bill.receiptUrl} alt="Receipt" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="bg-white/20 backdrop-blur-md rounded-full p-3 text-white">
                        <FaSearch size={20} />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-[#5e5e72] flex flex-col items-center">
                    <FaImage size={32} className="mb-2 opacity-50" />
                    <span className="text-sm">لا توجد صورة</span>
                  </div>
                )}
                
                <div className="absolute top-3 right-3 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                  {bill.paymentMethod === 'card' ? 'إنستا باي / تحويل' : 'أخرى'}
                </div>
              </div>

              {/* Info Area */}
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">طاولة رقم {bill.tableNumber}</h3>
                    <p className="text-xs text-[#9a9aad]" dir="ltr">{bill.orderReference}</p>
                  </div>
                  <div className="text-left">
                    <span className="text-primary font-black text-xl">{bill.total.toFixed(2)} EGP</span>
                  </div>
                </div>

                <div className="text-sm text-[#9a9aad] bg-white/5 rounded-xl p-3 mb-4 space-y-1">
                  <div className="flex justify-between">
                    <span>وقت الطلب:</span>
                    <span className="text-white" dir="ltr">{new Date(bill.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>حالة الجلسة:</span>
                    <span className="text-yellow-400 font-bold">بانتظار التأكيد</span>
                  </div>
                </div>

                <div className="mt-auto pt-2 border-t border-white/5 flex gap-3">
                  <button 
                    onClick={() => confirmPayment(bill._id)}
                    disabled={submitting === bill._id}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-3 rounded-xl hover:opacity-90 transition-all flex justify-center items-center gap-2 shadow-[0_4px_15px_rgba(16,185,129,0.3)] disabled:opacity-50"
                  >
                    {submitting === bill._id ? 'جاري التأكيد...' : (
                      <>
                        <FaCheckCircle />
                        تأكيد وإغلاق الجلسة
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button 
            className="absolute top-6 right-6 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-red-500 hover:scale-110 transition-all"
            onClick={() => setSelectedImage(null)}
          >
            <FaTimes size={24} />
          </button>
          
          <img 
            src={selectedImage} 
            alt="Receipt Full" 
            className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl animate-scale-up" 
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
