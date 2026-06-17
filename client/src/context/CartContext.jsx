import { createContext, useContext, useReducer, useEffect } from 'react';

const CartContext = createContext();

const initialState = {
  items: JSON.parse(localStorage.getItem('cart') || '[]'),
};

function cartReducer(state, action) {
  let newItems;

  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.items.find(
        (item) => item.id === action.payload.id && item.size === action.payload.size
      );
      if (existing) {
        newItems = state.items.map((item) =>
          item.id === action.payload.id && item.size === action.payload.size
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        newItems = [...state.items, { ...action.payload, quantity: 1 }];
      }
      break;
    }
    case 'REMOVE_ITEM':
      newItems = state.items.filter(
        (item) => !(item.id === action.payload.id && item.size === action.payload.size)
      );
      break;
    case 'UPDATE_QUANTITY':
      newItems = state.items.map((item) =>
        item.id === action.payload.id && item.size === action.payload.size
          ? { ...item, quantity: action.payload.quantity }
          : item
      );
      break;
    case 'CLEAR_CART':
      newItems = [];
      break;
    default:
      return state;
  }

  localStorage.setItem('cart', JSON.stringify(newItems));
  return { ...state, items: newItems };
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  const addItem = (product, size) => {
    dispatch({ type: 'ADD_ITEM', payload: { ...product, size } });
  };

  const removeItem = (id, size) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { id, size } });
  };

  const updateQuantity = (id, size, quantity) => {
    if (quantity <= 0) {
      removeItem(id, size);
      return;
    }
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, size, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = state.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}
