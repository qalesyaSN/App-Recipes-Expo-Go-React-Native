import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import {
  databaseName,
  databasePath,
  closeCurrentDatabase,
  reinitializeDatabaseConnection,
  checkpointDatabase,
  getTotalRowCount // <-- 1. Impor getTotalRowCount
} from '../db';
import { useRouter } from 'expo-router';
import { showAppToast } from '../utils/toastHelper';

// Palet warna Anda
const MODERN_PALETTE = {
  background: '#F7F7F7',
  card: '#FFFFFF',
  textPrimary: '#2D3748',
  textSecondary: '#718096',
  primaryButton: '#211e2f',
  primaryButtonText: '#FFFFFF',
  exportButton: '#211e2f',
  importButton: '#3f3c4d',
  warningTextLight: '#E2E8F0',
  warningIconColor: '#FFD700',
};

export default function ManajemenDataScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleExportDatabase = async () => {
    // ... (Fungsi ekspor Anda tidak diubah)
    if (!(await Sharing.isAvailableAsync())) {
      showAppToast("error", "Fitur Sharing Tidak Tersedia", "Sharing tidak didukung di perangkat ini.");
      return;
    }
    const dbFileInfo = await FileSystem.getInfoAsync(databasePath);
    if (!dbFileInfo.exists) {
        showAppToast("error", "Ekspor Gagal", "File database tidak ditemukan.");
        return;
    }
    setIsLoading(true);
    try {
      await checkpointDatabase();
      await Sharing.shareAsync(databasePath, { mimeType: 'application/x-sqlite3', dialogTitle: `Ekspor Database (${databaseName})` });
    } catch (error) {
      showAppToast("error", "Error Ekspor", "Gagal mengekspor database.");
      console.error("Error exporting database:", error);
    } finally {
      setIsLoading(false);
    }
  };


  // --- FUNGSI IMPOR YANG DIPERBARUI ---
  const handleImportDatabase = async () => {
    Alert.alert(
      "Peringatan Penting!",
      "Mengimpor database akan MENGGANTI semua data resep Anda saat ini. Tindakan ini tidak dapat dibatalkan. Yakin ingin melanjutkan?",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Lanjutkan Impor",
          style: "destructive",
          onPress: async () => {
            let pickedFileUri = '';
            try {
              const result = await DocumentPicker.getDocumentAsync({
                type: '*/*', // Izinkan semua file agar lebih fleksibel
                copyToCacheDirectory: true,
              });

              if (result.canceled || !result.assets || result.assets.length === 0) {
                showAppToast("info", "Dibatalkan", "Pemilihan file impor dibatalkan.");
                return;
              }
              
              pickedFileUri = result.assets[0].uri;
              setIsLoading(true);

              // 1. Tutup koneksi database yang sedang aktif
              console.log("[Impor] Menutup koneksi DB saat ini...");
              await closeCurrentDatabase();

              // 2. Hapus file database lama untuk memastikan clean-copy
              const fileInfo = await FileSystem.getInfoAsync(databasePath);
              if (fileInfo.exists) {
                console.log("[Impor] Menghapus file DB lama...");
                await FileSystem.deleteAsync(databasePath);
              }

              // 3. Salin file yang dipilih ke lokasi database aplikasi
              console.log(`[Impor] Menyalin file dari: ${pickedFileUri} ke: ${databasePath}`);
              await FileSystem.copyAsync({ from: pickedFileUri, to: databasePath });

              // 4. Buka kembali koneksi ke file database yang BARU
              console.log("[Impor] Membuka ulang koneksi ke DB yang baru diimpor...");
              await reinitializeDatabaseConnection();

              // 5. VERIFIKASI LANGSUNG SETELAH IMPOR
              console.log("[Impor] Memverifikasi konten database yang baru...");
              const newTotal = await getTotalRowCount('menu');
              console.log(`[Impor] Verifikasi selesai. Total resep di DB baru: ${newTotal}`);

              setIsLoading(false);

              // Tampilkan notifikasi SUKSES dengan hasil verifikasi
              Alert.alert(
                "Impor Berhasil",
                `Database berhasil diimpor. Ditemukan ${newTotal} resep di dalam file yang baru.`,
                [{ text: "OK", onPress: () => router.replace('/(tabs)') }]
              );

            } catch (error: any) {
              setIsLoading(false);
              console.error('Error selama proses impor:', error);
              Alert.alert('Impor Gagal', `Terjadi kesalahan: ${error.message}. Silakan coba lagi.`);
              // Jika gagal, coba pulihkan koneksi
              await reinitializeDatabaseConnection();
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
        <View style={styles.centered}>
            <ActivityIndicator size="large" color={MODERN_PALETTE.primaryButton} />
            <Text style={styles.loadingText}>Memproses...</Text>
        </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* ... (Tampilan JSX Anda tidak diubah) ... */}
      <View style={styles.headerContent}><Text style={styles.title}>Manajemen Data</Text><Text style={styles.description}>Anda dapat mengirim file database ke WhatsApp, MMS, atau di simpan di storage dengan fitur ekspor database.</Text></View>
      <TouchableOpacity style={[styles.button, styles.exportButton]} onPress={handleExportDatabase}><Ionicons name="download-outline" size={22} color={MODERN_PALETTE.primaryButtonText} style={{marginRight: 10}} /><Text style={[styles.buttonText, {color: MODERN_PALETTE.primaryButtonText}]}>Ekspor Database</Text></TouchableOpacity>
      <TouchableOpacity style={[styles.button, styles.importButton]} onPress={handleImportDatabase}><Ionicons name="share-outline" size={22} color={MODERN_PALETTE.primaryButtonText} style={{marginRight: 10, transform: [{ rotate: '180deg'}] }} /><Text style={[styles.buttonText, {color: MODERN_PALETTE.primaryButtonText}]}>Impor Database</Text></TouchableOpacity>
      <View style={styles.warningSection}><Ionicons name="warning-outline" size={28} color={MODERN_PALETTE.warningIconColor || "#FFA000"} style={{marginRight: 12, marginTop: 2}} /><View style={{flex: 1}}><Text style={styles.warningTitle}>Penting:</Text><Text style={styles.warningText}>• Mengimpor database akan <Text style={{fontWeight: 'bold', color: MODERN_PALETTE.warningTextLight || '#FEFCE8'}}>menimpa seluruh data Anda saat ini</Text>. Pastikan Anda memiliki cadangan jika diperlukan.</Text></View></View>
    </ScrollView>
  );
}

// ... (Styles Anda tidak diubah)
const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: MODERN_PALETTE.background, },
  headerContent: { width: '100%', marginBottom: 20, },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: MODERN_PALETTE.background, },
  loadingText: { marginTop: 10, fontSize: 16, color: MODERN_PALETTE.textSecondary, fontFamily: 'Outfit Regular' },
  title: { fontSize: 26, color: MODERN_PALETTE.textPrimary, marginBottom: 12, textAlign: 'left', fontFamily: 'Outfit Regular' },
  description: { fontSize: 16, color: MODERN_PALETTE.textSecondary, textAlign: 'left', marginBottom: 30, lineHeight: 24, fontFamily: 'Outfit Regular' },
  button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15, paddingHorizontal: 20, borderRadius: 12, marginBottom: 20, width: '100%', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2, },
  buttonText: { fontSize: 16, fontFamily: 'Outfit Regular' },
  exportButton: { backgroundColor: MODERN_PALETTE.exportButton, },
  importButton: { backgroundColor: MODERN_PALETTE.importButton, },
  warningSection: { marginTop: 20, padding: 16, backgroundColor: '#3f3c4d', borderRadius: 10, width: '100%', flexDirection: 'row', alignItems: 'flex-start', },
  warningTitle: { fontSize: 16, color: MODERN_PALETTE.warningTextLight || '#FEFCE8', marginBottom: 8, fontFamily: 'Outfit Regular' },
  warningText: { fontSize: 14, color: MODERN_PALETTE.warningTextLight || '#E0E0E0', lineHeight: 20, marginBottom: 5, fontFamily: 'Outfit Regular' },
});
