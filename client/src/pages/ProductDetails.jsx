import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Truck, RotateCcw, ShieldCheck, ShoppingCart, Star, Heart } from 'lucide-react';
import apiClient from '../services/apiClient';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';

export default function ProductDetails() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addItemToCart } = useCart();
  const { toggleWishlistItem, isInWishlist } = useWishlist();
  const { user } = useAuth();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data } = await apiClient.get(`/products/slug/${slug}`);
        setProduct(data.data.product);
        setActiveImage(data.data.product.images[0]);
        setSelectedSize(data.data.product.sizes[0]);
      } catch (error) {
        console.error('Failed to load product details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [slug]);

  const handleAddToCart = async () => {
    if (!selectedSize) return alert('Please select a size first.');
    setAdding(true);
    
    const colorName = product.colors?.[0]?.name || 'Standard';
    const colorHex = product.colors?.[0]?.hex || '#000000';
    
    await addItemToCart(product._id, 1, selectedSize, colorName, colorHex);
    
    setTimeout(() => setAdding(false), 500);
  };

  const handleToggleWishlist = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    toggleWishlistItem(product._id);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-black flex items-center justify-center text-brand-accentNeon font-display uppercase tracking-widest font-bold">
        Loading Artifact...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-brand-black flex items-center justify-center text-white flex-col gap-4">
        <h2 className="font-display text-4xl font-black uppercase">Artifact Not Found</h2>
        <Link to="/shop" className="text-brand-accentNeon underline">Return to Shop</Link>
      </div>
    );
  }

  const activePrice = product.discountPrice || product.price;

  return (
    <div className="w-full min-h-screen bg-brand-black pt-28 pb-20 px-4 md:px-8 text-white">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
        
        {/* Left Column: Image Gallery Matrix */}
        <div className="flex flex-col-reverse md:flex-row gap-4 h-fit">
          {/* Thumbnail Strip */}
          <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto md:w-20 lg:w-24 shrink-0 no-scrollbar">
            {product.images?.map((img, idx) => (
              <button 
                key={idx} 
                onClick={() => setActiveImage(img)}
                className={`w-16 md:w-full aspect-[3/4] bg-neutral-900 rounded-lg overflow-hidden border transition-all ${activeImage === img ? 'border-brand-accentNeon opacity-100' : 'border-white/10 opacity-50 hover:opacity-100'}`}
              >
                <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>

          {/* Main Active Image Window */}
          <div className="flex-1 w-full aspect-[3/4] bg-neutral-900 rounded-2xl overflow-hidden border border-white/5 relative">
            <img 
              src={activeImage} 
              alt={product.name} 
              className="w-full h-full object-cover"
            />
            {product.discountPrice && (
              <span className="absolute top-4 left-4 bg-brand-accentNeon text-black font-black text-[10px] px-3 py-1.5 rounded uppercase tracking-widest">
                SALE
              </span>
            )}
          </div>
        </div>

        {/* Right Column: Product Metadata & Purchasing Controls */}
        <div className="flex flex-col justify-center">
          <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-neutral-500 mb-2">
            {product.brand} // {product.category?.name || 'Core'}
          </span>
          <h1 className="font-display font-black text-4xl lg:text-5xl uppercase tracking-tighter mb-4">
            {product.name}
          </h1>
          
          {/* Pricing & Ratings */}
          <div className="flex items-center gap-6 mb-6">
            <div className="flex items-end gap-2">
              <span className="text-3xl font-black font-sans text-white">${activePrice.toFixed(2)}</span>
              {product.discountPrice && (
                <span className="text-neutral-500 font-sans line-through text-sm mb-1">${product.price.toFixed(2)}</span>
              )}
            </div>
            
            <div className="h-6 w-px bg-white/10"></div>
            
            <div className="flex items-center gap-2">
              <Star size={16} className="text-brand-accentNeon fill-brand-accentNeon" />
              <span className="text-sm font-bold">{product.ratingsAverage}</span>
              <span className="text-xs text-neutral-500">({product.ratingsQuantity} Reviews)</span>
            </div>
          </div>

          <p className="text-neutral-400 text-sm leading-relaxed font-light mb-8">
            {product.description}
          </p>

          {/* Size Selector */}
          <div className="mb-8">
            <div className="flex justify-between items-center text-[10px] font-bold tracking-wider uppercase text-neutral-400 mb-3">
              <span>Select Structural Size</span>
              <button className="text-white hover:text-brand-accentNeon transition-colors border-b border-white hover:border-brand-accentNeon">Size Guide</button>
            </div>
            <div className="grid grid-cols-4 gap-2 lg:gap-3">
              {product.sizes.map(s => (
                <button 
                  key={s} 
                  onClick={() => setSelectedSize(s)}
                  className={`py-3 rounded-lg text-xs font-bold transition-all uppercase border ${selectedSize === s ? 'bg-brand-accentNeon text-black border-brand-accentNeon' : 'bg-transparent border-white/10 text-neutral-300 hover:border-white/40 hover:text-white'}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Add to Cart + Wishlist Command Row */}
          <div className="flex items-stretch gap-3">
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0 || adding}
              className={`flex-1 py-4 rounded-lg font-display font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 transition-all ${product.stock === 0 ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed' : adding ? 'bg-white text-black' : 'btn-primary'}`}
            >
              <ShoppingCart size={18} />
              {product.stock === 0 ? 'Out of Stock' : adding ? 'Adding to Bag...' : 'Add to Bag'}
            </button>
            <button
              onClick={handleToggleWishlist}
              aria-label={isInWishlist(product._id) ? 'Remove from wishlist' : 'Add to wishlist'}
              className={`shrink-0 w-14 rounded-lg border flex items-center justify-center transition-all ${isInWishlist(product._id) ? 'border-red-500 bg-red-500/10' : 'border-white/10 hover:border-white/30'}`}
            >
              <Heart size={20} className={isInWishlist(product._id) ? 'text-red-500 fill-red-500' : 'text-white'} />
            </button>
          </div>

          <p className={`mt-3 text-center text-xs font-bold ${product.stock > 0 && product.stock <= 5 ? 'text-amber-500' : 'text-neutral-500'}`}>
            {product.stock > 0 && product.stock <= 5 ? `Only ${product.stock} units remaining.` : product.stock > 5 ? 'In Stock & Ready to Ship.' : ''}
          </p>

          {/* Brand Guarantees Deck */}
          <div className="border-t border-white/10 mt-8 pt-8 grid grid-cols-1 gap-4 text-xs text-neutral-400 font-sans">
            <div className="flex items-center gap-4">
              <Truck size={18} className="text-white" /> 
              <span>Express worldwide shipping available at checkout.</span>
            </div>
            <div className="flex items-center gap-4">
              <RotateCcw size={18} className="text-white" /> 
              <span>30-day hassle-free return policy.</span>
            </div>
            <div className="flex items-center gap-4">
              <ShieldCheck size={18} className="text-white" /> 
              <span>Secure, encrypted payment gateways.</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}