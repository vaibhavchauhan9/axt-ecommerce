import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Trash2, ArrowRight, ShoppingBag } from 'lucide-react';
import { useUI } from '../../context/UIContext';
import { useCart } from '../../context/CartContext';

export default function CartDrawer() {
  const { cartDrawerOpen, toggleCartDrawer } = useUI();
  const { cart, removeItemFromCart, cartTotalAmount } = useCart();
  const navigate = useNavigate();

  if (!cartDrawerOpen) return null;

  const handleCheckout = () => {
    toggleCartDrawer();
    navigate('/checkout');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Dimmed Background Overlay */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={toggleCartDrawer} 
      />
      
      {/* Sliding Drawer Panel */}
      <div className="relative w-full max-w-md h-full bg-brand-black border-l border-white/10 flex flex-col shadow-2xl animate-[slideInRight_0.3s_ease-out]">
        
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="font-display font-black text-xl uppercase tracking-wider text-white">Your Bag</h2>
          <button onClick={toggleCartDrawer} className="text-neutral-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
          {(!cart.items || cart.items.length === 0) ? (
            <div className="h-full flex flex-col items-center justify-center text-neutral-500">
              <ShoppingBag size={48} className="mb-4 opacity-50" />
              <p className="font-display uppercase tracking-widest text-xs">Your bag is empty.</p>
            </div>
          ) : (
            cart.items.map((item) => (
              <div key={item._id} className="flex gap-4 items-center bg-neutral-900/50 p-3 rounded-xl border border-white/5">
                <img 
                  src={item.product?.images?.[0]} 
                  alt={item.product?.name || 'Product'} 
                  className="w-16 h-20 object-cover rounded-md border border-white/10"
                />
                <div className="flex-1">
                  <h4 className="text-xs font-bold uppercase text-white line-clamp-1">{item.product?.name || 'Product unavailable'}</h4>
                  <p className="text-[10px] text-neutral-400 mt-1">Size: {item.size} | Color: {item.color?.name}</p>
                  <p className="text-brand-accentNeon font-bold text-xs mt-1">
                    ${(item.product?.discountPrice ?? item.product?.price ?? 0).toFixed(2)} x {item.quantity}
                  </p>
                </div>
                <button 
                  onClick={() => removeItemFromCart(item._id)}
                  className="text-neutral-500 hover:text-red-500 transition-colors p-2"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Checkout Footer */}
        <div className="p-6 border-t border-white/10 bg-neutral-950">
          <div className="flex justify-between items-center mb-6">
            <span className="text-xs uppercase tracking-widest text-neutral-400">Subtotal</span>
            <span className="text-lg font-bold text-white">${cartTotalAmount.toFixed(2)}</span>
          </div>
          <button 
            onClick={handleCheckout}
            disabled={!cart.items || cart.items.length === 0}
            className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Checkout Securely <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}