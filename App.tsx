import React, { useEffect, useState } from 'react';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image, Modal, Pressable, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import i18n, { initI18n } from './src/i18n';
import { AuthProvider } from './src/contexts/AuthContext';
import { CartProvider } from './src/contexts/CartContext';
import HomeScreen from './src/screens/HomeScreen';
import RecipesListScreen from './src/screens/RecipesListScreen';
import RecipeDetailScreen from './src/screens/RecipeDetailScreen';
import CartScreen from './src/screens/CartScreen';
import CheckoutScreen from './src/screens/CheckoutScreen';
import SuccessScreen from './src/screens/SuccessScreen';
import LoginScreen from './src/screens/LoginScreen';
import CategoriesScreen from './src/screens/CategoriesScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import OrdersScreen from './src/screens/OrdersScreen';
import OrderDetailScreen from './src/screens/OrderDetailScreen';
import type { CartStackParamList, OrdersStackParamList, RecipesStackParamList, RootDrawerParamList, RootTabParamList } from './types.navigation';
import { fetchMobileConfig } from './src/api';

const RecipesStack = createNativeStackNavigator<RecipesStackParamList>();
const CartStack = createNativeStackNavigator<CartStackParamList>();
const OrdersStack = createNativeStackNavigator<OrdersStackParamList>();
const Tab = createBottomTabNavigator<RootTabParamList>();
const Drawer = createDrawerNavigator<RootDrawerParamList>();

const navigationRef = createNavigationContainerRef();

const LANGUAGE_STORAGE_KEY = 'cuisinefacile.mobile.language';
type LanguageCode = 'fr' | 'en' | 'es';

const getActiveRouteName = (state: any): string => {
  if (!state) return '';
  const idx = typeof state.index === 'number' ? state.index : 0;
  const route = state.routes?.[idx];
  if (!route) return '';
  if (route.state) return getActiveRouteName(route.state);
  return String(route.name ?? '');
};

function RecipesNavigator() {
  const { t } = useTranslation('common');
  return (
    <RecipesStack.Navigator>
      <RecipesStack.Screen name="Recipes" component={RecipesListScreen} options={{ title: t('nav.recipes') }} />
      <RecipesStack.Screen
        name="RecipeDetail"
        component={RecipeDetailScreen}
        options={({ route }) => ({ title: route.params?.title || t('nav.recipeDetail') })}
      />
    </RecipesStack.Navigator>
  );
}

function CartNavigator() {
  const { t } = useTranslation('common');
  return (
    <CartStack.Navigator>
      <CartStack.Screen name="Cart" component={CartScreen} options={{ title: t('nav.cart') }} />
      <CartStack.Screen name="Checkout" component={CheckoutScreen} options={{ title: t('nav.checkout') }} />
      <CartStack.Screen name="Success" component={SuccessScreen} options={{ headerShown: false }} />
    </CartStack.Navigator>
  );
}

function OrdersNavigator() {
  const { t } = useTranslation('common');
  return (
    <OrdersStack.Navigator>
      <OrdersStack.Screen name="Orders" component={OrdersScreen} options={{ title: t('nav.orders') }} />
      <OrdersStack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ title: t('nav.orderDetail') }} />
    </OrdersStack.Navigator>
  );
}

