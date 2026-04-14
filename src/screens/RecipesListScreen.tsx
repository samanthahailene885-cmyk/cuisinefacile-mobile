import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { fetchRecipes } from '../api';
import type { RecipeListItem } from '../types';
import { getRecipeImageSource } from '../recipeImageSource';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RecipesStackParamList } from '../../types.navigation';
import { useTranslation } from 'react-i18next';

type Props = NativeStackScreenProps<RecipesStackParamList, 'Recipes'>;

const RecipeCard: React.FC<{ item: RecipeListItem; onPress: () => void }> = ({ item, onPress }) => {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <Pressable onPress={onPress} style={styles.card}>
      <Image
        source={getRecipeImageSource({ recipeId: item.id, image: item.image, imageFailed })}
        style={styles.image}
        onError={() => setImageFailed(true)}
      />
      <View style={styles.cardBody}>
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {item.time} • {item.calories}
        </Text>
        <Text style={styles.desc} numberOfLines={2}>
          {item.description}
        </Text>
      </View>
    </Pressable>
  );
};

const RecipesListScreen: React.FC<Props> = ({ navigation, route }) => {
  const { t } = useTranslation('common');
  const [data, setData] = useState<RecipeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('toutes');
  const searchInputRef = useRef<TextInput | null>(null);

  const normalizeCategoryKey = useCallback((value: string): string => value.trim().toLowerCase(), []);

  const normalizedData = useMemo(() => {
    return data.map((r) => {
      const raw = String(r.category ?? '').trim();
      const key = raw.toLowerCase();
      if (key === 'traditionnel') {
        return { ...r, category: 'Africaines' };
      }
      return r;
    });
  }, [data]);

  const load = useCallback(async () => {
    setError(null);
    const rows = await fetchRecipes();
    setData(rows);
  }, []);

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

  useEffect(() => {
    const initial = String((route.params as any)?.initialCategory ?? '').trim();
    if (initial) {
      setCategory(normalizeCategoryKey(initial));
    }
  }, [route.params]);

  useEffect(() => {
    const initialQuery = String((route.params as any)?.initialQuery ?? '').trim();
    if (initialQuery) {
      setQuery(initialQuery);
    }
  }, [route.params]);

  useEffect(() => {
    const focusSearch = (route.params as any)?.focusSearch;
    if (!focusSearch) return;
    const id = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 60);
    return () => clearTimeout(id);
  }, [(route.params as any)?.focusSearch]);

  const categories = useMemo(() => {
    const fixedCategories: Array<{ key: 'all' | 'boissons' | 'calories_smart' | 'africaines' | 'flexitariennes' | 'rapides'; matchValue: string; label: string }> = [
      { key: 'all', matchValue: 'toutes', label: t('recipesMobile.categories.all') },
      { key: 'boissons', matchValue: 'boissons', label: t('recipesMobile.categories.boissons') },
      { key: 'calories_smart', matchValue: 'calories smart', label: t('recipesMobile.categories.caloriesSmart') },
      { key: 'africaines', matchValue: 'africaines', label: t('recipesMobile.categories.africaines') },
      { key: 'flexitariennes', matchValue: 'flexitariennes', label: t('recipesMobile.categories.flexitariennes') },
      { key: 'rapides', matchValue: 'rapides', label: t('recipesMobile.categories.rapides') },
    ];

    const excluded = new Set(['gibier', 'veggie', 'mer', 'classique']);
    const dynamic = Array.from(
      new Set(
        normalizedData
          .map((r) => String(r.category ?? '').trim())
          .filter(Boolean)
          .filter((c) => !excluded.has(c.trim().toLowerCase()))
      )
    ).sort((a, b) => a.localeCompare(b));

    const fixedKeys = new Set(fixedCategories.map((c) => normalizeCategoryKey(c.matchValue)));
    const dynamicCats = dynamic
      .filter((c) => !fixedKeys.has(normalizeCategoryKey(c)))
      .map((c) => ({ id: `dyn:${c}`, matchValue: normalizeCategoryKey(c), label: c }));

    const fixedCats = fixedCategories.map((c) => ({ id: `fixed:${c.key}`, matchValue: normalizeCategoryKey(c.matchValue), label: c.label }));
    return [...fixedCats, ...dynamicCats];
  }, [normalizedData, normalizeCategoryKey]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const selectedKey = normalizeCategoryKey(category);

    return normalizedData.filter((r) => {
      const rKey = normalizeCategoryKey(String(r.category ?? ''));
      const byCat = selectedKey === 'toutes' ? true : rKey === selectedKey;
      if (!byCat) return false;

      if (!q) return true;
      const hay = `${r.title} ${r.description}`.toLowerCase();
      return hay.includes(q);
    });
  }, [normalizedData, query, category, normalizeCategoryKey]);

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await load();
    } catch (e: any) {
      setError(e?.message ?? 'Erreur');
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.centerText}>{t('recipesMobile.loading')}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>{t('recipesMobile.errorTitle')}</Text>
        <Text style={styles.centerText}>{error}</Text>
        <Pressable onPress={onRefresh} style={styles.retryBtn}>
          <Text style={styles.retryText}>{t('recipesMobile.retry')}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <FlatList
      data={filtered}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      numColumns={2}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListHeaderComponent={
        <View style={styles.headerWrap}>
          <View style={styles.banner}>
            <Text style={styles.bannerTitle}>{t('recipesMobile.bannerTitle')}</Text>
            <Text style={styles.bannerSub}>{t('recipesMobile.bannerSubtitle')}</Text>
          </View>

          <TextInput
            placeholder={t('recipesMobile.searchPlaceholder')}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            style={styles.search}
            ref={searchInputRef}
          />

          <FlatList
            data={categories}
            keyExtractor={(c) => c.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}
            renderItem={({ item: c }) => {
              const active = c.matchValue === category;
              return (
                <Pressable onPress={() => setCategory(c.matchValue)} style={[styles.chip, active && styles.chipActive]}>
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{c.label}</Text>
                </Pressable>
              );
            }}
          />
        </View>
      }
      columnWrapperStyle={styles.gridRow}
      renderItem={({ item }) => (
        <RecipeCard item={item} onPress={() => navigation.navigate('RecipeDetail', { id: item.id, title: item.title })} />
      )}
    />
  );
};

const styles = StyleSheet.create({
  list: {
    padding: 16,
    gap: 12,
  },
  headerWrap: {
    paddingBottom: 10,
    gap: 10,
  },
  banner: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#8B1D1D',
    padding: 16,
    gap: 4,
  },
  bannerTitle: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 18,
  },
  bannerSub: {
    color: '#fff',
    opacity: 0.9,
    fontWeight: '700',
  },
  search: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  chips: {
    paddingVertical: 2,
    gap: 6,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eee',
  },
  chipActive: {
    backgroundColor: '#111',
    borderColor: '#111',
  },
  chipText: {
    fontWeight: '800',
    color: '#111',
    fontSize: 11,
  },
  chipTextActive: {
    color: '#fff',
  },
  gridRow: {
    gap: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E7E7E7',
    flex: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  image: {
    width: '100%',
    height: 90,
    backgroundColor: '#f2f2f2',
    resizeMode: 'cover',
  },
  cardBody: {
    padding: 10,
    gap: 6,
    minHeight: 92,
  },
  title: {
    fontSize: 13,
    fontWeight: '900',
    color: '#111',
  },
  meta: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  desc: {
    fontSize: 12,
    color: '#444',
  },
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

export default RecipesListScreen;
