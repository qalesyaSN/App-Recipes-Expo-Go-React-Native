import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { getMenuItemById, updateMenuItem, StoredIngredient, MenuItem as MenuItemType } from '../db';
import { Ionicons } from '@expo/vector-icons';
import { showAppToast } from '../utils/toastHelper';
import RNPickerSelect from 'react-native-picker-select';

interface IngredientInput extends StoredIngredient {
  tempId: string;
}

// Palet Warna (sama seperti di TambahResepScreen)
const MODERN_PALETTE = {
  background: '#f4f4f4',
  card: '#3f3c4d',
  textPrimary: '#FFFFFF', // Teks di dalam input
  textSecondary: '#A0AEC0', // Teks untuk label
  placeholderText: '#718096',
  borderColor: '#4A5568',
  primaryButton: '#211e2f',
  primaryButtonText: '#FFFFFF',
  secondaryButton: '#3f3c4d',
  secondaryButtonText: '#fff',
  dangerButton: '#E53E3E',
  iconColor: '#A0AEC0',
  inputText: '#FFFFFF',
};

const HEADER_HEIGHT = Platform.select({ ios: 64, android: 56, default: 64 });
const KEYBOARD_OFFSET = Platform.OS === 'ios' ? HEADER_HEIGHT : 0;

const CATEGORY_OPTIONS = [
  { label: 'Pilih kategori...', value: null, color: MODERN_PALETTE.placeholderText },
  { label: 'Prepare', value: 'Prepare' },
  { label: 'Sauce & Sambal', value: 'Sauce & Sambal' },
  { label: 'Soup', value: 'Soup' },
  { label: 'lightmeals', value: 'lightmeals' },
  { label: 'Nusantara', value: 'Nusantara' },
  { label: 'Noodles & Pasta', value: 'Noodles & Pasta' },
  { label: 'Steak', value: 'Steak' },
  { label: 'Satay', value: 'Satay' },
  { label: 'Lainnya', value: 'Lainnya' },
];

const COMMON_BORDER_RADIUS = 12;