function DrawerContent(props: any) {
  const { navigation } = props;
  const { t } = useTranslation('common');
  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{ paddingVertical: 6 }}>
      <View style={{ paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center' }}>
        <Image
          source={require('./assets/logo.png')}
          style={{ width: 180, height: 48 }}
          resizeMode="contain"
        />
      </View>

      <Text style={{ paddingHorizontal: 16, paddingVertical: 8, color: '#777', fontWeight: '800', fontSize: 12 }}>
        {t('drawer.accountSection')}
      </Text>
      <DrawerItem
        label={t('drawer.profile')}
        onPress={() => navigation.navigate('Tabs', { screen: 'Login' })}
        icon={({ size }) => <MaterialCommunityIcons name="account-circle-outline" size={size} color="#6B7280" />}
        labelStyle={{ color: '#8B1D1D', fontWeight: '900', fontSize: 18 }}
        style={{ borderBottomWidth: 1, borderBottomColor: '#eee' }}
      />
      <DrawerItem
        label={t('drawer.notifications')}
        onPress={() => navigation.navigate('Notifications')}
        icon={({ size }) => <MaterialCommunityIcons name="bell-outline" size={size} color="#6B7280" />}
        labelStyle={{ color: '#8B1D1D', fontWeight: '900', fontSize: 18 }}
        style={{ borderBottomWidth: 1, borderBottomColor: '#eee' }}
      />
      <DrawerItem
        label={t('drawer.myCart')}
        onPress={() => navigation.navigate('Tabs', { screen: 'Cart' })}
        icon={({ size }) => <MaterialCommunityIcons name="cart-outline" size={size} color="#6B7280" />}
        labelStyle={{ color: '#8B1D1D', fontWeight: '900', fontSize: 18 }}
        style={{ borderBottomWidth: 1, borderBottomColor: '#eee' }}
      />
      <DrawerItem
        label={t('drawer.myOrders')}
        onPress={() => navigation.navigate('Orders')}
        icon={({ size }) => <MaterialCommunityIcons name="cube-outline" size={size} color="#6B7280" />}
        labelStyle={{ color: '#8B1D1D', fontWeight: '900', fontSize: 18 }}
        style={{ borderBottomWidth: 1, borderBottomColor: '#eee' }}
      />

      <Text style={{ paddingHorizontal: 16, paddingVertical: 8, color: '#777', fontWeight: '800', fontSize: 12 }}>
        {t('drawer.appSection')}
      </Text>
      <DrawerItem
        label={t('drawer.home')}
        onPress={() => navigation.navigate('Tabs', { screen: 'Home' })}
        icon={({ size }) => <MaterialCommunityIcons name="home-outline" size={size} color="#6B7280" />}
        labelStyle={{ color: '#8B1D1D', fontWeight: '900', fontSize: 18 }}
        style={{ borderBottomWidth: 1, borderBottomColor: '#eee' }}
      />
      <DrawerItem
        label={t('drawer.categories')}
        onPress={() => navigation.navigate('Tabs', { screen: 'Categories' })}
        icon={({ size }) => <MaterialCommunityIcons name="layers-outline" size={size} color="#6B7280" />}
        labelStyle={{ color: '#8B1D1D', fontWeight: '900', fontSize: 18 }}
        style={{ borderBottomWidth: 1, borderBottomColor: '#eee' }}
      />
      <DrawerItem
        label={t('drawer.recipes')}
        onPress={() => navigation.navigate('Tabs', { screen: 'RecipesTab' })}
        icon={({ size }) => <MaterialCommunityIcons name="food-outline" size={size} color="#6B7280" />}
        labelStyle={{ color: '#8B1D1D', fontWeight: '900', fontSize: 18 }}
      />
    </DrawerContentScrollView>
  );
}

