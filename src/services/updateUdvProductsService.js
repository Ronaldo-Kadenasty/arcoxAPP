import axios from 'axios';

const updateUdvProductsService = async (udvId, products, token) => {
  const url = `http://www.distribuidoraarcox.com/api/udvs/update/${udvId}`;
  
  const data = {
    id: udvId,
    products: products.map(product => ({
      id: product.id,
      stock: product.stock,
      pieces_per_package: 1,//product.pieces_per_package,
      total_pieces: 1, //product.stock * product.pieces_per_package
    }))
  };

  try {
    console.log('UDDVSSSS');
    console.log(data);

    const response = await axios.put(url, data, {
      headers: { Authorization: `Bearer ${token}` } 
    });

    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error(error);
  }
};

export default updateUdvProductsService;