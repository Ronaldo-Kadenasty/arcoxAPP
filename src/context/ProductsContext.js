import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const ProductsContext = createContext();

const ProductsProvider = ({ children }) => {
  const [soldProducts, setSoldProducts] = useState([]);

  // Load sold products from AsyncStorage when the provider mounts
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const products = await AsyncStorage.getItem('soldProducts');
        if (products !== null) {
          setSoldProducts(JSON.parse(products));
        }
      } catch (e) {
        console.error('Failed to load products', e);
      }
    };

    loadProducts();
  }, []);

  // Save sold products to AsyncStorage when they change
  useEffect(() => {
    const saveProducts = async () => {
      try {
        await AsyncStorage.setItem('soldProducts', JSON.stringify(soldProducts));
      } catch (e) {
        console.error('Failed to save products', e);
      }
    };

    saveProducts();
  }, [soldProducts]);

  const addSoldProduct = (product, quantity) => {
    setSoldProducts(prevSoldProducts => {
      const existingProductIndex = prevSoldProducts.findIndex(item => item.id === product.id);
  
      if (existingProductIndex !== -1) {
        const updatedProducts = [...prevSoldProducts];
        updatedProducts[existingProductIndex].quantity += quantity;
        return updatedProducts;
      } else {
        const newSoldProduct = { ...product, quantity };
        return [...prevSoldProducts, newSoldProduct];
      }
    });
  };

  const removeSoldProduct = (productId) => {
    setSoldProducts(prevSoldProducts => 
      prevSoldProducts.filter(product => product.id !== productId)
    );
  };

  const clearSoldProducts = () => {
    setSoldProducts([]);
  };

  return (
    <ProductsContext.Provider value={{
      soldProducts,
      addSoldProduct,
      removeSoldProduct,
      clearSoldProducts
    }}>
      {children}
    </ProductsContext.Provider>
  );
};

export default ProductsProvider;
