// app/utils/toastHelper.ts
import Toast from 'react-native-toast-message';

type ToastType = 'success' | 'error' | 'info';

/**
 * Menampilkan notifikasi toast.
 * @param type Jenis toast: 'success', 'error', atau 'info'.
 * @param title Judul toast (baris pertama).
 * @param message Pesan toast (baris kedua, opsional).
 * @param duration Durasi tampil toast dalam milidetik (opsional).
 */
export const showAppToast = (
  type: ToastType,
  title: string,
  message?: string,
  duration: number = 4000 // Default durasi 4 detik
) => {
  Toast.show({
    type: type, // Ini akan merujuk ke tipe yang dikustomisasi di toastConfig
    text1: title,
    text2: message,
    visibilityTime: duration,
    // position: 'top', // Default 'top', bisa juga 'bottom'
    // topOffset: 60, // Sesuaikan jika ada header yang tinggi dan posisi 'top'
  });
};