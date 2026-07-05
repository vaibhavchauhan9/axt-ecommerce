import React, { useState, useEffect, useCallback } from 'react';
import { Users, Search, Ban, CheckCircle, X, ShoppingBag, IndianRupee, ChevronLeft, ChevronRight } from 'lucide-react';
import apiClient from '../../services/apiClient';

function CustomerDetailModal({ customerId, onClose, onBlockToggled }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get(`/admin/customers/${customerId}`);
      setData(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load customer details.');
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleBlockToggle = async () => {
    setActionLoading(true);
    try {
      await apiClient.patch(`/admin/customers/${customerId}/block`);
      await fetchDetail();
      onBlockToggled();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update customer status.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="glass-card border border-white/10 rounded-xl p-6 md:p-8 w-full max-w-2xl max-h-[85vh] overflow-y-auto relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {loading ? (
          <div className="animate-pulse flex flex-col gap-4 py-8">
            {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-neutral-900 rounded-xl" />)}
          </div>
        ) : error ? (
          <p className="text-red-400 text-sm text-center py-12">{error}</p>
        ) : data ? (
          <>
            <div className="flex items-start justify-between mb-6 gap-4">
              <div>
                <h3 className="font-display font-black text-xl uppercase tracking-wider">{data.customer.name}</h3>
                <p className="text-xs text-neutral-500 mt-1">{data.customer.email}</p>
                <p className="text-xs text-neutral-500">{data.customer.phoneNumber || 'No phone on file'}</p>
                <p className="text-[10px] text-neutral-600 font-mono mt-2">
                  Joined {new Date(data.customer.createdAt).toLocaleDateString()}
                </p>
              </div>
              <span
                className={`shrink-0 px-2 py-1 rounded text-[10px] font-black tracking-widest uppercase ${
                  data.customer.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                }`}
              >
                {data.customer.isActive ? 'Active' : 'Blocked'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-neutral-900/40 border border-white/5 rounded-lg p-4">
                <p className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest mb-1 flex items-center gap-1">
                  <ShoppingBag size={12} /> Total Orders
                </p>
                <p className="text-xl font-black text-white">{data.orderCount}</p>
              </div>
              <div className="bg-neutral-900/40 border border-white/5 rounded-lg p-4">
                <p className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest mb-1 flex items-center gap-1">
                  <IndianRupee size={12} /> Total Spent
                </p>
                <p className="text-xl font-black text-brand-accentNeon">₹{data.totalSpent.toFixed(2)}</p>
              </div>
            </div>

            <button
              onClick={handleBlockToggle}
              disabled={actionLoading}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors mb-8 disabled:opacity-50 ${
                data.customer.isActive
                  ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20'
                  : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20'
              }`}
            >
              {data.customer.isActive ? <Ban size={14} /> : <CheckCircle size={14} />}
              {actionLoading ? 'Updating...' : data.customer.isActive ? 'Block Customer' : 'Unblock Customer'}
            </button>

            <h4 className="text-xs font-black uppercase tracking-widest text-neutral-400 mb-3">Order History</h4>
            {data.orders.length === 0 ? (
              <p className="text-neutral-500 text-xs text-center py-8 border border-dashed border-white/10 rounded-xl">
                No orders placed yet.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {data.orders.map((order) => (
                  <div key={order._id} className="bg-neutral-900/40 border border-white/5 rounded-lg p-4 flex justify-between items-center">
                    <div>
                      <p className="text-[10px] text-neutral-500 font-mono">{order._id}</p>
                      <p className="text-xs text-neutral-400 mt-1">{new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-white">₹{order.totalPrice.toFixed(2)}</p>
                      <span className={`text-[9px] font-black tracking-widest uppercase ${order.orderStatus === 'DELIVERED' ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {order.orderStatus}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}

export default function CustomerManagement() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [blockLoadingId, setBlockLoadingId] = useState(null);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get('/admin/customers', {
        params: { search, page, limit: 10 },
      });
      setCustomers(data.data.customers);
      setTotalPages(data.pages);
      setTotal(data.total);
    } catch (error) {
      console.error('Failed to load customers:', error);
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const handleQuickBlockToggle = async (customer) => {
    setBlockLoadingId(customer._id);
    try {
      await apiClient.patch(`/admin/customers/${customer._id}/block`);
      await fetchCustomers();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update customer status.');
    } finally {
      setBlockLoadingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h3 className="font-display font-black text-2xl uppercase tracking-wider flex items-center gap-3">
          <Users className="text-brand-accentNeon" /> Customer Management
        </h3>

        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-80">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search name, email, or phone..."
              className="w-full bg-neutral-900/50 border border-white/10 text-white text-xs rounded-lg py-3 pl-9 pr-4 focus:outline-none focus:border-brand-accentNeon"
            />
          </div>
          <button type="submit" className="btn-primary py-3 px-4 text-xs shrink-0">Search</button>
        </form>
      </div>

      <div className="glass-card border border-white/5 overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="border-b border-white/10 bg-black/40">
              <th className="p-4 text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Customer</th>
              <th className="p-4 text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Contact</th>
              <th className="p-4 text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Orders</th>
              <th className="p-4 text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Total Spent</th>
              <th className="p-4 text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Status</th>
              <th className="p-4 text-[10px] text-neutral-500 font-bold uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [1, 2, 3, 4].map((i) => (
                <tr key={i} className="border-b border-white/5">
                  <td colSpan={6} className="p-4">
                    <div className="h-6 bg-neutral-900 rounded animate-pulse" />
                  </td>
                </tr>
              ))
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-neutral-500 text-xs uppercase tracking-widest font-bold">
                  No customers found.
                </td>
              </tr>
            ) : (
              customers.map((customer) => (
                <tr key={customer._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-4 text-xs font-bold uppercase text-white">{customer.name}</td>
                  <td className="p-4 text-xs text-neutral-400">
                    <p>{customer.email}</p>
                    <p className="text-neutral-500">{customer.phoneNumber || '—'}</p>
                  </td>
                  <td className="p-4 text-xs text-neutral-300">{customer.orderCount}</td>
                  <td className="p-4 text-xs font-bold text-brand-accentNeon">₹{customer.totalSpent.toFixed(2)}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-[9px] font-black tracking-widest uppercase ${customer.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                      {customer.isActive ? 'Active' : 'Blocked'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => setSelectedCustomerId(customer._id)}
                        className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-white transition-colors"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleQuickBlockToggle(customer)}
                        disabled={blockLoadingId === customer._id}
                        className={`text-[10px] font-bold uppercase tracking-widest transition-colors disabled:opacity-50 ${
                          customer.isActive ? 'text-red-400 hover:text-red-300' : 'text-emerald-400 hover:text-emerald-300'
                        }`}
                      >
                        {customer.isActive ? 'Block' : 'Unblock'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && customers.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest">
            {total} customer{total !== 1 ? 's' : ''} total
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-2 rounded-lg bg-neutral-900/40 border border-white/5 text-neutral-400 hover:text-white disabled:opacity-30 transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-xs text-neutral-400 font-bold">{page} / {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-2 rounded-lg bg-neutral-900/40 border border-white/5 text-neutral-400 hover:text-white disabled:opacity-30 transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {selectedCustomerId && (
        <CustomerDetailModal
          customerId={selectedCustomerId}
          onClose={() => setSelectedCustomerId(null)}
          onBlockToggled={fetchCustomers}
        />
      )}
    </div>
  );
}
