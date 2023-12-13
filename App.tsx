import React, { useState } from 'react';
import { View, Button, Text, FlatList, StyleSheet, Platform, Alert } from 'react-native';
import { BleManager, Device } from 'react-native-ble-plx';
import { PERMISSIONS, RESULTS, request } from 'react-native-permissions';
import { NativeModules } from 'react-native';


const App = () => {
    const [devices, setDevices] = useState<Device[]>([]);

    // Only instantiate BleManager for Android and iOS
    const bleManager = Platform.OS !== 'windows' ? new BleManager() : null;

    const requestBluetoothPermission = async () => {
        if (Platform.OS === 'android') {
            const result = await request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
            return result === RESULTS.GRANTED;
        }
        // No need for permissions on iOS for BLE
        return true;
    };

    const scanDevices = async () => {
        const isAuthorized = await requestBluetoothPermission();
        if (!isAuthorized) {
            console.log('Bluetooth permission denied');
            return;
        }
        bleManager?.startDeviceScan(null, null, (error, device) => {
            if (error) {
                console.error(error);
                return;
            }

            if (device) {
                setDevices(prevDevices => {
                    if (prevDevices.every(prevDevice => prevDevice.id !== device.id)) {
                        return [...prevDevices, device];
                    }
                    return prevDevices;
                });
            }
        });

        // Stop scanning after 5 seconds
        setTimeout(() => bleManager?.stopDeviceScan(), 5000);
    };

    const handlePress = async () => {
        if (Platform.OS === 'windows') {
            // Assuming your native module has `startScanning` and `stopScanning` methods
            try {
                await NativeModules.BLEModule.startScanning();
                // After some time, you might want to stop scanning, similar to what you do on Android/iOS
                setTimeout(() => {
                    NativeModules.BLEModule.stopScanning();
                }, 5000);
            } catch (error) {
                console.error('Error starting BLE scan on Windows', error);
            }
        } else {
            // Existing logic for Android and iOS
            scanDevices();
        }
    };


    return (
        <View style={styles.container}>
            <Button
                title={Platform.OS === 'windows' ? 'Cannot Scan on Windows' : 'Scan for Devices'}
                onPress={handlePress}
            />
            <FlatList
                data={devices}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <Text>{item.name || `Unnamed Device (ID: ${item.id})`}</Text>
                )}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginTop: 50,
        paddingHorizontal: 20
    },
});

export default App;
