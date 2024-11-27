import React, { useState, useContext, useEffect } from 'react';
import { Icon } from 'react-native-elements';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Input, Button } from 'react-native-elements';
import { Context as AuthContext } from '../context/AuthContext';

const Signin = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { state, signin } = useContext(AuthContext);
  const [hidePassword, setHidePassword] = useState(true);

  useEffect(() => {
    if (state.errorMessage) {
      Alert.alert('Error de autenticación', state.errorMessage);
    }
  }, [state.errorMessage]);

  const handleSignin = async () => {
    try {
      await signin({ email, password });
    } catch (error) {
      // El error se maneja en el contexto, por lo que no es necesario hacer nada aquí
    }
  };

  return (
    <View style={styles.master}>
      <Text style={styles.header}>Arcox Ventas</Text>
      <Input
        placeholder="Correo Electrónico"
        onChangeText={setEmail}
        value={email}
        leftIcon={<Icon name="envelope" type="font-awesome" size={24} />}
      />
      <Input
        placeholder="Contraseña"
        onChangeText={setPassword}
        value={password}
        leftIcon={<Icon name="key" type="font-awesome" size={24} />}
        rightIcon={
          <TouchableOpacity onPress={() => setHidePassword(!hidePassword)}>
            <Icon
              name={hidePassword ? 'eye-slash' : 'eye'}
              type="font-awesome"
              size={24}
            />
          </TouchableOpacity>
        }
        secureTextEntry={hidePassword}
      />
      <Button
        title="Ingresar"
        type="clear"
        onPress={handleSignin}
      />
      {/* <View style={styles.link}>
        <Text style={styles.text}>Dont have an account? </Text>
        <TouchableOpacity onPress={() => {}}>
          <Text style={styles.text}>Sign up Here.</Text>
        </TouchableOpacity>
      </View> */}
    </View>
  );
};

const styles = StyleSheet.create({
  master: {
    padding: 16,
    flex: 1,
    alignItems: 'stretch',
    justifyContent: 'center',
  },
  header: {
    fontSize: 32,
    marginBottom: 18,
    alignSelf: 'center',
  },
  text: {
    fontSize: 16,
    marginTop: 16,
  },
  link: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
});

export default Signin;
