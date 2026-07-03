import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';

export default function ProductCard({ product }) {
  const { addItemToCart } = useCart();
  const { toggleWishlistItem, isInWishlist } = useWishlist();
  const { user } = useAuth();
  const navigate = useNavigate();
  const activePrice = product.discountPrice || product.price;
  const saved = isInWishlist(product._id);

  const handleQuickAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }
    if (!product.sizes?.length) return;
    const colorName = product.colors?.[0]?.name || 'Standard';
    const colorHex = product.colors?.[0]?.hex || '#000000';
    addItemToCart(product._id, 1, product.sizes[0], colorName, colorHex);
  };

  const handleToggleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }
    toggleWishlistItem(product._id);
  };

  return (
    <Link
      to={`/product/${product.slug}`}
      className="group flex flex-col w-full bg-transparent transition-all duration-300 select-none"
    >
      {/* High-Contrast Image Container */}
      <div className="relative w-full aspect-[3/4] bg-[#e5e5e5] border-4 border-black overflow-hidden group-hover:border-[#FAB116] transition-colors">
        {product.images && product.images[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-black/20 font-display font-black text-4xl">AXT</div>
        )}

        {/* Badges */}
        {product.discountPrice && (
          <span className="absolute top-3 left-3 bg-[#FAB116] border-2 border-black text-black font-black text-[10px] px-2 py-1 uppercase tracking-widest drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
            SALE
          </span>
        )}

        {/* Wishlist Heart Toggle */}
        <button
          onClick={handleToggleWishlist}
          className="absolute top-3 right-3 z-10 bg-white/90 backdrop-blur-sm p-2 rounded-full border-2 border-black hover:scale-110 transition-transform"
          aria-label={saved ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart
            size={14}
            className={saved ? 'text-red-500 fill-red-500' : 'text-black'}
          />
        </button>

        {/* Quick Add Overlay */}
        <div className="absolute bottom-3 left-3 right-3 translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 z-10">
          <button
            onClick={handleQuickAdd}
            className="w-full bg-black text-white font-display font-black py-3 text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#FAB116] hover:text-black border-2 border-transparent hover:border-black transition-all"
          >
            <ShoppingCart size={14} /> Quick Add
          </button>
        </div>
      </div>

      {/* Bold Typography Meta Info */}
      <div className="pt-3 flex flex-col gap-1">
        <div className="flex justify-between items-start gap-2">
          <h3 className="font-display font-black text-sm text-black uppercase tracking-wide line-clamp-1 group-hover:text-[#FAB116] transition-colors">
            {product.name}
          </h3>
          <span className="text-sm font-black text-black whitespace-nowrap">
            ${activePrice.toFixed(2)}
          </span>
        </div>
        <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">{product.brand}</p>
      </div>
    </Link>
  );
}
