import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { fetchOrdersByUserEmail } from '../api';
import { useAuth } from '../contexts/AuthContext';

const OrdersScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<any[]>([]);

  const onBack = useCallback(() => {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
      return;
    }
    navigation.navigate('Tabs', { screen: 'Home' });
  }, [navigation]);

  const load = useCallback(async () => {
    if (!user?.email) return;
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchOrdersByUserEmail(user.email);
      setOrders(Array.isArray(rows) ? rows : []);
    } catch (e: any) {
      setError(e?.message ?? 'Erreur');
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    void load();
  }, [load]);

  const firstName = useMemo(() => {
    const raw = String(user?.name ?? '').trim();
    if (!raw) return '';
    const parts = raw.split(/\s+/).filter(Boolean);
    return String(parts[0] ?? raw);
  }, [user?.name]);

  const initials = useMemo(() => {
    const raw = String(user?.name ?? user?.email ?? '').trim();
    if (!raw) return '?';
    const parts = raw.split(/\s+/).filter(Boolean);
    const i1 = (parts[0]?.[0] ?? raw[0] ?? '?').toUpperCase();
    const i2 = (parts[1]?.[0] ?? '').toUpperCase();
    return `${i1}${i2}`.trim();
  }, [user?.name, user?.email]);

  const formatFcfa = useCallback((value: any) => {
    const n = Number(value ?? 0);
    const safe = Number.isFinite(n) ? n : 0;
    try {
      return `${Math.round(safe).toLocaleString('fr-FR')} F`;
    } catch {
      return `${Math.round(safe)} F`;
    }
  }, []);

  const formatDate = useCallback((value: any) => {
    const raw = String(value ?? '').trim();
    if (!raw) return '';
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return raw;
    try {
      return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return raw;
    }
  }, []);

  const statusUi = useCallback((value: any) => {
    const raw = String(value ?? '').trim().toLowerCase();
    if (!raw) return { label: 'EN COURS', bg: '#FDE68A', fg: '#92400E' };
    if (raw.includes('livr') || raw.includes('deliv') || raw.includes('term') || raw.includes('done')) {
      return { label: 'LIVRÉE', bg: '#DCFCE7', fg: '#166534' };
    }
    if (raw.includes('annul') || raw.includes('cancel') || raw.includes('reject')) {
      return { label: 'ANNULÉE', bg: '#FEE2E2', fg: '#991B1B' };
    }
    if (raw.includes('en cours') || raw.includes('cours') || raw.includes('pending')) {
      return { label: 'EN COURS', bg: '#FDE68A', fg: '#92400E' };
    }
    return { label: raw.toUpperCase(), bg: '#E5E7EB', fg: '#111827' };
  }, []);

  if (!user?.email) {
    return (
      <View style={styles.screen}>
        <View style={styles.container}>
          <View style={styles.banner}>
            <Text style={styles.bannerTitle}>Mes commandes</Text>
            <Text style={styles.bannerSub}>Connectez-vous pour voir vos commandes.</Text>
          </View>

          <Pressable onPress={() => navigation.navigate('Tabs', { screen: 'Login' })} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>Se connecter</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.text}>Chargement…</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <FlatList
        data={orders}
        keyExtractor={(it, idx) => String(it?.id ?? idx)}
        contentContainerStyle={styles.container}
        ListHeaderComponent={
          <>
            <Pressable onPress={onBack} style={({ pressed }) => [styles.backRow, pressed && styles.pressed]}>
              <MaterialCommunityIcons name="arrow-left" size={20} color="#111" />
              <Text style={styles.backText}>Retour</Text>
            </Pressable>

            <View style={styles.profileCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
              <Text style={styles.profileName}>{String(user?.name ?? '').trim() || 'Utilisateur'}</Text>
              <Text style={styles.profileBadge}>CLIENT VIP</Text>

              <View style={styles.profileMetaRow}>
                <MaterialCommunityIcons name="email-outline" size={16} color="#8B1D1D" />
                <Text style={styles.profileMetaText}>{user.email}</Text>
              </View>
              {!!String(user?.phone ?? '').trim() && (
                <View style={styles.profileMetaRow}>
                  <MaterialCommunityIcons name="phone-outline" size={16} color="#8B1D1D" />
                  <Text style={styles.profileMetaText}>{String(user.phone ?? '')}</Text>
                </View>
              )}
            </View>

            <View style={styles.banner}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.bannerTitle}>Bonjour{firstName ? `, ${firstName}` : ''}</Text>
                <Text style={styles.bannerSub}>Gérez vos commandes et vos préférences.</Text>
              </View>
              <Pressable
                onPress={() => navigation.navigate('Tabs', { screen: 'RecipesTab' })}
                style={({ pressed }) => [styles.bannerCta, pressed && styles.pressed]}
              >
                <Text style={styles.bannerCtaText}>NOUVELLE BOX</Text>
              </Pressable>
            </View>

            {!!error && <Text style={styles.error}>{error}</Text>}

            <View style={styles.historyHeader}>
              <View style={styles.historyTitleRow}>
                <Text style={styles.historyTitle}>Historique</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{orders.length}</Text>
                </View>
              </View>

              <Pressable onPress={load} style={({ pressed }) => [styles.refreshBtn, pressed && styles.pressed]}>
                <MaterialCommunityIcons name="refresh" size={16} color="#111" />
                <Text style={styles.refreshText}>Actualiser</Text>
              </Pressable>
            </View>

            {orders.length === 0 ? <Text style={styles.text}>Aucune commande.</Text> : null}
          </>
        }
        renderItem={({ item }) => {
          const id = String(item?.id ?? '');
          const createdAt = item?.created_at ?? item?.date ?? '';
          const itemsCount = Array.isArray(item?.items) ? item.items.length : Number(item?.items_count ?? 0);
          const total = item?.total ?? 0;
          const status = statusUi(item?.status);

          return (
            <Pressable
              onPress={() => navigation.navigate('OrderDetail', { order: item })}
              style={({ pressed }) => [styles.orderCard, pressed && styles.pressed]}
            >
              <View style={styles.orderIcon}>
                <MaterialCommunityIcons name="cube-outline" size={18} color="#8B1D1D" />
              </View>

              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.orderId} numberOfLines={1}>
                  #{id.slice(0, 8) || '---'}
                </Text>
                <Text style={styles.orderDate} numberOfLines={1}>
                  {formatDate(createdAt) || '—'}
                </Text>
                <Text style={styles.orderMeta} numberOfLines={1}>
                  {Math.max(0, Number(itemsCount) || 0)} recette(s) • {formatFcfa(total)}
                </Text>
              </View>

              <View style={[styles.statusPill, { backgroundColor: status.bg }]}>
                <Text style={[styles.statusPillText, { color: status.fg }]}>{status.label}</Text>
              </View>

              <MaterialCommunityIcons name="chevron-right" size={22} color="#9CA3AF" />
            </Pressable>
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8F5F1' },
  container: { padding: 16, gap: 14 },
  text: { color: '#444', fontWeight: '600' },
  error: { color: '#b00020', fontWeight: '800' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16 },
  pressed: { opacity: 0.85 },

  backRow: { flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'flex-start', paddingVertical: 8 },
  backText: { fontWeight: '900', color: '#6B7280' },

  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#eee',
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  avatarText: { fontWeight: '900', color: '#8B1D1D', fontSize: 18 },
  profileName: { fontWeight: '900', color: '#111', fontSize: 16 },
  profileBadge: { fontWeight: '900', color: '#9CA3AF', fontSize: 11, letterSpacing: 1.2 },
  profileMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  profileMetaText: { color: '#444', fontWeight: '700' },

  banner: {
    backgroundColor: '#8B1D1D',
    borderRadius: 22,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  bannerTitle: { color: '#fff', fontWeight: '900', fontSize: 18 },
  bannerSub: { color: '#fff', opacity: 0.9, fontWeight: '700' },
  bannerCta: { backgroundColor: '#F59E0B', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14 },
  bannerCtaText: { color: '#fff', fontWeight: '900', fontSize: 12, letterSpacing: 0.4 },

  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  historyTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  historyTitle: { fontWeight: '900', color: '#111', fontSize: 16 },
  countBadge: { backgroundColor: '#EFE7E0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  countBadgeText: { fontWeight: '900', color: '#8B1D1D', fontSize: 12 },
  refreshBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 12 },
  refreshText: { fontWeight: '800', color: '#111' },

  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#eee',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  orderIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#F8EFEF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderId: { fontWeight: '900', color: '#9CA3AF', letterSpacing: 1.1, fontSize: 12 },
  orderDate: { fontWeight: '900', color: '#111', fontSize: 14 },
  orderMeta: { fontWeight: '800', color: '#8B1D1D', fontSize: 12 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  statusPillText: { fontWeight: '900', fontSize: 11, letterSpacing: 0.4 },

  primaryBtn: { backgroundColor: '#8B1D1D', paddingVertical: 12, borderRadius: 14, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontWeight: '900' },
});

export default OrdersScreen;
