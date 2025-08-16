import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { addMenuItem, StoredIngredient } from '../db';
import { useRouter, Stack } from 'expo-router'; // Stack diimpor untuk mengatur judul
import { Ionicons } from '@expo/vector-icons';
import { showAppToast } from '../utils/toastHelper';
import RNPickerSelect from 'react-native-picker-select';

interface IngredientInput extends StoredIngredient {
  tempId: string;
}

const MODERN_PALETTE = {
  background: '#f4f4f4',
  card: '#3f3c4d',
  textPrimary: '#2D3748',
  textSecondary: '#718096',
  placeholderText: '#A0AEC0',
  borderColor: '#E2E8F0',
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

export default function TambahResepScreen() {
  const router = useRouter();
  const [namaMasakan, setNamaMasakan] = useState('');
  const [kategori, setKategori] = useState<string | null>(null);
  const [bahanInputs, setBahanInputs] = useState<IngredientInput[]>([
    { tempId: Date.now().toString(), name: '', quantity: '' },
  ]);

  // --- FUNGSI BARU UNTUK MENGATUR ULANG URUTAN BAHAN ---
  const handleMoveBahan = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === bahanInputs.length - 1)) {
      return; // Batasi agar tidak keluar dari array
    }
    const newBahanInputs = [...bahanInputs];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    // Tukar posisi
    [newBahanInputs[index], newBahanInputs[targetIndex]] = [newBahanInputs[targetIndex], newBahanInputs[index]];
    setBahanInputs(newBahanInputs);
  };

  const handleAddBahan = () => {
    setBahanInputs([
      ...bahanInputs,
      { tempId: (Date.now() + Math.random()).toString(), name: '', quantity: '' },
    ]);
  };

  const handleBahanInputChange = (
    tempId: string,
    field: 'name' | 'quantity',
    value: string
  ) => {
    setBahanInputs(
      bahanInputs.map((bahan) =>
        bahan.tempId === tempId ? { ...bahan, [field]: value } : bahan
      )
    );
  };

  const handleRemoveBahan = (tempId: string) => {
    if (bahanInputs.length > 1) {
      setBahanInputs(bahanInputs.filter((bahan) => bahan.tempId !== tempId));
    } else {
      setBahanInputs([{ tempId: bahanInputs[0].tempId, name: '', quantity: '' }]);
      showAppToast("info", "Baris bahan dikosongkan", "Minimal harus ada satu baris bahan.");
    }
  };

  const handleSimpanResep = async () => {
    if (!namaMasakan.trim()) {
      showAppToast('error', 'Input Tidak Valid', 'Nama masakan tidak boleh kosong!');
      return;
    }
    if (!kategori) {
      showAppToast('error', 'Input Tidak Valid', 'Kategori harus dipilih!');
      return;
    }
    const bahanUntukDisimpan: StoredIngredient[] = bahanInputs
      .filter(b => b.name.trim() !== '' || b.quantity.trim() !== '')
      .map(({ name, quantity }) => ({ name: name.trim(), quantity: quantity.trim() }));

    if (bahanUntukDisimpan.length === 0) {
        showAppToast('error', 'Input Tidak Valid', 'Minimal harus ada satu bahan yang diisi.');
        return;
    }

    try {
      const newRecipeId = await addMenuItem(namaMasakan.trim(), bahanUntukDisimpan, kategori);
      if (newRecipeId) {
        showAppToast('success', 'Sukses!', `Resep "${namaMasakan.trim()}" berhasil ditambahkan.`);
        router.back();
      } else {
        showAppToast('error', 'Gagal Disimpan', 'Resep tidak berhasil ditambahkan ke database.');
      }
    } catch (error) {
      console.error("Error saving recipe:", error);
      showAppToast('error', 'Terjadi Kesalahan', 'Tidak dapat menyimpan resep saat ini.');
    }
  };

  return (
    <View style={styles.pageContainer}>
      {/* Menambahkan Stack.Screen untuk mengatur header */}
      <Stack.Screen options={{ title: 'Tambah Resep Baru' }} /> 
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
                {/* --- TOMBOL UNTUK ATUR URUTAN --- */}
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

                {/* --- INPUT FIELDS --- */}
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

                {/* --- TOMBOL HAPUS BARIS --- */}
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
          <TouchableOpacity style={[styles.button, styles.simpanButton]} onPress={handleSimpanResep}>
            <Ionicons name="save-outline" size={20} color={MODERN_PALETTE.primaryButtonText} style={{marginRight: 8}}/>
            <Text style={[styles.buttonText, styles.simpanButtonText]}>Simpan</Text>
          </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pageContainer: { flex: 1, backgroundColor: MODERN_PALETTE.background },
  kav: { flex: 1 },
  scrollView: {},
  scrollViewContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 120 },
  label: { fontSize: 16, marginBottom: 8, color: MODERN_PALETTE.textSecondary, fontFamily: 'Outfit Regular' },
  input: { backgroundColor: MODERN_PALETTE.card, borderWidth: 1, borderColor: MODERN_PALETTE.borderColor, borderRadius: COMMON_BORDER_RADIUS, paddingHorizontal: 15, paddingVertical: Platform.OS === 'ios' ? 14 : 12, fontSize: 16, color: MODERN_PALETTE.inputText, marginBottom: 20, fontFamily: 'Outfit Regular' },
  pickerInputContainer: { backgroundColor: MODERN_PALETTE.card, borderRadius: COMMON_BORDER_RADIUS, borderWidth: 1, borderColor: MODERN_PALETTE.borderColor, marginBottom: 20, justifyContent: 'center' },
  pickerInputStyle: { fontSize: 16, fontFamily: 'Outfit Regular', color: MODERN_PALETTE.inputText, paddingHorizontal: 15, paddingVertical: Platform.OS === 'ios' ? 14 : 12 },
  pickerIconContainer: { height: '100%', justifyContent: 'center', right: 15 },
  bahanRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  reorderButtonsContainer: { justifyContent: 'space-around', marginRight: 3, alignSelf: 'stretch' },
  reorderButton: { paddingVertical: 3 }, // Memberi sedikit ruang vertikal untuk ditekan
  bahanInputName: { flex: 2.5, marginRight: 10, marginBottom: 0 },
  bahanInputQuantity: { flex: 1, marginRight: 10, marginBottom: 0 },
  deleteBahanButton: {
    padding: 10, // Beri padding agar ikon tidak mepet
    backgroundColor: MODERN_PALETTE.primaryButton, // Gunakan warna merah dari palet
    borderRadius: COMMON_BORDER_RADIUS, // Samakan radius dengan input
    justifyContent: 'center',
    alignItems: 'center',
  },
  stickyButtonContainer: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12, paddingHorizontal: 20, backgroundColor: MODERN_PALETTE.background, borderTopWidth: 1, borderTopColor: MODERN_PALETTE.borderColor },
  button: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: COMMON_BORDER_RADIUS, marginHorizontal: 5 },
  buttonText: { fontSize: 16, fontFamily: 'Outfit Bold', marginLeft: 5 },
  addBahanButton: { backgroundColor: MODERN_PALETTE.secondaryButton },
  addBahanButtonText: { color: MODERN_PALETTE.secondaryButtonText },
  simpanButton: { backgroundColor: MODERN_PALETTE.primaryButton },
  simpanButtonText: { color: MODERN_PALETTE.primaryButtonText },
});
