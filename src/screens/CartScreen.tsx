import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { getRecipeImageSource } from '../recipeImageSource';

const CartScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { t } = useTranslation('common');
  const { user } = useAuth();
  const { items, loading, total, removeRecipe, clear, sync } = useCart();
  const [failedImages, setFailedImages] = useState<Record<string, true>>({});

  const isLoggedIn = Boolean(user?.email);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.text}>{t('cartMobile.loading')}</Text>
      </View>
    );
  }

  const openRecipeDetail = (recipeId: string, title?: string) => {
    const parent = navigation.getParent?.();
    if (!parent) return;
    parent.navigate('RecipesTab', {
      screen: 'RecipeDetail',
      params: {
        id: recipeId,
        title: title || '',
      },
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('cartMobile.title')}</Text>
        <Pressable onPress={sync} disabled={!isLoggedIn} style={[styles.smallBtn, !isLoggedIn && styles.smallBtnDisabled]}>
          <Text style={styles.smallBtnText}>{t('cartMobile.refresh')}</Text>
        </Pressable>
      </View>

      {!isLoggedIn && (
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>{t('cartMobile.loginInfo')}</Text>
        </View>
      )}

      {items.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.text}>{t('cartMobile.empty')}</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={items}
            keyExtractor={(it) => it.recipeId}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <View style={styles.row}>
                <Pressable style={styles.rowMain} onPress={() => openRecipeDetail(item.recipeId, item.title)}>
                  <Image
                    source={getRecipeImageSource({
                      recipeId: item.recipeId,
                      image: item.image,
                      imageFailed: !!failedImages[item.recipeId],
                    })}
                    style={styles.image}
                    onError={() => setFailedImages((prev) => ({ ...prev, [item.recipeId]: true }))}
                  />
                  <View style={styles.rowBody}>
                    <Text style={styles.rowTitle} numberOfLines={2}>
                      {item.title}
                    </Text>
                    <Text style={styles.rowMeta}>
                      {item.quantity} × {item.unitPrice} FCFA
                    </Text>
                  </View>
                </Pressable>
                <Pressable onPress={() => removeRecipe(item.recipeId)} style={styles.removeBtn}>
                  <Text style={styles.removeText}>X</Text>
                </Pressable>
              </View>
            )}
          />

          <View style={styles.footer}>
            <Text style={styles.total}>{t('cartMobile.total', { total })}</Text>
            <View style={styles.footerActions}
            >
              <Pressable onPress={clear} style={styles.clearBtn}>
                <Text style={styles.clearText}>{t('cartMobile.clear')}</Text>
              </Pressable>
              <Pressable
                onPress={() => navigation.navigate('Checkout')}
                style={[styles.checkoutBtn, (!isLoggedIn || items.length === 0) && styles.checkoutBtnDisabled]}
                disabled={!isLoggedIn || items.length === 0}
              >
                <Text style={styles.checkoutText}>{t('cartMobile.checkout')}</Text>
              </Pressable>
            </View>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontSize: 22, fontWeight: '900', color: '#111' },
  smallBtn: {
    backgroundColor: '#eee',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  smallBtnDisabled: { opacity: 0.5 },
  smallBtnText: { fontWeight: '800', color: '#111' },
  infoBox: {
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  infoText: { color: '#7C2D12', fontWeight: '800' },
  list: { padding: 16, gap: 10 },
  row: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#eee',
    padding: 10,
  },
  rowMain: { flex: 1, flexDirection: 'row', gap: 12, alignItems: 'center' },
  image: { width: 64, height: 64, borderRadius: 12, backgroundColor: '#f2f2f2' },
  rowBody: { flex: 1, gap: 4 },
  rowTitle: { fontWeight: '900', color: '#111' },
  rowMeta: { color: '#444', fontWeight: '700' },
  removeBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B1D1D',
  },
  removeText: { color: '#fff', fontWeight: '900' },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  total: { fontWeight: '900', fontSize: 16, color: '#111' },
  footerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  clearBtn: {
    backgroundColor: '#111',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  clearText: { color: '#fff', fontWeight: '900' },
  checkoutBtn: {
    backgroundColor: '#8B1D1D',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  checkoutBtnDisabled: { opacity: 0.5 },
  checkoutText: { color: '#fff', fontWeight: '900' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16, gap: 8 },
  text: { color: '#444', textAlign: 'center' },
});

export default CartScreen;
