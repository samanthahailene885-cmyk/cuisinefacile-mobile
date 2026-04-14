import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useAuth } from '../contexts/AuthContext';
import { fetchUserByEmail } from '../api';

const LoginScreen: React.FC = () => {
  const { user, loading, loginExisting, createAccount, logout, lastLoginAction } = useAuth();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [accountExists, setAccountExists] = useState<boolean | null>(null);

  const isLogged = !!user?.email;

  const initials = useMemo(() => {
    const src = user?.name || user?.email || '';
    return src
      .split(/\s|@/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase())
      .join('');
  }, [user?.email, user?.name]);

  const checkAccount = async () => {
    const normalized = email.trim().toLowerCase();
    if (!normalized) {
      setAccountExists(null);
      return;
    }
    try {
      const existing = await fetchUserByEmail(normalized);
      setAccountExists(Boolean(existing));
    } catch {
      setAccountExists(null);
    }
  };

  const onLogin = async () => {
    try {
      setError(null);
      setSuccess(null);
      setSaving(true);
      await loginExisting({ email });
      setEmail('');
      setName('');
      setPhone('');
      setSuccess('Connexion réussie');
    } catch (e: any) {
      setError(e?.message ?? 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const onCreate = async () => {
    try {
      setError(null);
      setSuccess(null);
      setSaving(true);
      await createAccount({ email, name, phone });
      setEmail('');
      setName('');
      setPhone('');
      setSuccess('Compte créé');
    } catch (e: any) {
      setError(e?.message ?? 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.text}>Chargement…</Text>
      </View>
    );
  }

  if (isLogged) {
    return (
      <View style={styles.container}>
        <View style={styles.profile}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials || 'U'}</Text>
          </View>
          <Text style={styles.title}>{user?.name || 'Utilisateur'}</Text>
          <Text style={styles.text}>{user?.email}</Text>
          {!!user?.phone && <Text style={styles.text}>{user.phone}</Text>}
          {lastLoginAction === 'created' && <Text style={styles.info}>Compte créé automatiquement.</Text>}
          {lastLoginAction === 'existing' && <Text style={styles.info}>Compte existant.</Text>}
        </View>

        <Pressable onPress={logout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Déconnexion</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Connexion</Text>
      <Text style={styles.text}>Saisis ton email pour te connecter.</Text>

      <View style={styles.form}>
        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={(v) => {
            setEmail(v);
            setAccountExists(null);
          }}
          onBlur={checkAccount}
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
        />
        <TextInput placeholder="Nom (optionnel)" value={name} onChangeText={setName} style={styles.input} />
        <TextInput placeholder="Téléphone (optionnel)" value={phone} onChangeText={setPhone} style={styles.input} />

        {!!error && <Text style={styles.error}>{error}</Text>}
        {!!success && <Text style={styles.success}>{success}</Text>}

        {accountExists === false && <Text style={styles.info}>Aucun compte trouvé. Vous pouvez le créer.</Text>}
        {accountExists === true && <Text style={styles.info}>Compte trouvé. Vous pouvez vous connecter.</Text>}

        <Pressable onPress={onLogin} disabled={saving || accountExists === false} style={[styles.btn, (saving || accountExists === false) && styles.btnDisabled]}>
          <Text style={styles.btnText}>{saving ? 'Connexion…' : 'Se connecter'}</Text>
        </Pressable>
        <Pressable
          onPress={onCreate}
          disabled={saving || accountExists === true}
          style={[styles.btnAlt, (saving || accountExists === true) && styles.btnDisabled]}
        >
          <Text style={styles.btnAltText}>{saving ? 'Création…' : 'Créer un compte'}</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 10 },
  title: { fontSize: 22, fontWeight: '900', color: '#111' },
  text: { color: '#444' },
  form: { gap: 10, marginTop: 10 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  btn: {
    backgroundColor: '#8B1D1D',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontWeight: '900' },
  btnAlt: {
    backgroundColor: '#111',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnAltText: { color: '#fff', fontWeight: '900' },
  error: { color: '#b00020', fontWeight: '800' },
  success: { color: '#0a7a33', fontWeight: '800' },
  info: { color: '#0b4a7a', fontWeight: '800' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  profile: { alignItems: 'center', marginTop: 20, gap: 6 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  avatarText: { color: '#fff', fontWeight: '900', fontSize: 22 },
  logoutBtn: {
    marginTop: 18,
    backgroundColor: '#111',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutText: { color: '#fff', fontWeight: '900' },
});

export default LoginScreen;
