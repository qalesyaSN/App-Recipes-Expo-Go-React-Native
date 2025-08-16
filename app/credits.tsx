// app/credits.tsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Linking, TouchableOpacity } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Palet Warna (bisa Anda impor dari file palet global jika ada, atau definisikan di sini)
// Saya akan menggunakan palet yang mirip dengan yang terakhir kita pakai
const PALETTE = {
  background: '#F4F4F4',
  card: '#FFFFFF',
  textPrimary: '#2D2D2D',
  textSecondary: '#7A7A7A',
  accentBlue: '#007AFF', // Warna untuk link atau aksen
  borderColor: '#EEEEEE',
  headerText: '#211e2f', // Jika header punya warna teks sendiri
};

// Informasi Aplikasi (Ganti dengan informasi Anda)
const APP_NAME = "Aplikasi ResepKu";
const APP_VERSION = "1.0.2"; // Ambil dari package.json atau set manual
const DEVELOPER_NAME = "Dian & Gemini AI";
const DEVELOPER_CONTACT =
"ustadcage48@gmail.com"; // Opsional

// Daftar Pustaka/Aset yang Digunakan (Contoh)
const LIBRARIES_USED = [
  { name: 'React Native', link: 'https://reactnative.dev/' },
  { name: 'Expo & Expo Router', link: 'https://expo.dev/' },
  { name: 'Expo SQLite (Next)', link: 'https://docs.expo.dev/versions/latest/sdk/sqlite/' },
  { name: 'Ionicons (dari @expo/vector-icons)', link: 'https://icons.expo.fyi/' },
  { name: 'React Native Toast Message', link: 'https://github.com/calintamas/react-native-toast-message' },
  // Tambahkan pustaka lain yang Anda gunakan
];

const FONT_USED = { name: 'Outfit', link: 'https://fonts.google.com/specimen/Outfit' }; // Contoh

export default function CreditsScreen() {
  const openLink = (url: string) => {
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        // showAppToast('error', 'Tidak bisa membuka link', url); // Jika Anda punya toast helper
        alert(`Tidak bisa membuka URL: ${url}`);
      }
    });
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Credits & Tentang',
          // headerStyle: { backgroundColor: PALETTE.background }, // Sesuaikan gaya header jika perlu
          // headerTintColor: PALETTE.headerText,
          // headerTitleStyle: { fontFamily: 'Outfit Bold' }, // Gunakan font kustom Anda
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.section}>
          <Text style={styles.appName}>{APP_NAME}</Text>
          <Text style={styles.appVersion}>Versi {APP_VERSION}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dikembangkan Oleh</Text>
          <Text style={styles.text}>{DEVELOPER_NAME}</Text>
          {DEVELOPER_CONTACT ? (
            <TouchableOpacity onPress={() => openLink(`mailto:${DEVELOPER_CONTACT}`)}>
              <Text style={styles.linkText}>{DEVELOPER_CONTACT}</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Font yang Digunakan</Text>
          <TouchableOpacity onPress={() => openLink(FONT_USED.link)}>
            <Text style={styles.linkText}>{FONT_USED.name}</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pustaka & Aset</Text>
          {LIBRARIES_USED.map((lib, index) => (
            <TouchableOpacity key={index} onPress={() => openLink(lib.link)} style={styles.listItem}>
              <Text style={styles.linkText}>{lib.name}</Text>
              <Ionicons name="open-outline" size={16} color={PALETTE.accentBlue} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ucapan Terima Kasih</Text>
          <Text style={styles.text}>
            Terima kasih telah menggunakan aplikasi ini! 
            {/* Tambahkan ucapan terima kasih lain jika ada */}
          </Text>
        </View>
        
        {/* Anda bisa menambahkan copyright di paling bawah jika perlu */}
        <Text style={styles.copyrightText}>© {new Date().getFullYear()} {DEVELOPER_NAME}. All rights reserved.</Text>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PALETTE.background,
    fontFamily: 'Outfit Regular',
  },
  contentContainer: {
    padding: 20,
  },
  section: {
    backgroundColor: PALETTE.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 0,
    shadowColor: PALETTE.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    fontFamily: 'Outfit Regular',
  },
  appName: {
    fontSize: 26,
    fontFamily: 'Outfit Bold', // Gunakan font kustom Anda
    color: PALETTE.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 14,
    fontFamily: 'Outfit Regular', // Gunakan font kustom Anda
    color: PALETTE.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Outfit Bold', // Gunakan font kustom Anda
    color: PALETTE.textPrimary,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.borderColor,
    paddingBottom: 8,
    fontFamily: 'Outfit Bold',
  },
  text: {
    fontSize: 15,
    fontFamily: 'Outfit Regular', // Gunakan font kustom Anda
    color: PALETTE.textSecondary,
    lineHeight: 22,
    marginBottom: 8,
    fontFamily: 'Outfit Regular',
  },
  linkText: {
    fontSize: 15,
    fontFamily: 'Outfit Regular', // Gunakan font kustom Anda
    color: PALETTE.accentBlue,
    lineHeight: 22,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  copyrightText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 12,
    fontFamily: 'Outfit Regular', // Gunakan font kustom Anda
    color: PALETTE.textMuted,
  }
});
