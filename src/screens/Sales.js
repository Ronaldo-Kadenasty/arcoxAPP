import React, { useState,useEffect} from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as SQLite from 'expo-sqlite';
import { useContext } from 'react';
import { ProductsContext } from '../context/ProductsContext';
const db = SQLite.openDatabase('arcox.db');


const SalesAdminScreen = () => {
  const [sales, setSales] = useState([]);
  const { removeSoldProduct } = useContext(ProductsContext);
  const fetchSales = async () => {
    try {
      await new Promise((resolve, reject) => {
        db.transaction((tx) => {
          tx.executeSql(
            'SELECT * FROM sales ',//WHERE status = 0',
            [],
            (_, { rows }) => {
              const parsedSales = rows._array
                .filter(row => typeof row.data === 'string')
                .map(row => {
                  try {
                    // console.log( JSON.parse(row.data))
                    const parsed = JSON.parse(row.data);
                    return {
                      ...parsed,
                      id: row.id,
                      status: row.status
                    };
                  } catch (e) {
                    console.error(`Error parsing JSON from row id ${row.id}:`, e);
                    return null;
                  }
                })
                .filter(item => item !== null);
              console.log(parsedSales)
              setSales(parsedSales);
              resolve();
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
  };
// const fetchSales = async () => {
//   try {
//     await new Promise((resolve, reject) => {
//       db.transaction((tx) => {
//         tx.executeSql(
//           'SELECT * FROM sales WHERE status = 0',
//           [],
//           async (_, { rows }) => {
//             const sales = rows._array;
//             console.log(JSON.parse(sales[1].data)); 
//             setSales(JSON.parse(sales.data));
            

  
//             resolve(); // Resolve the Promise after processing all sales
//           },
//           (_, error) => {
//             reject(error);
//           }
//         );
//       });
//     });

//   } catch (error) {
//     console.error('Error processing sales:', error);
//   }

// };
  useEffect(() => {
   
    fetchSales();
  
  }, []);
  useFocusEffect(
    React.useCallback(() => {
  
      fetchSales();
    
    }, [])
  );
  const confirmCancelSale = (saleCode) => {
    Alert.alert(
      'Cancelar Venta',
      `¿Estás seguro de cancelar la venta #${saleCode}?`,
      [
        { text: 'No', style: 'cancel' },
        { text: 'Sí', onPress: () => cancelSale(saleCode) },
      ]
    );
  };

  // const cancelSale = (saleCode) => {
  //   setSales((prevSales) => prevSales.filter(sale => sale.sale_code !== saleCode));
  // };
  // const cancelSale = (saleCode) => {
  //   const saleToCancel = sales.find(sale => sale.sale_code === saleCode);
  
  //   if (!saleToCancel) return;
  
  //   db.transaction((tx) => {
  //     tx.executeSql(
  //       'UPDATE sales SET status = 3 WHERE id = ?',
  //       [saleToCancel.id],
  //       () => {
  //         // Actualizamos el estado local después del éxito
  //         setSales((prevSales) =>
  //           prevSales.map((sale) =>
  //             sale.sale_code === saleCode ? { ...sale, status: 3 } : sale
  //           )
  //         );
  //       },
  //       (_, error) => {
  //         console.error('Error updating status to 3:', error);
  //       }
  //     );
  //   });
  // };
  const cancelSale = (saleCode) => {
    const saleToCancel = sales.find(sale => sale.sale_code === saleCode);
    if (!saleToCancel) return;
  
    db.transaction((tx) => {
      tx.executeSql(
        'UPDATE sales SET status = 3 WHERE id = ?',
        [saleToCancel.id],
        () => {
          // Eliminar los productos del contexto
          saleToCancel.products.forEach(product => {
            removeSoldProduct(product.product_id); // O product.id si lo usas así
          });
  
          // Actualizar estado local
          setSales(prevSales =>
            prevSales.map(sale =>
              sale.sale_code === saleCode ? { ...sale, status: 3 } : sale
            )
          );
        },
        (_, error) => {
          console.error('Error updating status to 3:', error);
        }
      );
    });
  };

  const renderSaleItem = ({ item }) => (
    <View style={[styles.saleItem, item.status === 3 && styles.cancelledSale]}>
      <Text style={styles.saleTitle}>Venta #{item.sale_code}</Text>
      <Text>Efectivo recibido: ${item.cash}</Text>
      <Text>Cambio entregado: ${item.change}</Text>
      <Text>Total antes de descuentos: ${item.total_before_discounts}</Text>
      <Text>Total descuentos: ${item.total_before_discounts - item.total}</Text>
      <Text style={styles.total}>Total final: ${item.total}</Text>
      <FlatList
        data={item.products}
        keyExtractor={(prod) => prod.product_id.toString()}
        renderItem={({ item: product }) => (
          <View style={styles.productItem}>
            <Text style={styles.productName}>{product.product_name}</Text>
            <Text>ID: {product.product_id} | Cantidad: {product.quantity} | Precio: ${product.price} | Descuento: ${product.discount}</Text>
          </View>
        )}
      />
      <TouchableOpacity style={styles.cancelButton} onPress={() => confirmCancelSale(item.sale_code)}>
        <Text style={styles.cancelButtonText}>Cancelar Venta</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={sales}
        keyExtractor={(item) => item.sale_code.toString()}
        renderItem={renderSaleItem}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    padding: 10,
  },
  listContainer: {
    paddingBottom: 20,
  },
  saleItem: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 10,
    marginVertical: 8,
    elevation: 3,
  },
  saleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  total: {
    fontWeight: 'bold',
    marginVertical: 5,
  },
  productItem: {
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#ececec',
  },
  productName: {
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#e74c3c',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    alignSelf: 'flex-end',
    marginTop: 10,
  },
  cancelButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  cancelledSale: {
    backgroundColor: '#ffe6e6', // fondo rojo suave
    borderColor: '#cc0000',
    borderWidth: 1,
  },
});

export default SalesAdminScreen;
