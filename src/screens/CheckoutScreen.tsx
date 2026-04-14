import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { createOrder } from '../api';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

type Props = {
  navigation: any;
};

const DELIVERY_FEE = 1500;

const CheckoutScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useTranslation('common');
  const { user } = useAuth();
  const { items, total } = useCart();

  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);

  const grandTotal = useMemo(() => total + DELIVERY_FEE, [total]);

  const canSubmit = Boolean(user?.email) && items.length > 0 && address.trim().length > 4;

  const onSubmit = async () => {
    if (!user?.email) {
      Alert.alert(t('checkoutMobile.alerts.loginRequiredTitle'), t('checkoutMobile.alerts.loginRequiredBody'));
      return;
    }
    if (items.length === 0) {
      Alert.alert(t('checkoutMobile.alerts.emptyCartTitle'), t('checkoutMobile.alerts.emptyCartBody'));
      return;
    }
    if (!address.trim()) {
      Alert.alert(t('checkoutMobile.alerts.addressRequiredTitle'), t('checkoutMobile.alerts.addressRequiredBody'));
      return;
    }

    setSaving(true);
    try {
      const created = await createOrder({
        email: user.email,
        address: address.trim(),
        total: grandTotal,
        items,
        customer: { name: user?.name ?? '', phone: user?.phone ?? '' },
      });

      navigation.replace('Success', { order: created });
    } catch (e: any) {
      Alert.alert(t('checkoutMobile.alerts.errorTitle'), e?.message ?? t('checkoutMobile.alerts.errorFallback'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('checkoutMobile.title')}</Text>
      <Text style={styles.text}>{t('checkoutMobile.subtitle')}</Text>

      <View style={styles.notice}>
        <Text style={styles.noticeTitle}>{t('checkoutMobile.payment.title')}</Text>
        <Text style={styles.noticeBody}>{t('checkoutMobile.payment.body')}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>{t('checkoutMobile.fields.address')}</Text>
        <TextInput
          placeholder={t('checkoutMobile.placeholders.address')}
          value={address}
          onChangeText={setAddress}
          style={styles.input}
          multiline
        />

        <View style={styles.summary}>
          <View style={styles.sumRow}>
            <Text style={styles.sumLabel}>{t('checkoutMobile.summary.subtotal')}</Text>
            <Text style={styles.sumValue}>{total} FCFA</Text>
          </View>
          <View style={styles.sumRow}>
            <Text style={styles.sumLabel}>{t('checkoutMobile.summary.delivery')}</Text>
            <Text style={styles.sumValue}>{DELIVERY_FEE} FCFA</Text>
          </View>
          <View style={styles.sep} />
          <View style={styles.sumRow}>
            <Text style={styles.sumTotalLabel}>{t('checkoutMobile.summary.total')}</Text>
            <Text style={styles.sumTotalValue}>{grandTotal} FCFA</Text>
          </View>
        </View>

        <Pressable onPress={onSubmit} disabled={!canSubmit || saving} style={[styles.btn, (!canSubmit || saving) && styles.btnDisabled]}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>{t('checkoutMobile.submit')}</Text>}
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 10, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '900', color: '#111' },
  text: { color: '#444' },
  notice: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(15,118,110,0.25)',
    backgroundColor: 'rgba(15,118,110,0.08)',
    padding: 12,
    gap: 2,
  },
  noticeTitle: { fontWeight: '900', color: '#0F766E' },
  noticeBody: { color: '#0F766E', fontWeight: '800', fontSize: 12 },
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#eee', borderRadius: 16, padding: 14, gap: 12, marginTop: 6 },
  label: { fontWeight: '900', color: '#111' },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  summary: { gap: 8 },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sumLabel: { color: '#444', fontWeight: '800' },
  sumValue: { color: '#111', fontWeight: '900' },
  sep: { height: 1, backgroundColor: '#eee', marginVertical: 6 },
  sumTotalLabel: { color: '#111', fontWeight: '900', fontSize: 16 },
  sumTotalValue: { color: '#8B1D1D', fontWeight: '900', fontSize: 16 },
  btn: { backgroundColor: '#8B1D1D', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontWeight: '900' },
});

export default CheckoutScreen;
