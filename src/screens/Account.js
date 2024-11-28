import React, { useRef, useContext, useEffect, useState } from 'react';
import { View, TextInput, Text, FlatList, StyleSheet, TouchableOpacity, Alert, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Button, Icon, Card } from 'react-native-elements';
import { Context as AuthContext } from '../context/AuthContext';
import * as SQLite from 'expo-sqlite';
import { processSales } from '../services/sellerService'
import { captureRef, ViewShot } from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import { ProductsContext } from '../context/ProductsContext';
import { updateUdvProductsService } from '../services/updateUdvProductsService';
import { Linking, AppState } from 'react-native';
import TicketService from '../services/ticketService';

const db = SQLite.openDatabase('arcox.db');

const AccountScreen = ({ navigation }) => {
  const { state, signout } = useContext(AuthContext);
  const [salesCount, setSalesCount] = useState([]);
  const textRef = useRef();
  const restock = useRef();
  const [capturedImage, setCapturedImage] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [expensesValue, setExpensesValue] = useState('');
  const [products, setProducts] = useState([]);
  const { soldProducts, addSoldProduct, removeSoldProduct, clearSoldProducts } = useContext(ProductsContext);
  const [closedDayButton, setClosedDayButton] = useState(false);
  const [localTicketRestockUrl, setLocalTicketRestockUrl] = useState('');
  const [localTicketCutUrl, setLocalTicketCutUrl] = useState('');


  useEffect(() => {
    fetchSalesCount();
    fetchSales();
    loadProducts();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchSalesCount();
      fetchSales();
      loadProducts();
    }, [])
  );

  const loadProducts = () => {
    db.transaction((tx) => {
      tx.executeSql(
        'SELECT * FROM products',
        [],
        (_, { rows: { _array } }) => setProducts(_array)
      );
    });
  };

  const printToImage = async (image) => {
    try {
      const uri = await captureRef(image, {
        format: 'png',
        quality: 1,
      });
      setCapturedImage(uri);
      saveFile(uri);
      //Alert.alert('Success', 'Printed to image successfully');
      // Use the uri to display the printed image if needed
      console.log(uri);
      //saveFile(uri);
    } catch (error) {
      console.error('Error printing to image:', error);
      Alert.alert('Error', 'Failed to print to image');
    }
  };

  async function saveFile(filePath) {
    const albumName = 'Arcox';

    try {
      const asset = await MediaLibrary.createAssetAsync(filePath);

      if (asset) {
        try {
          let album = await MediaLibrary.getAlbumAsync(albumName);
          if (album) {
            await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
          } else {
            album = await MediaLibrary.createAlbumAsync(
              albumName,
              asset,
              false
            );
          }
          const assetResult = await MediaLibrary.getAssetsAsync({
            first: 1,
            album,
            sortBy: MediaLibrary.SortBy.creationTime,
          });
          const updatedAsset = await assetResult.assets[0];
          // Do something with updatedAsset if needed
        } catch (e) {
          console.error('Failed', e);
        }
      } else {
        console.error('Unable to use MediaLibrary, cannot create assets');
      }
    } catch (e) {
      console.error('MediaLibrary.createAssetAsync failed', e);
    }
  }

  const calculateTotal = () => {
    let total = 0;
    cartItems.forEach((item) => {
      total += JSON.parse(item.data).total;
    });
    return total.toFixed(2);
  };

  const handleSell = async () => {
    if (expensesValue != '') {
      const response = await processSales(state.token).then((res) => {

        alert(`Día Cerrado`);
      });

      //console.log(udvResponse)
      //await printToImage(textRef);
      await handlePrintCorte();

      fetchSalesCount();
      fetchSales();
      setExpensesValue('');

      await handleRestock();

      // await updateUdvProductsService(state.udvId, products, state.token);
      //clearCart();

    }
    else {
      alert(`Ingrese sus gastos `);
      return;

    }

  }

  const handlePrintResurtido = () => {
    const ticketUrl = TicketService.generateTicket('resurtido', soldProducts);
    setLocalTicketRestockUrl(ticketUrl);
    Linking.openURL(ticketUrl)
      .catch(err => console.error("Failed to open URL:", err));
  };

  const handlePrintCorte = () => {
    const ticketUrl = TicketService.generateCorteCajaTicket(state.name, cartItems, +calculateTotal(), +expensesValue, +(calculateTotal() - expensesValue));
    setLocalTicketCutUrl(ticketUrl);
    Linking.openURL(ticketUrl)
      .catch(err => console.error("Failed to open URL:", err));
  };

  const handleRestock = async () => {
    //await printToImage(restock);
    handlePrintResurtido();
    clearSoldProducts();
  }

  const fetchSales = async () => {
    try {
      await new Promise((resolve, reject) => {
        db.transaction((tx) => {
          tx.executeSql(
            'SELECT * FROM sales WHERE status = 0',
            [],
            async (_, { rows }) => {
              const sales = rows._array;

              setCartItems(sales);



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

  };

  const fetchSalesCount = () => {
    try {
      db.transaction((tx) => {
        tx.executeSql('SELECT COUNT(*) AS count FROM sales WHERE status = 0', [], (_, { rows }) => {
          const { count } = rows.item(0);
          console.log(count);
          setSalesCount(count);
        });
      });
    } catch (error) {
      console.error('Error fetching sales count:', error);
    }
  };

  const signoutFunc = async () => {
    //console.log(state)
    if (salesCount >= 1) {
      alert(`Primero debe cerrar las ventas del día`);
    }
    else {
      signout()
    }
  }

  const handleSetClosedDayTrue = () => {
    console.log("Si cerro sesión")
  };

  const handleSetClosedDayFalse = () => {
    if (localTicketRestockUrl && localTicketCutUrl) {
      Linking.openURL(localTicketRestockUrl)
        .catch(err => console.error("Failed to open URL:", err));

      Linking.openURL(localTicketCutUrl)
        .catch(err => console.error("Failed to open URL:", err));
    }
  };

  return (
    <View style={styles.container}>
      <View style={{ height: 700 }}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerText}>Mi Cuenta</Text>
          <Text style={styles.subheaderText}>{state.name}</Text>
          <Text style={[styles.subheaderText, { color: '#bbb' }]}>{state.email}</Text>
        </View>
        <View style={styles.buttonContainer}>
          <Button
            title="Cerrar Día"
            type="outline"
            onPress={handleSell}
            containerStyle={styles.button}
            titleStyle={styles.buttonTitle}
            icon={<Icon name="calendar-check" type="material-community" color="#4285F4" />}
            iconRight
          />
          <Button
            title="Cerrar Sesión"
            type="solid"
            onPress={signoutFunc}
            containerStyle={styles.button}
            titleStyle={styles.buttonTitle}
            icon={<Icon name="logout" type="material-community" color="#fff" />}
            buttonStyle={styles.signoutButton}
            loading={state.isLoading}
            loadingStyle={styles.loadingStyle}
          />
        </View>
        <View style={styles.headerContainer}>
          <Text style={styles.headerText}>Mi UDV</Text>
        </View>
        <View style={styles.tabContainer}>
          <Text>Gastos:</Text>
          <TextInput
            // style={styles.cashValueInput}
            placeholder="Ingrese sus Gastos"
            keyboardType='numeric'
            placeholderTextColor="black"
            value={expensesValue}
            onChangeText={(value) => setExpensesValue(value)}
          />
        </View>
        <Card>
          <Card.Title>Total de Ventas</Card.Title>
          <Card.Divider />
          <Text style={styles.salesCountText}>{salesCount}</Text>
        </Card>

        <Button
          title="Reimprimir"
          type="outline"
          onPress={handleSetClosedDayFalse}
          containerStyle={styles.button}
          titleStyle={styles.buttonTitle}
          icon={<Icon name="printer" type="material-community" color="#4285F4" />}
        />

      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerContainer: {
    backgroundColor: '#4285F4',
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subheaderText: {
    color: '#fff',
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
  },
  button: {
    borderRadius: 8,
    borderColor: '#4285F4',
  },
  buttonTitle: {
    fontSize: 16,
    color: '#4285F4',
  },
  signoutButton: {
    backgroundColor: '#DB4437',
  },
  loadingStyle: {
    marginVertical: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#eee',
    padding: 16,
  },
  tab: {
    alignItems: 'center',
  },
  tabText: {
    marginTop: 8,
    fontSize: 12,
    color: '#333',
  },
  salesCountText: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 16,
  },
});

export default AccountScreen;
