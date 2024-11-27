import React, { useState, useEffect } from 'react';
import { View, Text, Button, FlatList, TouchableOpacity } from 'react-native';
import { BleManager } from 'react-native-ble-plx';
import { EscPos } from '@leesiongchan/react-native-esc-pos';

const PrinterScreen = () => {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [isPrinting, setIsPrinting] = useState(false);

  // Initialize a Bluetooth Low Energy (BLE) manager
  const manager = new BleManager();

  // Scan for BLE devices and add them to the list
  const scanForDevices = async () => {
    try {
      const results = await manager.startDeviceScan(null, null, true);
      results.subscribe((scanResult) => {
        const { name, id } = scanResult?.advertisement?.localName ?? {};
        if (name && id && !devices.some((device) => device.id === id)) {
          setDevices((devices) => [...devices, { name, id }]);
        }
      });
    } catch (error) {
      console.error('Error scanning for devices', error);
    }
  };

  // Stop scanning for BLE devices
  const stopScanForDevices = () => {
    manager.stopDeviceScan();
  };

  // Connect to the selected printer and print some text
  const printText = async () => {
    setIsPrinting(true);
    const printer = new EscPos();
    try {
      await printer.connect(selectedDevice.id);
      await printer
        .setCharacterCodeTable('PC437')
        .setTextSize('normal')
        .setJustification('center')
        .text('Hello, world!')
        .feed(3)
        .cut('full')
        .flush();
      console.log('Print job sent successfully');
    } catch (error) {
      console.error('Error printing text', error);
    } finally {
      await printer.disconnect();
      setIsPrinting(false);
    }
  };

  // Load the list of available Bluetooth devices on mount
  useEffect(() => {
    scanForDevices();
    return () => {
      stopScanForDevices();
    };
  }, []);

  return (
    <View>
      <Text>Select a printer to print with:</Text>
      <FlatList
        data={devices}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => setSelectedDevice(item)}>
            <Text>{item.name}</Text>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.id}
      />
      <Button
        title="Print"
        onPress={printText}
        disabled={!selectedDevice || isPrinting}
      />
    </View>
  );
};

export default PrinterScreen;