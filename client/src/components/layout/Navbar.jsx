import logo from '../../assets/axt.png'; // Ensure the filename matches yours perfectly
import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Heart, ShoppingCart, User } from 'lucide-react';
import { useUI } from '../../context/UIContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';

export default function Navbar() {
  const { toggleCartDrawer, toggleSidebar, toggleSearchBar } = useUI();
  const { cartItemCount } = useCart();
  const { wishlistCount } = useWishlist();

  return (
    <header className="w-full bg-black h-16 flex items-center px-4 md:px-6 border-b border-neutral-800 select-none z-50 fixed top-0 left-0">
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Left Side: Custom Menu Icon */}
        <button 
          onClick={toggleSidebar}
          className="text-white hover:text-neutral-400 transition-colors shrink-0 cursor-pointer"
        >
          <div className="flex flex-col gap-1 w-6">
            <span className="h-0.5 w-6 bg-white rounded-full"></span>
            <span className="h-0.5 w-6 bg-white rounded-full"></span>
            <span className="h-0.5 w-6 bg-white rounded-full"></span>
          </div>
        </button>

        {/* Center-Left: Actual Brand Identity Logo */}
        <Link to="/" className="shrink-0 flex items-center justify-center">
          <img 
            src={logo} 
            alt="AXT Logo" 
            className="h-10 w-auto object-contain drop-shadow-[0px_0px_4px_rgba(255,255,255,0.2)]" 
          />
        </Link>

        {/* Spacer pushes the icon deck to the right on all screen sizes */}
        <div className="flex-1" />

        {/* Right Side: Essential Icon Utility Deck */}
        <div className="flex items-center gap-4 md:gap-6 text-white shrink-0">
          {/* Search Icon - opens the full-screen SearchOverlay */}
          <button
            onClick={toggleSearchBar}
            className="hover:text-[#FAB116] transition-colors"
            aria-label="Search"
          >
            <Search size={22} strokeWidth={2} />
          </button>

          {/* Wishlist Heart Icon */}
          <Link to="/wishlist" className="hover:text-[#FAB116] transition-colors relative">
            <Heart size={22} strokeWidth={2} className={wishlistCount > 0 ? 'text-red-500 fill-red-500' : 'text-red-500 hover:fill-red-500 transition-all'} />
            {wishlistCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-[#FAB116] text-black font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center border border-black">
                {wishlistCount}
              </span>
            )}
          </Link>

          {/* Cart Icon with Dynamic Count Badge */}
          <button 
            onClick={toggleCartDrawer} 
            className="hover:text-[#FAB116] transition-colors relative"
          >
            <ShoppingCart size={22} strokeWidth={2} />
            {cartItemCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-[#FAB116] text-black font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center border border-black">
                {cartItemCount}
              </span>
            )}
          </button>

          {/* User Profile Gate */}
          <Link to="/profile" className="hover:text-[#FAB116] transition-colors">
            <User size={22} strokeWidth={2} />
          </Link>
        </div>

      </div>
    </header>
  );
}
