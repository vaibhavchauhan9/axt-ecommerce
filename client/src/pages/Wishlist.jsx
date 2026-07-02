import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2, ArrowRight } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';

export default function Wishlist() {
  const { wishlist, wishlistLoading, toggleWishlistItem } = useWishlist();
  const { addItemToCart } = useCart();
  const [movingId, setMovingId] = useState(null);

  const handleMoveToCart = async (product) => {
    if (!product.sizes?.length) return;
    setMovingId(product._id);
    const colorName = product.colors?.[0]?.name || 'Standard';
    const colorHex = product.colors?.[0]?.hex || '#000000';
    await addItemToCart(product._id, 1, product.sizes[0], colorName, colorHex);
    await toggleWishlistItem(product._id);
    setMovingId(null);
  };

  if (wishlistLoading && wishlist.length === 0) {
    return (
      <div className="min-h-screen bg-brand-black flex items-center justify-center text-brand-accentNeon font-display uppercase tracking-widest font-bold">
        Loading Your Wishlist...
      </div>
    );
  }

  if (wishlist.length === 0) {
    return (
      <div className="min-h-screen bg-brand-black flex flex-col items-center justify-center px-4 text-center gap-6">
        <Heart size={64} className="text-neutral-700" />
        <h1 className="font-display font-black text-2xl md:text-3xl uppercase tracking-wider text-white">
          Your Wishlist Is Empty
        </h1>
        <p className="text-neutral-500 text-sm max-w-sm">
          Tap the heart icon on any product to save it here for later.
        </p>
        <Link to="/shop" className="btn-primary inline-flex items-center gap-2 px-8 py-3">
          Explore Products <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-brand-black pt-28 pb-20 px-4 md:px-8 text-white">
      <div className="max-w-6xl mx-auto">
        <h1 className="font-display font-black text-2xl md:text-4xl uppercase tracking-wider mb-8 flex items-center gap-3">
          <Heart className="text-brand-accentNeon fill-brand-accentNeon" /> Your Wishlist
        </h1>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {wishlist.map((product) => {
            const activePrice = product.discountPrice || product.price;
            const outOfStock = product.stock === 0;

            return (
              <div key={product._id} className="glass-card border border-white/5 overflow-hidden flex flex-col group">
                <Link to={`/product/${product.slug}`} className="relative w-full aspect-[3/4] bg-neutral-900 overflow-hidden block">
                  {product.images?.[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-700 font-display font-black text-2xl">AXT</div>
                  )}
                  {outOfStock && (
                    <span className="absolute top-2 left-2 bg-red-500/90 text-white text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded">
                      Out of Stock
                    </span>
                  )}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      toggleWishlistItem(product._id);
                    }}
                    className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm p-2 rounded-full text-red-500 hover:bg-black/80 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </Link>

                <div className="p-3 flex flex-col gap-2 flex-1">
                  <Link to={`/product/${product.slug}`}>
                    <h3 className="font-bold text-xs uppercase text-white line-clamp-1 hover:text-brand-accentNeon transition-colors">
                      {product.name}
                    </h3>
                  </Link>
                  <p className="text-[10px] text-neutral-500 uppercase tracking-widest">{product.brand}</p>
                  <span className="font-black text-sm text-brand-accentNeon">${activePrice?.toFixed(2)}</span>

                  <button
                    onClick={() => handleMoveToCart(product)}
                    disabled={outOfStock || movingId === product._id}
                    className="mt-auto w-full flex items-center justify-center gap-2 bg-white text-black text-[10px] font-black uppercase tracking-widest py-2.5 rounded-lg hover:bg-brand-accentNeon transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ShoppingCart size={12} />
                    {movingId === product._id ? 'Moving...' : outOfStock ? 'Unavailable' : 'Move to Bag'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}