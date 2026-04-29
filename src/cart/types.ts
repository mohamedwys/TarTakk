export type CartItem = {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  updated_at: string;

  product?: {
    id: string;
    title: string;
    title_ar?: string | null;
    price: number;
    currency: string;
    thumbnail_url: string | null;
    images: string[] | null;
    stock_qty: number;
    listing_type: 'B2B' | 'B2C' | 'C2C';
    seller_id: string;
  };
};

export type CartState = {
  items: CartItem[];
  isLoading: boolean;
  error: string | null;
};

export type CartContextValue = CartState & {
  refresh: () => Promise<void>;
  addItem: (productId: string, quantity?: number) => Promise<{ success: boolean; error?: string }>;
  updateQuantity: (productId: string, quantity: number) => Promise<{ success: boolean; error?: string }>;
  removeItem: (productId: string) => Promise<{ success: boolean; error?: string }>;
  clearCart: () => Promise<{ success: boolean; error?: string }>;

  totalItems: number;
  totalAmount: number;
  isEmpty: boolean;
};
