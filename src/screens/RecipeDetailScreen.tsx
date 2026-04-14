import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RecipesStackParamList } from '../../types.navigation';
import { fetchRecipeDetail } from '../api';
import type { RecipeDetail } from '../types';
import { useCart } from '../contexts/CartContext';
import { getRecipeImageSource } from '../recipeImageSource';
import { useTranslation } from 'react-i18next';

type Props = NativeStackScreenProps<RecipesStackParamList, 'RecipeDetail'>;

const RecipeDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { t } = useTranslation('common');
  const { id } = route.params;
  const { addRecipe } = useCart();
  const [data, setData] = useState<RecipeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [personsCount, setPersonsCount] = useState(1);
  const [recipesCount, setRecipesCount] = useState(1);
  const [imageFailed, setImageFailed] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    const r = await fetchRecipeDetail(id);
    setData(r);
  }, [id]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await load();
      } catch (e: any) {
        setError(e?.message ?? 'Erreur');
      } finally {
        setLoading(false);
      }
    })();
  }, [load]);

  const unitLabel = String(data?.time ?? '').trim();

  const basePrice = Number(data?.price ?? 0);
  const totalPrice = Math.max(0, basePrice) * Math.max(1, personsCount) * Math.max(1, recipesCount);
  const formatFcfa = (value: number) => {
    const n = Number.isFinite(value) ? value : 0;
    try {
      return `${Math.round(n).toLocaleString('fr-FR')} F CFA`;
    } catch {
      return `${Math.round(n)} F CFA`;
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.centerText}>{t('recipeDetailMobile.loading')}</Text>
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>{t('recipeDetailMobile.errorTitle')}</Text>
        <Text style={styles.centerText}>{error ?? t('recipeDetailMobile.notFound')}</Text>
        <Pressable onPress={load} style={styles.retryBtn}>
          <Text style={styles.retryText}>{t('recipeDetailMobile.retry')}</Text>
        </Pressable>
      </View>
    );
  }

  const onAddToCart = () => {
    addRecipe({
      recipeId: data.id,
      title: data.title,
      image: data.image,
      unitPrice: totalPrice,
    });

    Alert.alert(t('recipeDetailMobile.cartAlertTitle'), t('recipeDetailMobile.addedToCart'));
    goToCart();
  };

  const goToCart = () => {
    const parent = navigation.getParent?.();
    if (parent) {
      parent.navigate('Cart' as never);
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container}>
        <ImageBackground
          source={getRecipeImageSource({ recipeId: data.id, image: data.image, imageFailed })}
          onError={() => setImageFailed(true)}
          style={styles.hero}
        >
          <View style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle} numberOfLines={2}>
              {data.title}
            </Text>
            <Text style={styles.heroPrice}>
              {t('recipeDetailMobile.pricePerPerson', { amount: data.price })}
            </Text>
          </View>
          {!!unitLabel && (
            <View style={styles.timeBadge}>
              <Text style={styles.timeBadgeText}>{unitLabel}</Text>
            </View>
          )}
        </ImageBackground>

        <View style={styles.content}>
          <View style={styles.sectionCard}>
            <Text style={styles.sectionKicker}>{t('recipeDetailMobile.customizeKicker')}</Text>

            <View style={styles.counterRow}>
              <View style={styles.counterCard}>
                <Text style={styles.counterTitle}>{t('recipeDetailMobile.peopleCount')}</Text>
                <View style={styles.counterControls}>
                  <Pressable onPress={() => setPersonsCount((v) => Math.max(1, v - 1))} style={styles.counterBtn}>
                    <Text style={styles.counterBtnText}>−</Text>
                  </Pressable>
                  <Text style={styles.counterValue}>{personsCount}</Text>
                  <Pressable onPress={() => setPersonsCount((v) => v + 1)} style={styles.counterBtn}>
                    <Text style={styles.counterBtnText}>+</Text>
                  </Pressable>
                </View>
              </View>

              <View style={styles.counterCard}>
                <Text style={styles.counterTitle}>{t('recipeDetailMobile.recipesCount')}</Text>
                <View style={styles.counterControls}>
                  <Pressable onPress={() => setRecipesCount((v) => Math.max(1, v - 1))} style={styles.counterBtn}>
                    <Text style={styles.counterBtnText}>−</Text>
                  </Pressable>
                  <Text style={styles.counterValue}>{recipesCount}</Text>
                  <Pressable onPress={() => setRecipesCount((v) => v + 1)} style={styles.counterBtn}>
                    <Text style={styles.counterBtnText}>+</Text>
                  </Pressable>
                </View>
              </View>
            </View>

            <View style={styles.priceBlock}>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>{t('recipeDetailMobile.basePrice')}</Text>
                <Text style={styles.priceValue}>{formatFcfa(basePrice)}</Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceTotalLabel}>{t('recipeDetailMobile.personalizedTotal')}</Text>
                <Text style={styles.priceTotalValue}>{formatFcfa(totalPrice)}</Text>
              </View>
            </View>

            <Pressable
              onPress={onAddToCart}
              style={({ pressed }) => [styles.addToCartWide, pressed && styles.pressed]}
            >
              <Text style={styles.addToCartWideText}>{t('recipeDetailMobile.addToCart')}</Text>
            </Pressable>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{t('recipeDetailMobile.ingredientsTitle')}</Text>

            {data.ingredients.length === 0 ? (
              <Text style={styles.empty}>{t('recipeDetailMobile.noIngredients')}</Text>
            ) : (
              <View style={styles.ingredientsList}>
                {data.ingredients.map((ing) => (
                  <View key={ing.id} style={styles.ingredientRow}>
                    <Text style={styles.ingredientName}>{ing.name}</Text>
                    <Text style={styles.ingredientQty}>
                      {ing.quantity} {ing.unit}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            <Pressable style={styles.extraBtn}>
              <Text style={styles.extraBtnText}>{t('recipeDetailMobile.addExtraIngredients')}</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.stepsSection}>
          <Text style={styles.stepsTitle}>{t('recipeDetailMobile.preparationTitle')}</Text>
          {data.preparation_steps.length === 0 ? (
            <Text style={styles.empty}>{t('recipeDetailMobile.noSteps')}</Text>
          ) : (
            [...data.preparation_steps]
              .sort((a, b) => a.step_number - b.step_number)
              .map((s) => (
                <View key={s.id} style={styles.step}>
                  <Text style={styles.stepNumber}>{t('recipeDetailMobile.step', { number: s.step_number })}</Text>
                  <Text style={styles.stepText}>{s.description}</Text>
                </View>
              ))
          )}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={styles.bottomBar}>
        <Pressable onPress={onAddToCart} style={styles.bottomPrimaryBtn}>
          <Text style={styles.bottomPrimaryText}>{t('recipeDetailMobile.addToCart')}</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            onAddToCart();
            goToCart();
          }}
          style={styles.bottomSecondaryBtn}
        >
          <Text style={styles.bottomSecondaryText}>{t('recipeDetailMobile.orderRecipe')}</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  container: { paddingBottom: 24 },
  hero: { width: '100%', height: 240, backgroundColor: '#f2f2f2', justifyContent: 'flex-end' },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  heroContent: { paddingHorizontal: 16, paddingBottom: 14, gap: 4 },
  heroTitle: { color: '#fff', fontWeight: '900', fontSize: 16, textTransform: 'uppercase' },
  heroPrice: { color: '#fff', fontWeight: '900', fontSize: 13 },
  timeBadge: { position: 'absolute', right: 12, top: 12, backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 },
  timeBadgeText: { color: '#111', fontWeight: '900', fontSize: 12 },
  content: { padding: 16, gap: 14 },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
    gap: 12,
  },
  sectionKicker: {
    color: '#9CA3AF',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 0.4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#8B1D1D',
  },
  empty: {
    color: '#666',
  },
  ingredientsList: { gap: 6 },
  ingredientRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  ingredientName: { flex: 1, color: '#111', fontWeight: '900' },
  ingredientQty: { color: '#444', fontWeight: '800' },
  counterRow: { flexDirection: 'row', gap: 12, justifyContent: 'space-between' },
  counterCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f3f3f3',
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 12,
  },
  counterTitle: { fontWeight: '900', color: '#9CA3AF', fontSize: 12, letterSpacing: 0.3 },
  counterControls: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  counterBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#F59E0B', alignItems: 'center', justifyContent: 'center' },
  counterBtnText: { color: '#fff', fontWeight: '900', fontSize: 22, lineHeight: 22 },
  counterValue: { fontWeight: '900', color: '#111', minWidth: 22, textAlign: 'center', fontSize: 18 },

  priceBlock: { marginTop: 4, gap: 12, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f3f3f3' },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 },
  priceLabel: { color: '#6B7280', fontWeight: '700' },
  priceValue: { color: '#111', fontWeight: '900', fontSize: 18 },
  priceTotalLabel: { color: '#9CA3AF', fontWeight: '900', letterSpacing: 2, fontSize: 13 },
  priceTotalValue: { color: '#8B1D1D', fontWeight: '900', fontSize: 34 },

  addToCartWide: {
    marginTop: 2,
    backgroundColor: '#F59E0B',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  addToCartWideText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  pressed: { opacity: 0.85 },
  extraBtn: { backgroundColor: '#15803D', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12, alignItems: 'center' },
  extraBtnText: { color: '#fff', fontWeight: '900', fontSize: 12 },
  stepsSection: { paddingHorizontal: 16, paddingTop: 4, gap: 10 },
  stepsTitle: { fontSize: 16, fontWeight: '900', color: '#111' },
  step: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#eee',
    gap: 6,
  },
  stepNumber: {
    fontWeight: '900',
    color: '#8B1D1D',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  stepText: {
    color: '#333',
    lineHeight: 20,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 12,
    gap: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  bottomPrimaryBtn: { backgroundColor: '#8B1D1D', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  bottomPrimaryText: { color: '#fff', fontWeight: '900' },
  bottomSecondaryBtn: { backgroundColor: '#16A34A', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  bottomSecondaryText: { color: '#fff', fontWeight: '900' },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  centerText: {
    color: '#444',
    textAlign: 'center',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#b00020',
  },
  retryBtn: {
    marginTop: 10,
    backgroundColor: '#8B1D1D',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryText: {
    color: '#fff',
    fontWeight: '800',
  },
});

export default RecipeDetailScreen;
