"use client";
import { useEffect, useState } from 'react';
import { FaPlus, FaEdit, FaTrash, FaSync, FaCoffee, FaTags, FaTimes, FaUpload } from 'react-icons/fa';
import api, { uploadImage } from '@/lib/api';
import toast from 'react-hot-toast';

const EMPTY_PRODUCT = { name: '', nameAr: '', price: '', category: '', description: '', image: '', isAvailable: true };
const EMPTY_CATEGORY = { name: '', nameAr: '', icon: '', image: '', sortOrder: 0, isActive: true };

export default function AdminMenuPage() {
  const [activeTab, setActiveTab] = useState('products');
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // Edit IDs — null = Add mode, string = Edit mode
  const [editingProductId, setEditingProductId] = useState(null);
  const [editingCategoryId, setEditingCategoryId] = useState(null);

  // Forms
  const [productForm, setProductForm] = useState(EMPTY_PRODUCT);
  const [categoryForm, setCategoryForm] = useState(EMPTY_CATEGORY);

  // Upload state
  const [uploadingImage, setUploadingImage] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [catsRes, prodsRes] = await Promise.all([
        api.get('/categories'),
        api.get('/menu?all=true')
      ]);
      if (catsRes.data.success) setCategories(catsRes.data.data);
      if (prodsRes.data.success) setProducts(prodsRes.data.data);
    } catch (error) {
      console.error("Error fetching menu data:", error);
      toast.error('حدث خطأ أثناء تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // ─── Image Upload ──────────────────────────────────────────────────────────
  const handleImageUpload = async (e, formType) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    setUploadingImage(true);
    try {
      const res = await uploadImage(formData);
      if (res.data.success) {
        if (formType === 'product') setProductForm(f => ({ ...f, image: res.data.data }));
        else setCategoryForm(f => ({ ...f, image: res.data.data }));
        toast.success('تم رفع الصورة بنجاح');
      }
    } catch (error) {
      toast.error('خطأ في رفع الصورة');
    } finally {
      setUploadingImage(false);
    }
  };

  // ─── Product Handlers ──────────────────────────────────────────────────────
  const openAddProduct = () => {
    setEditingProductId(null);
    setProductForm(EMPTY_PRODUCT);
    setShowProductModal(true);
  };

  const openEditProduct = (product) => {
    setEditingProductId(product._id);
    setProductForm({
      name: product.name || '',
      nameAr: product.nameAr || '',
      price: product.price || '',
      category: product.category?._id || '',
      description: product.description || '',
      image: product.image || '',
      isAvailable: product.isAvailable ?? true,
    });
    setShowProductModal(true);
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProductId) {
        // UPDATE
        const res = await api.put(`/menu/${editingProductId}`, productForm);
        if (res.data.success) {
          toast.success('تم تعديل المنتج بنجاح');
          setProducts(products.map(p => p._id === editingProductId ? res.data.data : p));
          setShowProductModal(false);
        }
      } else {
        // CREATE
        const res = await api.post('/menu', productForm);
        if (res.data.success) {
          toast.success('تمت إضافة المنتج بنجاح');
          setProducts([...products, res.data.data]);
          setShowProductModal(false);
        }
      }
    } catch (error) {
      console.error("Product submit error:", error.response?.data || error.message);
      let errMsg = error.response?.data?.message || (editingProductId ? 'خطأ في تعديل المنتج' : 'خطأ في إضافة المنتج');
      if (errMsg.includes('E11000')) errMsg = 'هذا الاسم الإنجليزي موجود مسبقاً.';
      toast.error(errMsg);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;
    try {
      await api.delete(`/menu/${id}`);
      setProducts(products.filter(p => p._id !== id));
      toast.success('تم حذف المنتج');
    } catch (error) {
      toast.error('خطأ في الحذف');
    }
  };

  // ─── Category Handlers ─────────────────────────────────────────────────────
  const openAddCategory = () => {
    setEditingCategoryId(null);
    setCategoryForm(EMPTY_CATEGORY);
    setShowCategoryModal(true);
  };

  const openEditCategory = (cat) => {
    setEditingCategoryId(cat._id);
    setCategoryForm({
      name: cat.name || '',
      nameAr: cat.nameAr || '',
      icon: cat.icon || '',
      image: cat.image || '',
      sortOrder: cat.sortOrder ?? 0,
      isActive: cat.isActive ?? true,
    });
    setShowCategoryModal(true);
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCategoryId) {
        // UPDATE
        const res = await api.put(`/categories/${editingCategoryId}`, categoryForm);
        if (res.data.success) {
          toast.success('تم تعديل التصنيف بنجاح');
          setCategories(categories.map(c => c._id === editingCategoryId ? res.data.data : c));
          setShowCategoryModal(false);
        }
      } else {
        // CREATE
        const res = await api.post('/categories', categoryForm);
        if (res.data.success) {
          toast.success('تمت إضافة التصنيف بنجاح');
          setCategories([...categories, res.data.data]);
          setShowCategoryModal(false);
        }
      }
    } catch (error) {
      console.error("Category submit error:", error.response?.data || error.message);
      let errMsg = error.response?.data?.message || (editingCategoryId ? 'خطأ في تعديل التصنيف' : 'خطأ في إضافة التصنيف');
      if (errMsg.includes('E11000')) errMsg = 'هذا الاسم الإنجليزي موجود مسبقاً.';
      toast.error(errMsg);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!confirm('هل أنت متأكد من حذف هذا التصنيف؟')) return;
    try {
      await api.delete(`/categories/${id}`);
      setCategories(categories.filter(c => c._id !== id));
      toast.success('تم حذف التصنيف');
    } catch (error) {
      toast.error('خطأ في الحذف');
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-1">إدارة المنيو</h1>
          <p className="text-[#9a9aad] text-xs md:text-sm">إضافة وتعديل المنتجات والتصنيفات في المنيو.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
          <button onClick={fetchData} className="w-full sm:w-auto justify-center px-4 py-2 md:py-2.5 flex items-center gap-2 rounded-lg bg-elevated border border-white/10 text-xs md:text-sm font-bold hover:text-primary transition-all">
            <FaSync className={loading ? "animate-spin" : ""} /> تحديث
          </button>
          {activeTab === 'products' ? (
            <button onClick={openAddProduct} className="w-full sm:w-auto justify-center px-4 py-2 md:py-2.5 flex items-center gap-2 rounded-lg bg-primary text-gray-900 text-xs md:text-sm font-bold hover:opacity-90 transition-all shadow-[0_4px_15px_rgba(200,149,108,0.3)]">
              <FaPlus /> إضافة منتج
            </button>
          ) : (
            <button onClick={openAddCategory} className="w-full sm:w-auto justify-center px-4 py-2 md:py-2.5 flex items-center gap-2 rounded-lg bg-accent text-white text-xs md:text-sm font-bold hover:opacity-90 transition-all shadow-[0_4px_15px_rgba(110,133,183,0.3)]">
              <FaPlus /> إضافة تصنيف
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-row gap-2 md:gap-4 mb-6 md:mb-8 border-b border-white/10 pb-4 overflow-x-auto">
        <button onClick={() => setActiveTab('products')} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-2 md:py-3 rounded-xl text-xs md:text-base font-bold transition-all whitespace-nowrap ${activeTab === 'products' ? 'bg-primary text-gray-900 shadow-lg' : 'bg-elevated text-[#9a9aad] hover:text-white'}`}>
          <FaCoffee /> المنتجات ({products.length})
        </button>
        <button onClick={() => setActiveTab('categories')} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-2 md:py-3 rounded-xl text-xs md:text-base font-bold transition-all whitespace-nowrap ${activeTab === 'categories' ? 'bg-primary text-gray-900 shadow-lg' : 'bg-elevated text-[#9a9aad] hover:text-white'}`}>
          <FaTags /> التصنيفات ({categories.length})
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-20 text-[#5e5e72] font-medium text-lg">جاري التحميل...</div>
      ) : activeTab === 'products' ? (
        /* ── Products Grid ── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {products.length === 0 ? (
            <div className="col-span-full text-center py-20 text-[#5e5e72] font-medium text-base md:text-lg">لا يوجد منتجات مسجلة</div>
          ) : products.map((product) => (
            <div key={product._id} className="bg-card border border-white/5 rounded-2xl overflow-hidden transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-[0_8px_30px_rgba(200,149,108,0.1)] flex flex-col">
              <div className="h-32 md:h-40 bg-[#1a1a2e] relative">
                {product.image ? (
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl md:text-5xl">☕</div>
                )}
                <div className="absolute top-2 md:top-3 left-2 md:left-3 bg-black/60 backdrop-blur-md px-2 py-0.5 md:px-3 md:py-1 rounded-full text-primary text-xs md:text-base font-bold">
                  ${product.price}
                </div>
                {!product.isAvailable && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <span className="bg-red-500 text-white text-[10px] md:text-xs font-bold px-2 py-0.5 md:px-3 md:py-1 rounded-full">غير متاح</span>
                  </div>
                )}
              </div>
              <div className="p-4 md:p-5 flex-1 flex flex-col">
                <h3 className="text-lg md:text-xl font-bold mb-1">{product.nameAr || product.name}</h3>
                <p className="text-[#9a9aad] text-[10px] md:text-xs mb-2 md:mb-3 uppercase tracking-wider">{product.category?.nameAr || product.category?.name}</p>
                <p className="text-[#5e5e72] text-xs md:text-sm mb-4 line-clamp-2 flex-1">{product.description}</p>
                <div className="flex gap-2 w-full pt-3 md:pt-4 border-t border-white/5 mt-auto">
                  <button onClick={() => openEditProduct(product)} className="flex-1 h-8 md:h-10 flex items-center justify-center gap-2 rounded-xl bg-elevated text-[#9a9aad] hover:bg-primary hover:text-gray-900 transition-colors text-xs md:text-sm font-bold" title="تعديل">
                    <FaEdit /> تعديل
                  </button>
                  <button onClick={() => handleDeleteProduct(product._id)} className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-xl bg-elevated text-[#9a9aad] hover:bg-red-500 hover:text-white transition-colors text-sm md:text-base" title="حذف">
                    <FaTrash />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ── Categories Grid ── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {categories.length === 0 ? (
            <div className="col-span-full text-center py-20 text-[#5e5e72] font-medium text-base md:text-lg">لا يوجد تصنيفات مسجلة</div>
          ) : categories.map((cat) => (
            <div key={cat._id} className="bg-card border border-white/5 rounded-2xl p-4 md:p-6 flex flex-col items-center text-center transition-all hover:-translate-y-1 hover:border-accent/50 hover:shadow-[0_8px_30px_rgba(110,133,183,0.1)]">
              {cat.image ? (
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl overflow-hidden mb-3 md:mb-4 shadow-inner border-2 border-white/10">
                  <img src={cat.image} alt={cat.nameAr || cat.name} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-elevated border-2 border-white/10 flex items-center justify-center text-2xl md:text-3xl mb-3 md:mb-4 shadow-inner">
                  {cat.icon || '🏷️'}
                </div>
              )}
              <h3 className="text-lg md:text-xl font-bold mb-1">{cat.nameAr || cat.name}</h3>
              <p className="text-[#9a9aad] text-[10px] md:text-xs mb-1">{cat.name}</p>
              <p className="text-[#5e5e72] text-[10px] md:text-xs mb-3 md:mb-4">الترتيب: {cat.sortOrder}</p>
              <div className="flex gap-2 w-full justify-center pt-3 md:pt-4 border-t border-white/5 mt-auto">
                <button onClick={() => openEditCategory(cat)} className="flex-1 h-8 md:h-9 flex items-center justify-center gap-2 rounded-xl bg-elevated text-[#9a9aad] hover:bg-accent hover:text-white transition-colors text-xs md:text-sm font-bold" title="تعديل">
                  <FaEdit /> تعديل
                </button>
                <button onClick={() => handleDeleteCategory(cat._id)} className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-xl bg-elevated text-[#9a9aad] hover:bg-red-500 hover:text-white transition-colors text-sm md:text-base" title="حذف">
                  <FaTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Product Modal (Add / Edit) ─── */}
      {showProductModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#111118] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-slide-up">
            <div className="flex justify-between items-center p-6 border-b border-white/5">
              <h2 className="text-xl font-bold">{editingProductId ? 'تعديل المنتج' : 'إضافة منتج جديد'}</h2>
              <button onClick={() => setShowProductModal(false)} className="text-[#9a9aad] hover:text-white transition-colors"><FaTimes size={20}/></button>
            </div>
            <form onSubmit={handleProductSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-[#9a9aad] mb-2">الاسم (إنجليزي)</label>
                  <input required type="text" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} className="w-full bg-elevated border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors" placeholder="Latte" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#9a9aad] mb-2">الاسم (عربي)</label>
                  <input type="text" value={productForm.nameAr} onChange={e => setProductForm({...productForm, nameAr: e.target.value})} className="w-full bg-elevated border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors" placeholder="لاتيه" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-[#9a9aad] mb-2">السعر ($)</label>
                  <input required type="number" step="0.01" value={productForm.price} onChange={e => setProductForm({...productForm, price: e.target.value})} className="w-full bg-elevated border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors" placeholder="4.50" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#9a9aad] mb-2">التصنيف</label>
                  <select required value={productForm.category} onChange={e => setProductForm({...productForm, category: e.target.value})} className="w-full bg-elevated border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors">
                    <option value="">اختر تصنيف...</option>
                    {categories.map(c => (
                      <option key={c._id} value={c._id}>{c.nameAr || c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-[#9a9aad] mb-2">الوصف</label>
                <textarea rows="2" value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} className="w-full bg-elevated border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors resize-none" placeholder="وصف المنتج..." />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#9a9aad] mb-2">الصورة</label>
                <div className="flex gap-2">
                  <input type="text" value={productForm.image} onChange={e => setProductForm({...productForm, image: e.target.value})} className="flex-1 bg-elevated border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors text-left" dir="ltr" placeholder="رابط الصورة أو ارفع ملف..." />
                  <label className="bg-primary/20 text-primary border border-primary/30 rounded-xl px-4 py-3 cursor-pointer hover:bg-primary/30 transition-all flex items-center justify-center min-w-[3rem]">
                    {uploadingImage ? <FaSync className="animate-spin" /> : <FaUpload />}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'product')} disabled={uploadingImage} />
                  </label>
                </div>
                {productForm.image && (
                  <img src={productForm.image} alt="preview" className="mt-2 w-full h-28 object-cover rounded-xl border border-white/10" />
                )}
              </div>
              <div className="flex items-center gap-3 p-3 bg-elevated rounded-xl border border-white/5">
                <input type="checkbox" id="isAvailable" checked={productForm.isAvailable} onChange={e => setProductForm({...productForm, isAvailable: e.target.checked})} className="w-4 h-4 accent-primary" />
                <label htmlFor="isAvailable" className="text-sm font-bold cursor-pointer">متاح للطلب</label>
              </div>
              <div className="pt-2 flex gap-3">
                <button type="submit" className="flex-1 bg-primary text-gray-900 font-bold py-3 rounded-xl hover:opacity-90 transition-all shadow-[0_4px_15px_rgba(200,149,108,0.3)]">
                  {editingProductId ? 'حفظ التعديلات' : 'إضافة'}
                </button>
                <button type="button" onClick={() => setShowProductModal(false)} className="px-6 bg-elevated text-white font-bold py-3 rounded-xl hover:bg-white/10 transition-all">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Category Modal (Add / Edit) ─── */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#111118] border border-white/10 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-slide-up">
            <div className="flex justify-between items-center p-6 border-b border-white/5">
              <h2 className="text-xl font-bold">{editingCategoryId ? 'تعديل التصنيف' : 'إضافة تصنيف جديد'}</h2>
              <button onClick={() => setShowCategoryModal(false)} className="text-[#9a9aad] hover:text-white transition-colors"><FaTimes size={20}/></button>
            </div>
            <form onSubmit={handleCategorySubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-bold text-[#9a9aad] mb-2">الاسم (إنجليزي)</label>
                <input required type="text" value={categoryForm.name} onChange={e => setCategoryForm({...categoryForm, name: e.target.value})} className="w-full bg-elevated border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-accent transition-colors" placeholder="Hot Drinks" />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#9a9aad] mb-2">الاسم (عربي)</label>
                <input type="text" value={categoryForm.nameAr} onChange={e => setCategoryForm({...categoryForm, nameAr: e.target.value})} className="w-full bg-elevated border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-accent transition-colors" placeholder="مشروبات ساخنة" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-[#9a9aad] mb-2">أيقونة (إيموجي)</label>
                  <input type="text" value={categoryForm.icon} onChange={e => setCategoryForm({...categoryForm, icon: e.target.value})} className="w-full bg-elevated border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-accent transition-colors text-center text-xl" placeholder="☕" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#9a9aad] mb-2">الترتيب</label>
                  <input type="number" value={categoryForm.sortOrder} onChange={e => setCategoryForm({...categoryForm, sortOrder: parseInt(e.target.value) || 0})} className="w-full bg-elevated border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-accent transition-colors" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-[#9a9aad] mb-2">الصورة</label>
                <div className="flex gap-2">
                  <input type="text" value={categoryForm.image} onChange={e => setCategoryForm({...categoryForm, image: e.target.value})} className="flex-1 bg-elevated border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-accent transition-colors text-left" dir="ltr" placeholder="رابط الصورة أو ارفع ملف..." />
                  <label className="bg-accent/20 text-accent border border-accent/30 rounded-xl px-4 py-3 cursor-pointer hover:bg-accent/30 transition-all flex items-center justify-center min-w-[3rem]">
                    {uploadingImage ? <FaSync className="animate-spin" /> : <FaUpload />}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'category')} disabled={uploadingImage} />
                  </label>
                </div>
                {categoryForm.image && (
                  <img src={categoryForm.image} alt="preview" className="mt-2 w-full h-24 object-cover rounded-xl border border-white/10" />
                )}
              </div>
              <div className="pt-2 flex gap-3">
                <button type="submit" className="flex-1 bg-accent text-white font-bold py-3 rounded-xl hover:opacity-90 transition-all shadow-[0_4px_15px_rgba(110,133,183,0.3)]">
                  {editingCategoryId ? 'حفظ التعديلات' : 'إضافة'}
                </button>
                <button type="button" onClick={() => setShowCategoryModal(false)} className="px-6 bg-elevated text-white font-bold py-3 rounded-xl hover:bg-white/10 transition-all">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
