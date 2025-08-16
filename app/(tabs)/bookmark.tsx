import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons,
FontAwesome,
MaterialCommunityIcons } from
'@expo/vector-icons';
import { useFocusEffect, Link } from 'expo-router';
import { MenuItem, addFavorite, removeFavorite, getFavoriteMenuItems } from '../db';

const formatDate = (isoString: string | null): string => {
  if (!isoString) return 'Tanggal tidak diketahui';
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch (e) { return 'Format tanggal salah'; }
};

const PALETTE = {
  background: '#F4F4F4',
  card: '#FFFFFF',
  textPrimary: '#2D2D2D',
  textSecondary: '#7A7A7A',
  accentBlack: '#211e2f',
  borderColor: '#EEEEEE',
  iconColor: '#555555',
  accentLove: '#211e2f',
  errorTextBackground: '#FFCDD2',
  errorTextColor: '#D32F2F',
};

export default function ResepFavoritScreen() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Default true untuk pemuatan awal
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [operationError, setOperationError] = useState<string | null>(null);

  // Fungsi inti untuk mengambil data, dibuat stabil dengan useCallback dan dependensi yang stabil
  const fetchAndSetFavorites = useCallback(async () => {
    try {
      const items = await getFavoriteMenuItems();
      setMenuItems(items || []);
      // Jangan setOperationError(null) di sini, biarkan pemanggil yang mengontrolnya
      // agar error tidak hilang terlalu cepat atau pada konteks yang salah.
    } catch (error: any) {
      console.error("Error loading favorite menu items:", error);
      const errorMessage = error instanceof Error ? error.message : "Gagal memuat data.";
      setOperationError(`Gagal memuat resep favorit: ${errorMessage}`);
      setMenuItems([]); // Pastikan menuItems adalah array kosong jika ada error
    }
  }, [setMenuItems, setOperationError]); // setMenuItems dan setOperationError adalah setter state yang stabil

  // Efek untuk pemuatan data awal saat komponen mount
  useEffect(() => {
    // console.log("Initial load useEffect triggered");
    setOperationError(null);
    setIsLoading(true); // Set loading sebelum fetch
    fetchAndSetFavorites().finally(() => {
      setIsLoading(false); // Set loading selesai setelah fetch
    });
  }, [fetchAndSetFavorites]); // Bergantung pada fetchAndSetFavorites yang stabil

  // Efek untuk memuat ulang data saat layar kembali fokus
  useFocusEffect(
    useCallback(() => {
      // console.log("Favorite screen focused, reloading data...");
      setOperationError(null);
      // Untuk useFocusEffect, kita mungkin ingin loader jika data belum ada,
      // atau refresh diam-diam jika data sudah ada.
      // Untuk konsistensi, kita set isLoading true agar ada feedback.
      setIsLoading(true);
      fetchAndSetFavorites().finally(() => {
        setIsLoading(false);
      });
    }, [fetchAndSetFavorites])
  );

  // Fungsi untuk pull-to-refresh
  const onRefresh = useCallback(async () => {
    // console.log("onRefresh triggered");
    setIsRefreshing(true);
    setOperationError(null);
    await fetchAndSetFavorites(); // fetchAndSetFavorites tidak mengubah isRefreshing
    setIsRefreshing(false); // Kontrol isRefreshing di sini
  }, [fetchAndSetFavorites]);

  const handleToggleFavorite = async (itemId: number, currentIsFavorite: boolean | undefined) => {
    const isFav = !!currentIsFavorite;
    setOperationError(null);

    try {
      if (isFav) {
        await removeFavorite(itemId);
        setMenuItems(prevItems => prevItems.filter(item => item.id !== itemId));
      } else {
        await addFavorite(itemId);
        // Setelah menambah favorit, muat ulang data untuk konsistensi
        // Kita tidak set isLoading di sini agar tidak ada loader layar penuh,
        // data akan diperbarui di latar belakang.
        await fetchAndSetFavorites();
      }
    } catch (error: any) {
      console.error("Error toggling favorite:", error);
      const baseMessage =
      isFav ? "Gagal menghapus dari bookmark"
      : "Gagal menambahkan ke bookmark";
      if (typeof error.message === 'string' && error.message.includes('Text strings must be rendered within a <Text> component')) {
        setOperationError(`${baseMessage}. Terjadi masalah tampilan saat memperbarui.`);
      } else {
        const errorMessage = error instanceof Error ? error.message : "Operasi gagal.";
        setOperationError(`${baseMessage}: ${errorMessage}`);
      }
    }
  };

  const renderItem = ({ item }: { item: MenuItem }) => (
    <View style={styles.itemOuterContainer}>
      <Link href={{ pathname: "/resep/[id]", params: { id: item.id } }} asChild>
        <TouchableOpacity style={styles.itemPressableContent}>
          <View style={{ paddingRight: 30 }}>
            <Text style={styles.itemTitle}>{item.nama}</Text>
          </View>
          <View style={styles.itemFooter}>
            <View style={styles.infoWithIcon}>
              <Ionicons name="pricetag-outline" size={14} color={PALETTE.iconColor} style={styles.infoIcon} />
              <Text style={styles.itemInfoText}>{item.kategori || 'Lainnya'}</Text>
            </View>
            <View style={styles.infoWithIcon}>
              <Ionicons name="calendar-outline" size={14} color={PALETTE.iconColor} style={styles.infoIcon} />
              <Text style={styles.itemInfoText}>{formatDate(item.tanggal)}</Text>
            </View>
          </View>
        </TouchableOpacity>
      </Link>
      <TouchableOpacity
        style={styles.favoriteIconContainer}
        onPress={() => handleToggleFavorite(item.id, item.isFavorite)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <FontAwesome 
          name={item.isFavorite
          ? "bookmark" :
          "bookmark-o"}
          size={26}
          color={item.isFavorite ? PALETTE.accentLove : PALETTE.iconColor}
        />
      </TouchableOpacity>
    </View>
  );

  const renderOperationError = () => {
    if (!operationError) return null;
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{operationError}</Text>
        <TouchableOpacity onPress={() => setOperationError(null)} style={styles.dismissButton}>
          <Ionicons name="close-circle-outline" size={20} color={PALETTE.errorTextColor} />
        </TouchableOpacity>
      </View>
    );
  };

  // Kondisi render utama
  if (isLoading && !isRefreshing) { // Loading awal atau loading saat fokus (tanpa data sebelumnya)
    return (
      <View style={styles.centeredMessage}>
        <ActivityIndicator size="large" color={PALETTE.accentBlack} />
        <Text
        style={styles.loadingText}>Memuat
        bookmark...</Text>
        {renderOperationError()}
      </View>
    );
  }

  if (menuItems.length === 0 && !isRefreshing) { // Tidak loading, tidak refreshing, tapi tidak ada item
    return (
      <View style={styles.container}>
          <View style={styles.emptyContainer}>
            {renderOperationError()}
            <MaterialCommunityIcons
            name="bookmark-off-outline"
            size={64}
            color={PALETTE.textSecondary}
            />
            <Text
            style={styles.emptyText}>Anda
            belum memiliki
            bookmark.</Text>
            <Text
            style={styles.emptySubText}>Tekan
            ikon mark pada resep
            untuk
            menambahkannya ke
            sini.</Text>
            {/* PASTIKAN PATH INI BENAR! */}
            <Link href="/(tabs)" asChild> 
               <TouchableOpacity style={styles.browseRecipesButton}>
                  <Text style={styles.browseRecipesButtonText}>Lihat Semua Resep</Text>
               </TouchableOpacity>
            </Link>
          </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Pesan error bisa juga ditampilkan di atas FlatList jika ada data */}
      {/* {renderOperationError()} */}
      <FlatList
        data={menuItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={renderOperationError} // Tampilkan error di atas list jika ada
        contentContainerStyle={styles.listContentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[PALETTE.accentBlack]}
            tintColor={PALETTE.accentBlack}
          />
        }
      />
    </View>
  );
}

