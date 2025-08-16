// app/_layout.tsx
import React, { useEffect, useCallback } from 'react';
import { Stack } from 'expo-router';
import { View, Alert } from 'react-native'; // Impor Alert dan View
import { initializeDatabase } from './db'; // Pastikan path ini benar
import Toast from 'react-native-toast-message';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { toastConfig } from './utils/toastConfig'; // Pastikan path ini benar

SplashScreen.preventAutoHideAsync();

// NAMA FONT YANG AKAN DIGUNAKAN (konsisten dengan yang di-load)
const FONT_FAMILY_REGULAR = 'Outfit Regular';
const FONT_FAMILY_BOLD = 'Outfit Bold';

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    [FONT_FAMILY_REGULAR]: require('../assets/fonts/Outfit-Regular.ttf'), // Menggunakan konstanta
    [FONT_FAMILY_BOLD]: require('../assets/fonts/Outfit-Bold.ttf'),       // Menggunakan konstanta
  });

  useEffect(() => {
    const initDb = async () => {
      try {
        console.log("[RootLayout DEBUG] Memanggil initializeDatabase...");
        await initializeDatabase();
        console.log('DATABASE: Panggilan initializeDatabase dari ROOT _layout.tsx selesai.');
      } catch (e: any) {
        console.error("DATABASE: !!! GAGAL KRITIS saat memanggil initializeDatabase dari ROOT _layout.tsx !!!");
        console.error("DATABASE: Pesan Error:", e.message);
        console.error("DATABASE: Seluruh Objek Error:", JSON.stringify(e, null, 2));
        Alert.alert(
          "Kesalahan Database Kritis",
          `Tidak dapat menginisialisasi database: ${e.message}. Aplikasi mungkin tidak akan berfungsi dengan benar. Coba restart aplikasi atau hubungi developer jika masalah berlanjut.`
        );
      }
    };
    initDb();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
      if (fontError) {
        console.error("FONT ERROR: Gagal memuat font kustom:", fontError);
        Alert.alert("Kesalahan Font", "Gagal memuat font kustom, tampilan mungkin berbeda.");
      } else {
        console.log("FONTS: Font kustom berhasil dimuat!");
      }
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <>
        <Stack
          screenOptions={{
            headerTitleAlign: 'center',
            // -- TAMBAHKAN INI UNTUK MENGATUR FONT HEADER GLOBAL --
            headerTitleStyle: {
              fontFamily: FONT_FAMILY_REGULAR, // Menggunakan konstanta nama font
              // Anda juga bisa mengatur properti lain seperti fontSize, fontWeight, color di sini jika perlu
              // fontSize: 18, // Contoh
              // fontWeight: 'normal', // Pastikan ini 'normal' jika 'Outfit Regular' adalah font normal weight
            },
            // Anda bisa menambahkan default styling header lainnya di sini
            // headerStyle: { backgroundColor: '#f4511e' }, // Contoh warna background header
            // headerTintColor: '#fff', // Contoh warna tombol back dan title (jika tidak di-override oleh headerTitleStyle.color)
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="resep/[id]"
            options={{ 
              title: 'Detail Resep',
              // Jika Anda ingin font yang berbeda untuk layar spesifik, bisa override di sini:
              headerTitleStyle:
              { fontFamily:
              FONT_FAMILY_REGULAR
              }
            }}
          />
          <Stack.Screen
            name="edit-resep/[id]"
            options={{ 
              title: 'Edit Resep',
              // headerTitleStyle: { fontFamily: FONT_FAMILY_REGULAR } // Ini sudah default dari screenOptions
            }}
          />
          <Stack.Screen
            name="resep/tambah"
            options={{ 
              title: 'Tambah Resep',
              // headerTitleStyle: { fontFamily: FONT_FAMILY_REGULAR } // Ini sudah default dari screenOptions
            }}
          />
        <Stack.Screen
            name="credits"
            options={{ 
              title: 'Kredit dan Pengembang',
              // headerTitleStyle: { fontFamily: FONT_FAMILY_REGULAR } // Ini sudah default dari screenOptions
            }}
          />
          <Stack.Screen
            name="feedback"
            options={{ 
              title: 'Kritik dan Saran',
              // headerTitleStyle: { fontFamily: FONT_FAMILY_REGULAR } // Ini sudah default dari screenOptions
            }}
          />
        </Stack>
        <Toast config={toastConfig} />
      </>
    </View>
  );
}
