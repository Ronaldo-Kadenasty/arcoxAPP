import React, { useRef, useState, useContext, useEffect } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, TextInput, Modal, Pressable, FlatList, ScrollView, Alert, Keyboard, Image } from 'react-native';
import { CartContext } from '../context/CartContext';
import { ProductsContext } from '../context/ProductsContext';
import { Context as AuthContext } from '../context/AuthContext';
import sellAndUdvProductsService from '../services/sellAndUdvProductsService';
import * as SQLite from 'expo-sqlite';
import { captureRef, ViewShot } from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TicketService from '../services/ticketService';
import { Linking, AppState } from 'react-native';

const CartScreen = () => {
  const { cartItems, removeFromCart, clearCart, removeFromCartItem, updateCartItemDiscount } = useContext(CartContext);
  const { state } = useContext(AuthContext);
  const [cashValue, setCashValue] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showPrinting, setShowPrinting] = useState(false);
  const [showNegociate, setNegociate] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [clients, setClients] = useState([]);
  const [client, setClient] = useState([]);
  const [showClients, setShowClients] = useState();
  const [selectedItem, setSelectedItem] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [change, setChange] = useState('');
  const db = SQLite.openDatabase('arcox.db');
  const textRef = useRef();
  const [capturedImage, setCapturedImage] = useState(null);
  const [maxDiscount, setMaxDiscount] = useState('');
  const [lastTicket,setLastTIcket]=useState();
  const { soldProducts, addSoldProduct, removeSoldProduct } = useContext(ProductsContext);

  
  const setContext = async() =>{
   let local = await AsyncStorage.getItem('maxDiscount')
    console.log(local)
    setMaxDiscount( local);
  }
 
  const handleDiscountInputSubmit = () => {
    Keyboard.dismiss();
  };

 

  const handleDiscountChange = (discount) => {
    const parsedDiscount = parseFloat(discount);
  
    if (!isNaN(parsedDiscount) && parsedDiscount >= 0 && parsedDiscount >= selectedItem.price - parseFloat(maxDiscount)) {
      setDiscount(parsedDiscount);
  
      const newPrice = parsedDiscount;
      const updatedItem = { ...selectedItem, newPrice };
      setSelectedItem(updatedItem);
  
      updateCartItemDiscount(selectedItem, selectedItem.price - newPrice);
    } else {
      setDiscount(0);
      //Alert.alert('Error', 'Descuento no válido.');
    }
  };
  const handleRemoveFromCart = (item) => {
    removeFromCartItem(item);
  };
  const handleNegociateFromCart = (item) => {
    setSelectedItem(item);
    setNegociate(true);
  };
 const loadClients = () => {
  db.transaction((tx) => {
    tx.executeSql(
      'SELECT * FROM clients',
      [],
      (_, { rows: { _array } }) => setClients(_array),
      (_, error) => {
        console.error('Error loading clients', error);
        Alert.alert('Error', 'No se pudieron cargar los clientes.');
      }
    );
  });
};
  useEffect(() => {
    loadClients();
    setContext();
    console.log('MAXDIscount',maxDiscount);
  }, []);

  const handleClearCart = () => {
    clearCart();
  };

  const debounce = (func, delay) => {
    let timeoutId;
    return function (...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  };
  const debouncedHandleDiscountChange = debounce(handleDiscountChange, 500);

  const handleSelectClient = (id) => {
    console.log('selected', id)
    setClient(id)
    console.log('client', client)
    setShowClients(false)
    console.log(showClients)
  }
  const handleSellProducts = async () => {
    console.log(cashValue)
    console.log(calculateTotal())
    if (Number(cashValue) >= calculateTotal()) {

      //const response = await sellAndUdvProductsService(cartItems, state.sellerId, state.udvId, cashValue,(cashValue - calculateTotal()).toFixed(2),state.token,client);
      setShowModal(true);
      // clearCart();
    }
    else {
      alert(`Ingrese una cantidad de efectivo superior a la compra `);
      return;

    }

    //console.log(response); // do something with the response
  };

  const handlePrintVenta = () => {
  const seller = state.name;
  const route = `Ruta ${state.udvId}`;
  let total= +calculateTotal();
  const cashReceived = +cashValue;
  const change = +(cashValue - calculateTotal());

  const ticketUrl = TicketService.generateVentaTicket(seller, route, cartItems, total,cashReceived, change);
  setLastTIcket(ticketUrl);
  Linking.openURL(ticketUrl)
    .catch(err => console.error("Failed to open URL:", err));
};
const handleRePrintVenta = () => {
  
  Linking.openURL(lastTicket)
    .catch(err => console.error("Failed to open URL:", err));
};
  const handleSell = async () => {
    try {
      setShowPrinting(true);
      setShowModal(false);
      const response = await sellAndUdvProductsService(cartItems, state.sellerId, state.udvId, cashValue, (cashValue - calculateTotal()).toFixed(2), state.token, client.id);
      //await printToImage();
      handlePrintVenta();
      cartItems.forEach((item) => {
        addSoldProduct(item, item.quantity);
      });
      setCashValue(0);
      clearCart();
      setShowPrinting(false);
    } catch (error) {
      setShowPrinting(false);
      console.error('Error selling products', error);
      Alert.alert('Error', 'Ocurrió un error al finalizar la compra.');
    }
  };
  const calculateTotal = () => {
    let total = 0;
    cartItems.forEach((item) => {
      let discount = 0;
      if (item.discount) {
        discount = item.discount;
      }
      total += item.quantity * (item.price - discount);
    });
    return total.toFixed(2);
  };
  
 
  const renderItem = ({ item }) => (
    <View style={styles.cartItem} key={item.id}>
      <View style={styles.itemDetails}>
        <Text style={styles.itemPieces}>{`Pz: ${item.quantity}`}</Text>
        <Text style={styles.itemName} numberOfLines={1} ellipsizeMode="tail">
          {item.name}
        </Text>
        <Text style={item.discount > 0 ? styles.itemPriceCanceled : styles.itemPrice}>{`$${item.price}`}</Text>
        <Text style={styles.itemPrice}>{`$${item.discount ? item.price - item.discount : '--'}`}</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.removeItemButton} onPress={() => handleRemoveFromCart(item)}>
          <Text style={styles.removeItemButtonText}>Eliminar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.negociateItemButton} onPress={() => handleNegociateFromCart(item)}>
          <Text style={styles.negociateItemButtonText}>Editar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>

      {/* <View style={styles.inputContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar Cliente por nombre"
          placeholderTextColor="black"
          value={searchText}
          onChangeText={(text) => setSearchText(text)}
        />
        {!showClients && (
          <TouchableOpacity style={styles.resetButton} onPress={setShowClients(true)}>
            <Text style={styles.resetButtonText}>Cambiar cliente: {client}</Text>
          </TouchableOpacity>
        )}
     
      </View>
      {showClients && (
      <View  >
      {clients.map((item)=>( 
        <View style={styles.cartItem} key={item.id}>
          
        <Text style={styles.itemName}>{item.name}</Text>
        
        <TouchableOpacity style={styles.removeItemButton} onPress={() => handleSelectClient(item)}>
          <Text style={styles.removeItemButtonText}>Seleccionar</Text>
        </TouchableOpacity>
      </View>
      ))}
      </View>)} */}
      <View style={styles.totalSection}>
        <Text style={styles.totalText}>{`Total: $${calculateTotal()}`}</Text>
        <View style={styles.totalButtonContainer}>
          <TextInput
            style={styles.cashValueInput}
            placeholder="Efectivo"
            keyboardType='numeric'
            placeholderTextColor="black"
            value={cashValue}
            onChangeText={(value) => setCashValue(value)}
          />
          <TouchableOpacity style={styles.finishBuyButton} onPress={handleSellProducts}>
            <Text style={styles.finishBuyButtonText}>Finalizar Compra</Text>
          </TouchableOpacity>
        </View>
      </View>
      {cartItems.length > 0 ? (
        <>
          <View style={{ height: 509}}>

            <FlatList
              data={cartItems}
              renderItem={renderItem}
              keyExtractor={(item) => item.id.toString()}
            />
          </View>

          <TouchableOpacity style={styles.clearCartButton} onPress={handleClearCart}>
            <Text style={styles.clearCartButtonText}>Limpiar Carrito</Text>
          </TouchableOpacity>
         
        </>
      ) : (
        <View>
          <Text style={styles.emptyCartText}>Carrito Vacío.</Text>
          <TouchableOpacity style={styles.clearCartButton} onPress={async () => { handleRePrintVenta(); }}>
            <Text style={styles.clearCartButtonText}>Reimprimir último ticket </Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={showNegociate}
      >
        <View style={styles.modalContainer1}>
          {selectedItem && (
            <>

              <Text style={styles.modalTitle}>Negociar: {selectedItem.name}</Text>
              <Text style={styles.modalText}>Precio actual: ${selectedItem.price}</Text>
              <Text style={styles.modalText}>Máximo descuento: ${maxDiscount}</Text>

              <Text style={styles.modalText}>Nuevo Precio:  ${selectedItem.newPrice}</Text>
              <Text style={styles.modalText}>Ingrese Nevo precio</Text>
              <TextInput
                style={styles.quantityInput}

                keyboardType="numeric"
                value={discount}
                onChangeText={(discount) => debouncedHandleDiscountChange(discount)}
                onSubmitEditing={handleDiscountInputSubmit}
              //ref={discountInputRef}
              />
              {/* Add a button to print the receipt */}
            </>
          )}


          <TouchableOpacity style={styles.closeModalButton} onPress={() => { setNegociate(false); }}>
            <Text style={styles.closeModalButtonText}>Cerrar</Text>
          </TouchableOpacity>
        </View>

      </Modal>
      <Modal
        animationType="slide"
        transparent={true}
        visible={showModal}
      >
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Detalles de la compra:</Text>
          {/* <Text style={styles.modalText}>Client: {client}</Text> */}
          <Text style={styles.modalText}>Total:                      ${calculateTotal()}</Text>
          <Text style={styles.modalText}>Efectivo recibido:  ${cashValue}</Text>
          <Text style={styles.modalText}>Cambio:                ${(cashValue - calculateTotal()).toFixed(2)}</Text>
          {/* Add a button to print the receipt */}
          <TouchableOpacity style={styles.printReceiptButton} onPress={() => handleSell()}>
            <Text style={styles.printReceiptButtonText}>Finalizar e Imprimir</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeModalButton} onPress={() => setShowModal(false)}>
            <Text style={styles.closeModalButtonText}>Cerrar</Text>
          </TouchableOpacity>
        </View>

      </Modal>
      <Modal
        animationType="slide"
        transparent={true}
        visible={showPrinting}
      >
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Imprimiendo...</Text>
          
        </View>

      </Modal>
    </View>
  );
};
const styles = StyleSheet.create({
  quantityInput: {
    borderWidth: 3,
    borderColor: 'white',
    borderRadius: 5,
    padding: 5,
    width: 50,
    fontSize: 25,
    color: '#fff'
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    margin: 10,
    alignSelf: 'center',
    width: '90%',
    fontSize: 18,
  },
  container: {
    flex: 1,
    padding: 10,
  },


  /////////////////////////
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
  },
  itemDetails: {
    flex: 1,
    flexDirection: 'column', // Stack details vertically
    marginRight: 10, // Add some space between details and buttons
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemPrice: {
    fontSize: 16,
    color: 'green',
  },
  itemPriceCanceled: {
    fontSize: 16,
    color: 'red',
    textDecorationLine: 'line-through',
  },
  itemPieces: {
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'column', // Stack buttons vertically
    alignItems: 'flex-end', // Align buttons to the end of the row
  },
  removeItemButton: {
    backgroundColor: '#f00',
    padding: 10,
    borderRadius: 5,
    marginBottom: 3, // Add margin between buttons
  },
  negociateItemButton: {
    backgroundColor: '#FFA500',
    padding: 10,
    borderRadius: 5,
  },
  removeItemButtonText: {
    color: '#fff',
  },
  negociateItemButtonText: {
    color: '#fff',
    width: 50
  },

  clearCartButton: {
    backgroundColor: '#ddd',
    padding: 10,
    alignSelf: 'center',
    marginTop: 10,
    borderRadius: 5,
  },
  clearCartButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyCartText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 50,
  },
  totalSection: {
    marginTop: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: 'black',
    borderRadius: 5,
  },

  totalText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  totalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dummyQRButton: {
    backgroundColor: '#ddd',
    padding: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  dummyQRButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  finishBuyButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
  },
  finishBuyButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  //---------------------------- Modal
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.90)',
  },
  modalContainer1: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 20, 0,1)',
  },

  modalContent: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    width: '80%',
  },
  modalText: {
    fontSize: 18,
    color: "#FFFFFF",
    marginBottom: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    marginTop: 20,
    width: '100%',
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 20,
    width: '45%',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalChange: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 10,
  },
  closeModalButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 10,
    width: '100%',
    borderColor: "#000000",
  },
  closeModalButtonText: {
    color: "#000000",
    fontWeight: "bold",
    fontSize: 16,
    textAlign: 'center',
  },
  printReceiptButton: {
    backgroundColor: '#007AFF',
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 10,
    width: '100%',
  },
  printReceiptButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#FFFFFF',
  },




});
export default CartScreen;