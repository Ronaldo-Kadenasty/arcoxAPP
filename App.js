import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Icon } from 'react-native-elements';
import { ActivityIndicator, View } from 'react-native';
import Signin from './src/screens/Signin';
import CategoriesScreen from './src/screens/Categories';

import Tab3 from './src/screens/Account';
import Sales from './src/screens/Sales'
import BarCode from './src/screens/BarCode';
import Carrito from './src/screens/Profile';
import Productos from './src/screens/Products';
import { Provider as AuthProvider, Context as AuthContext } from './src/context/AuthContext.js';
import { Provider } from 'react-redux';
import store from './src/store';
import CartProvider from './src/context/CartContext';
import ProductsProvider from './src/context/ProductsContext';

const AuthStack = createStackNavigator();
function AuthFlow() {
  return (
    <AuthStack.Navigator>
      <AuthStack.Screen
        options={{ headerShown: false }}
        name="Signin"
        component={Signin}
      />
      <AuthStack.Screen
        options={{ headerShown: false }}
        name="Signup"
        component={Signin}
      />
    </AuthStack.Navigator>
  );
}

const Tab = createBottomTabNavigator();
function HomeFlow() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Categorías':
              iconName = focused
                ? 'ios-checkbox'
                : 'ios-checkbox-outline';
              break;
            case 'Promociones':
              iconName = focused
                ? 'ios-add-circle'
                : 'ios-add-circle-outline';
              break;
            case 'Carrito':
              iconName = focused
                ? 'cart'
                : 'cart';
              break;
            case 'Productos':
              iconName = focused
                ? 'ios-add-circle'
                : 'ios-add-circle-outline';
              break;
            // case 'Escaner':
            //   iconName = focused
            //     ? 'ios-add-circle'
            //     : 'ios-add-circle-outline';
            //   break;
            case 'Ventas':
              iconName = focused
                ? 'ios-add-circle'
                : 'ios-add-circle-outline';
              break;
            case 'Cuenta':
              iconName = focused
                ? 'settings-outline'
                : 'settings-outline';
              break;
          }

          return (
            <Icon name={iconName} type="ionicon" size={size} color={color} />
          );
        },
      })}
    >
      <Tab.Screen name="Categorías" component={CategoriesScreen} />
      <Tab.Screen name="Productos" component={Productos} />
      <Tab.Screen name="Carrito" component={Carrito} />
      {/* <Tab.Screen name="Escaner" component={BarCode} /> */}
      <Tab.Screen name="Ventas" component={Sales} />
      <Tab.Screen name="Cuenta" component={Tab3} />
    </Tab.Navigator>
  );
}

const Stack = createStackNavigator();
function App() {
  const { state, tryLocalSignin } = React.useContext(AuthContext);

  React.useEffect(() => {
    tryLocalSignin();
  }, []);

  if (state.isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {state.token === null ? (
          <Stack.Screen
            options={{ headerShown: false }}
            name="Auth"
            component={AuthFlow}
          />
        ) : (
          <Stack.Screen
            options={{ headerShown: false }}
            name="Home"
            component={HomeFlow}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default () => {
  return (
    <AuthProvider>
      <Provider store={store}>
        <CartProvider>
          <ProductsProvider>
            <App />
          </ProductsProvider>
        </CartProvider>
      </Provider>
    </AuthProvider>
  );
};
