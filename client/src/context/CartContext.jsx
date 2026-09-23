import { createContext, useContext, useReducer } from 'react';
import { useUser } from './UserContext';
import { getCartItemUnitPrice } from '../utils/pricing';

const CartContext = createContext();

const initialState = {
  items: JSON.parse(localStorage.getItem('cart') || '[]'),
};

export function cartItemKey(item) {
  return [
    item.id,
    item.size || '',
    item.printNumber || '',
    item.printName || '',
  ].join('|');
}

function sameCartItem(a, b) {
  return cartItemKey(a) === cartItemKey(b);
}

function cartReducer(state, action) {
  let newItems;

  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.items.find((item) => sameCartItem(item, action.payload));
      if (existing) {
        newItems = state.items.map((item) =>
          sameCartItem(item, action.payload)
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        newItems = [...state.items, { ...action.payload, quantity: 1 }];
      }
      break;
    }
    case 'REMOVE_ITEM':
      newItems = state.items.filter((item) => !sameCartItem(item, action.payload));
      break;
    case 'UPDATE_QUANTITY':
      newItems = state.items.map((item) =>
        sameCartItem(item, action.payload)
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
  const { user } = useUser();
  const isMember = !!user;

  const addItem = (product, size, extras = {}) => {
    const baseGuest = Number(extras.basePriceGuest ?? extras.basePrice ?? product.price) || 0;
    const baseMember =
      extras.basePriceMember != null && extras.basePriceMember !== ''
        ? Number(extras.basePriceMember)
        : baseGuest;
    const printNumberPrice = extras.printNumberPrice || 0;
    const printNamePrice = extras.printNamePrice || 0;
    const unitPrice = getCartItemUnitPrice(
      {
        basePriceGuest: baseGuest,
        basePriceMember: baseMember,
        printNumberPrice,
        printNamePrice,
      },
      isMember
    );

    dispatch({
      type: 'ADD_ITEM',
      payload: {
        ...product,
        price: unitPrice,
        size,
        printNumber: extras.printNumber || '',
        printName: extras.printName || '',
        printNumberEnabled: !!extras.printNumberEnabled,
        printNameEnabled: !!extras.printNameEnabled,
        basePrice: baseGuest,
        basePriceGuest: baseGuest,
        basePriceMember: baseMember,
        printNumberPrice,
        printNamePrice,
      },
    });
  };

  const removeItem = (item) => {
    dispatch({ type: 'REMOVE_ITEM', payload: item });
  };

  const updateQuantity = (item, quantity) => {
    if (quantity <= 0) {
      removeItem(item);
      return;
    }
    dispatch({ type: 'UPDATE_QUANTITY', payload: { ...item, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = state.items.reduce(
    (sum, item) => sum + getCartItemUnitPrice(item, isMember) * item.quantity,
    0
  );

  const getItemPrice = (item) => getCartItemUnitPrice(item, isMember);

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
        getItemPrice,
        isMember,
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