function TabsWithHeader({ navigation }: any) {
  const { t } = useTranslation('common');
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [language, setLanguage] = useState<LanguageCode>('fr');
  const [languageModalOpen, setLanguageModalOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchMobileConfig()
      .then((cfg) => {
        if (cancelled) return;
        setLogoUrl(String(cfg?.logo_url ?? '').trim());
      })
      .catch(() => {
        // noop
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (cancelled) return;
        if (raw === 'fr' || raw === 'en' || raw === 'es') {
          setLanguage(raw);
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const updateLanguage = async (next: LanguageCode) => {
    setLanguage(next);
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, next);
    } catch {
      // ignore
    }
    try {
      await i18n.changeLanguage(next);
    } catch {
      // ignore
    }
  };

  const activeRouteName = navigationRef.isReady() ? getActiveRouteName(navigationRef.getRootState()) : '';
  const showBack = activeRouteName === 'RecipeDetail' || activeRouteName === 'OrderDetail';

  const onLogoPress = () => {
    const refreshKey = Date.now();
    navigation.navigate('Tabs', {
      screen: 'Home',
      params: { refreshKey },
    });
  };

  return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          height: 70,
          paddingHorizontal: 12,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottomWidth: 1,
          borderBottomColor: '#eee',
          backgroundColor: '#fff',
        }}
      >
        {showBack ? (
          <Pressable onPress={() => navigationRef.goBack()} style={{ padding: 14 }}>
            <Text style={{ fontSize: 26, fontWeight: '900', color: '#8B1D1D' }}>‹</Text>
          </Pressable>
        ) : (
          <Pressable onPress={() => navigation.openDrawer()} style={{ padding: 14 }}>
            <Text style={{ fontSize: 26, fontWeight: '900', color: '#8B1D1D' }}>≡</Text>
          </Pressable>
        )}
        <Pressable onPress={onLogoPress} style={{ paddingVertical: 6 }}>
          {logoUrl ? (
            <Image source={{ uri: logoUrl }} style={{ height: 40, width: 260 }} resizeMode="contain" />
          ) : (
            <Image source={require('./assets/logo.png')} style={{ height: 40, width: 260 }} resizeMode="contain" />
          )}
        </Pressable>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Pressable
            style={{ padding: 8 }}
            onPress={() => {
              const focusSearch = Date.now();
              navigation.navigate('Tabs', {
                screen: 'RecipesTab',
                params: {
                  screen: 'Recipes',
                  params: { focusSearch },
                },
              });
            }}
          >
            <MaterialCommunityIcons name="magnify" size={20} color="#8B1D1D" />
          </Pressable>
          <Pressable onPress={() => setLanguageModalOpen(true)} style={{ paddingVertical: 8, paddingHorizontal: 10 }}>
            <Text style={{ fontWeight: '900', color: '#2563EB' }}>{String(language).toUpperCase()}</Text>
          </Pressable>
        </View>
      </View>

      <Modal
        visible={languageModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setLanguageModalOpen(false)}
      >
        <Pressable
          onPress={() => setLanguageModalOpen(false)}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', justifyContent: 'center', paddingHorizontal: 24 }}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{ backgroundColor: '#fff', borderRadius: 18, padding: 16 }}
          >
            <Text style={{ fontWeight: '900', fontSize: 16, color: '#111', marginBottom: 12 }}>{t('language.title')}</Text>
            {(
              [
                { code: 'fr' as const, label: t('language.fr') },
                { code: 'en' as const, label: t('language.en') },
                { code: 'es' as const, label: t('language.es') },
              ]
            ).map((opt) => {
              const active = opt.code === language;
              return (
                <Pressable
                  key={opt.code}
                  onPress={() => {
                    void updateLanguage(opt.code);
                    setLanguageModalOpen(false);
                  }}
                  style={{
                    paddingVertical: 12,
                    paddingHorizontal: 12,
                    borderRadius: 14,
                    backgroundColor: active ? 'rgba(139,29,29,0.08)' : 'transparent',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Text style={{ fontWeight: '900', color: '#8B1D1D', fontSize: 14 }}>
                    {opt.label}
                  </Text>
                  <Text style={{ fontWeight: '900', color: '#2563EB' }}>{opt.code.toUpperCase()}</Text>
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>

      <Tab.Navigator screenOptions={{ headerShown: false, tabBarStyle: { display: 'none' } }}>
        <Tab.Screen name="Home" component={HomeScreen} options={{ title: t('nav.home') }} />
        <Tab.Screen name="RecipesTab" component={RecipesNavigator} options={{ title: t('nav.recipes') }} />
        <Tab.Screen name="Cart" component={CartNavigator} options={{ title: t('nav.cart') }} />
        <Tab.Screen name="Login" component={LoginScreen} options={{ title: t('nav.login') }} />
        <Tab.Screen name="Categories" component={CategoriesScreen} options={{ title: t('nav.categories') }} />
      </Tab.Navigator>
    </View>
  );
}

export default function App() {
  const [i18nReady, setI18nReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await initI18n();
        if (!cancelled) setI18nReady(true);
      } catch {
        if (!cancelled) setI18nReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!i18nReady) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
        <Text style={{ fontWeight: '900', color: '#8B1D1D' }}>CuisineFacile</Text>
      </View>
    );
  }

  return (
    <AuthProvider>
      <CartProvider>
        <NavigationContainer ref={navigationRef}>
          <StatusBar style="auto" />
          <Drawer.Navigator
            screenOptions={{ headerShown: false }}
            drawerContent={(props) => <DrawerContent {...props} />}
          >
            <Drawer.Screen name="Tabs" component={TabsWithHeader} />
            <Drawer.Screen name="Notifications" component={NotificationsScreen} />
            <Drawer.Screen name="Orders" component={OrdersNavigator} />
          </Drawer.Navigator>
        </NavigationContainer>
      </CartProvider>
    </AuthProvider>
  );
}
