import * as SQLite from 'expo-sqlite';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const db = SQLite.openDatabase('arcox.db');
const url = `http://www.distribuidoraarcox.com/api/sale`;

const deleteAllRecords = () => {
  db.transaction((tx) => {
    tx.executeSql('DELETE FROM sales', [], (_, resultSet) => {
      const rowsDeleted = resultSet.rowsAffected;
      console.log(`Deleted ${rowsDeleted} records from sales.`);
    },
    (_, error) => {
      console.error('Error deleting records:', error);
    });
  });
};

// const processSales = async (token) => {
//   try {
//     db.transaction((tx) => {
//       tx.executeSql('SELECT * FROM sales', [], (_, { rows }) => {
//         const sales = rows._array;
//         sales.forEach(async (sale) => {
//           const { id, data } = sale;
          
//           try {
//             console.log(id,JSON.parse(data))
//             //const response = await axios.put('http://www.distribuidoraarcox.com/api/sale', JSON.parse(data));
//             await axios.post(url, JSON.parse(data), {
//               headers: { Authorization: `Bearer ${token}` } 
//             }).then((res)=>{ 
//               console.log('PUT request successful:', );

//               tx.executeSql('DELETE FROM sales WHERE id = ?', [id]);
//               //tx.executeSql('commit;');
//               console.log('Row deleted from sales table:', id);
//             });

           
//           } catch (error) {
//             console.error('PUT request error:', error);
//           }
//         });
//       });
//     });
//   } catch (error) {
//     console.error('Error processing sales:', error);
//   }
// };
// const processSales = async (token) => {
//   try {
//     db.transaction((tx) => {
//       tx.executeSql('SELECT * FROM sales WHERE status = 0', [], (_, { rows }) => {
//         const sales = rows._array;
        
//         sales.forEach(async (sale) => {
//           const { id, data } = sale;

//           try {
//             let response = await axios.post(url, JSON.parse(data), {
//               headers: { Authorization: `Bearer ${token}` },
//             });
//             console.log('PUT request successful:', id, response.data.message);

//             tx.executeSql(
//               'UPDATE sales SET status = 1 WHERE id = ?',
//               [id],
//               (_, { rowsAffected }) => {
//                 if (rowsAffected > 0) {
//                   console.log('Status updated for sales record:', id);
//                 }
//               }
//             );
//           } catch (error) {
//             console.error('PUT request error:', error);
//           }
//         });
//       });
//     });
//   } catch (error) {
//     console.error('Error processing sales:', error);
//   }
// };

const processSales = async (token) => {
  try {
    await new Promise((resolve, reject) => {
      db.transaction((tx) => {
        tx.executeSql(
          'SELECT * FROM sales WHERE status = 0',
          [],
          async (_, { rows }) => {
            const sales = rows._array;

            for (const sale of sales) {
              const { id, data } = sale;

               console.log('data beforesent'+data)
               
                try {
                  const response = await axios.post(url, JSON.parse(data), {
                    headers: { Authorization: `Bearer ${token}` },
                  });
                  console.log('POST request successful:');
                  console.log('id to delete',id);
                  db.transaction((tx) => {
                    tx.executeSql(
                      'UPDATE sales SET status = 1 WHERE id = ?',
                      [id],
                      (_, { rowsAffected }) => {
                        if (rowsAffected >=0) {
                          console.log('Status updated for sales record:', id);
                        }
                      }
                    );
                  });
                  
                } catch (error) {
                  console.error('POST request not successful on SELL:', error);
                }

                // const response = await axios.post(url, JSON.parse(data), {
                //   headers: { Authorization: `Bearer ${token}` },
                // }).then(console.log('PUT request successful:')).catch(console.log('PUT requestnotsuccessful:'));
                
                //console.log('PUT request successful:',response);

               
              
            }

            resolve(); // Resolve the Promise after processing all sales
          },
          (_, error) => {
            reject(error);
          }
        );
      });
    });
    
  } catch (error) {
    console.error('Error processing sales:', error);
  }
 deleteAllRecords();
};


const generateSaleCode = async (sellerId) => {
  const now = new Date();
  const datePart = `${now.getFullYear().toString().slice(-2)}${(now.getMonth() + 1)
    .toString()
    .padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`; // YYMMDD

  const key = `sale_counter_s${sellerId}_${datePart}`;
  let counter = 0;

  try {
    const storedValue = await AsyncStorage.getItem(key);
    counter = storedValue ? parseInt(storedValue, 10) : 0;
    counter += 1;
    await AsyncStorage.setItem(key, counter.toString());
  } catch (error) {
    console.error('Error accessing sale counter in AsyncStorage', error);
  }

  const counterPart = counter.toString().padStart(3, '0');
  return `V${sellerId}-${datePart}-${counterPart}`;
};


const sellProductsService = async (products, sellerId, udvId, cashr, changer, token, client) => {
  
  
  const data = {
    sale_code:await generateSaleCode(sellerId),
    total_before_discounts:products.reduce((acc, product) => acc + (product.price )* product.quantity, 0), //products.reduce((acc, product) => acc + product.price * product.quantity, 0),
    total: products.reduce((acc, product) => acc +( product.price- (product.discount?product.discount:0))* product.quantity, 0),
    items: products.length,
    cash:cashr,
    change:changer,
    discount_for_products:0,
    give_away: false,
    discount_for_gift_products: 0,
    discount_for_purchase_quantity: 0,
    gift_products: 0,
    client_id:null,
    seller_id: sellerId,
    udv_id: udvId,
    products: products.map(product => ({ price: product.price-(product.discount?product.discount:0), quantity: product.quantity, product_id: product.id , product_name: product.name , discount:product.discount?product.discount:0}))
  };

  try {
    //console.log(data);
    console.log(products)

    // const response = await axios.post(url, data, {
    //   headers: { Authorization: `Bearer ${token}` } 
    // });
    
    db.transaction(tx => {
     
    
      tx.executeSql(
        'CREATE TABLE IF NOT EXISTS sales (id INTEGER PRIMARY KEY AUTOINCREMENT, data TEXT, status INTEGER)',
        [],
        () => {
          tx.executeSql(
            'INSERT INTO sales (data,status) VALUES (?,?)',
            [JSON.stringify(data),0],
            (_, { insertId }) => {
              console.log('Data saved successfully with ID:', insertId);
            },
            (_, error) => {
              console.error('Failed to save data:', error);
            }
          );
        },
        (_, error) => {
          console.error('Failed to create table:', error);
        }
      );
    });

    db.transaction(tx => {
      products.forEach(product => {
        const { id, quantity } = product;
        const query = `UPDATE products SET stock = stock - ${quantity} WHERE id = ${id}`;
        tx.executeSql(query);
        //console.log('actualizado'+ id + 'la cantidad restada '+ quantity);
      });
    }, error => {
      console.error(error);
    }, () => {
      console.log('Stock updated successfully');
      
    });

    //console.log(response.data);
    
  } catch (error) {
    console.error(error);
  }
  console.log('codigo de ventaaaa')
  console.log(data.sale_code)
  return data.sale_code;
};



export {sellProductsService,processSales};