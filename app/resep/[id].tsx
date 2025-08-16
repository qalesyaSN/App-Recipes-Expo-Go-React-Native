import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Platform, // Untuk styling spesifik OS jika perlu
} from 'react-native';
import {
  useLocalSearchParams,
  Stack,
  useRouter,
  Link,
  useFocusEffect,
} from 'expo-router';
// 1. IMPOR FUNGSI FAVORIT
import {
  getMenuItemById,
  MenuItem as MenuItemType,
  deleteMenuItem,
  addFavorite,
  removeFavorite
} from '../db';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { showAppToast } from '../utils/toastHelper'; // <-- 1. IMPOR HELPER TOAST


// Fungsi helper formatDate (bisa diimpor dari file utilitas jika sudah ada)
const formatDate = (isoString: string | null): string => {
  if (!isoString) return 'Tanggal tidak diketahui';
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch (e) { return 'Format tanggal salah'; }
};

// Palet Warna Modern (sesuaikan dengan tema aplikasi Anda)
const PALETTE = {
  background: '#f4f4f4',
  cardBackground: '#F8F9FA',
  textPrimary: '#222222',
  textSecondary: '#5F6368',
  textMuted: '#80868B',
  accentBlue: '#211e2f',
  dangerButton: '#211e2f', // Warna merah yang lebih standar untuk hapus
  dangerButtonText: '#FFFFFF',
  favoriteActiveButton: '#5F6368', // Tomat (accentLove)
  favoriteInactiveButton:
  '#192236', // Abu-abu netral
  favoriteButtonText: '#FFFFFF',
  borderColor: '#E8EAED',
  iconColor: '#5F6368',
  accentLove: '#FF6347', // Untuk ikon hati aktif
};


