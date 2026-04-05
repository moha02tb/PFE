import React from 'react';
import { View, Text, StyleSheet, Button, Linking } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function PharmacyCard({ pharmacie }) {
  const { t } = useTranslation();

  return (
    <View style={styles.card}>
      <Text style={styles.nom}>{pharmacie.nom}</Text>
      <Text style={styles.adresse}>📍 {pharmacie.adresse}</Text>
      <Text style={styles.tel}>☎️ {pharmacie.telephone}</Text>
      <Button
        title={t('home.call')}
        color="#2196f3"
        onPress={() => Linking.openURL(`tel:${pharmacie.telephone}`)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  nom: { fontSize: 20, fontWeight: 'bold', marginBottom: 8, color: '#333' },
  adresse: { marginBottom: 5, color: '#555' },
  tel: { marginBottom: 10, color: '#555' },
});
