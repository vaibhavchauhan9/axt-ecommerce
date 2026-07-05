import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../services/apiClient';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({ items: [], coupon: null });
  const [cartLoading, setCartLoading] = useState(false);
  const [couponLoading, setCouponLoading] = useState(false);
  const { user } = useAuth();
  const { showToast } = useToast();

  // Load backend cart state whenever a valid user session starts running
  useEffect(() => {
    if (user) {
      fetchCartState();
    } else {
      setCart({ items: [], coupon: null }); // Flush localized parameters on session logs out
    }
  }, [user]);

  const fetchCartState = async () => {
    setCartLoading(true);
    try {
      const { data } = await apiClient.get('/cart');
      setCart(data.data.cart);
    } catch (error) {
      console.error('[Cart Context Error] Pipeline extraction failed.');
    } finally {
      setCartLoading(false);
    }
  };

  const addItemToCart = async (productId, quantity, size, colorName, colorHex) => {
    try {
      const { data } = await apiClient.post('/cart', {
        productId,
        quantity,
        size,
        colorName,
        colorHex
      });
      setCart(data.data.cart);
      showToast('Added to bag.', 'success');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Inventory cart insertion block failed.';
      showToast(message, 'error');
      return {
        success: false,
        message
      };
    }
  };

  const updateItemQuantity = async (itemId, quantity) => {
    try {
      const { data } = await apiClient.patch(`/cart/${itemId}`, { quantity });
      setCart(data.data.cart);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update quantity.';
      showToast(message, 'error');
      return {
        success: false,
        message
      };
    }
  };

  const removeItemFromCart = async (itemId) => {
    try {
      const { data } = await apiClient.delete(`/cart/${itemId}`);
      setCart(data.data.cart);
      showToast('Item removed from bag.', 'info');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Item deletion failed.';
      showToast(message, 'error');
      return {
        success: false,
        message
      };
    }
  };

  // NEW: Save for Later
  const saveForLater = async (itemId) => {
    try {
      const { data } = await apiClient.patch(`/cart/${itemId}/save-for-later`);
      setCart(data.data.cart);
      showToast('Saved for later.', 'info');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to save item for later.';
      showToast(message, 'error');
      return { success: false, message };
    }
  };

  const moveToCart = async (itemId) => {
    try {
      const { data } = await apiClient.patch(`/cart/${itemId}/move-to-cart`);
      setCart(data.data.cart);
      showToast('Moved to bag.', 'success');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to move item to bag.';
      showToast(message, 'error');
      return { success: false, message };
    }
  };

  // NEW: Coupon handling
  const applyCoupon = async (code) => {
    setCouponLoading(true);
    try {
      const { data } = await apiClient.post('/cart/apply-coupon', { code });
      setCart(data.data.cart);
      showToast('Coupon applied!', 'success');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Invalid or expired coupon.';
      showToast(message, 'error');
      return { success: false, message };
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = async () => {
    try {
      const { data } = await apiClient.delete('/cart/coupon');
      setCart(data.data.cart);
      showToast('Coupon removed.', 'info');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to remove coupon.';
      showToast(message, 'error');
      return { success: false, message };
    }
  };

  // Only active (not saved-for-later) items count toward cart totals
  const activeItems = cart.items.filter((item) => !item.savedForLater);
  const savedItems = cart.items.filter((item) => item.savedForLater);

  const cartTotalAmount = activeItems.reduce((total, item) => {
    const itemPrice = item.product?.discountPrice || item.product?.price || 0;
    return total + itemPrice * item.quantity;
  }, 0);

  const cartItemCount = activeItems.reduce((count, item) => count + item.quantity, 0);
  const discountAmount = cart.coupon?.discountAmount || 0;

  return (
    <CartContext.Provider
      value={{
        cart,
        activeItems,
        savedItems,
        cartLoading,
        couponLoading,
        addItemToCart,
        updateItemQuantity,
        removeItemFromCart,
        saveForLater,
        moveToCart,
        applyCoupon,
        removeCoupon,
        fetchCartState,
        cartTotalAmount,
        cartItemCount,
        discountAmount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart executed outside structural CartProvider boundary bounds.');
  return context;
};
