// import React, { createContext, useState } from 'react';

// export const CartContext = createContext();

// const CartProvider = ({ children }) => {
//   const [cartItems, setCartItems] = useState([]);

//   const addToCart = (product, quantity) => {
//     const existingItem = cartItems.find((item) => item.id === product.id);
//     if (existingItem) {
//       // If item already exists in cart, update its quantity
//       const updatedItem = { ...existingItem, quantity };
//       const updatedItems = cartItems.map((item) => (item.id === existingItem.id ? updatedItem : item));
//       setCartItems(updatedItems);
//     } else {
//       // If item doesn't exist in cart, add it to the cart with the given quantity
//       const newItem = { ...product, quantity };
//       setCartItems([...cartItems, newItem]);
//     }
//   };
//   const addOneToCart = (product) => {
//     const existingItemIndex = cartItems.findIndex((item) => item.id === product.id);
//     if (existingItemIndex !== -1) {
//       // If item already exists in cart, increment its quantity
//       const updatedItems = [...cartItems];
//       updatedItems[existingItemIndex].quantity += 1;
//       setCartItems(updatedItems);
//     } else {
//       // If item doesn't exist in cart, add it to the cart with a quantity of 1
//       const newItem = { ...product, quantity: 1 };
//       setCartItems([...cartItems, newItem]);
//     }
//   };
//   const removeFromCart = (item) => {
//     const existingItemIndex = cartItems.findIndex((cartItem) => cartItem.id === item.id);
    
//     // Check if the item exists in the cart
//     if (existingItemIndex === -1) {
//       return; // Item not found, do nothing
//     }
  
//     const existingItem = cartItems[existingItemIndex];
//     let updatedCartItems;
  
//     if (existingItem.quantity <= 1) {
//       updatedCartItems = cartItems.filter((cartItem) => cartItem.id !== item.id);
//     } else {
//       updatedCartItems = [...cartItems];
//       updatedCartItems[existingItemIndex] = {
//         ...existingItem,
//         quantity: existingItem.quantity - 1,
//       };
//     }
  
//     setCartItems(updatedCartItems);
//   };
//   const updateCartItemDiscount = (item, newDiscount) => {
//     console.log(newDiscount);
//     setCartItems(cartItems => {
//       return cartItems.map(cartItem => {
//         if (cartItem.id === item.id) {
//           //console.log('updated');
//           return {
//             ...cartItem,
//             discount: newDiscount,
//           };
//         }
//         return cartItem;
//       });
//     });
//   };
   
//   const removeFromCartItem = (item) => {
//     const updatedCartItems = cartItems.filter((cartItem) => cartItem.id !== item.id);
//     setCartItems(updatedCartItems);
//   };
//   // const removeFromCart = (item) => {
//   //   const existingItemIndex = cartItems.findIndex((cartItem) => cartItem.id === item.id);
//   //   const existingItem = cartItems[existingItemIndex];
//   //   let updatedCartItems;
  
//   //   if (existingItem.quantity === 1 || existingItem.quantity< 1) {
//   //     updatedCartItems = cartItems.filter((cartItem) => cartItem.id !== item.id);
//   //   } else {
//   //     updatedCartItems = [...cartItems];
//   //     updatedCartItems[existingItemIndex] = {
//   //       ...existingItem,
//   //       quantity: existingItem.quantity - 1,
//   //     };
//   //   }
  
//   //   setCartItems(updatedCartItems);
//   // };

//   const clearCart = () => {
//     setCartItems([]);
//   };

//   return (
//     <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, clearCart,addOneToCart,removeFromCartItem,updateCartItemDiscount}}>
//       {children}
//     </CartContext.Provider>
//   );
// };

// export default CartProvider;

import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const CartContext = createContext();

const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

  // Cargar el carrito desde AsyncStorage al montar el componente
  useEffect(() => {
    const loadCartFromStorage = async () => {
      try {
        const storedCart = await AsyncStorage.getItem('cart');
        if (storedCart !== null) {
          setCartItems(JSON.parse(storedCart));
        }
      } catch (error) {
        console.error('Error loading cart from storage', error);
      }
    };
    loadCartFromStorage();
  }, []);

  // Guardar el carrito en AsyncStorage cada vez que cambie el estado
  const saveCartToStorage = async (cart) => {
    try {
      await AsyncStorage.setItem('cart', JSON.stringify(cart));
    } catch (error) {
      console.error('Error saving cart to storage', error);
    }
  };

  const addToCart = (product, quantity) => {
    const existingItem = cartItems.find((item) => item.id === product.id);
    let updatedItems;
    if (existingItem) {
      // Si el producto ya existe en el carrito, actualiza su cantidad
      const updatedItem = { ...existingItem, quantity };
      updatedItems = cartItems.map((item) =>
        item.id === existingItem.id ? updatedItem : item
      );
    } else {
      // Si no existe, agrégalo con la cantidad indicada
      const newItem = { ...product, quantity };
      updatedItems = [...cartItems, newItem];
    }
    setCartItems(updatedItems);
    saveCartToStorage(updatedItems);
  };

  const addOneToCart = (product) => {
    const existingItemIndex = cartItems.findIndex((item) => item.id === product.id);
    let updatedItems;
    if (existingItemIndex !== -1) {
      // Incrementa la cantidad si ya existe en el carrito
      updatedItems = [...cartItems];
      updatedItems[existingItemIndex].quantity += 1;
    } else {
      // Si no está en el carrito, agrégalo con cantidad 1
      updatedItems = [...cartItems, { ...product, quantity: 1 }];
    }
    setCartItems(updatedItems);
    saveCartToStorage(updatedItems);
  };

  const removeFromCart = (item) => {
    const existingItemIndex = cartItems.findIndex((cartItem) => cartItem.id === item.id);
    
    if (existingItemIndex === -1) return;

    const existingItem = cartItems[existingItemIndex];
    let updatedItems;
  
    if (existingItem.quantity <= 1) {
      updatedItems = cartItems.filter((cartItem) => cartItem.id !== item.id);
    } else {
      updatedItems = [...cartItems];
      updatedItems[existingItemIndex].quantity -= 1;
    }
  
    setCartItems(updatedItems);
    saveCartToStorage(updatedItems);
  };

  const updateCartItemDiscount = (item, newDiscount) => {
    const updatedItems = cartItems.map((cartItem) => {
      if (cartItem.id === item.id) {
        return { ...cartItem, discount: newDiscount };
      }
      return cartItem;
    });
    setCartItems(updatedItems);
    saveCartToStorage(updatedItems);
  };

  const removeFromCartItem = (item) => {
    const updatedItems = cartItems.filter((cartItem) => cartItem.id !== item.id);
    setCartItems(updatedItems);
    saveCartToStorage(updatedItems);
  };

  const clearCart = () => {
    setCartItems([]);
    saveCartToStorage([]);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        clearCart,
        addOneToCart,
        removeFromCartItem,
        updateCartItemDiscount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export default CartProvider;

