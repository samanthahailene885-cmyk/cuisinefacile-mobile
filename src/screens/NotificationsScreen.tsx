import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const NotificationsScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notifications</Text>
      <Text style={styles.text}>Aucune notification pour le moment.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 10 },
  title: { fontSize: 22, fontWeight: '900', color: '#111' },
  text: { color: '#444' },
});

export default NotificationsScreen;