// Styles (tetap sama seperti sebelumnya, pastikan semua style yang direferensikan ada)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PALETTE.background,
    // paddingTop: 16, // Dihapus, karena header list (error) bisa mengisi ruang atas
  },
  errorContainer: {
    backgroundColor: PALETTE.errorTextBackground,
    paddingVertical: 10,
    paddingHorizontal: 15,
    margin: 16,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderLeftWidth: 5,
    borderLeftColor: PALETTE.errorTextColor,
  },
  errorText: {
    color: PALETTE.errorTextColor,
    fontFamily: 'Outfit Regular',
    fontSize: 14,
    flex: 1,
  },
  dismissButton: {
    paddingLeft: 10,
  },
  centeredMessage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: PALETTE.background,
  },
  loadingText: {
    marginTop: 10,
    color: PALETTE.textSecondary,
    fontFamily: 'Outfit Regular',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: 'Outfit Bold',
    color: PALETTE.textPrimary,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    fontFamily: 'Outfit Regular',
    color: PALETTE.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  browseRecipesButton: {
    paddingVertical: 12,
    paddingHorizontal: 28,
    backgroundColor: PALETTE.accentBlack,
    borderRadius: 12,
  },
  browseRecipesButtonText: {
    color: PALETTE.card,
    fontSize: 15,
    fontFamily: 'Outfit Regular'
  },
  itemOuterContainer: {
    backgroundColor: PALETTE.card,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#B0B0B0',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    position: 'relative',
  },
  itemPressableContent: {
    padding: 16,
  },
  itemTitle: {
    fontSize: 17,
    color: PALETTE.textPrimary,
    marginBottom: 10,
    fontFamily: "Outfit Bold",
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  infoWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    marginRight: 5,
  },
  itemInfoText: {
    fontSize: 12,
    color: PALETTE.textSecondary,
    fontFamily: 'Outfit Regular',
  },
  favoriteIconContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 1,
    padding: 4,
  },
  listContentContainer: {
    paddingTop: 20, // Disesuaikan karena ada ListHeaderComponent untuk error
    paddingBottom: 20,
  }
});