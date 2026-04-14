import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { fetchRecipes } from '../api';
import type { RecipeListItem } from '../types';

const CategoriesScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const [data, setData] = useState<RecipeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalizeKey = useCallback((value: string): string => value.trim().toLowerCase(), []);
  const displayCategory = useCallback((raw: string): string => {
    const t = String(raw ?? '').trim();
    if (!t) return '';
    if (t.toLowerCase() === 'traditionnel') return 'Africaines';
    return t;
  }, []);

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

  const categoriesWithCounts = useMemo(() => {
    const counts = new Map<string, { name: string; count: number }>();
    for (const r of data) {
      const name = displayCategory(String((r as any)?.category ?? ''));
      if (!name) continue;
      const key = normalizeKey(name);
      const prev = counts.get(key);
      counts.set(key, { name, count: (prev?.count ?? 0) + 1 });
    }

    const fixed = ['Boissons', 'Africaines', 'Flexitariennes', 'Poisson & légumes', 'Calories Smart', 'Rapides', 'Végétariennes', 'Familiales', 'Classiques'];
    const fixedKeys = fixed.map((c) => normalizeKey(c));
    const out: { name: string; count: number }[] = [];

    for (const c of fixed) {
      const entry = counts.get(normalizeKey(c));
      out.push({ name: c, count: entry?.count ?? 0 });
    }

    const rest = Array.from(counts.values())
      .filter((e) => !fixedKeys.includes(normalizeKey(e.name)))
      .sort((a, b) => a.name.localeCompare(b.name));

    return [...out, ...rest];
  }, [data, displayCategory, normalizeKey]);

  const goToCategory = useCallback(
    (category: string) => {
      navigation.navigate('Tabs', {
        screen: 'RecipesTab',
        params: {
          screen: 'Recipes',
          params: { initialCategory: category },
        },
      });
    },
    [navigation]
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.centerText}>Chargement…</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <FlatList
        data={categoriesWithCounts}
        keyExtractor={(it) => it.name}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Categories</Text>
            {!!error && <Text style={styles.errorText}>{error}</Text>}
          </View>
        }
        renderItem={({ item }) => {
          const count = Math.max(0, Number(item.count) || 0);
          return (
            <Pressable onPress={() => goToCategory(item.name)} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
              <View style={styles.left}>
                <View style={styles.countBadge}>
                  <Text style={styles.countText}>{count}</Text>
                </View>
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {item.name}
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={22} color="#9CA3AF" />
            </Pressable>
          );
        }}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  header: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 10, gap: 6 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#111', textAlign: 'center' },
  errorText: { color: '#b00020', fontWeight: '800', textAlign: 'center' },

  row: { paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  left: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  rowTitle: { fontWeight: '900', color: '#8B1D1D', flex: 1 },
  sep: { height: 1, backgroundColor: '#eee', marginLeft: 16 },
  pressed: { opacity: 0.75 },

  countBadge: { minWidth: 26, paddingHorizontal: 8, height: 22, borderRadius: 8, backgroundColor: '#F97316', alignItems: 'center', justifyContent: 'center' },
  countText: { color: '#fff', fontWeight: '900', fontSize: 12 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16 },
  centerText: { color: '#444', textAlign: 'center' },
});

export default CategoriesScreen;
