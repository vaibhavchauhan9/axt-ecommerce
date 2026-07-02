import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../services/apiClient';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({ items: [] });
  const [cartLoading, setCartLoading] = useState(false);
  const { user } = useAuth();

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
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Inventory cart insertion block failed.'
      };
    }
  };

  const updateItemQuantity = async (itemId, quantity) => {
    try {
      const { data } = await apiClient.patch(`/cart/${itemId}`, { quantity });
      setCart(data.data.cart);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update quantity.'
      };
    }
  };

  const removeItemFromCart = async (itemId) => {
    try {
      const { data } = await apiClient.delete(`/cart/${itemId}`);
      setCart(data.data.cart);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Item deletion failed.'
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