export default function ResepDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const [resep, setResep] = useState<MenuItemType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const recipeId = id ? parseInt(id, 10) : null;

  const fetchResepDetail = useCallback(async () => {
    // Fungsi ini akan dipanggil oleh useFocusEffect
    // setIsLoading(true); // isLoading diatur oleh useFocusEffect
    if (!recipeId || isNaN(recipeId)) {
      showAppToast("error", "Error ID", "ID Resep tidak valid atau tidak ditemukan.");
      setIsLoading(false);
      if (router.canGoBack()) router.back(); else router.replace('/(tabs)');
      return;
    }
    try {
      // Pastikan getMenuItemById di db.ts mengembalikan isFavorite
      const data = await getMenuItemById(recipeId);
      if (data) {
        setResep(data);
      } else {
        showAppToast("error", "Tidak Ditemukan", "Resep tidak ditemukan.");
        if (router.canGoBack()) router.back(); else router.replace('/(tabs)');
      }
    } catch (error) {
      console.error("Gagal mengambil detail resep:", error);
      showAppToast("error", "Gagal Memuat", "Gagal mengambil detail resep.");
    } finally {
      setIsLoading(false);
    }
  }, [recipeId, router]);


  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      setIsLoading(true); // Set loading true di awal useFocusEffect

      const loadData = async () => {
        await fetchResepDetail();
        // setIsLoading(false) sudah dihandle di fetchResepDetail
      };

      if (isActive) {
        loadData();
      }
      
      return () => { isActive = false; };
    }, [fetchResepDetail]) // fetchResepDetail sekarang jadi dependensi
  );
  
  // 2. BUAT FUNGSI handleToggleFavorite
  const handleToggleFavorite = async () => {
    if (!resep || !recipeId) return;

    const currentIsFavorite = !!resep.isFavorite; // Pastikan boolean

    try {
      if (currentIsFavorite) {
        await removeFavorite(recipeId);
        showAppToast('success',
        'Bookmark Dihapus',
        `"${resep.nama}"
        dihapus dari
        bookmark.`);
      } else {
        await addFavorite(recipeId);
        showAppToast('success',
        'Bookmark Ditambahkan',
        `"${resep.nama}"
        ditambahkan ke
        bookmark.`);
      }
      // Update state resep lokal untuk merefleksikan perubahan status favorit
      setResep(prevResep => prevResep ? { ...prevResep, isFavorite: !currentIsFavorite } : null);
    } catch (error) {
      console.error("Gagal mengubah status favorit:", error);
      showAppToast('error', 'Gagal', 'Gagal mengubah status favorit.');
    }
  };


  const handleDeleteResep = () => {
    if (!resep || !recipeId) return;
    Alert.alert(
      "Konfirmasi Hapus",
      `Yakin ingin menghapus resep "${resep.nama}"?`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          onPress: async () => {
            try {
              await deleteMenuItem(recipeId); // Gunakan recipeId yang sudah divalidasi
              showAppToast('success',
              'Sukses!',
              `Resep "${resep.nama}" berhasil dihapus.`); // Pesan diperbaiki
              router.replace('/(tabs)'); // Atau navigasi lain yang sesuai
            } catch (error) {
              console.error("Gagal menghapus resep:", error);
              showAppToast('error',
              'Gagal Hapus',
              'Tidak dapat menghapus resep.');
            }
          },
          style: "destructive"
        }
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centeredLoader}>
        <ActivityIndicator size="large" color={PALETTE.accentBlue} />
        <Text style={styles.loadingText}>Memuat detail...</Text>
      </View>
    );
  }

  if (!resep) {
    // Pesan ini akan muncul jika fetchResepDetail gagal dan setResep(null) atau tidak menemukan data
    return (
      <View style={styles.centeredLoader}>
        <Stack.Screen options={{ title: 'Error' }} />
        <Text style={styles.errorText}>Resep tidak dapat dimuat atau tidak ditemukan.</Text>
        <TouchableOpacity onPress={() => router.replace('/(tabs)')} style={styles.backButton}>
            <Text style={styles.backButtonText}>Kembali ke Daftar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isCurrentlyFavorite = !!resep.isFavorite;

  return (
    <View style={styles.pageContainer}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        <Stack.Screen options={{
          title: 'Detail Resep',
          headerTitleAlign: 'center',
          headerRight: () => (
            <Link href={`/edit-resep/${resep.id}`} asChild>
              <TouchableOpacity style={{ marginRight: 15, padding: 5 }}>
                <Ionicons name="create-outline" size={26} color={PALETTE.accentBlue} />
              </TouchableOpacity>
            </Link>
          ),
           headerStyle: { backgroundColor: '#fff' },
           headerTitleStyle: {
           color: PALETTE.textPrimary,
           fontFamily: 'Outfit Regular'}, 
           headerTintColor: PALETTE.accentBlue,
        }} />

        <View style={styles.headerInfoSection}>
          <Text style={styles.recipeTitle}>{resep.nama}</Text>
          <View style={styles.metaInfoContainer}>
            <View style={styles.metaItem}>
              <Ionicons name="pricetag-outline" size={15} color={PALETTE.textSecondary} style={styles.metaIcon} />
              <Text style={styles.metaText}>{resep.kategori || 'Tidak ada kategori'}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={15} color={PALETTE.textSecondary} style={styles.metaIcon} />
              <Text style={styles.metaText}>{formatDate(resep.tanggal)}</Text>
            </View>
             {/* Tampilkan status favorit di header jika diinginkan */}
 
          </View>
        </View>

        <Text style={styles.sectionTitle}>Bahan-bahan</Text>
        <View style={styles.sectionContainer}>
          {resep.ingredients.length > 0 ? (
            resep.ingredients.map((bahan, index) => (
              <View key={index} style={styles.ingredientItem}>
                <Text style={styles.ingredientName}>{bahan.name}</Text>
                <Text style={styles.ingredientQuantity}>{bahan.quantity}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.noDataText}>Tidak ada bahan yang dicantumkan.</Text>
          )}
        </View>
      </ScrollView>

      {/* 3. MODIFIKASI stickyButtonContainer */}
      <View style={styles.stickyButtonContainer}>
        <TouchableOpacity
            style={[
              styles.buttonBase,
              isCurrentlyFavorite ? styles.activeFavoriteButton : styles.inactiveFavoriteButton,
              styles.actionButton // Common style for flex
            ]}
            onPress={handleToggleFavorite}
        >
            <FontAwesome 
              name={isCurrentlyFavorite ? "bookmark" : "bookmark-o"}
              size={20} 
              color={PALETTE.favoriteButtonText} // Asumsi teks tombol favorit selalu putih
              style={{marginRight: 8}} 
            />
            <Text style={[styles.buttonTextBase, styles.favoriteButtonText]}>
              {isCurrentlyFavorite ? "Bookmark" : "Bookmark"}
            </Text>
        </TouchableOpacity>
        
        <View style={styles.buttonSpacer} /> 

        <TouchableOpacity
            style={[styles.buttonBase, styles.deleteButton, styles.actionButton]}
            onPress={handleDeleteResep}
        >
            <Ionicons name="trash-outline" size={20} color={PALETTE.dangerButtonText} style={{marginRight: 8}} />
            <Text style={[styles.buttonTextBase, styles.deleteButtonText]}>Hapus</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    backgroundColor: PALETTE.background,
    marginTop: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: Platform.OS === 'ios' ? 100 : 85, // Lebih banyak ruang untuk iOS karena safe area bawah
  },
  centeredLoader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: PALETTE.background,
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: PALETTE.textSecondary,
    fontFamily: 'Outfit Regular',
  },
  errorText: {
    fontSize: 17,
    color: PALETTE.dangerButton,
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'Outfit Regular',
  },
  backButton: {
    backgroundColor: PALETTE.accentBlue,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  backButtonText: {
    color: '#FFFFFF', // Diubah agar kontras dengan accentBlue
    fontSize: 16,
    fontFamily: 'Outfit Bold',
  },
  headerInfoSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 0,
    borderBottomColor: PALETTE.borderColor,
    marginBottom: 20,
    marginTop: 0, 
    marginHorizontal: 16,
    borderRadius: 12,
  },
  recipeTitle: {
    fontSize: 25,
    color: PALETTE.textPrimary,
    marginBottom: 12,
    textAlign:'center',
    fontFamily: 'Outfit Bold'
  },
  metaInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around', 
    flexWrap: 'wrap', 
    marginTop: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 5, 
    marginBottom: 5,
  },
  metaIcon: {
    marginRight: 6,
  },
  metaText: {
    fontSize: 13,
    color: PALETTE.textSecondary,
    fontFamily: 'Outfit Regular'
  },
  sectionContainer: {
    paddingHorizontal: 20,
    marginBottom: 25,
    backgroundColor: '#fff',
    padding: 10,
    marginHorizontal: 16,
    borderRadius: 12,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    paddingTop: 5,
  },
  sectionTitle: {
    fontSize: 17,
    color: PALETTE.textPrimary,
    marginBottom: 0,
    paddingBottom: 0,
    paddingLeft: 20,
    paddingVertical: 12,
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    fontFamily: 'Outfit Bold'
  },
  ingredientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  ingredientName: {
    fontSize: 16,
    color: PALETTE.textSecondary,
    flex: 2.5,
    fontFamily: 'Outfit Regular'
  },
  ingredientQuantity: {
    fontSize: 16,
    color: PALETTE.textMuted,
    flex: 1,
    textAlign: 'right',
    fontFamily: 'Outfit Regular'
  },
  noDataText: {
    fontSize: 15,
    fontFamily: 'Outfit Regular',
    color: PALETTE.textMuted,
    textAlign: 'center',
    paddingVertical: 10,
  },
  stickyButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Platform.OS === 'ios' ? 20 : 15,
    paddingHorizontal: 16,
    backgroundColor: PALETTE.background, 
    borderTopWidth: 0,
    borderTopColor: PALETTE.borderColor,
    elevation: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonBase: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 15,
    borderRadius: 12,
    elevation: 0,
  },
  actionButton: {
    flex: 1,
  },
  buttonSpacer: {
    width: 10,
  },
  buttonTextBase: {
    fontSize: 16,
    textAlign: 'center',
    fontFamily: 'Outfit Regular',
  },
  activeFavoriteButton: {
    backgroundColor: PALETTE.favoriteActiveButton,
  },
  inactiveFavoriteButton: {
    backgroundColor: PALETTE.favoriteInactiveButton,
    borderWidth: 1,
    borderColor: PALETTE.borderColor,
  },
  favoriteButtonText: {
    color: PALETTE.favoriteButtonText,
  },
  deleteButton: {
    backgroundColor: PALETTE.dangerButton,
  },
  deleteButtonText: {
    color: PALETTE.dangerButtonText,
  },
});