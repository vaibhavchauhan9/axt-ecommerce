import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Truck, ShieldCheck, ArrowRight, Wallet } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/apiClient';

export default function Checkout() {
  const { cart, cartTotalAmount, fetchCartState } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [shippingAddress, setShippingAddress] = useState({
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'United States',
  });
  const [paymentMethod, setPaymentMethod] = useState('STRIPE');
  const [isProcessing, setIsProcessing] = useState(false);
  const [summary, setSummary] = useState({ subtotal: 0, tax: 0, shipping: 0, total: 0 });

  // Compute final costs based on cart
  useEffect(() => {
    if (cart.items?.length > 0) {
      const sub = cartTotalAmount;
      const ship = sub > 100 ? 0 : 15;
      const taxAmount = sub * 0.18;
      setSummary({
        subtotal: sub,
        shipping: ship,
        tax: taxAmount,
        total: sub + ship + taxAmount,
      });
    } else {
      navigate('/shop');
    }
  }, [cart, cartTotalAmount, navigate]);

  const handleInputChange = (e) => {
    setShippingAddress({ ...shippingAddress, [e.target.name]: e.target.value });
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      // 1. Create the base order in the database
      const { data: orderData } = await apiClient.post('/orders', {
        shippingAddress,
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
              <h2 className="text-sm font-display font-bold uppercase tracking-wider mb-6 flex items-center gap-2">
                <Truck size={18} className="text-brand-accentNeon" /> Shipping Coordinates
              </h2>
              
              <form className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest block mb-2">Street Address</label>
                  <input type="text" name="street" required value={shippingAddress.street} onChange={handleInputChange} className="w-full bg-neutral-900/50 border border-white/10 rounded-lg py-3 px-4 focus:outline-none focus:border-brand-accentNeon" />
                </div>
                <div>
                  <label className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest block mb-2">City</label>
                  <input type="text" name="city" required value={shippingAddress.city} onChange={handleInputChange} className="w-full bg-neutral-900/50 border border-white/10 rounded-lg py-3 px-4 focus:outline-none focus:border-brand-accentNeon" />
                </div>
                <div>
                  <label className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest block mb-2">State / Province</label>
                  <input type="text" name="state" required value={shippingAddress.state} onChange={handleInputChange} className="w-full bg-neutral-900/50 border border-white/10 rounded-lg py-3 px-4 focus:outline-none focus:border-brand-accentNeon" />
                </div>
                <div>
                  <label className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest block mb-2">Postal Code</label>
                  <input type="text" name="postalCode" required value={shippingAddress.postalCode} onChange={handleInputChange} className="w-full bg-neutral-900/50 border border-white/10 rounded-lg py-3 px-4 focus:outline-none focus:border-brand-accentNeon" />
                </div>
                <div>
                  <label className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest block mb-2">Country</label>
                  <input type="text" name="country" required value={shippingAddress.country} onChange={handleInputChange} className="w-full bg-neutral-900/50 border border-white/10 rounded-lg py-3 px-4 focus:outline-none focus:border-brand-accentNeon" />
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
                {cart.items?.map((item) => (
                  <div key={item._id} className="flex gap-4 items-center">
                    <img src={item.product?.images?.[0]} alt="Pic" className="w-12 h-16 object-cover rounded-md border border-white/10" />
                    <div className="flex-1">
                      <h4 className="text-xs font-bold uppercase text-white line-clamp-1">{item.product?.name || 'Product unavailable'}</h4>
                      <p className="text-[10px] text-neutral-500">Qty: {item.quantity} | Size: {item.size}</p>
                    </div>
                    <span className="text-xs font-bold text-white">${((item.product?.discountPrice ?? item.product?.price ?? 0) * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-white/10 pt-4 flex flex-col gap-3 text-xs text-neutral-400 mb-6">
                <div className="flex justify-between"><span>Subtotal</span><span className="text-white">${summary.subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Shipping</span><span className="text-white">${summary.shipping === 0 ? 'FREE' : summary.shipping.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Taxes (18%)</span><span className="text-white">${summary.tax.toFixed(2)}</span></div>
                <div className="flex justify-between items-center border-t border-white/5 pt-3 mt-1">
                  <span className="text-sm font-bold text-white uppercase">Final Total</span>
                  <span className="text-lg font-black text-brand-accentNeon">${summary.total.toFixed(2)}</span>
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