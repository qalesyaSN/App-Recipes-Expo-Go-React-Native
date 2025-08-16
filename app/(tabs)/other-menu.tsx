import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Dimensions, TouchableOpacity, Alert, Platform, ActivityIndicator } from 'react-native';
import { Stack, Link, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { showAppToast } from '../utils/toastHelper';

// Palet Warna (dari kode Anda)
const PALETTE = {
  background: '#F4F4F4',
  cardBackground: '#FFFFFF',
  textPrimary: '#1A202C',
  textSecondary: '#4A5568',
  textMuted: '#718096',
  borderColor: '#E2E8F0',
  listIconColor: '#211e2f',
  shadowColor: '#A0AEC0',
  accentColor: '#007AFF',
};

// Path ke gambar default Anda
const defaultBannerImage = require('../../assets/images/ktc.jpg');

// Lokasi penyimpanan permanen untuk banner kustom di direktori aplikasi
const CUSTOM_BANNER_PATH = FileSystem.documentDirectory + 'custom_banner.jpg';
// Kunci untuk menyimpan path di AsyncStorage
const BANNER_STORAGE_KEY = '@MyApp:customBannerPath';

const screenWidth = Dimensions.get('window').width;
const bannerMarginHorizontal = 20;
const bannerWidth = screenWidth - (bannerMarginHorizontal * 2);

const APP_VERSION = "1.0.2";
const DEVELOPER_NAME = "Dian";

export default function MenuLainnyaScreen() {
  const router = useRouter();

  // State untuk menyimpan URI banner yang akan ditampilkan
  const [currentBannerUri, setCurrentBannerUri] = useState<string | null>(null);
  // State untuk melacak apakah sedang memuat path gambar
  const [isBannerLoading, setIsBannerLoading] = useState(true);

  // Fungsi untuk memuat path banner yang tersimpan saat layar ini mendapatkan fokus
  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const loadBanner = async () => {
        if (!isActive) return;
        // Selalu set loading ke true saat fokus agar ada indikator jika prosesnya lambat
        setIsBannerLoading(true);
        try {
          const savedPath = await AsyncStorage.getItem(BANNER_STORAGE_KEY);
          if (savedPath) {
            const fileInfo = await FileSystem.getInfoAsync(savedPath);
            if (fileInfo.exists) {
              // PERBAIKAN: Selalu tambahkan timestamp baru saat memuat dari storage
              // Ini adalah kunci untuk mengalahkan cache React Native
              setCurrentBannerUri(savedPath + '?' + new Date().getTime());
            } else {
              // File tidak ditemukan, bersihkan storage
              await AsyncStorage.removeItem(BANNER_STORAGE_KEY);
              setCurrentBannerUri(null);
            }
          } else {
            // Tidak ada path tersimpan, gunakan default
            setCurrentBannerUri(null);
          }
        } catch (error) {
          console.error("Gagal memuat banner:", error);
          setCurrentBannerUri(null); // Fallback ke default jika error
        } finally {
          if (isActive) {
            setIsBannerLoading(false);
          }
        }
      };
      loadBanner();

      return () => {
        isActive = false;
      };
    }, [])
  );

  // Fungsi untuk memilih dan menyimpan gambar baru
  const handleChooseImage = async () => {
    // 1. Minta izin akses ke galeri
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Izin Diperlukan', 'Aplikasi memerlukan izin untuk mengakses galeri gambar Anda.');
      return;
    }

    // 2. Buka galeri gambar
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9], // Rasio aspek untuk crop
      quality: 0.8,    // Kompresi gambar
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const selectedImageUri = result.assets[0].uri;
      try {
        // 3. Salin gambar yang dipilih ke lokasi permanen (menimpa yang lama)
        await FileSystem.copyAsync({
          from: selectedImageUri,
          to: CUSTOM_BANNER_PATH,
        });

        // 4. Simpan path baru yang permanen ke AsyncStorage
        await AsyncStorage.setItem(BANNER_STORAGE_KEY, CUSTOM_BANNER_PATH);

        // 5. Perbarui state dengan timestamp baru untuk memaksa re-render
        const newUri = CUSTOM_BANNER_PATH + '?' + new Date().getTime();
        setCurrentBannerUri(newUri);

        showAppToast('success', 'Sukses!', 'Gambar berhasil diperbarui!');
      } catch (error) {
        console.error("Gagal menyimpan gambar baru:", error);
        showAppToast('error', 'Gagal Diperbarui', 'Gagal memperbarui gambar.');
      }
    }
  };
  
  // Tentukan sumber gambar: gunakan URI kustom jika ada, jika tidak gunakan gambar default
  const imageSource = currentBannerUri ? { uri: currentBannerUri } : defaultBannerImage;

  const dummyData = [
    { id: '1', title: 'Kirim masukan', icon: 'mail-outline' as keyof typeof Ionicons.glyphMap, href: '/feedback' },
    { id: '2', title: 'Kredit aplikasi', icon: 'information-circle' as keyof typeof Ionicons.glyphMap, href: '/credits' },
  ];

  return (
    <View style={styles.pageContainer}>
      <Stack.Screen options={{ title: 'Menu Lainnya' }} />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mainContent}> 
          <View style={styles.bannerContainer}>
            {isBannerLoading ? (
              <View style={[styles.bannerImage, styles.bannerLoading]} >
                  <ActivityIndicator color={PALETTE.textSecondary} />
              </View>
            ) : (
              <TouchableOpacity onPress={handleChooseImage} activeOpacity={0.8}>
                <Image 
                  source={imageSource}
                  style={styles.bannerImage}
                  key={currentBannerUri} // Key ini penting untuk memaksa re-render
                />
                <View style={styles.editBannerOverlay}>
                  <Ionicons name="camera-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.editBannerText}>Ubah</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.listContainer}>
            {dummyData.map((item) => (
              <Link key={item.id} href={item.href as any} asChild>
                <TouchableOpacity 
                  style={styles.listItemContainer} 
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name={item.icon} 
                    size={22}
                    color={PALETTE.listIconColor}
                    style={styles.listItemIcon} 
                  />
                  <Text style={styles.listItemText}>{item.title}</Text>
                  <Ionicons name="chevron-forward-outline" size={20} color={PALETTE.textSecondary} />
                </TouchableOpacity>
              </Link>
            ))}
          </View>
        </View>

        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>Versi {APP_VERSION}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  pageContainer: { flex: 1, backgroundColor: PALETTE.background },
  scrollView: { flex: 1 },
  scrollViewContent: { flexGrow: 1, justifyContent: 'space-between' },
  mainContent: {},
  bannerContainer: {
    marginHorizontal: bannerMarginHorizontal,
    marginTop: 20,
    marginBottom: 25,
    borderRadius: 12,
    elevation: 0,
    shadowColor: PALETTE.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    backgroundColor: PALETTE.cardBackground,
  },
  bannerImage: {
    width: bannerWidth,
    height: bannerWidth * 0.55,
    resizeMode: 'cover',
    borderRadius: 12,
  },
  bannerLoading: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: PALETTE.borderColor,
  },
  editBannerOverlay: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  editBannerText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 6,
    fontFamily: 'Outfit Regular',
  },
  listContainer: { paddingHorizontal: 20 },
  listItemContainer: {
    backgroundColor: PALETTE.cardBackground,
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 0,
    borderColor: PALETTE.borderColor,
  },
  listItemIcon: { marginRight: 15 },
  listItemText: {
    flex: 1,
    fontSize: 16,
    color: PALETTE.textPrimary,
    fontFamily: 'Outfit Regular',
  },
  footerContainer: {
    alignItems: 'center',
    paddingVertical: 25,
    marginTop: 30, 
    borderTopWidth: 0,
    borderTopColor: PALETTE.borderColor,
  },
  footerText: {
    fontSize: 12,
    color: PALETTE.textMuted,
    lineHeight: 18,
    fontFamily: 'Outfit Regular',
  },
});
