import React, { useState, useEffect, useCallback, useRef, memo } from "react";
import {
    View,
    Text,
    TextInput,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Keyboard,
    RefreshControl,
    Platform
} from "react-native";
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import { useFocusEffect, Link, useRouter } from "expo-router";
import {
    getMenuItems,
    getUniqueCategories,
    MenuItem,
    addFavorite,
    removeFavorite,
    getTotalRowCount,
    SortByType
} from "../db";
import { useTabBarVisibility } from "../TabBarContext";
import { showAppToast } from "../utils/toastHelper";

// --- FUNGSI HELPER & PALET WARNA (Tidak Berubah) ---
const formatDate = (isoString: string | null): string => { if (!isoString) return "Tanggal tidak diketahui"; try { const date = new Date(isoString); return date.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }); } catch (e) { return "Format tanggal salah"; } };
const debounce = <F extends (...args: any[]) => void>( func: F, waitFor: number ) => { let timeout: NodeJS.Timeout | null = null; return (...args: Parameters<F>): void => { if (timeout) clearTimeout(timeout); timeout = setTimeout(() => func(...args), waitFor); }; };
const PALETTE = { background: "#F4F4F4", card: "#FFFFFF", textPrimary: "#2D2D2D", textSecondary: "#7A7A7A", accentAddButton: "#211e2f", accentAddButtonIcon: "#FFFFFF", accentBlack: "#2D2D2D", placeholderText: "#B0B0B0", borderColor: "#EEEEEE", activeCategoryBackground: "#211e2f", activeCategoryText: "#FFFFFF", inactiveCategoryBackground: "#888590", inactiveCategoryText: "#FFFFFF", iconColor: "#555555", searchBarBackground: "#3f3c4d", searchBarIconColor: "#FFFFFF", linkToTambahBackground: "#211e2f", linkToTambahText: "#FFFFFF", accentLove: "#211e2f" };

// --- Komponen Item yang Dioptimalkan (Tidak Berubah) ---
const MenuItemCard = memo(
    ({ item, onToggleFavorite }: { item: MenuItem; onToggleFavorite: (itemId: number, isFavorite: boolean | undefined) => void; }) => {
        const router = useRouter();
        return (
            <View style={styles.itemOuterContainer}>
                <TouchableOpacity style={styles.itemPressableContent} onPress={() => router.push(`/resep/${item.id}` as any)} activeOpacity={0.7}>
                    <View style={{ flex: 1, paddingRight: 30 }}><Text style={styles.itemTitle} numberOfLines={2}>{item.nama}</Text></View>
                    <View style={styles.itemFooter}><View style={styles.infoWithIcon}><Ionicons name="pricetag-outline" size={14} color={PALETTE.iconColor} style={styles.infoIcon} /><Text style={styles.itemInfoText} numberOfLines={1}>{item.kategori || "Lainnya"}</Text></View><View style={styles.infoWithIcon}><Ionicons name="calendar-outline" size={14} color={PALETTE.iconColor} style={styles.infoIcon} /><Text style={styles.itemInfoText}>{formatDate(item.tanggal)}</Text></View></View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.favoriteIconContainer} onPress={() => onToggleFavorite(item.id, item.isFavorite)} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
                    <FontAwesome name={item.isFavorite ? "bookmark" : "bookmark-o"} size={24} color={item.isFavorite ? PALETTE.accentLove : PALETTE.iconColor} />
                </TouchableOpacity>
            </View>
        );
    }
);

