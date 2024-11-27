import React, { useState, useEffect, useContext } from 'react';
import { View, Text, ScrollView, Image, StyleSheet, TouchableOpacity, Dimensions, Alert } from 'react-native';
import axios from 'axios';
import * as SQLite from 'expo-sqlite';
import { useNavigation } from '@react-navigation/native';
import { Context as AuthContext } from '../context/AuthContext';
import CachedImage from 'react-native-expo-cached-image';
import NetInfo from '@react-native-community/netinfo';

const db = SQLite.openDatabase('arcox.db');
const CATEGORIES_API_URL = 'http://distribuidoraarcox.com/api/categories';

const CategoriesScreen = () => {
  const { state } = useContext(AuthContext);
  const [categories, setCategories] = useState([]);
  const navigation = useNavigation();

  const loadCategories = () => {
    db.transaction(
      (tx) => {
        tx.executeSql(
          'SELECT * FROM categories',
          [],
          (_, { rows: { _array } }) => {
            setCategories(_array);
            console.log('categorías cargadas');
          },
          (tx, error) => {
            console.error('Error al cargar categorías desde la base de datos', error);
            return true;
          }
        );
      },
      (error) => {
        console.error('Error en la transacción de la base de datos', error);
      }
    );
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(CATEGORIES_API_URL, {
        headers: {
          Authorization: `Bearer ${state.token}`,
        },
      });
      setCategories(response.data.data);

      db.transaction(
        (tx) => {
          tx.executeSql('DELETE FROM categories', []);
          response.data.data.forEach((category) => {
            tx.executeSql('INSERT INTO categories (id, name, image) VALUES (?, ?, ?)', [
              category.id,
              category.name,
              category.image,
            ]);
          });
        },
        (error) => {
          console.error('Error al guardar categorías en la base de datos', error);
        }
      );
    } catch (error) {
      console.error('Error al obtener categorías de la API', error);
      Alert.alert('Error', 'No se pudieron obtener las categorías. Verifique su conexión a Internet.');
    }
  };

  useEffect(() => {
    const checkConnectivityAndFetch = async () => {
      const state = await NetInfo.fetch();
      if (state.isConnected) {
        fetchCategories();
      } else {+
        Alert.alert('Sin conexión', 'No se pudo conectar a Internet. Mostrando categorías almacenadas.');
      }
    };

    loadCategories();
    checkConnectivityAndFetch();
  }, [state.token]);

  const navigateToProductsByCategory = (categoryName) => {
    try {
      navigation.navigate('Home', {
        screen: 'Productos',
        params: { category: categoryName },
      });
    } catch (error) {
      console.error('Error al navegar a la pantalla de productos', error);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {categories.map((category) => (
        <TouchableOpacity key={category.id} style={styles.category} onPress={() => navigateToProductsByCategory(category.name)}>
          <CachedImage
            source={{ uri: `http://distribuidoraarcox.com/${category.image}` }}
            style={styles.image}
          />
          <Text style={styles.name}>{category.name}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  category: {
    margin: 10,
    alignItems: 'center',
    width: Dimensions.get('window').width / 2 - 20,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  image: {
    width: Dimensions.get('window').width / 2 - 30,
    height: Dimensions.get('window').width / 2 - 30,
    marginTop: 10,
  },
  name: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
});

export default CategoriesScreen;
