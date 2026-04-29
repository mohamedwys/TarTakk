import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import * as cartService from '@/lib/services/cartService';
import type { CartContextValue, CartItem } from './types';

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user?._id) {
      setItems([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const fetched = await cartService.fetchCartItems(user._id);
      setItems(fetched);
    } catch (err: any) {
      console.error('[CartContext] refresh failed:', err);
      setError(err?.message ?? 'Failed to load cart');
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [user?._id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addItem = useCallback(async (productId: string, quantity: number = 1) => {
    if (!user?._id) {
      return { success: false, error: 'User not logged in' };
    }
    try {
      await cartService.addToCart(user._id, productId, quantity);
      await refresh();
      return { success: true };
    } catch (err: any) {
      console.error('[CartContext] addItem failed:', err);
      return { success: false, error: err?.message ?? 'Failed to add to cart' };
    }
  }, [user?._id, refresh]);

  const updateQuantity = useCallback(async (productId: string, quantity: number) => {
    if (!user?._id) {
      return { success: false, error: 'User not logged in' };
    }
    try {
      await cartService.updateCartItemQuantity(user._id, productId, quantity);
      await refresh();
      return { success: true };
    } catch (err: any) {
      console.error('[CartContext] updateQuantity failed:', err);
      return { success: false, error: err?.message ?? 'Failed to update quantity' };
    }
  }, [user?._id, refresh]);

  const removeItem = useCallback(async (productId: string) => {
    if (!user?._id) {
      return { success: false, error: 'User not logged in' };
    }
    try {
      await cartService.removeCartItem(user._id, productId);
      await refresh();
      return { success: true };
    } catch (err: any) {
      console.error('[CartContext] removeItem failed:', err);
      return { success: false, error: err?.message ?? 'Failed to remove item' };
    }
  }, [user?._id, refresh]);

  const clearCart = useCallback(async () => {
    if (!user?._id) {
      return { success: false, error: 'User not logged in' };
    }
    try {
      await cartService.clearUserCart(user._id);
      await refresh();
      return { success: true };
    } catch (err: any) {
      console.error('[CartContext] clearCart failed:', err);
      return { success: false, error: err?.message ?? 'Failed to clear cart' };
    }
  }, [user?._id, refresh]);

  const totalItems = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const totalAmount = useMemo(
    () => items.reduce((sum, item) => {
      const price = item.product?.price ?? 0;
      return sum + (price * item.quantity);
    }, 0),
    [items]
  );

  const isEmpty = items.length === 0;

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      isLoading,
      error,
      refresh,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      totalItems,
      totalAmount,
      isEmpty,
    }),
    [items, isLoading, error, refresh, addItem, updateQuantity, removeItem, clearCart, totalItems, totalAmount, isEmpty]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return ctx;
}
