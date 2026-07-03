import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../services/apiClient';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({ items: [] });
  const [cartLoading, setCartLoading] = useState(false);
  const { user } = useAuth();
  const { showToast } = useToast();

  // Load backend cart state whenever a valid user session starts running
  useEffect(() => {
    if (user) {
      fetchCartState();
    } else {
      setCart({ items: [] }); // Flush localized parameters on session logs out
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

  // Computes active price parameters and counts dynamically
  const cartTotalAmount = cart.items.reduce((total, item) => {
    const itemPrice = item.product?.discountPrice || item.product?.price || 0;
    return total + itemPrice * item.quantity;
  }, 0);

  const cartItemCount = cart.items.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, cartLoading, addItemToCart, updateItemQuantity, removeItemFromCart, fetchCartState, cartTotalAmount, cartItemCount }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart executed outside structural CartProvider boundary bounds.');
  return context;
};
