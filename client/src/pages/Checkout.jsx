import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Truck, ShieldCheck, ArrowRight, Wallet, Tag, X, Lock } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/apiClient';
import AddressAutocomplete from '../components/common/AddressAutocomplete';

const FIXED_STATE = 'Uttar Pradesh';
const FIXED_COUNTRY = 'India';

export default function Checkout() {
  const { cart, activeItems, cartTotalAmount, discountAmount, applyCoupon, removeCoupon, couponLoading, fetchCartState } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [shippingAddress, setShippingAddress] = useState({
    street: '',
    city: '',
    state: FIXED_STATE,
    postalCode: '',
    country: FIXED_COUNTRY,
  });
  const [paymentMethod, setPaymentMethod] = useState('STRIPE');
  const [isProcessing, setIsProcessing] = useState(false);
  const [summary, setSummary] = useState({ subtotal: 0, discount: 0, tax: 0, shipping: 0, total: 0 });
  const [couponInput, setCouponInput] = useState('');
  const [mapNotice, setMapNotice] = useState('');

  // Compute final costs based on cart (subtotal, coupon discount, shipping, tax)
  useEffect(() => {
    if (activeItems.length > 0) {
      const sub = cartTotalAmount;
      const discountedSub = Math.max(sub - discountAmount, 0);
      const ship = discountedSub > 100 ? 0 : 15;
      const taxAmount = discountedSub * 0.18;
      setSummary({
        subtotal: sub,
        discount: discountAmount,
        shipping: ship,
        tax: taxAmount,
        total: discountedSub + ship + taxAmount,
      });
    } else {
      navigate('/shop');
    }
  }, [activeItems, cartTotalAmount, discountAmount, navigate]);

  const handleInputChange = (e) => {
    setShippingAddress({ ...shippingAddress, [e.target.name]: e.target.value });
  };

  const handleAddressResolved = ({ street, city, postalCode }) => {
    setShippingAddress((prev) => ({
      ...prev,
      street: street || prev.street,
      city: city || prev.city,
      postalCode: postalCode || prev.postalCode,
      // state/country are never touched here — they're permanently fixed below
    }));
    setMapNotice('');
  };

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    const result = await applyCoupon(couponInput.trim());
    if (result.success) setCouponInput('');
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      // 1. Create the base order in the database
      // (the server enforces state=Uttar Pradesh / country=India and re-validates any
      // applied coupon — the client-side "summary" above is just a preview)
      const { data: orderData } = await apiClient.post('/orders', {
        shippingAddress: { ...shippingAddress, state: FIXED_STATE, country: FIXED_COUNTRY },
        paymentMethod,
      });
      const orderId = orderData.data.order._id;

      // 2. Route to the correct Payment Gateway
      if (paymentMethod === 'STRIPE') {
        const { data: stripeData } = await apiClient.post('/payments/stripe/checkout-session', { orderId });
        window.location.href = stripeData.sessionUrl; // Redirect to Stripe Hosted Checkout
      } else if (paymentMethod === 'RAZORPAY') {
        const { data: rzpData } = await apiClient.post('/payments/razorpay/order', { orderId });
        // Razorpay frontend integration logic would trigger the SDK here
        alert(`Razorpay Order Created: ${rzpData.data.id} - Implement SDK to continue.`);
        setIsProcessing(false);
      } else {
        // Cash on Delivery
        await fetchCartState(); // Refresh cart to clear it locally
        navigate(`/profile?success=true`);
      }
    } catch (error) {
      console.error('Checkout processing failed:', error);
      alert(error.response?.data?.message || 'Transaction failed. Please verify your details.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-brand-black pt-28 pb-20 px-4 md:px-8 text-white">
      <div className="max-w-7xl mx-auto">
        <h1 className="font-display font-black text-3xl md:text-4xl uppercase tracking-tighter mb-8">
          Secure Checkout
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left Column: Logistics & Payment Forms */}
          <div className="lg:col-span-7 flex flex-col gap-8">
            
            {/* Logistics Form */}
            <div className="glass-card p-6 md:p-8 border border-white/5">
              <h2 className="text-sm font-display font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                <Truck size={18} className="text-brand-accentNeon" /> Shipping Coordinates
              </h2>
              <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold mb-6">
                We currently deliver only within Uttar Pradesh, India.
              </p>

              {/* Google Maps search + current-location fetch */}
              <AddressAutocomplete onResolved={handleAddressResolved} onError={setMapNotice} />
              {mapNotice && (
                <p className="text-[11px] text-amber-400 mb-3">{mapNotice}</p>
              )}
              
              <form className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-2">
                <div className="md:col-span-2">
                  <label className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest block mb-2">Street Address</label>
                  <input type="text" name="street" required value={shippingAddress.street} onChange={handleInputChange} className="w-full bg-neutral-900/50 border border-white/10 rounded-lg py-3 px-4 focus:outline-none focus:border-brand-accentNeon" />
                </div>
                <div>
                  <label className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest block mb-2">City</label>
                  <input type="text" name="city" required value={shippingAddress.city} onChange={handleInputChange} className="w-full bg-neutral-900/50 border border-white/10 rounded-lg py-3 px-4 focus:outline-none focus:border-brand-accentNeon" />
                </div>
                <div>
                  <label className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest flex items-center gap-1.5 mb-2">
                    State <Lock size={10} />
                  </label>
                  <input type="text" disabled value={FIXED_STATE} className="w-full bg-neutral-900/80 border border-white/5 text-neutral-400 rounded-lg py-3 px-4 cursor-not-allowed" />
                </div>
                <div>
                  <label className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest block mb-2">Postal Code</label>
                  <input type="text" name="postalCode" required value={shippingAddress.postalCode} onChange={handleInputChange} className="w-full bg-neutral-900/50 border border-white/10 rounded-lg py-3 px-4 focus:outline-none focus:border-brand-accentNeon" />
                </div>
                <div>
                  <label className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest flex items-center gap-1.5 mb-2">
                    Country <Lock size={10} />
                  </label>
                  <input type="text" disabled value={FIXED_COUNTRY} className="w-full bg-neutral-900/80 border border-white/5 text-neutral-400 rounded-lg py-3 px-4 cursor-not-allowed" />
                </div>
              </form>
            </div>

            {/* Payment Method Selection */}
            <div className="glass-card p-6 md:p-8 border border-white/5">
              <h2 className="text-sm font-display font-bold uppercase tracking-wider mb-6 flex items-center gap-2">
                <ShieldCheck size={18} className="text-brand-accentNeon" /> Payment Gateway
              </h2>
              
              <div className="flex flex-col gap-3">
                <label className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${paymentMethod === 'STRIPE' ? 'bg-brand-accentNeon/10 border-brand-accentNeon text-white' : 'bg-neutral-900/50 border-white/10 text-neutral-400 hover:border-white/30'}`}>
                  <input type="radio" name="paymentMethod" value="STRIPE" checked={paymentMethod === 'STRIPE'} onChange={(e) => setPaymentMethod(e.target.value)} className="hidden" />
                  <CreditCard size={20} className={paymentMethod === 'STRIPE' ? 'text-brand-accentNeon' : ''} />
                  <div>
                    <p className="font-bold uppercase text-xs">Credit / Debit Card (Stripe)</p>
                    <p className="text-[10px] mt-0.5">Global encrypted processing</p>
                  </div>
                </label>

                <label className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${paymentMethod === 'RAZORPAY' ? 'bg-brand-accentNeon/10 border-brand-accentNeon text-white' : 'bg-neutral-900/50 border-white/10 text-neutral-400 hover:border-white/30'}`}>
                  <input type="radio" name="paymentMethod" value="RAZORPAY" checked={paymentMethod === 'RAZORPAY'} onChange={(e) => setPaymentMethod(e.target.value)} className="hidden" />
                  <Wallet size={20} className={paymentMethod === 'RAZORPAY' ? 'text-brand-accentNeon' : ''} />
                  <div>
                    <p className="font-bold uppercase text-xs">UPI & NetBanking (Razorpay)</p>
                    <p className="text-[10px] mt-0.5">Optimized for regional routing</p>
                  </div>
                </label>

                <label className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${paymentMethod === 'COD' ? 'bg-brand-accentNeon/10 border-brand-accentNeon text-white' : 'bg-neutral-900/50 border-white/10 text-neutral-400 hover:border-white/30'}`}>
                  <input type="radio" name="paymentMethod" value="COD" checked={paymentMethod === 'COD'} onChange={(e) => setPaymentMethod(e.target.value)} className="hidden" />
                  <Truck size={20} className={paymentMethod === 'COD' ? 'text-brand-accentNeon' : ''} />
                  <div>
                    <p className="font-bold uppercase text-xs">Cash on Delivery</p>
                    <p className="text-[10px] mt-0.5">Pay physically upon receipt</p>
                  </div>
                </label>
              </div>
            </div>

          </div>

          {/* Right Column: Order Summary Deck */}
          <div className="lg:col-span-5">
            <div className="glass-card p-6 md:p-8 border border-white/5 sticky top-28">
              <h2 className="text-sm font-display font-bold uppercase tracking-wider mb-6">Order Matrix</h2>
              
              <div className="flex flex-col gap-4 mb-6 max-h-64 overflow-y-auto pr-2">
                {activeItems.map((item) => (
                  <div key={item._id} className="flex gap-4 items-center">
                    <img src={item.product?.images?.[0]} alt="Pic" className="w-12 h-16 object-cover rounded-md border border-white/10" />
                    <div className="flex-1">
                      <h4 className="text-xs font-bold uppercase text-white line-clamp-1">{item.product?.name || 'Product unavailable'}</h4>
                      <p className="text-[10px] text-neutral-500">Qty: {item.quantity} | Size: {item.size}</p>
                    </div>
                    <span className="text-xs font-bold text-white">₹{((item.product?.discountPrice || item.product?.price || 0) * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Coupon Box */}
              <div className="mb-6">
                {cart.coupon?.code ? (
                  <div className="flex items-center justify-between bg-white/5 border border-brand-accentNeon/30 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2 text-xs">
                      <Tag size={14} className="text-brand-accentNeon" />
                      <span className="font-bold text-white">{cart.coupon.code}</span>
                      <span className="text-neutral-400">applied</span>
                    </div>
                    <button onClick={removeCoupon} className="text-neutral-400 hover:text-red-400" type="button">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      placeholder="Have a coupon code?"
                      className="flex-1 bg-neutral-900/50 border border-white/10 rounded-lg py-3 px-4 text-xs uppercase tracking-wide text-white placeholder-neutral-500 focus:outline-none focus:border-brand-accentNeon"
                    />
                    <button
                      type="submit"
                      disabled={couponLoading || !couponInput.trim()}
                      className="px-4 text-[11px] font-bold uppercase tracking-widest bg-white/10 hover:bg-brand-accentNeon hover:text-black rounded-lg transition-colors disabled:opacity-40"
                    >
                      Apply
                    </button>
                  </form>
                )}
              </div>

              <div className="border-t border-white/10 pt-4 flex flex-col gap-3 text-xs text-neutral-400 mb-6">
                <div className="flex justify-between"><span>Subtotal</span><span className="text-white">₹{summary.subtotal.toFixed(2)}</span></div>
                {summary.discount > 0 && (
                  <div className="flex justify-between text-brand-accentNeon"><span>Coupon Discount</span><span>−₹{summary.discount.toFixed(2)}</span></div>
                )}
                <div className="flex justify-between"><span>Shipping</span><span className="text-white">{summary.shipping === 0 ? 'FREE' : `₹${summary.shipping.toFixed(2)}`}</span></div>
                <div className="flex justify-between"><span>Taxes (18%)</span><span className="text-white">₹{summary.tax.toFixed(2)}</span></div>
                <div className="flex justify-between items-center border-t border-white/5 pt-3 mt-1">
                  <span className="text-sm font-bold text-white uppercase">Final Total</span>
                  <span className="text-lg font-black text-brand-accentNeon">₹{summary.total.toFixed(2)}</span>
                </div>
              </div>

              <button 
                onClick={handlePlaceOrder}
                disabled={isProcessing || !shippingAddress.street}
                className="w-full btn-primary flex items-center justify-center gap-2"
              >
                {isProcessing ? 'Processing Transaction...' : 'Authorize Payment'} <ArrowRight size={16} />
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
