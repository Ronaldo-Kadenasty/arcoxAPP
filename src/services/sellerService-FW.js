import * as SQLite from 'expo-sqlite';
import axios from 'axios';

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

              try {
                const response = await axios.post(url, JSON.parse(data), {
                  headers: { Authorization: `Bearer ${token}` },
                });
                console.log('POST request successful:', id);

                db.transaction((tx) => {
                  tx.executeSql(
                    'UPDATE sales SET status = 1 WHERE id = ?',
                    [id],
                    (_, { rowsAffected }) => {
                      if (rowsAffected > 0) {
                        console.log('Status updated for sales record:', id);
                      }
                    },
                    (_, error) => {
                      console.error('Error updating sales status:', error);
                    }
                  );
                });
              } catch (error) {
                console.error('POST request not successful on sale:', error);
              }
            }
            resolve();
          },
          (_, error) => {
            console.error('Error fetching sales:', error);
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

const sellProductsService = async (products, sellerId, udvId, cashr, changer, token, client) => {
  const data = {
    sale_code: 100,
    total_before_discounts: products.reduce((acc, product) => acc + (product.price) * product.quantity, 0),
    total: products.reduce((acc, product) => acc + (product.price - (product.discount ? product.discount : 0)) * product.quantity, 0),
    items: products.length,
    cash: cashr,
    change: changer,
    discount_for_products: 0,
    give_away: false,
    discount_for_gift_products: 0,
    discount_for_purchase_quantity: 0,
    gift_products: 0,
    client_id: null,
    seller_id: sellerId,
    udv_id: udvId,
    products: products.map(product => ({ price: product.price - (product.discount ? product.discount : 0), quantity: product.quantity, product_id: product.id, discount: product.discount ? product.discount : 0 }))
  };

  try {
    console.log(data);

    db.transaction(tx => {
      tx.executeSql(
        'CREATE TABLE IF NOT EXISTS sales (id INTEGER PRIMARY KEY AUTOINCREMENT, data TEXT, status INTEGER)',
        [],
        () => {
          tx.executeSql(
            'INSERT INTO sales (data, status) VALUES (?, ?)',
            [JSON.stringify(data), 0],
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
        tx.executeSql(query, [], 
          (_, result) => {
            console.log('Stock updated successfully for product ID:', id);
          }, 
          (_, error) => {
            console.error('Error updating stock for product ID:', id, error);
          });
      });
    }, error => {
      console.error('Transaction error:', error);
    });

  } catch (error) {
    console.error('Error in sellProductsService:', error);
  }
};

export { sellProductsService, processSales };
