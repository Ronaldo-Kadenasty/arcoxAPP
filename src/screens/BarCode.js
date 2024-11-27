import React, { useContext,useState, useEffect } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { Audio } from 'expo-av';
import * as SQLite from 'expo-sqlite';
import { CartContext } from '../context/CartContext';
const db = SQLite.openDatabase('arcox.db');

export default function BarcodeScanner() {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [sound, setSound] = useState();
  const { addOneToCart } = useContext(CartContext);

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  const handleBarCodeScanned = ({ type, data }) => {
    setScanned(true);
    if (sound) {
      sound.replayAsync();
    }
    db.transaction((tx) => {
      tx.executeSql(
        'SELECT * FROM products WHERE barcode = ?',
        [data],
        (_, { rows }) => {
          if (rows.length > 0) {
            console.log('found');
            console.log(rows.item(0));
            addOneToCart(rows.item(0));
            //setScanned(false); 

          }
        },
        (_, error) => {
          console.log('Error checking for product', error);
        }
      );
    });
    setTimeout(() => {
      setScanned(false);
    }, 2000); 
  };

  const playSound = async () => {
    const { sound } = await Audio.Sound.createAsync(
      require('../../assets/beep-07a.wav')
    );
    setSound(sound);
  };

  if (hasPermission === null) {
    return <Text>Requesting for camera permission</Text>;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <View style={styles.container}>
      <BarCodeScanner
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={StyleSheet.absoluteFillObject}
      />
      {scanned && (
        <Text style={styles.scanText} onPress={() => setScanned(false)}>
          Tap to Scan Again
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
  },
  scanText: {
    fontSize: 18,
    margin: 10,
    color: '#222',
    textAlign: 'center',
  },
});