import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../services/apiClient';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const WishlistContext = createContext(null);

export const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const { user } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    if (user) {
      fetchWishlistState();
    } else {
      setWishlist([]); // Flush wishlist on logout
    }
  }, [user]);

  const fetchWishlistState = async () => {
    setWishlistLoading(true);
    try {
      const { data } = await apiClient.get('/users/wishlist');
      setWishlist(data.data.wishlist);
    } catch (error) {
      console.error('[Wishlist Context Error] Failed to load saved items.');
    } finally {
      setWishlistLoading(false);
    }
  };

  // Toggles a product in/out of the wishlist (single API call handles both cases)
  const toggleWishlistItem = async (productId) => {
    try {
      const { data } = await apiClient.post(`/users/wishlist/${productId}`);
      setWishlist(data.data.wishlist);
      showToast(data.inWishlist ? 'Saved to wishlist.' : 'Removed from wishlist.', 'success');
      return { success: true, inWishlist: data.inWishlist };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update wishlist.';
      showToast(message, 'error');
      return {
        success: false,
        message,
      };
    }
  };

  const isInWishlist = (productId) => wishlist.some((p) => p._id === productId);

  const wishlistCount = wishlist.length;

  return (
    <WishlistContext.Provider
      value={{ wishlist, wishlistLoading, toggleWishlistItem, isInWishlist, wishlistCount, fetchWishlistState }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) throw new Error('useWishlist executed outside structural WishlistProvider boundary bounds.');
  return context;
};
