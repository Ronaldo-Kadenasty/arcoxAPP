import {sellProductsService} from './sellerService';
import updateUdvProductsService from './updateUdvProductsService';

const sellAndUdvProductsService = async (products, sellerId, udvId, cashr, changer, token) => {
  try {
    const saleResponse = await sellProductsService(products, sellerId, udvId, cashr, changer, token);
    //console.log('middddd');
   // const udvResponse = await updateUdvProductsService(udvId, products, token);
    //return { saleResponse, udvResponse };
    return { saleResponse};

  } catch (error) {
    console.error(error);
  }
};

export default sellAndUdvProductsService;