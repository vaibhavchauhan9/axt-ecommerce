import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, ArrowLeft } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function Cart() {
  const { cart, cartLoading, cartTotalAmount, updateItemQuantity, removeItemFromCart } = useCart();
  const navigate = useNavigate();

  const items = cart.items || [];
  const isEmpty = items.length === 0;

  const handleQtyChange = (item, delta) => {
    const nextQty = item.quantity + delta;
    if (nextQty < 1) return;
    if (item.product?.stock && nextQty > item.product.stock) return;
    updateItemQuantity(item._id, nextQty);
  };

  const shippingEstimate = cartTotalAmount > 0 && cartTotalAmount < 75 ? 6.99 : 0;
  const orderTotal = cartTotalAmount + shippingEstimate;

  if (cartLoading && isEmpty) {
    return (
      <div className="min-h-screen bg-brand-black flex items-center justify-center text-brand-accentNeon font-display uppercase tracking-widest font-bold">
        Loading Your Bag...
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="min-h-screen bg-brand-black flex flex-col items-center justify-center px-4 text-center gap-6">
        <ShoppingBag size={64} className="text-neutral-700" />
        <h1 className="font-display font-black text-2xl md:text-3xl uppercase tracking-wider text-white">
          Your Bag Is Empty
        </h1>
        <p className="text-neutral-500 text-sm max-w-sm">
          Looks like you haven't added anything yet. Browse the collection and find something that matches your attitude.
        </p>
        <Link
          to="/shop"
          className="btn-primary inline-flex items-center gap-2 px-8 py-3"
        >
          Start Shopping <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-brand-black pt-28 pb-20 px-4 md:px-8 text-white">
      <div className="max-w-6xl mx-auto">

        <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
          <h1 className="font-display font-black text-2xl md:text-4xl uppercase tracking-wider">
            Your Bag
          </h1>
          <Link to="/shop" className="text-xs font-bold uppercase tracking-widest text-neutral-400 hover:text-brand-accentNeon flex items-center gap-2 transition-colors">
            <ArrowLeft size={14} /> Continue Shopping
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Items List */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {items.map((item) => {
              const price = item.product?.discountPrice || item.product?.price || 0;
              const lineTotal = price * item.quantity;
              const outOfStock = !item.product || item.product.stock === 0;

              return (
                <div
                  key={item._id}
                  className="glass-card p-4 md:p-5 border border-white/5 flex flex-col sm:flex-row gap-4"
                >
                  <img
                    src={item.product?.images?.[0]}
                    alt={item.product?.name}
                    className="w-full sm:w-24 h-40 sm:h-28 object-cover rounded-lg border border-white/10 shrink-0"
                  />

                  <div className="flex-1 flex flex-col sm:flex-row justify-between gap-4 min-w-0">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm uppercase text-white line-clamp-1">
                        {item.product?.name || 'Product unavailable'}
                      </h3>
                      <p className="text-[11px] text-neutral-400 mt-1">
                        Size: {item.size} &nbsp;|&nbsp; Color: {item.color?.name}
                      </p>
                      {outOfStock ? (
                        <p className="text-[11px] font-bold text-red-400 mt-2 uppercase tracking-wide">Out of Stock</p>
                      ) : (
                        <p className="text-brand-accentNeon font-bold text-sm mt-2">₹{price.toFixed(2)}</p>
                      )}

                      {/* Quantity Stepper */}
                      <div className="flex items-center border border-white/10 rounded-lg overflow-hidden w-fit mt-3">
                        <button
                          onClick={() => handleQtyChange(item, -1)}
                          disabled={item.quantity <= 1}
                          className="p-2 text-neutral-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="px-4 text-sm font-bold text-white min-w-[2rem] text-center">{item.quantity}</span>
                        <button
                          onClick={() => handleQtyChange(item, 1)}
                          disabled={item.product?.stock ? item.quantity >= item.product.stock : false}
                          className="p-2 text-neutral-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-between gap-3">
                      <span className="font-black text-base text-white">₹{lineTotal.toFixed(2)}</span>
                      <button
                        onClick={() => removeItemFromCart(item._id)}
                        className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-neutral-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={14} /> Remove
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="glass-card p-6 border border-white/5 sticky top-24 flex flex-col gap-4">
              <h2 className="font-display font-black text-sm uppercase tracking-widest text-brand-accentNeon mb-2">
                Order Summary
              </h2>

              <div className="flex justify-between text-sm text-neutral-300">
                <span>Subtotal ({items.reduce((c, i) => c + i.quantity, 0)} items)</span>
                <span className="font-bold text-white">₹{cartTotalAmount.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-sm text-neutral-300">
                <span>Shipping</span>
                <span className="font-bold text-white">
                  {shippingEstimate === 0 ? 'Free' : `₹${shippingEstimate.toFixed(2)}`}
                </span>
              </div>

              {shippingEstimate > 0 && (
                <p className="text-[10px] text-neutral-500">
                  Add ₹{(75 - cartTotalAmount).toFixed(2)} more to unlock free shipping.
                </p>
              )}

              <div className="h-px bg-white/10 my-2"></div>

              <div className="flex justify-between text-base">
                <span className="font-bold uppercase tracking-wide">Total</span>
                <span className="font-black text-brand-accentNeon">₹{orderTotal.toFixed(2)}</span>
              </div>

              <button
                onClick={() => navigate('/checkout')}
                className="w-full btn-primary flex items-center justify-center gap-2 mt-4"
              >
                Proceed to Checkout <ArrowRight size={16} />
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}