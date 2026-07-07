import logo from '../../assets/axt.png';
import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useUI } from '../../context/UIContext';

export default function SideMenu() {
  const { isSidebarOpen, toggleSidebar, toggleCartDrawer } = useUI();

  // Every button routed logically to our working build targets
  const menuItems = [
    { label: 'HOME', path: '/' },
    { label: 'ACCOUNT', path: '/profile' },
    { label: 'MY ORDERS', path: '/orders' },
    { label: 'WISHLIST', path: '/wishlist' },
    { label: 'MY CART', path: null, action: () => { toggleSidebar(); toggleCartDrawer(); } },
    { label: 'ABOUT US', path: '/about' },
    { label: 'SUPPORT', path: '/support' },
  ];

  return (
    <AnimatePresence>
      {isSidebarOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={toggleSidebar}
            className="fixed inset-0 bg-black z-50 cursor-pointer"
          />

          {/* Precise Side Bar Drawer Container */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.25 }}
            className="fixed top-0 left-0 h-screen w-[280px] bg-black z-50 flex flex-col border-r border-neutral-800 select-none text-white font-display"
          >
            {/* Upper Structural Block matching image header alignment */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-neutral-800 shrink-0 relative">
              
              {/* Center-aligned brand logo signature */}
             {/* Center-aligned brand logo signature */}
<div className="flex-1 flex justify-center pl-6">
  <img 
    src={logo} 
    alt="AXT Logo" 
    className="h-10 w-auto object-contain" 
  />
</div>

              {/* High Contrast Custom Red Close Trigger */}
              <button 
                onClick={toggleSidebar}
                className="w-6 h-6 rounded border border-white bg-transparent text-red-500 hover:text-red-400 transition-colors flex items-center justify-center p-0"
              >
                <X size={18} strokeWidth={3} className="text-red-600 scale-110" />
              </button>
            </div>

            {/* List Array Matrix Stack */}
            <nav className="flex flex-col w-full bg-black">
              {menuItems.map((item, idx) => {
                const buttonClasses = "w-full bg-black h-12 flex items-center justify-center font-black text-lg tracking-wider text-white border-b-4 border-neutral-800 hover:bg-neutral-900 transition-colors uppercase text-center";
                
                if (item.action) {
                  return (
                    <button key={idx} onClick={item.action} className={buttonClasses}>
                      {item.label}
                    </button>
                  );
                }

                return (
                  <Link 
                    key={idx} 
                    to={item.path} 
                    onClick={toggleSidebar}
                    className={buttonClasses}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
