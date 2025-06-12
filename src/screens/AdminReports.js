import React, { useState, useEffect, useContext } from 'react';
import { View, TextInput, Text, StyleSheet, Alert, Linking } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Button, Icon, Card } from 'react-native-elements';
import * as SQLite from 'expo-sqlite';
import TicketService from '../services/ticketService';
import { Context as AuthContext } from '../context/AuthContext';

const db = SQLite.openDatabase('arcox.db');

const AdminReports = () => {
  const { state } = useContext(AuthContext);
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [salesCount, setSalesCount] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [cartItems2, setCartItems2] = useState([]);
  const [expensesValue, setExpensesValue] = useState('');
  const [localTicketRestockUrl, setLocalTicketRestockUrl] = useState('');
  const [localTicketCutUrl, setLocalTicketCutUrl] = useState('');

  useEffect(() => {
    if (authenticated) {
      fetchSalesCount();
      fetchSales();
      fetchSalesFull();
    }
  }, [authenticated]);

  useFocusEffect(
    React.useCallback(() => {
      if (authenticated) {
        fetchSalesCount();
        fetchSales();
        fetchSalesFull();
      }
    }, [authenticated])
  );

  const authenticate = () => {
    if (password === 'admin') {
      setAuthenticated(true);
      setPassword('');
    } else {
      Alert.alert('Contrase\u00f1a incorrecta');
    }
  };

  const calculateTotal = () => {
    let total = 0;
    cartItems.forEach((item) => {
      total += JSON.parse(item.data).total;
    });
    return total.toFixed(2);
  };

  const calculateTotalCanceled = () => {
    let total = 0;
    cartItems2.forEach((item) => {
      if (item.status == 3) {
        total += item.total;
      }
    });
    return total.toFixed(2);
  };

  const handlePrintResurtido = () => {
    const ticketUrl = TicketService.generateTicket('resurtido', cartItems);
    setLocalTicketRestockUrl(ticketUrl);
    Linking.openURL(ticketUrl).catch(err => console.error('Failed to open URL:', err));
  };

  const handlePrintReporteVentas = () => {
    const ticketUrl = TicketService.generateReportTicket(state.name, cartItems2, +calculateTotal(), +expensesValue, +(calculateTotal() - expensesValue), +calculateTotalCanceled());
    setLocalTicketCutUrl(ticketUrl);
    Linking.openURL(ticketUrl).catch(err => console.error('Failed to open URL:', err));
  };

  const handlePrintReporteDescuentos = () => {
    const ticketUrl = TicketService.generateReportDiscountsTicket(state.name, cartItems2, +calculateTotal(), +expensesValue, +(calculateTotal() - expensesValue));
    setLocalTicketCutUrl(ticketUrl);
    Linking.openURL(ticketUrl).catch(err => console.error('Failed to open URL:', err));
  };

  const handleSetClosedDayFalse = () => {
    if (localTicketRestockUrl && localTicketCutUrl) {
      Linking.openURL(localTicketRestockUrl).catch(err => console.error('Failed to open URL:', err));
      Linking.openURL(localTicketCutUrl).catch(err => console.error('Failed to open URL:', err));
    }
  };

  const fetchSalesFull = async () => {
    try {
      await new Promise((resolve, reject) => {
        db.transaction((tx) => {
          tx.executeSql(
            'SELECT * FROM sales ',
            [],
            (_, { rows }) => {
              const parsedSales = rows._array
                .filter(row => typeof row.data === 'string')
                .map(row => {
                  try {
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
              setCartItems2(parsedSales);
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

  const fetchSalesCount = () => {
    try {
      db.transaction((tx) => {
        tx.executeSql('SELECT COUNT(*) AS count FROM sales WHERE status = 0', [], (_, { rows }) => {
          const { count } = rows.item(0);
          setSalesCount(count);
        });
      });
    } catch (error) {
      console.error('Error fetching sales count:', error);
    }
  };

  if (!authenticated) {
    return (
      <View style={styles.authContainer}>
        <Text style={styles.headerText}>Acceso Administrador</Text>
        <TextInput
          placeholder="Contrase\u00f1a"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={styles.input}
        />
        <Button title="Ingresar" onPress={authenticate} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={{ height: 700 }}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerText}>Reportes</Text>
        </View>
        <Card>
          <Card.Title>Total de Ventas</Card.Title>
          <Card.Divider />
          <Text style={styles.salesCountText}>{salesCount}</Text>
        </Card>
        <View style={styles.tabContainer}>
          <Text>Gastos:</Text>
          <TextInput
            placeholder="Ingrese sus Gastos"
            keyboardType='numeric'
            placeholderTextColor="black"
            value={expensesValue}
            onChangeText={(value) => setExpensesValue(value)}
          />
        </View>
        <Button
          title="Reimprimir"
          type="outline"
          onPress={handleSetClosedDayFalse}
          containerStyle={styles.button}
          titleStyle={styles.buttonTitle}
          icon={<Icon name="printer" type="material-community" color="#4285F4" />}
        />
        <Button
          title="   Precorte"
          type="outline"
          onPress={handlePrintResurtido}
          containerStyle={styles.button}
          titleStyle={styles.buttonTitle}
          icon={<Icon name="printer" type="material-community" color="#3F8FFF" />}
        />
        <Button
          title="   Reporte de Ventas"
          type="outline"
          onPress={handlePrintReporteVentas}
          containerStyle={styles.button}
          titleStyle={styles.buttonTitle}
          icon={<Icon name="printer" type="material-community" color="#3F8FFF" />}
        />
        <Button
          title="   Reporte de Descuentos"
          type="outline"
          onPress={handlePrintReporteDescuentos}
          containerStyle={styles.button}
          titleStyle={styles.buttonTitle}
          icon={<Icon name="printer" type="material-community" color="#3F8FFF" />}
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
  salesCountText: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 16,
  },
  button: {
    borderRadius: 8,
    borderColor: '#4285F4',
    marginVertical: 5,
  },
  buttonTitle: {
    fontSize: 16,
    color: '#4285F4',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#eee',
    padding: 16,
  },
  authContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    width: '80%',
    paddingHorizontal: 10,
    marginVertical: 10,
  },
});

export default AdminReports;