export default function EditResepScreen() {
  const router = useRouter();
  const { id: resepIdString } = useLocalSearchParams<{ id?: string }>();

  const [namaMasakan, setNamaMasakan] = useState('');
  const [kategori, setKategori] = useState<string | null>(null);
  const [bahanInputs, setBahanInputs] = useState<IngredientInput[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const resepId = resepIdString ? parseInt(resepIdString, 10) : null;

  useEffect(() => {
    if (resepId) {
      const fetchResepUntukEdit = async () => {
        setIsLoading(true);
        try {
          const data = await getMenuItemById(resepId);
          if (data) {
            setNamaMasakan(data.nama);
            setKategori(data.kategori);
            const initialBahan = data.ingredients.length > 0
              ? data.ingredients.map((ing, index) => ({ ...ing, tempId: `${Date.now()}-${index}` }))
              : [{ tempId: Date.now().toString(), name: '', quantity: '' }];
            setBahanInputs(initialBahan);
          } else {
            showAppToast("error", "Tidak Ditemukan", "Resep tidak ditemukan untuk diedit.");
            router.back();
          }
        } catch (error) {
          showAppToast("error", "Gagal Memuat", "Gagal memuat data resep.");
          console.error("Error fetching recipe for edit:", error);
          router.back();
        } finally {
          setIsLoading(false);
        }
      };
      fetchResepUntukEdit();
    } else {
      showAppToast("error", "ID Tidak Valid", "ID Resep tidak valid.");
      router.back();
      setIsLoading(false);
    }
  }, [resepId]);

  const handleMoveBahan = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === bahanInputs.length - 1)) return;
    const newBahanInputs = [...bahanInputs];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newBahanInputs[index], newBahanInputs[targetIndex]] = [newBahanInputs[targetIndex], newBahanInputs[index]];
    setBahanInputs(newBahanInputs);
  };

  const handleAddBahan = () => {
    setBahanInputs([...bahanInputs, { tempId: (Date.now() + Math.random()).toString(), name: '', quantity: '' }]);
  };

  const handleBahanInputChange = (tempId: string, field: 'name' | 'quantity', value: string) => {
    setBahanInputs(bahanInputs.map(bahan => bahan.tempId === tempId ? { ...bahan, [field]: value } : bahan));
  };

  const handleRemoveBahan = (tempId: string) => {
    if (bahanInputs.length > 1) {
      setBahanInputs(bahanInputs.filter(bahan => bahan.tempId !== tempId));
    } else {
      setBahanInputs([{ tempId: bahanInputs[0].tempId, name: '', quantity: '' }]);
      showAppToast("info", "Baris bahan dikosongkan", "Minimal harus ada satu baris bahan.");
    }
  };

  const handleUpdateResep = async () => {
    if (!resepId) { showAppToast("error", "ID Tidak Valid", "ID Resep tidak valid."); return; }
    if (!namaMasakan.trim()) { showAppToast('error', 'Input Tidak Valid', 'Nama masakan tidak boleh kosong!'); return; }
    if (!kategori) { showAppToast('error', 'Input Tidak Valid', 'Kategori harus dipilih!'); return; }
    
    const bahanUntukDisimpan: StoredIngredient[] = bahanInputs
      .filter(b => b.name.trim() !== '' || b.quantity.trim() !== '')
      .map(({ name, quantity }) => ({ name: name.trim(), quantity: quantity.trim() }));

    if (bahanUntukDisimpan.length === 0) { showAppToast('error', 'Input Tidak Valid', 'Minimal harus ada satu bahan yang diisi.'); return; }

    try {
      await updateMenuItem(resepId, namaMasakan.trim(), bahanUntukDisimpan, kategori);
      showAppToast('success', 'Sukses!', `Resep "${namaMasakan.trim()}" berhasil diperbarui.`);
      router.back();
    } catch (error) {
      console.error("Error updating recipe:", error);
      showAppToast('error', 'Gagal Update', 'Tidak dapat memperbarui resep saat ini.');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centeredLoader}>
        <ActivityIndicator size="large" color={MODERN_PALETTE.primaryButton} />
        <Text style={styles.loadingText}>Memuat data resep...</Text>
      </View>
    );
  }

  return (
    <View style={styles.pageContainer}>
      <Stack.Screen options={{ title: 'Edit Resep' }} />
      <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.kav}
          keyboardVerticalOffset={KEYBOARD_OFFSET}
      >
        <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollViewContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
        >
            <Text style={styles.label}>Nama Masakan</Text>
            <TextInput
              style={styles.input}
              value={namaMasakan}
              onChangeText={setNamaMasakan}
              placeholder="Contoh: Ayam Bakar Madu"
              placeholderTextColor={MODERN_PALETTE.placeholderText}
            />

            <Text style={styles.label}>Kategori</Text>
            <View style={styles.pickerInputContainer}>
                <RNPickerSelect
                    onValueChange={(value) => setKategori(value)}
                    items={CATEGORY_OPTIONS.slice(1)}
                    style={{
                        inputIOS: styles.pickerInputStyle,
                        inputAndroid: styles.pickerInputStyle,
                        placeholder: { color: MODERN_PALETTE.placeholderText, fontSize: 16, fontFamily: 'Outfit Regular' },
                        iconContainer: styles.pickerIconContainer,
                    }}
                    value={kategori}
                    placeholder={CATEGORY_OPTIONS[0]}
                    useNativeAndroidPickerStyle={false}
                    Icon={() => <Ionicons name="chevron-down" size={22} color={MODERN_PALETTE.iconColor} />}
                />
            </View>

            <Text style={styles.label}>Bahan-bahan</Text>
            {bahanInputs.map((bahan, index) => (
            <View key={bahan.tempId} style={styles.bahanRow}>
                <View style={styles.reorderButtonsContainer}>
                    {index > 0 && (
                        <TouchableOpacity onPress={() => handleMoveBahan(index, 'up')} style={styles.reorderButton}>
                            <Ionicons name="chevron-up-circle-outline" size={24} color={MODERN_PALETTE.iconColor} />
                        </TouchableOpacity>
                    )}
                    {index < bahanInputs.length - 1 && (
                        <TouchableOpacity onPress={() => handleMoveBahan(index, 'down')} style={styles.reorderButton}>
                            <Ionicons name="chevron-down-circle-outline" size={24} color={MODERN_PALETTE.iconColor} />
                        </TouchableOpacity>
                    )}
                </View>

                <TextInput
                  style={[styles.input, styles.bahanInputName]}
                  value={bahan.name}
                  onChangeText={(text) => handleBahanInputChange(bahan.tempId, 'name', text)}
                  placeholder={`Bahan ${index + 1}`}
                  placeholderTextColor={MODERN_PALETTE.placeholderText}
                />
                <TextInput
                  style={[styles.input, styles.bahanInputQuantity]}
                  value={bahan.quantity}
                  onChangeText={(text) => handleBahanInputChange(bahan.tempId, 'quantity', text)}
                  placeholder="Qty"
                  placeholderTextColor={MODERN_PALETTE.placeholderText}
                />

                <TouchableOpacity
                  onPress={() => handleRemoveBahan(bahan.tempId)}
                  style={styles.deleteBahanButton}
                >
                <Ionicons
                  name="remove-circle-outline"
                  size={28}
                  color={MODERN_PALETTE.primaryButtonText} />
                </TouchableOpacity>
            </View>
            ))}
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.stickyButtonContainer}>
          <TouchableOpacity style={[styles.button, styles.addBahanButton]} onPress={handleAddBahan}>
            <Ionicons name="add-circle-outline" size={22} color={MODERN_PALETTE.secondaryButtonText} style={{marginRight: 8}} />
            <Text style={[styles.buttonText, styles.addBahanButtonText]}>Bahan</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.simpanButton]} onPress={handleUpdateResep}>
            <Ionicons name="checkmark-done-outline" size={20} color={MODERN_PALETTE.primaryButtonText} style={{marginRight: 8}}/>
            <Text style={[styles.buttonText, styles.simpanButtonText]}>Update</Text>
          </TouchableOpacity>
      </View>
    </View>
  );
}