export default function ResepSayaScreen() {
    const { setIsTabBarVisible } = useTabBarVisibility();
    const searchInputRef = useRef<TextInput>(null);
    const router = useRouter();

    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [allCategories, setAllCategories] = useState<string[]>(["Semua"]);
    const [searchTerm, setSearchTerm] = useState("");
    const [displayedSearchTerm, setDisplayedSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("Semua");
    const [isLoading, setIsLoading] = useState(true);
    const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [totalMenuCount, setTotalMenuCount] = useState<number | null>(null);
    const [sortBy, setSortBy] = useState<SortByType>("terbaru");
    const [isSortDropdownVisible, setIsSortDropdownVisible] = useState(false);

    const sortOptions: { label: string; value: SortByType }[] = [ { label: "Terbaru", value: "terbaru" }, { label: "Terlama", value: "terlama" }, { label: "Nama (A-Z)", value: "nama-az" }, { label: "Nama (Z-A)", value: "nama-za" } ];

    const loadMenuItems = useCallback( async (currentSearch: string, currentCategory: string, currentSortBy: SortByType) => { if (!isRefreshing) setIsLoading(true); try { const items = await getMenuItems(currentSearch, currentCategory === "Semua" ? "" : currentCategory, currentSortBy); setMenuItems(items); } catch (error) { showAppToast("error", "Gagal Memuat Resep", "Terjadi kesalahan."); } finally { if (!isRefreshing) setIsLoading(false); } }, [isRefreshing] );
    const loadCategories = useCallback(async () => { if (!isRefreshing) setIsCategoriesLoading(true); try { const uniqueCats = await getUniqueCategories(); setAllCategories(["Semua", ...(uniqueCats || [])]); } catch (error) { showAppToast("error", "Gagal Kategori", "Terjadi kesalahan."); } finally { if (!isRefreshing) setIsCategoriesLoading(false); } }, [isRefreshing]);
    const loadTotalMenuCount = useCallback(async () => { try { const count = await getTotalRowCount("menu"); setTotalMenuCount(count); } catch (error) { setTotalMenuCount(null); } }, []);
    
    // Menggunakan debounce dengan dependensi kosong agar lebih stabil
    const debouncedSearch = useCallback(debounce((newSearchTerm: string) => { setSearchTerm(newSearchTerm); }, 300), []);

    useEffect(() => { debouncedSearch(displayedSearchTerm); }, [displayedSearchTerm, debouncedSearch]);
    useEffect(() => { loadMenuItems(searchTerm, selectedCategory, sortBy); }, [searchTerm, selectedCategory, sortBy, loadMenuItems]);

    // PERBAIKAN: Menambahkan semua dependensi yang relevan ke useFocusEffect
    useFocusEffect(
        useCallback(() => {
            loadCategories();
            loadMenuItems(searchTerm, selectedCategory, sortBy);
            loadTotalMenuCount();
            if (searchInputRef.current && !searchInputRef.current.isFocused()) {
                setIsTabBarVisible(true);
            }
        }, [sortBy, searchTerm, selectedCategory]) // <-- Dependensi diperbaiki
    );

    // PERBAIKAN: Menyederhanakan dependensi onRefresh
    const onRefresh = useCallback(async () => { setIsRefreshing(true); try { await Promise.all([ loadCategories(), loadMenuItems(searchTerm, selectedCategory, sortBy), loadTotalMenuCount() ]); } catch (error) { showAppToast("error", "Gagal Refresh", "Gagal memuat ulang data."); } finally { setIsRefreshing(false); } }, [searchTerm, selectedCategory, sortBy]);

    const handleSearchFocus = () => setIsTabBarVisible(false);
    const handleSearchBlur = () => setIsTabBarVisible(true);
    const handleClearSearch = () => setDisplayedSearchTerm("");

    // PERBAIKAN: Mengoptimalkan handleToggleFavorite dengan menghapus dependensi [menuItems]
    const handleToggleFavorite = useCallback( async (itemId: number, currentIsFavorite: boolean | undefined) => {
        const isFav = !!currentIsFavorite;
        // Optimistic UI update menggunakan functional update, lebih aman untuk performa
        setMenuItems(prevItems => prevItems.map(item => item.id === itemId ? { ...item, isFavorite: !isFav } : item));
        try {
            if (isFav) await removeFavorite(itemId);
            else await addFavorite(itemId);
        } catch (error) {
            showAppToast("error", "Gagal Favorit", `Gagal mengubah status favorit.`);
            // Rollback jika error
            setMenuItems(prevItems => prevItems.map(item => item.id === itemId ? { ...item, isFavorite: isFav } : item));
        }
    }, [] ); // <-- Dependensi dikosongkan untuk performa maksimal

    const handleCategoryPress = (category: string) => { setSelectedCategory(category); Keyboard.dismiss(); setIsTabBarVisible(true); };
    const navigateToTambahResep = () => router.push("/resep/tambah");
    const handleSelectSort = (value: SortByType) => { setSortBy(value); setIsSortDropdownVisible(false); };
    const getSortLabel = () => sortOptions.find(opt => opt.value === sortBy)?.label || "Urutkan";

    const renderItem = useCallback( ({ item }: { item: MenuItem }) => (<MenuItemCard item={item} onToggleFavorite={handleToggleFavorite} />), [handleToggleFavorite] );

    return (
        <View style={styles.container}>
            <View style={styles.headerSectionContainer}>
                <View style={styles.searchRowContainer}>
                    <View style={styles.searchSection}><Ionicons name="search-outline" size={22} color={PALETTE.placeholderText} style={styles.searchIconStyle} /><TextInput ref={searchInputRef} style={styles.searchInput} placeholder="Cari..." placeholderTextColor={PALETTE.placeholderText} value={displayedSearchTerm} onChangeText={setDisplayedSearchTerm} onFocus={handleSearchFocus} onBlur={handleSearchBlur} />{displayedSearchTerm.length > 0 && (<TouchableOpacity onPress={handleClearSearch} style={styles.clearSearchButton}><Ionicons name="close-circle" size={20} color={PALETTE.placeholderText} /></TouchableOpacity>)}</View>
                    <TouchableOpacity onPress={navigateToTambahResep} style={styles.addRecipeButton}><Ionicons name="add-circle-outline" size={36} color={PALETTE.accentAddButtonIcon} /></TouchableOpacity>
                </View>
                {!isCategoriesLoading && allCategories.length > 1 && (<View style={styles.categoryListWrapper}><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScrollContent}>{allCategories.map(cat => (<TouchableOpacity key={cat} style={[styles.categoryChip, selectedCategory === cat ? styles.categoryChipSelected : styles.categoryChipInactive]} onPress={() => handleCategoryPress(cat)}><Text style={[styles.categoryText, selectedCategory === cat ? styles.categoryTextSelected : styles.categoryTextInactive]}>{cat}</Text></TouchableOpacity>))}</ScrollView></View>)}
                {isCategoriesLoading && (<ActivityIndicator size="small" color={PALETTE.accentBlack} style={styles.categoryLoading} />)}
                <View style={styles.listHeaderContainer}>
                    {totalMenuCount !== null && (<View style={styles.totalCountContainer}><Text style={styles.totalCountLabel}>Total Resep</Text><Text style={styles.totalCountValue}>{totalMenuCount}</Text></View>)}
                    <View><TouchableOpacity style={styles.sortButton} onPress={() => setIsSortDropdownVisible(!isSortDropdownVisible)}><Text style={styles.sortButtonText}>{getSortLabel()}</Text><Ionicons name={isSortDropdownVisible ? "chevron-up" : "chevron-down"} size={18} color={PALETTE.textSecondary} /></TouchableOpacity></View>
                </View>
            </View>

            {isLoading && menuItems.length === 0 ? (
                <View style={styles.centeredMessage}><ActivityIndicator size="large" color={PALETTE.accentBlack} /></View>
            ) : (
                <FlatList
                    data={menuItems}
                    renderItem={renderItem}
                    keyExtractor={item => item.id.toString()}
                    ListEmptyComponent={() => !isLoading && (<View style={styles.emptyContainer}><Text style={styles.emptyText}>{searchTerm || (selectedCategory && selectedCategory !== "Semua") ? "Resep tidak ditemukan." : "Belum ada resep ditambahkan."}</Text><Link href="/resep/tambah" asChild><TouchableOpacity style={styles.linkToTambah}><Text style={styles.linkToTambahText}>+ Tambah Resep Baru</Text></TouchableOpacity></Link></View>)}
                    contentContainerStyle={styles.listContentContainer}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    onScrollBeginDrag={() => Keyboard.dismiss()}
                    refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[PALETTE.accentBlack]} tintColor={PALETTE.accentBlack} />}
                    
                    // --- PERBAIKAN PERFORMA VIRTUALIZEDLIST ---
                    initialNumToRender={10}
                    maxToRenderPerBatch={5}
                    windowSize={11}
                    removeClippedSubviews={Platform.OS === 'android'} // Aktifkan hanya untuk Android
                    getItemLayout={(data, index) => (
                        // Asumsi tinggi setiap item adalah 112. Ganti jika perlu.
                        // Ini sangat membantu performa scroll.
                        { length: 112, offset: 112 * index, index }
                    )}
                />
            )}

            {isSortDropdownVisible && (
                <View style={styles.sortDropdown}>
                    {sortOptions.map((option, index) => (
                        <TouchableOpacity key={option.value} style={[styles.sortDropdownItem, index < sortOptions.length - 1 && styles.sortDropdownItemWithBorder ]} onPress={() => handleSelectSort(option.value)}>
                            <Text style={styles.sortDropdownItemText}>{option.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </View>
    );
}

// Styles (Tidak diubah sesuai permintaan Anda)
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: PALETTE.background },
    headerSectionContainer: { paddingBottom: 4, backgroundColor: PALETTE.background },
    searchRowContainer: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
    searchSection: { flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: PALETTE.searchBarBackground, borderRadius: 16, paddingLeft: 15, height: 48 },
    searchIconStyle: { marginRight: 10 },
    searchInput: { flex: 1, height: "100%", fontSize: 15, color: PALETTE.searchBarIconColor, fontFamily: "Outfit Regular" },
    clearSearchButton: { paddingHorizontal: 10, height: "100%", justifyContent: "center" },
    addRecipeButton: { marginLeft: 12, backgroundColor: PALETTE.accentAddButton, borderRadius: 16, width: 48, height: 48, justifyContent: "center", alignItems: "center" },
    categoryListWrapper: { marginHorizontal: 16, height: 45, marginTop: 8, marginBottom: 4 },
    categoryScrollContent: { paddingRight: 16, alignItems: "center" },
    categoryChip: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 12, marginRight: 8, borderWidth: 1.5 },
    categoryChipInactive: { backgroundColor: PALETTE.inactiveCategoryBackground, borderColor: PALETTE.inactiveCategoryBackground },
    categoryChipSelected: { backgroundColor: PALETTE.activeCategoryBackground, borderColor: PALETTE.activeCategoryBackground },
    categoryText: { fontSize: 13, fontFamily: "Outfit Regular" },
    categoryTextInactive: { color: PALETTE.inactiveCategoryText },
    categoryTextSelected: { color: PALETTE.activeCategoryText },
    categoryLoading: { justifyContent: "center", alignItems: "center" },
    listHeaderContainer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 12, marginBottom: 8 },
    totalCountContainer: { flexDirection: "row", alignItems: "baseline" },
    totalCountLabel: { fontSize: 14, fontFamily: "Outfit Regular", color: PALETTE.textSecondary },
    totalCountValue: { fontSize: 14, fontFamily: "Outfit Bold", color: PALETTE.textPrimary, marginLeft: 8 },
    sortButton: { flexDirection: "row", alignItems: "center", backgroundColor: PALETTE.card, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 0, borderColor: PALETTE.borderColor },
    sortButtonText: { fontSize: 13, fontFamily: "Outfit Regular", color: PALETTE.textPrimary, marginRight: 6 },
    sortDropdown: { position: "absolute", top: 165, right: 16, backgroundColor: PALETTE.card, borderRadius: 8, borderWidth: 0, borderColor: PALETTE.borderColor, elevation: 5, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, zIndex: 1000, width: 150 },
    sortDropdownItem: { paddingHorizontal: 15, paddingVertical: 12 },
    sortDropdownItemWithBorder: { borderBottomWidth: 1, borderBottomColor: PALETTE.borderColor },
    sortDropdownItemText: { fontSize: 14, fontFamily: "Outfit Regular", color: PALETTE.textPrimary },
    itemOuterContainer: { backgroundColor: PALETTE.card, marginHorizontal: 16, marginBottom: 12, borderRadius: 12, flexDirection: "row", alignItems: "center" },
    itemPressableContent: { flex: 1, padding: 16 },
    itemTitle: { fontSize: 17, color: PALETTE.textPrimary, marginBottom: 10, fontFamily: "Outfit Bold" },
    itemFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
    infoWithIcon: { flexDirection: "row", alignItems: "center" },
    infoIcon: { marginRight: 5 },
    itemInfoText: { fontSize: 12, color: PALETTE.textSecondary, fontFamily: "Outfit Regular" },
    favoriteIconContainer: { position: "absolute", top: 16, right: 16, zIndex: 1, padding: 4 },
    centeredMessage: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 50 },
    emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
    emptyText: { fontSize: 15, color: PALETTE.textSecondary, textAlign: "center", marginBottom: 20, fontFamily: "Outfit Regular" },
    linkToTambah: { paddingVertical: 12, paddingHorizontal: 28, backgroundColor: PALETTE.linkToTambahBackground, borderRadius: 12 },
    linkToTambahText: { color: PALETTE.linkToTambahText, fontSize: 15, fontFamily: "Outfit Bold" },
    listContentContainer: { paddingBottom: 80 }
});
