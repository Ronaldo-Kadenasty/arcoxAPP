import React, { createContext, useState } from 'react';

export const ProductsContext = createContext();

const ProductsProvider = ({ children }) => {
  const [soldProducts, setSoldProducts] = useState([]);

//   const addSoldProduct = (product, quantity) => {
//     // Assuming product has an id field
//     const existingProductIndex = soldProducts.findIndex((item) => item.id === product.id);

//     if (existingProductIndex !== -1) {
//       // If product already exists in soldProducts, update its quantity
//       const updatedProducts = [...soldProducts];
//       updatedProducts[existingProductIndex].quantity += quantity;
//       setSoldProducts(updatedProducts);
//     } else {
//       // If product doesn't exist in soldProducts, add it with the given quantity
//       const newSoldProduct = { ...product, quantity };
//       setSoldProducts([...soldProducts, newSoldProduct]);
//     }
//   };
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
    const updatedProducts = soldProducts.filter((product) => product.id !== productId);
    setSoldProducts(updatedProducts);
  };

  const clearSoldProducts = () => {
    setSoldProducts([]);
  };

  return (
    <ProductsContext.Provider value={{ soldProducts, addSoldProduct, removeSoldProduct, clearSoldProducts }}>
      {children}
    </ProductsContext.Provider>
  );
};

export default ProductsProvider;
