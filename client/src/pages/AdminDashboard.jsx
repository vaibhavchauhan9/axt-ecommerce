import React, { useState, useEffect } from 'react';
import { LayoutDashboard, ShoppingBag, AlertTriangle, TrendingUp, IndianRupee, Package, Plus, Trash2, Pencil, X, Users, Tag } from 'lucide-react';
import apiClient from '../services/apiClient';
import CustomerManagement from '../components/admin/CustomerManagement';
import CouponManagement from '../components/admin/CouponManagement';

const ALL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

const emptyProductForm = {
  name: '',
  category: '',
  brand: 'AXT',
  description: '',
  price: '',
  discountPrice: '',
  sizes: [],
  colors: [],
  images: '',
  stock: 10,
  sku: '',
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('metrics');
  const [stats, setStats] = useState(null);
  const [salesReport, setSalesReport] = useState([]);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Product management state
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [productForm, setProductForm] = useState(emptyProductForm);
  const [editingProductId, setEditingProductId] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [showProductForm, setShowProductForm] = useState(false);

  // Quick category creation
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });
  const [categoryError, setCategoryError] = useState('');

  // Fetch Admin Data
  useEffect(() => {
    const fetchAdminData = async () => {
      setLoading(true);
      try {
        if (activeTab === 'metrics') {
          const { data } = await apiClient.get('/admin/dashboard-stats');
          setStats(data.data);
        } else if (activeTab === 'orders') {
          const { data } = await apiClient.get('/admin/sales-report');
          setSalesReport(data.data.reports);
        } else if (activeTab === 'products') {
          await Promise.all([fetchProducts(), fetchCategories()]);
        }
      } catch (error) {
        console.error('Failed to load administrative matrices:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [activeTab]);

  const fetchProducts = async () => {
    const { data } = await apiClient.get('/products?limit=100&sort=-createdAt');
    setProducts(data.data.products);
  };

  const fetchCategories = async () => {
    const { data } = await apiClient.get('/categories');
    setCategories(data.data.categories);
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await apiClient.patch(`/orders/${orderId}/status`, { orderStatus: newStatus });
      alert(`Order ${orderId} shifted to ${newStatus}`);
      // Refresh the orders list
      const { data } = await apiClient.get('/admin/sales-report');
      setSalesReport(data.data.reports);
    } catch (error) {
      alert('Failed to update logistics status.');
    }
  };

  // ---- Product form handlers ----

  const resetProductForm = () => {
    setProductForm(emptyProductForm);
    setEditingProductId(null);
    setFormError('');
    setShowProductForm(false);
  };

  const startEditProduct = (product) => {
    setEditingProductId(product._id);
    setProductForm({
      name: product.name || '',
      category: product.category?._id || product.category || '',
      brand: product.brand || 'AXT',
      description: product.description || '',
      price: product.price ?? '',
      discountPrice: product.discountPrice ?? '',
      sizes: product.sizes || [],
      colors: product.colors || [],
      images: (product.images || []).join(', '),
      stock: product.stock ?? 0,
      sku: product.sku || '',
    });
    setShowProductForm(true);
    setFormError('');
  };

  const toggleSize = (size) => {
    setProductForm((prev) => {
      const has = prev.sizes.includes(size);
      return {
        ...prev,
        sizes: has ? prev.sizes.filter((s) => s !== size) : [...prev.sizes, size],
      };
    });
  };

  const addColorRow = () => {
    setProductForm((prev) => ({
      ...prev,
      colors: [...prev.colors, { name: '', hex: '#000000' }],
    }));
  };

  const updateColorRow = (index, field, value) => {
    setProductForm((prev) => {
      const colors = [...prev.colors];
      colors[index] = { ...colors[index], [field]: value };
      return { ...prev, colors };
    });
  };

  const removeColorRow = (index) => {
    setProductForm((prev) => ({
      ...prev,
      colors: prev.colors.filter((_, i) => i !== index),
    }));
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    // Basic client-side validation, mirrors server-side rules
    if (!productForm.name.trim()) return setFormError('Product name is required.');
    if (!productForm.category) return setFormError('Please select a category.');
    if (!productForm.description.trim()) return setFormError('Description is required.');
    if (productForm.price === '' || Number(productForm.price) < 0) return setFormError('Enter a valid price.');
    if (productForm.sizes.length === 0) return setFormError('Select at least one size.');
    if (!productForm.sku.trim()) return setFormError('SKU is required.');
    const imageList = productForm.images
      .split(',')
      .map((url) => url.trim())
      .filter(Boolean);
    if (imageList.length === 0) return setFormError('Add at least one image URL.');

    const payload = {
      name: productForm.name.trim(),
      category: productForm.category,
      brand: productForm.brand.trim() || 'AXT',
      description: productForm.description.trim(),
      price: Number(productForm.price),
      sizes: productForm.sizes,
      colors: productForm.colors.filter((c) => c.name.trim() && c.hex.trim()),
      images: imageList,
      stock: Number(productForm.stock) || 0,
      sku: productForm.sku.trim().toUpperCase(),
    };
    if (productForm.discountPrice !== '') {
      payload.discountPrice = Number(productForm.discountPrice);
    }

    setFormLoading(true);
    try {
      if (editingProductId) {
        await apiClient.patch(`/products/${editingProductId}`, payload);
      } else {
        await apiClient.post('/products', payload);
      }
      await fetchProducts();
      resetProductForm();
    } catch (error) {
      setFormError(error.response?.data?.message || 'Failed to save product. Check the fields and try again.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Permanently remove this product from the catalog?')) return;
    try {
      await apiClient.delete(`/products/${productId}`);
      setProducts((prev) => prev.filter((p) => p._id !== productId));
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete product.');
    }
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    setCategoryError('');
    if (!categoryForm.name.trim()) return setCategoryError('Category name is required.');

    try {
      const { data } = await apiClient.post('/categories', {
        name: categoryForm.name.trim(),
        description: categoryForm.description.trim(),
      });
      setCategories((prev) => [...prev, data.data.category]);
      setProductForm((prev) => ({ ...prev, category: data.data.category._id }));
      setCategoryForm({ name: '', description: '' });
      setShowCategoryForm(false);
    } catch (error) {
      setCategoryError(error.response?.data?.message || 'Failed to create category.');
    }
  };

  const inputClass =
    'w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-brand-accentNeon transition-colors';
  const labelClass = 'text-[10px] text-neutral-500 font-bold uppercase tracking-widest block mb-2';

  if (loading && !stats && activeTab === 'metrics') {
    return (
      <div className="min-h-screen bg-brand-black flex items-center justify-center text-brand-accentNeon font-display uppercase tracking-widest font-bold">
        Accessing Secure Command Center...
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-brand-black pt-28 pb-20 px-4 md:px-8 text-white">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8">
        
        {/* Admin Navigation Sidebar */}
        <aside className="w-full md:w-64 shrink-0">
          <div className="glass-card p-6 border border-white/5 mb-6">
            <h2 className="font-display font-black text-xl uppercase tracking-widest text-brand-accentNeon">
              AXT Admin
            </h2>
            <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mt-1">
              Level 5 Clearance
            </p>
          </div>

          <nav className="flex flex-col gap-2">
            <button 
              onClick={() => setActiveTab('metrics')}
              className={`flex items-center gap-3 w-full p-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'metrics' ? 'bg-white text-black' : 'bg-neutral-900/40 border border-white/5 text-neutral-400 hover:bg-neutral-900 hover:text-white'}`}
            >
              <LayoutDashboard size={16} /> Core Metrics
            </button>
            <button 
              onClick={() => setActiveTab('products')}
              className={`flex items-center gap-3 w-full p-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'products' ? 'bg-white text-black' : 'bg-neutral-900/40 border border-white/5 text-neutral-400 hover:bg-neutral-900 hover:text-white'}`}
            >
              <Package size={16} /> Product Catalog
            </button>
            <button 
              onClick={() => setActiveTab('orders')}
              className={`flex items-center gap-3 w-full p-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'orders' ? 'bg-white text-black' : 'bg-neutral-900/40 border border-white/5 text-neutral-400 hover:bg-neutral-900 hover:text-white'}`}
            >
              <ShoppingBag size={16} /> Order Pipeline
            </button>
            <button 
              onClick={() => setActiveTab('customers')}
              className={`flex items-center gap-3 w-full p-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'customers' ? 'bg-white text-black' : 'bg-neutral-900/40 border border-white/5 text-neutral-400 hover:bg-neutral-900 hover:text-white'}`}
            >
              <Users size={16} /> Customers
            </button>
            <button 
              onClick={() => setActiveTab('coupons')}
              className={`flex items-center gap-3 w-full p-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'coupons' ? 'bg-white text-black' : 'bg-neutral-900/40 border border-white/5 text-neutral-400 hover:bg-neutral-900 hover:text-white'}`}
            >
              <Tag size={16} /> Coupons
            </button>
          </nav>
        </aside>

        {/* Dynamic Admin Workspace */}
        <main className="flex-1 min-h-[600px]">
          
          {/* TAB 1: Core Metrics & Inventory Alerts */}
          {activeTab === 'metrics' && stats && (
            <div className="flex flex-col gap-8">
              <h3 className="font-display font-black text-2xl uppercase tracking-wider flex items-center gap-3">
                <TrendingUp className="text-brand-accentNeon" /> Platform Analytics
              </h3>
              
              {/* Top Level KPIs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="glass-card p-6 border border-white/5">
                  <span className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest block mb-2">Total Revenue</span>
                  <span className="text-2xl font-black text-white flex items-center gap-1">
                    <IndianRupee size={20} className="text-brand-accentNeon" />
                    {stats.summary.totalRevenue.toFixed(2)}
                  </span>
                </div>
                <div className="glass-card p-6 border border-white/5">
                  <span className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest block mb-2">Total Orders</span>
                  <span className="text-2xl font-black text-white">{stats.summary.totalOrders}</span>
                </div>
                <div className="glass-card p-6 border border-white/5">
                  <span className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest block mb-2">Customers</span>
                  <span className="text-2xl font-black text-white">{stats.summary.totalCustomers}</span>
                </div>
                <div className="glass-card p-6 border border-white/5">
                  <span className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest block mb-2">Active Artifacts</span>
                  <span className="text-2xl font-black text-white">{stats.summary.totalProducts}</span>
                </div>
              </div>

              {/* Low Stock Alerts */}
              <div className="glass-card p-6 md:p-8 border border-white/5 mt-4">
                <h4 className="text-sm font-bold uppercase tracking-widest mb-6 flex items-center gap-2 text-red-400">
                  <AlertTriangle size={18} /> Low Stock Warnings
                </h4>
                {stats.lowStockAlerts.length === 0 ? (
                  <p className="text-xs text-neutral-500 uppercase tracking-widest">Inventory levels optimal.</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {stats.lowStockAlerts.map(item => (
                      <div key={item._id} className="flex justify-between items-center bg-black/50 p-4 rounded-lg border border-red-500/20">
                        <div>
                          <p className="font-bold text-xs uppercase text-white">{item.name}</p>
                          <p className="text-[10px] text-neutral-500 font-mono mt-1">SKU: {item.sku}</p>
                        </div>
                        <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded text-[10px] font-black uppercase">
                          {item.stock} Units Left
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Product Catalog Management */}
          {activeTab === 'products' && (
            <div className="flex flex-col gap-8">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <h3 className="font-display font-black text-2xl uppercase tracking-wider flex items-center gap-3">
                  <Package className="text-brand-accentNeon" /> Product Catalog
                </h3>
                <button
                  onClick={() => {
                    if (showProductForm) {
                      resetProductForm();
                    } else {
                      setShowProductForm(true);
                    }
                  }}
                  className="flex items-center gap-2 bg-brand-accentNeon text-black px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:brightness-110 transition-all"
                >
                  {showProductForm ? <><X size={16} /> Close Form</> : <><Plus size={16} /> Add Product</>}
                </button>
              </div>

              {/* Add / Edit Product Form */}
              {showProductForm && (
                <form onSubmit={handleProductSubmit} className="glass-card p-6 md:p-8 border border-white/5 flex flex-col gap-6">
                  <h4 className="text-sm font-bold uppercase tracking-widest text-brand-accentNeon">
                    {editingProductId ? 'Edit Product' : 'New Product Listing'}
                  </h4>

                  {formError && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold uppercase tracking-wide px-4 py-3 rounded-lg">
                      {formError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className={labelClass}>Product Name *</label>
                      <input
                        type="text"
                        className={inputClass}
                        value={productForm.name}
                        onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                        placeholder="Attitude Oversized Tee"
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Category *</label>
                      <div className="flex gap-2">
                        <select
                          className={inputClass}
                          value={productForm.category}
                          onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                        >
                          <option value="">Select category</option>
                          {categories.map((cat) => (
                            <option key={cat._id} value={cat._id}>{cat.name}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => setShowCategoryForm((v) => !v)}
                          className="shrink-0 bg-neutral-900 border border-white/10 px-3 rounded-lg text-[10px] font-bold uppercase text-brand-accentNeon hover:bg-neutral-800"
                        >
                          + New
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className={labelClass}>Brand</label>
                      <input
                        type="text"
                        className={inputClass}
                        value={productForm.brand}
                        onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>SKU *</label>
                      <input
                        type="text"
                        className={inputClass}
                        value={productForm.sku}
                        onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                        placeholder="AXT-TEE-001"
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Price (₹) *</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className={inputClass}
                        value={productForm.price}
                        onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Discount Price (optional)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className={inputClass}
                        value={productForm.discountPrice}
                        onChange={(e) => setProductForm({ ...productForm, discountPrice: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Stock Quantity *</label>
                      <input
                        type="number"
                        min="0"
                        className={inputClass}
                        value={productForm.stock}
                        onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Quick inline category creation */}
                  {showCategoryForm && (
                    <div className="bg-black/50 border border-white/10 rounded-xl p-5 flex flex-col gap-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Create New Category</p>
                      {categoryError && <p className="text-[10px] text-red-400 font-bold uppercase">{categoryError}</p>}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          type="text"
                          className={inputClass}
                          placeholder="Category name (e.g. Hoodies)"
                          value={categoryForm.name}
                          onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                        />
                        <input
                          type="text"
                          className={inputClass}
                          placeholder="Short description (optional)"
                          value={categoryForm.description}
                          onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleCategorySubmit}
                        className="self-start bg-white text-black px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-brand-accentNeon transition-colors"
                      >
                        Save Category
                      </button>
                    </div>
                  )}

                  <div>
                    <label className={labelClass}>Description *</label>
                    <textarea
                      className={inputClass}
                      rows={3}
                      value={productForm.description}
                      onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                      placeholder="Premium heavyweight cotton tee with a bold graphic print..."
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Image URLs * (comma-separated)</label>
                    <textarea
                      className={inputClass}
                      rows={2}
                      value={productForm.images}
                      onChange={(e) => setProductForm({ ...productForm, images: e.target.value })}
                      placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                    />
                    <p className="text-[10px] text-neutral-600 mt-2">Upload isn't wired up yet — host images (e.g. Cloudinary, Imgur) and paste the direct URLs here.</p>
                  </div>

                  <div>
                    <label className={labelClass}>Available Sizes *</label>
                    <div className="flex flex-wrap gap-2">
                      {ALL_SIZES.map((size) => (
                        <button
                          type="button"
                          key={size}
                          onClick={() => toggleSize(size)}
                          className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest border transition-all ${productForm.sizes.includes(size) ? 'bg-brand-accentNeon text-black border-brand-accentNeon' : 'bg-black/50 border-white/10 text-neutral-400 hover:border-white/30'}`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Colors (optional)</label>
                    <div className="flex flex-col gap-3">
                      {productForm.colors.map((color, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <input
                            type="text"
                            className={inputClass}
                            placeholder="Color name (e.g. Jet Black)"
                            value={color.name}
                            onChange={(e) => updateColorRow(idx, 'name', e.target.value)}
                          />
                          <input
                            type="color"
                            className="w-12 h-11 bg-black/50 border border-white/10 rounded-lg cursor-pointer"
                            value={color.hex}
                            onChange={(e) => updateColorRow(idx, 'hex', e.target.value)}
                          />
                          <button
                            type="button"
                            onClick={() => removeColorRow(idx)}
                            className="shrink-0 text-red-400 hover:text-red-300"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addColorRow}
                        className="self-start flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-brand-accentNeon hover:brightness-110"
                      >
                        <Plus size={14} /> Add Color Option
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pt-2">
                    <button
                      type="submit"
                      disabled={formLoading}
                      className="bg-white text-black px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-brand-accentNeon transition-colors disabled:opacity-50"
                    >
                      {formLoading ? 'Saving...' : editingProductId ? 'Update Product' : 'Publish Product'}
                    </button>
                    <button
                      type="button"
                      onClick={resetProductForm}
                      className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Product List */}
              <div className="glass-card border border-white/5 overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="border-b border-white/10 bg-black/40">
                      <th className="p-4 text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Product</th>
                      <th className="p-4 text-[10px] text-neutral-500 font-bold uppercase tracking-widest">SKU</th>
                      <th className="p-4 text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Category</th>
                      <th className="p-4 text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Price</th>
                      <th className="p-4 text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Stock</th>
                      <th className="p-4 text-[10px] text-neutral-500 font-bold uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={6} className="p-6 text-center text-xs text-neutral-500 uppercase tracking-widest">Loading catalog...</td></tr>
                    ) : products.length === 0 ? (
                      <tr><td colSpan={6} className="p-6 text-center text-xs text-neutral-500 uppercase tracking-widest">No products yet. Add your first one above.</td></tr>
                    ) : (
                      products.map((product) => (
                        <tr key={product._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="p-4 text-xs font-bold uppercase text-white flex items-center gap-3">
                            {product.images?.[0] && (
                              <img src={product.images[0]} alt={product.name} className="w-10 h-10 object-cover rounded-md border border-white/10" />
                            )}
                            {product.name}
                          </td>
                          <td className="p-4 text-xs font-mono text-neutral-400">{product.sku}</td>
                          <td className="p-4 text-xs text-neutral-300">{product.category?.name || '—'}</td>
                          <td className="p-4 text-xs font-bold text-brand-accentNeon">₹{product.price?.toFixed(2)}</td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded text-[9px] font-black tracking-widest uppercase ${product.stock < 5 ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                              {product.stock} units
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex justify-end gap-3">
                              <button onClick={() => startEditProduct(product)} className="text-neutral-400 hover:text-brand-accentNeon transition-colors">
                                <Pencil size={16} />
                              </button>
                              <button onClick={() => handleDeleteProduct(product._id)} className="text-neutral-400 hover:text-red-400 transition-colors">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: Logistics & Order Pipeline */}
          {activeTab === 'orders' && (
            <div className="flex flex-col gap-8">
              <h3 className="font-display font-black text-2xl uppercase tracking-wider flex items-center gap-3">
                <ShoppingBag className="text-brand-accentNeon" /> Logistics Terminal
              </h3>

              <div className="glass-card border border-white/5 overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead>
                    <tr className="border-b border-white/10 bg-black/40">
                      <th className="p-4 text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Order ID</th>
                      <th className="p-4 text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Date</th>
                      <th className="p-4 text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Customer</th>
                      <th className="p-4 text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Payment</th>
                      <th className="p-4 text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Total</th>
                      <th className="p-4 text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Status</th>
                      <th className="p-4 text-[10px] text-neutral-500 font-bold uppercase tracking-widest text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesReport.map(order => (
                      <React.Fragment key={order._id}>
                        <tr
                          onClick={() => setExpandedOrderId(expandedOrderId === order._id ? null : order._id)}
                          className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                        >
                          <td className="p-4 text-xs font-mono text-neutral-400">{order._id.substring(0, 8)}...</td>
                          <td className="p-4 text-xs text-neutral-300">{new Date(order.createdAt).toLocaleDateString()}</td>
                          <td className="p-4 text-xs font-bold uppercase">{order.user?.name || 'GUEST'}</td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded text-[9px] font-black tracking-widest uppercase ${order.paymentMethod === 'COD' ? 'bg-orange-500/10 text-orange-400' : 'bg-blue-500/10 text-blue-400'}`}>
                              {order.paymentMethod === 'COD' ? 'Cash on Delivery' : order.paymentMethod}
                            </span>
                          </td>
                          <td className="p-4 text-xs font-bold text-brand-accentNeon">₹{order.totalPrice.toFixed(2)}</td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded text-[9px] font-black tracking-widest uppercase ${order.orderStatus === 'DELIVERED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                              {order.orderStatus}
                            </span>
                          </td>
                          <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <select 
                              value={order.orderStatus}
                              onChange={(e) => handleUpdateOrderStatus(order._id, e.target.value)}
                              className="bg-neutral-900 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-white rounded px-2 py-1 focus:outline-none focus:border-brand-accentNeon cursor-pointer"
                            >
                              <option value="PENDING">PENDING</option>
                              <option value="PACKED">PACKED</option>
                              <option value="SHIPPED">SHIPPED</option>
                              <option value="DELIVERED">DELIVERED</option>
                              <option value="CANCELLED">CANCELLED</option>
                            </select>
                          </td>
                        </tr>

                        {/* Expandable panel: customer contact + delivery address + items — essential for COD fulfilment */}
                        {expandedOrderId === order._id && (
                          <tr className="bg-black/40 border-b border-white/5">
                            <td colSpan={7} className="p-5">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                  <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-2">Customer Contact</p>
                                  <p className="text-xs text-white font-bold">{order.user?.name || 'Guest'}</p>
                                  <p className="text-xs text-neutral-400 mt-1">{order.user?.email || '—'}</p>
                                  <p className="text-xs text-neutral-400 mt-1">{order.user?.phoneNumber || 'No phone on file'}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-2">Delivery Address</p>
                                  <p className="text-xs text-neutral-300 leading-relaxed">
                                    {order.shippingAddress?.street}<br />
                                    {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.postalCode}<br />
                                    {order.shippingAddress?.country}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-2">Items ({order.items?.length || 0})</p>
                                  <div className="flex flex-col gap-1.5 max-h-24 overflow-y-auto pr-2">
                                    {order.items?.map((item, idx) => (
                                      <p key={idx} className="text-xs text-neutral-300">
                                        {item.quantity}x {item.name} <span className="text-neutral-500">({item.size}, {item.color?.name})</span>
                                      </p>
                                    ))}
                                  </div>
                                  {order.paymentMethod === 'COD' && (
                                    <p className="text-[10px] text-orange-400 font-bold uppercase tracking-widest mt-3">
                                      ⚠ Collect ₹{order.totalPrice.toFixed(2)} cash on delivery
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: Customer Management */}
          {activeTab === 'customers' && <CustomerManagement />}

          {/* TAB 5: Coupon Management */}
          {activeTab === 'coupons' && <CouponManagement />}

        </main>
      </div>
    </div>
  );
}
