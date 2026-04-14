import React, { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import type { OrdersStackParamList } from '../../types.navigation';
import { getRecipeImageSource } from '../recipeImageSource';

type Props = NativeStackScreenProps<OrdersStackParamList, 'OrderDetail'>;

const OrderDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { order } = route.params;
  const [imageFailed, setImageFailed] = useState<Record<string, boolean>>({});

  const statusUi = useMemo(() => {
    const raw = String(order?.status ?? '').trim().toLowerCase();
    if (!raw) return { label: 'EN PRÉPARATION', bg: '#FDE68A', fg: '#92400E' };
    if (raw.includes('livr') || raw.includes('deliv') || raw.includes('term') || raw.includes('done')) {
      return { label: 'LIVRÉE', bg: '#DCFCE7', fg: '#166534' };
    }
    if (raw.includes('annul') || raw.includes('cancel') || raw.includes('reject')) {
      return { label: 'ANNULÉE', bg: '#FEE2E2', fg: '#991B1B' };
    }
    if (raw.includes('en cours') || raw.includes('cours') || raw.includes('pending') || raw.includes('prépa') || raw.includes('prepa')) {
      return { label: 'EN PRÉPARATION', bg: '#FDE68A', fg: '#92400E' };
    }
    return { label: raw.toUpperCase(), bg: '#E5E7EB', fg: '#111827' };
  }, [order?.status]);

  const formatFcfa = (value: any) => {
    const n = Number(value ?? 0);
    const safe = Number.isFinite(n) ? n : 0;
    try {
      return `${Math.round(safe).toLocaleString('fr-FR')} F CFA`;
    } catch {
      return `${Math.round(safe)} F CFA`;
    }
  };

  const formatDate = (value: any) => {
    const raw = String(value ?? '').trim();
    if (!raw) return '';
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return raw;
    try {
      return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return raw;
    }
  };

  const orderId = String(order?.id ?? '');
  const transactionId = orderId || String(order?.transaction_id ?? order?.reference ?? '');
  const createdAt = order?.created_at ?? order?.date ?? '';
  const items = Array.isArray(order?.items) ? order.items : [];

  const totalArticles = useMemo(() => {
    const explicit = Number(order?.total ?? NaN);
    if (Number.isFinite(explicit)) return explicit;
    return items.reduce((sum: number, it: any) => sum + Number(it?.totalPrice ?? it?.unitPrice ?? 0), 0);
  }, [order?.total, items]);

  const deliveryFee = useMemo(() => {
    const fee = Number(order?.delivery_fee ?? order?.shipping_fee ?? 0);
    return Number.isFinite(fee) ? fee : 0;
  }, [order?.delivery_fee, order?.shipping_fee]);

  const totalPaid = Math.max(0, totalArticles + deliveryFee);
  const address = String(order?.delivery_address ?? order?.address ?? '').trim();

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container}>
        <Pressable onPress={() => navigation.goBack()} style={({ pressed }) => [styles.backRow, pressed && styles.pressed]}>
          <MaterialCommunityIcons name="arrow-left" size={18} color="#111" />
          <Text style={styles.backText}>RETOUR À LA LISTE</Text>
        </Pressable>

        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={styles.title}>Détails de la commande</Text>
              {!!transactionId && (
                <Text style={styles.subTitle} numberOfLines={2}>
                  ID TRANSACTION : {transactionId}
                </Text>
              )}
              {!!createdAt && <Text style={styles.dateText}>{formatDate(createdAt)}</Text>}
            </View>

            <View style={[styles.statusPill, { backgroundColor: statusUi.bg }]}>
              <Text style={[styles.statusPillText, { color: statusUi.fg }]}>{statusUi.label}</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionRow}>
          <View style={styles.leftCol}>
            <Text style={styles.sectionKicker}>ARTICLES & INGRÉDIENTS</Text>

            {items.length === 0 ? (
              <View style={styles.card}>
                <Text style={styles.muted}>Aucun article</Text>
              </View>
            ) : (
              items.map((it: any, idx: number) => {
                const recipe = it?.recipe ?? it;
                const title = String(recipe?.title ?? 'Recette').trim();
                const qty = Number(it?.quantity ?? 1);
                const price = Number(it?.totalPrice ?? it?.unitPrice ?? 0);
                const img = String(recipe?.image ?? '').trim();
                const key = String(it?.order_item_id ?? recipe?.id ?? idx);
                const failed = !!imageFailed[key];

                return (
                  <View key={key} style={styles.itemCard}>
                    <View style={styles.itemRow}>
                      <Image
                        source={getRecipeImageSource({ recipeId: String(recipe?.id ?? key), image: img, imageFailed: failed })}
                        onError={() => setImageFailed((s) => ({ ...s, [key]: true }))}
                        style={styles.itemImg}
                      />
                      <View style={{ flex: 1, gap: 4 }}>
                        <Text style={styles.itemTitle} numberOfLines={2}>
                          {title.toUpperCase()}
                        </Text>
                        <Text style={styles.itemMeta} numberOfLines={1}>
                          RECETTE • {Math.max(1, qty)} PERSONNE(S)
                        </Text>
                      </View>
                      <Text style={styles.itemPrice}>{formatFcfa(price)}</Text>
                    </View>

                    <View style={styles.divider} />

                    <Text style={styles.smallKicker}>COMPOSITION DE LA BOX :</Text>
                    {Array.isArray(it?.selectedIngredients) && it.selectedIngredients.length > 0 ? (
                      <View style={{ gap: 6 }}>
                        {it.selectedIngredients.map((ing: any) => (
                          <View key={String(ing?.id ?? Math.random())} style={styles.ingRow}>
                            <Text style={styles.ingName} numberOfLines={1}>
                              {String(ing?.name ?? '')}
                            </Text>
                            <Text style={styles.ingQty}>
                              {Number(ing?.selectedQuantity ?? 0)} {String(ing?.unit ?? '')}
                            </Text>
                          </View>
                        ))}
                      </View>
                    ) : (
                      <Text style={styles.muted}>Aucun ingrédient sélectionné</Text>
                    )}
                  </View>
                );
              })
            )}
          </View>

          <View style={styles.rightCol}>
            <Text style={styles.sectionKicker}>RÉSUMÉ DE LA COMMANDE</Text>
            <View style={styles.card}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total articles</Text>
                <Text style={styles.summaryValue}>{formatFcfa(totalArticles)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Frais de livraison</Text>
                <Text style={styles.summaryValue}>{formatFcfa(deliveryFee)}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.summaryRow}>
                <Text style={styles.totalLabel}>Total Payé</Text>
                <Text style={styles.totalValue}>{formatFcfa(totalPaid)}</Text>
              </View>
            </View>

            <View style={{ height: 12 }} />

            <Text style={styles.sectionKicker}>ADRESSE DE LIVRAISON</Text>
            <View style={styles.card}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                <View style={styles.addrIcon}>
                  <MaterialCommunityIcons name="truck-outline" size={18} color="#8B1D1D" />
                </View>
                <View style={{ flex: 1, gap: 6 }}>
                  <Text style={styles.addrTitle}>{address || '—'}</Text>
                  <Text style={styles.addrSub}>Livraison prévue entre 9h et 18h.</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8F5F1' },
  container: { padding: 16, gap: 14 },
  pressed: { opacity: 0.85 },

  backRow: { flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'flex-start', paddingVertical: 8 },
  backText: { fontWeight: '900', color: '#6B7280', letterSpacing: 1 },

  headerCard: { backgroundColor: '#fff', borderRadius: 22, padding: 16, borderWidth: 1, borderColor: '#eee' },
  headerTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  title: { fontWeight: '900', color: '#111', fontSize: 18 },
  subTitle: { fontWeight: '900', color: '#9CA3AF', letterSpacing: 1.2, fontSize: 11 },
  dateText: { fontWeight: '800', color: '#444' },

  statusPill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
  statusPillText: { fontWeight: '900', fontSize: 11, letterSpacing: 0.4 },

  sectionRow: { gap: 14 },
  leftCol: { gap: 10 },
  rightCol: { gap: 10 },

  sectionKicker: { fontWeight: '900', color: '#9CA3AF', letterSpacing: 1.2, fontSize: 12 },
  card: { backgroundColor: '#fff', borderRadius: 18, padding: 14, borderWidth: 1, borderColor: '#eee' },

  itemCard: { backgroundColor: '#fff', borderRadius: 18, padding: 14, borderWidth: 1, borderColor: '#eee', gap: 10 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  itemImg: { width: 56, height: 56, borderRadius: 14, backgroundColor: '#f2f2f2' },
  itemTitle: { fontWeight: '900', color: '#111', fontSize: 13 },
  itemMeta: { fontWeight: '900', color: '#8B1D1D', fontSize: 11 },
  itemPrice: { fontWeight: '900', color: '#111', fontSize: 14 },

  divider: { height: 1, backgroundColor: '#f0f0f0' },
  smallKicker: { fontWeight: '900', color: '#9CA3AF', letterSpacing: 1.1, fontSize: 11 },
  muted: { color: '#666', fontWeight: '600' },

  ingRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  ingName: { flex: 1, fontWeight: '800', color: '#111' },
  ingQty: { fontWeight: '800', color: '#444' },

  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, paddingVertical: 6 },
  summaryLabel: { fontWeight: '700', color: '#6B7280' },
  summaryValue: { fontWeight: '900', color: '#111' },
  totalLabel: { fontWeight: '900', color: '#111', fontSize: 16 },
  totalValue: { fontWeight: '900', color: '#8B1D1D', fontSize: 18 },

  addrIcon: { width: 34, height: 34, borderRadius: 12, backgroundColor: '#F8EFEF', alignItems: 'center', justifyContent: 'center' },
  addrTitle: { fontWeight: '900', color: '#111' },
  addrSub: { fontWeight: '700', color: '#9CA3AF' },
});

export default OrderDetailScreen;
