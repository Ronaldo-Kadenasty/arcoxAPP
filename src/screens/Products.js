import React, { useContext, useEffect, useState, useMemo } from 'react';
import { Text, View, Image, StyleSheet, TouchableOpacity, TextInput, FlatList, Alert } from 'react-native';
import * as SQLite from 'expo-sqlite';
import { CartContext } from '../context/CartContext';
import { AntDesign } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import CachedImage from 'react-native-expo-cached-image';
import NetInfo from '@react-native-community/netinfo';

const db = SQLite.openDatabase('arcox.db');

const ProductListScreen = ({ route }) => {
  const [products, setProducts] = useState([]);
  const { cartItems, addToCart, removeFromCart, addOneToCart } = useContext(CartContext);
  const [searchText, setSearchText] = useState('');

  const loadProducts = async () => {
    try {
      if (route.params && route.params.category) {
        db.transaction((tx) => {
          tx.executeSql(
            'SELECT * FROM products WHERE category_name = ? AND stock > 0',
            [route.params.category],
            (_, { rows: { _array } }) => setProducts(_array),
            (_, error) => {
              console.error('Error loading products', error);
              Alert.alert('Error', 'No se pudieron cargar los productos.');
            }
          );
        });
      } else {
        db.transaction((tx) => {
          tx.executeSql(
            'SELECT * FROM products WHERE stock > 0',
            [],
            (_, { rows: { _array } }) => setProducts(_array),
            (_, error) => {
              console.error('Error loading products', error);
              Alert.alert('Error', 'No se pudieron cargar los productos.');
            }
          );
        });
      }
    } catch (error) {
      console.error('Unexpected error loading products', error);
      Alert.alert('Error', 'Ocurrió un error inesperado al cargar los productos.');
    }
  };

  useEffect(() => {
    loadProducts();
  }, [route.params]);

  useFocusEffect(
    React.useCallback(() => {
      loadProducts();
    }, [route.params])
  );

  const handleResetCategory = () => {
    setProducts([]);
    route.params = undefined;
  };

  const handleAddToCart = (product) => {
    if (getQuantityInCart(product) >= product.stock) {
      alert(`No hay suficiente stock para ${product.name}.`);
      return;
    } else {
      addOneToCart(product);
    }
  };

  const handleQuantityChange = (product, quantity) => {
    if (quantity > product.stock) {
      alert(`No hay suficiente stock para ${product.name}.`);
      return;
    } else {
      addToCart(product, quantity);
    }
  };

  const getQuantityInCart = (product) => {
    const item = cartItems.find((item) => item.id === product.id);
    return item ? item.quantity : 0;
  };

  const filteredProducts = useMemo(() => {
    return products.filter((product) =>
      product.name.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [products, searchText]);

  const renderItem = ({ item }) => (
    <View style={styles.productContainer} key={item.id}>
      <View style={styles.container}>
        <CachedImage 
          style={styles.productImage} 
          source={{ uri: `http://distribuidoraarcox.com/${item.image}` }} 
        />
        <Text style={styles.productPrice}>$ {item.price}</Text>
      </View>

      <View style={styles.productDetails}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productDescription}>{item.description}</Text>
        <Text style={styles.productStock}>Bodega: {item.stock}</Text>
        <Text style={styles.productCategory}>Categoría: {item.category_name}</Text>
        <View style={styles.cartContainer}>
          <TouchableOpacity style={styles.addButton} onPress={() => handleAddToCart(item)}>
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
          <View style={styles.totalContainer}>
            <TextInput
              style={styles.quantityInput}
              keyboardType="numeric"
              value={getQuantityInCart(item).toString()}
              onChangeText={(value) => handleQuantityChange(item, Number(value))}
            />
            <Text style={styles.productName}>
              Sub: ${(item.price * getQuantityInCart(item)).toFixed(2)}
            </Text>
          </View>
          <TouchableOpacity style={styles.removeButton} onPress={() => removeFromCart(item)}>
            <Text style={styles.removeButtonText}>-</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View>
      <View style={styles.inputContainer}>
        {/* Row 1: TextInput and "X" button */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre"
            placeholderTextColor="black"
            value={searchText}
            onChangeText={(text) => setSearchText(text)}
          />
          <TouchableOpacity onPress={() => setSearchText('')}>
            <AntDesign name="closecircle" size={30} color="black" />
          </TouchableOpacity>
        </View>
        
        {/* Row 2: Category reset button */}
        {route.params && route.params.category && (
          <TouchableOpacity style={styles.resetButton} onPress={handleResetCategory}>
            <Text style={styles.resetButtonText}>
              Dejar de filtrar por: {route.params.category}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        style={{ marginBottom: 95 }}
        data={filteredProducts}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  productContainer: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#ddd',
  },
  container: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  productImage: {
    width: 175,
    height: 175,
    resizeMode: 'contain',
  },
  productPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 5,
  },
  productDetails: {
    flex: 1,
    paddingLeft: 10,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  productDescription: {
    fontSize: 16,
    color: '#666',
  },
  productStock: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  productCategory: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  resetButton: {
    backgroundColor: '#ddd',
    padding: 5,
    alignSelf: 'center',
    marginTop: 1,
    borderRadius: 5,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: 'green',
    padding: 10,
    borderRadius: 5,
    alignSelf: 'flex-end',
    marginTop: 5,
    width: 70,
  },
  removeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  removeButton: {
    backgroundColor: 'red',
    padding: 10,
    borderRadius: 5,
    alignSelf: 'flex-end',
    marginTop: 5,
    width: 70,
  },
  quantityText: {
    marginRight: 10,
    fontSize: 16,
  },
  quantityInput: {
    borderWidth: 3,
    borderColor: 'gray',
    borderRadius: 5,
    padding: 5,
    width: 50,
    fontSize: 25,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 5,
    margin: 10,
    width: '70%',
    fontSize: 18,
  },
  clearSearch: {
    fontSize: 18,
    backgroundColor: 'green',
    borderWidth: 1,
    borderRadius: 5,
    alignSelf: 'flex-end',
    borderRadius: 5,
    padding: 10,
    margin: 10,
    width: 70,
    height: 50,
  },
  inputContainer: {
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    marginBottom: 10,
  },
});

export default ProductListScreen;
