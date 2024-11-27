import createDataContext from './createDataContext';
import axios from 'axios';
import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabase('arcox.db');
const CATEGORIES_API_URL = 'http://distribuidoraarcox.com/api/categories';
const CLIENTS_API_URL = 'http://distribuidoraarcox.com/api/clients';

function saveDataToDatabase(data) {
  db.transaction((tx) => {
    tx.executeSql(
      'DROP TABLE IF EXISTS products',
      [],
      () => {
        console.log('Table dropped successfully');
      },
      (_, error) => {
        console.log('Error dropping table', error);
      }
    );
    tx.executeSql(
      'CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY, name TEXT, description TEXT, stock INTEGER, barcode TEXT, price REAL, image TEXT, category_id INTEGER, category_name TEXT)',
      [],
      () => {
        data.forEach((product) => {
          tx.executeSql(
            'INSERT INTO products (id, name, description, stock, barcode, price, image, category_id, category_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [product.old_product_id, product.name, product.description, product.stock, product.barcode, product.price, product.image, product.category_id, product.category.name],
            (_, { rowsAffected, insertId }) => {
              // console.log(`Inserted ${rowsAffected} rows with id: ${insertId}`);
            },
            (_, error) => {
              console.log('Error inserting product', error);
            }
          );
        });
      },
      (_, error) => {
        console.log('Error creating table', error);
      }
    );
  });
}

function saveDataToDatabaseCat(data) {
  db.transaction((tx) => {
    tx.executeSql(
      'DROP TABLE IF EXISTS categories',
      [],
      () => {
        console.log('Table dropped successfully');
      },
      (_, error) => {
        console.log('Error dropping table', error);
      }
    );
    tx.executeSql(
      'CREATE TABLE IF NOT EXISTS categories (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, description TEXT, image TEXT)',
      [],
      () => {
        data.forEach((product) => {
          tx.executeSql(
            'INSERT INTO categories (name, description, image) VALUES (?, ?, ?)',
            [product.name, product.description, product.image],
            (_, { rowsAffected, insertId }) => {
              // console.log(`Inserted Cat ${rowsAffected} rows with id: ${insertId}`);
            },
            (_, error) => {
              console.log('Error inserting product', error);
            }
          );
        });
      },
      (_, error) => {
        console.log('Error creating table', error);
      }
    );
  });
}

function saveDataToDatabaseCli(data) {
  db.transaction((tx) => {
    tx.executeSql(
      'DROP TABLE IF EXISTS clients',
      [],
      () => {
        console.log('Table dropped successfully');
      },
      (_, error) => {
        console.log('Error dropping table', error);
      }
    );
    tx.executeSql(
      'CREATE TABLE IF NOT EXISTS clients (id INTEGER PRIMARY KEY, name TEXT, address TEXT, phone TEXT)',
      [],
      () => {
        data.forEach((product) => {
          tx.executeSql(
            'INSERT INTO clients (id, name, address, phone) VALUES (?, ?, ?, ?)',
            [product.id, product.name, product.address, product.phone],
            (_, { rowsAffected, insertId }) => {
              // console.log(`Inserted Cli ${rowsAffected} rows with id: ${insertId}`);
            },
            (_, error) => {
              console.log('Error inserting product', error);
            }
          );
        });
      },
      (_, error) => {
        console.log('Error creating table', error);
      }
    );
  });
}

const fetchCategories = async (token) => {
  try {
    const response = await axios.get(CATEGORIES_API_URL, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    saveDataToDatabaseCat(response.data.data);
  } catch (error) {
    console.error(error);
    throw error; // Propagar el error para manejo posterior
  }
};

const fetchClients = async (token) => {
  try {
    const response = await axios.get(CLIENTS_API_URL, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    saveDataToDatabaseCli(response.data.data);
  } catch (error) {
    console.error(error);
    throw error; // Propagar el error para manejo posterior
  }
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'signout':
      return { token: null, email: '' };
    case 'signin':
    case 'signup':
      return {
        name: action.payload.name,
        sellerId: action.payload.sellerId,
        udvId: action.payload.udvId,
        token: action.payload.token,
        maxDiscount: action.payload.maxDiscount,
        email: action.payload.email,
      };
    case 'add_error':
      return { ...state, errorMessage: action.payload };
    default:
      return state;
  }
};

const signup = dispatch => {
  return ({ email, password }) => {
    console.log('Signup');
  };
};

const signin = dispatch => {
  return async ({ email, password }) => {
    try {
      const response = await axios.post('http://www.distribuidoraarcox.com/api/login', { email, password });
      saveDataToDatabase(response.data.data.seller.udv.products);

      dispatch({
        type: 'signin',
        payload: {
          name: response.data.data.seller.name,
          sellerId: response.data.data.seller.id,
          udvId: response.data.data.seller.udv.id,
          token: response.data.data.token,
          maxDiscount: response.data.data.seller.udv.max_discount_for_products,
          email,
        },
      });

      await fetchCategories(response.data.data.token);
      await fetchClients(response.data.data.token);
    } catch (error) {
      let errorMessage = 'Error al iniciar sesión. Verifica tus credenciales.';
      if (error.response && error.response.status === 404) {
        errorMessage = 'Usuario no encontrado. Verifica tu correo electrónico y contraseña.';
      }
      dispatch({ type: 'add_error', payload: errorMessage });
      throw error; // Re-throw the error to handle it in the component
    }
  };
};

const signout = dispatch => {
  return () => {
    dispatch({ type: 'signout' });
  };
};

export const { Provider, Context } = createDataContext(
  authReducer,
  { signin, signout, signup },
  { token: null, email: '', errorMessage: '' },
);
