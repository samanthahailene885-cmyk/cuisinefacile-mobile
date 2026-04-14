import React, { useCallback, useMemo } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CartStackParamList } from '../../types.navigation';
import { useTranslation } from 'react-i18next';

type Props = {
  navigation: any;
  route: any;
};

const SuccessScreen: React.FC<Props> = ({ navigation, route }) => {
  const { t } = useTranslation('common');
  const order = route?.params?.order;

  const safe = (v: any) => String(v ?? '').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const buildHtml = useCallback(() => {
    const items = Array.isArray(order?.items) ? order.items : [];
    const itemsHtml = items
      .map((item: any) => {
        const title = safe(item?.recipe?.title ?? item?.title);
        const qty = Number(item?.quantity ?? 1);
        const total = Number(item?.totalPrice ?? item?.unitPrice ?? 0) * qty;
        const persons = item?.personsCount ?? 1;
        const recipesCount = item?.recipesCount ?? 1;
        return `
          <div class="item">
            <div class="row">
              <div>
                <div class="title">${title}</div>
                <div class="meta">${safe(recipesCount)} recette(s) • ${safe(persons)} personne(s)</div>
              </div>
              <div class="price">${Math.round(total).toLocaleString('fr-FR')} F CFA</div>
            </div>
          </div>
        `;
      })
      .join('');

    const orderId = order?.id ?? '';
    const totalPaid = Number(order?.total ?? 0);
    return `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Commande #${safe(orderId)}</title>
          <style>
            *{box-sizing:border-box;font-family:Arial, Helvetica, sans-serif;}
            body{margin:0;padding:24px;color:#111;background:#fff;}
            .header{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;margin-bottom:16px;}
            .h1{font-size:20px;font-weight:800;margin:0;}
            .sub{font-size:12px;color:#666;margin-top:6px;}
            .section{margin-top:18px;}
            .sectionTitle{font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#666;font-weight:800;margin-bottom:10px;}
            .item{border:1px solid #eee;border-radius:12px;padding:12px;margin-bottom:10px;}
            .row{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;}
            .title{font-size:14px;font-weight:800;margin:0 0 4px 0;}
            .meta{font-size:11px;color:#666;font-weight:700;}
            .price{font-size:13px;font-weight:800;white-space:nowrap;}
            .summary{border:1px solid #eee;border-radius:12px;padding:12px;}
            .sumRow{display:flex;justify-content:space-between;gap:12px;font-size:12px;color:#333;margin:6px 0;}
            .sumTotal{display:flex;justify-content:space-between;gap:12px;font-size:14px;font-weight:900;margin-top:10px;padding-top:10px;border-top:1px solid #eee;}
            @media print { body{padding:0;} }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="h1">Reçu de commande</div>
              <div class="sub">ID TRANSACTION: #${safe(orderId)}</div>
            </div>
          </div>

          <div class="section">
            <div class="sectionTitle">Articles</div>
            ${itemsHtml || '<div>Aucun article</div>'}
          </div>

          <div class="section">
            <div class="sectionTitle">Total</div>
            <div class="summary">
              <div class="sumTotal"><span>Total payé</span><span>${Math.round(totalPaid).toLocaleString('fr-FR')} F CFA</span></div>
            </div>
          </div>
        </body>
      </html>
    `;
  }, [order]);

  const onDownloadPdf = useCallback(async () => {
    if (!order) {
      Alert.alert(t('successMobile.pdf.title'), t('successMobile.pdf.noOrder'));
      return;
    }

    const html = buildHtml();

    if (Platform.OS === 'web') {
      const w = window.open('', '_blank', 'noopener,noreferrer');
      if (!w) {
        Alert.alert(t('successMobile.pdf.title'), t('successMobile.pdf.popupBlocked'));
        return;
      }
      w.document.open();
      w.document.write(html);
      w.document.close();
      w.onload = () => {
        setTimeout(() => w.print(), 250);
      };
      return;
    }

    try {
      const printModuleName = 'expo-print';
      const sharingModuleName = 'expo-sharing';
      const Print = await import(printModuleName);
      const Sharing = await import(sharingModuleName);
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert(t('successMobile.pdf.title'), t('successMobile.pdf.sharingUnavailable'));
      }
    } catch (e: any) {
      Alert.alert(
        t('successMobile.pdf.title'),
        `${t('successMobile.pdf.installHelp')}\n\n${t('successMobile.pdf.errorLabel')}: ${e?.message ?? t('successMobile.pdf.unknownError')}`
      );
    }
  }, [order, buildHtml]);

  return (
    <View style={styles.container}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>✓</Text>
      </View>
      <Text style={styles.title}>{t('successMobile.title')}</Text>
      <Text style={styles.text}>{t('successMobile.subtitle')}</Text>

      <View style={styles.actions}>
        <Pressable onPress={onDownloadPdf} style={styles.btnAlt}>
          <Text style={styles.btnAltText}>{t('successMobile.downloadPdf')}</Text>
        </Pressable>

        <Pressable
          onPress={() => {
            navigation.reset({
              index: 0,
              routes: [{ name: 'Cart' }],
            });
          }}
          style={styles.btn}
        >
          <Text style={styles.btnText}>{t('successMobile.backToCart')}</Text>
        </Pressable>

        <Pressable
          onPress={() => {
            navigation.getParent?.()?.navigate?.('Orders');
          }}
          style={styles.btnAlt}
        >
          <Text style={styles.btnAltText}>{t('successMobile.viewOrders')}</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16, gap: 10, backgroundColor: '#fff' },
  badge: {
    width: 90,
    height: 90,
    borderRadius: 26,
    backgroundColor: '#8B1D1D',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  badgeText: { color: '#fff', fontWeight: '900', fontSize: 44 },
  title: { fontSize: 24, fontWeight: '900', color: '#111' },
  text: { color: '#444', textAlign: 'center' },
  actions: { width: '100%', gap: 10, marginTop: 16 },
  btn: { backgroundColor: '#8B1D1D', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '900' },
  btnAlt: { backgroundColor: '#111', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  btnAltText: { color: '#fff', fontWeight: '900' },
});

export default SuccessScreen;
