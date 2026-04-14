import React, { useEffect, useMemo, useState } from 'react';
import { Image, ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { fetchRecipes } from '../api';
import type { Ingredient, RecipeListItem } from '../types';

import { getRecipeImageSource } from '../recipeImageSource';

const HomeScreen: React.FC<any> = ({ route }) => {
  const navigation = useNavigation<any>();
  const { t } = useTranslation('common');
  const [recipes, setRecipes] = useState<RecipeListItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [slideIndex, setSlideIndex] = useState(0);
  const [failedImages, setFailedImages] = useState<Record<string, true>>({});

  const slides = useMemo(
    () => [require('../../assets/img1.jpg'), require('../../assets/img2.jpg'), require('../../assets/img3.png')],
    []
  );

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const rows = await fetchRecipes();
        if (cancelled) return;
        setRecipes(rows || []);
        const normalize = (v: string) => v.trim().toLowerCase();
        const titleCase = (v: string) => v.trim().replace(/\s+/g, ' ').replace(/(^|\s)\S/g, (m) => m.toUpperCase());
        const fixedLabelByKey: Record<string, string> = {
          toutes: t('recipesMobile.categories.all'),
          boissons: t('recipesMobile.categories.boissons'),
          'calories smart': t('recipesMobile.categories.caloriesSmart'),
          africaines: t('recipesMobile.categories.africaines'),
          flexitariennes: t('recipesMobile.categories.flexitariennes'),
          rapides: t('recipesMobile.categories.rapides'),
          classiques: 'Classiques',
        };

        const byKey = new Map<string, string>();
        byKey.set('toutes', fixedLabelByKey.toutes);

        for (const r of rows || []) {
          const raw = String((r as any)?.category ?? '').trim();
          if (!raw) continue;
          let key = normalize(raw);
          if (key === 'traditionnel' || key === 'traditionnelle' || key === 'traditionnelles') key = 'africaines';
          if (!key) continue;
          if (!byKey.has(key)) {
            const label = fixedLabelByKey[key] ?? titleCase(raw);
            byKey.set(key, label);
          }
        }

        const ordered = Array.from(byKey.entries())
          .filter(([k]) => k !== 'traditionnel' && k !== 'traditionnelle' && k !== 'traditionnelles')
          .sort((a, b) => {
            if (a[0] === 'toutes') return -1;
            if (b[0] === 'toutes') return 1;
            return a[1].localeCompare(b[1]);
          })
          .map(([, label]) => label);

        setCategories(ordered.slice(0, 10));
      } catch {
        // noop
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [route?.params?.refreshKey]);

  useEffect(() => {
    const id = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(id);
  }, [slides.length]);

  const heroSource = slides[slideIndex];

  return (
    <View style={styles.root}>
      <ScrollView style={styles.page} contentContainerStyle={styles.pageContent}>
        <ImageBackground source={heroSource} style={styles.hero} imageStyle={styles.heroImage}>
        <View style={styles.heroOverlay} />
          <View style={styles.heroInner}>
            <View style={styles.heroTextBlock}>
              <Text style={styles.heroTitle}>{t('homeMobile.heroTitle')}</Text>
              <Text style={styles.heroSubtitle}>{t('homeMobile.heroSubtitle')}</Text>
            </View>
          </View>
      </ImageBackground>

      <View style={styles.chipsStrip}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsStripInner}>
          {(categories.length ? categories : [t('recipesMobile.categories.all'), t('recipesMobile.categories.africaines'), t('recipesMobile.categories.boissons'), t('recipesMobile.categories.caloriesSmart'), t('recipesMobile.categories.flexitariennes'), t('recipesMobile.categories.rapides'), 'Classiques']).map((label) => (
            <Pressable
              key={label}
              style={styles.chip}
              onPress={() => {
                const isAll = label === t('recipesMobile.categories.all');
                navigation.navigate('Tabs', {
                  screen: 'RecipesTab',
                  params: {
                    screen: 'Recipes',
                    params: isAll ? undefined : { initialCategory: label },
                  },
                });
              }}
            >
              <Text style={styles.chipText}>{label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('homeMobile.sectionTitle', { count: recipes.length })}</Text>

        <View style={styles.grid}>
          {recipes.map((r) => (
            <Pressable
              key={r.id}
              style={styles.gridCard}
              onPress={() =>
                navigation.navigate('Tabs', {
                  screen: 'RecipesTab',
                  params: {
                    screen: 'RecipeDetail',
                    params: { id: r.id, title: r.title },
                  },
                })
              }
            >
              <Image
                source={
                  getRecipeImageSource({
                    recipeId: r.id,
                    image: r.image,
                    imageFailed: !!failedImages[r.id],
                  })
                }
                style={styles.gridImage}
                onError={() => setFailedImages((prev) => ({ ...prev, [r.id]: true }))}
              />
              <View style={styles.gridMeta}>
                <Text style={styles.gridTitle} numberOfLines={1}>
                  {r.title}
                </Text>
                <Text style={styles.gridSub} numberOfLines={1}>
                  {r.time}
                </Text>
                {!!r.ingredients?.length && (
                  <Text style={styles.gridInfo} numberOfLines={2}>
                    {t('homeMobile.ingredientsLabel')}: {r.ingredients.map((i: Ingredient) => i.name).slice(0, 6).join(', ')}
                  </Text>
                )}
                {!!r.preparation_steps?.length && (
                  <Text style={styles.gridInfo} numberOfLines={2}>
                    {t('homeMobile.preparationLabel')}: {r.preparation_steps[0]?.description || ''}
                  </Text>
                )}
              </View>
            </Pressable>
          ))}
        </View>
      </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <View style={styles.bottomIconSlot}>
          <Text style={styles.bottomIcon}>👤</Text>
        </View>
        <Pressable style={styles.bottomCta} onPress={() => navigation.navigate('Tabs', { screen: 'RecipesTab' })}>
          <Text style={styles.bottomCtaText}>{t('homeMobile.orderRecipe')}</Text>
        </Pressable>
        <Pressable style={styles.bottomIconSlot} onPress={() => navigation.navigate('Tabs', { screen: 'Cart' })}>
          <Text style={styles.bottomIcon}>🛒</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F7F1E8' },
  page: { flex: 1, backgroundColor: '#F7F1E8' },
  pageContent: { paddingBottom: 92 },
  hero: { height: 180, width: '100%' },
  heroImage: { resizeMode: 'cover' },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  heroInner: { flex: 1, paddingHorizontal: 16, paddingVertical: 14, justifyContent: 'flex-end' },
  heroTextBlock: { paddingBottom: 6, gap: 4 },
  heroTitle: { color: '#fff', fontWeight: '900', fontSize: 22 },
  heroSubtitle: { color: 'rgba(255,255,255,0.9)', fontWeight: '700', fontSize: 12 },
  chipsStrip: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  chipsStripInner: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  chip: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderColor: '#8B1D1D',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  chipText: { color: '#8B1D1D', fontWeight: '900', fontSize: 11 },
  section: { paddingHorizontal: 16, paddingTop: 14 },
  sectionTitle: { color: '#111', fontWeight: '900', fontSize: 16, marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10 },
  gridCard: {
    width: '49%',
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee',
  },
  gridImage: { height: 74, width: '100%' },
  gridMeta: { paddingHorizontal: 8, paddingVertical: 6 },
  gridTitle: { fontWeight: '900', color: '#111', fontSize: 10 },
  gridSub: { fontWeight: '700', color: '#666', fontSize: 9, marginTop: 2 },
  gridInfo: { fontWeight: '700', color: '#444', fontSize: 9, marginTop: 4, lineHeight: 12 },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 54,
    backgroundColor: '#E5E7EB',
    borderTopWidth: 1,
    borderTopColor: '#D1D5DB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    gap: 10,
  },
  bottomIconSlot: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomIcon: { fontSize: 18 },
  bottomCta: {
    flex: 1,
    backgroundColor: '#0F766E',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    height: 36,
  },
  bottomCtaText: { color: '#fff', fontWeight: '900' },
});

export default HomeScreen;