// Styles (sama seperti TambahResepScreen)
const styles = StyleSheet.create({
  pageContainer: { flex: 1, backgroundColor: MODERN_PALETTE.background },
  kav: { flex: 1 },
  scrollView: {},
  scrollViewContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 120 },
  centeredLoader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: MODERN_PALETTE.background, },
  loadingText: { marginTop: 10, fontSize: 16, color: MODERN_PALETTE.textSecondary, fontFamily: 'Outfit Regular', },
  label: { fontSize: 16, marginBottom: 8, color: MODERN_PALETTE.textSecondary, fontFamily: 'Outfit Regular' },
  input: { backgroundColor: MODERN_PALETTE.card, borderWidth: 1, borderColor: MODERN_PALETTE.borderColor, borderRadius: COMMON_BORDER_RADIUS, paddingHorizontal: 15, paddingVertical: Platform.OS === 'ios' ? 14 : 12, fontSize: 16, color: MODERN_PALETTE.inputText, marginBottom: 20, fontFamily: 'Outfit Regular' },
  pickerInputContainer: { backgroundColor: MODERN_PALETTE.card, borderRadius: COMMON_BORDER_RADIUS, borderWidth: 1, borderColor: MODERN_PALETTE.borderColor, marginBottom: 20, justifyContent: 'center' },
  pickerInputStyle: { fontSize: 16, fontFamily: 'Outfit Regular', color: MODERN_PALETTE.inputText, paddingHorizontal: 15, paddingVertical: Platform.OS === 'ios' ? 14 : 12 },
  pickerIconContainer: { height: '100%', justifyContent: 'center', right: 15 },
  bahanRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  reorderButtonsContainer: { justifyContent: 'space-around', marginRight: 8, alignSelf: 'stretch' },
  reorderButton: { paddingVertical: 4 },
  bahanInputName: { flex: 2.5, marginRight: 10, marginBottom: 0 },
  bahanInputQuantity: { flex: 1, marginRight: 10, marginBottom: 0 },
  deleteBahanButton: { padding: 10, backgroundColor: MODERN_PALETTE.primaryButton, borderRadius: COMMON_BORDER_RADIUS, justifyContent: 'center', alignItems: 'center' },
  stickyButtonContainer: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12, paddingHorizontal: 20, backgroundColor: MODERN_PALETTE.background, borderTopWidth: 1, borderTopColor: MODERN_PALETTE.borderColor },
  button: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: COMMON_BORDER_RADIUS, marginHorizontal: 5 },
  buttonText: { fontSize: 16, fontFamily: 'Outfit Bold', marginLeft: 5 },
  addBahanButton: { backgroundColor: MODERN_PALETTE.secondaryButton },
  addBahanButtonText: { color: MODERN_PALETTE.secondaryButtonText },
  simpanButton: { backgroundColor: MODERN_PALETTE.primaryButton },
  simpanButtonText: { color: MODERN_PALETTE.primaryButtonText },
});
