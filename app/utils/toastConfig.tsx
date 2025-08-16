// app/utils/toastConfig.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native'; // StyleSheet mungkin tidak dipakai jika semua inline
import { BaseToast, ErrorToast, InfoToast, ToastConfigParams } from 'react-native-toast-message';

// --- GANTI DENGAN NAMA FONT YANG SUDAH ANDA LOAD DI app/_layout.tsx ---
const FONT_FAMILY_BOLD = 'Outfit Bold';        // Pastikan nama ini persis sama
const FONT_FAMILY_REGULAR = 'Outfit Regular';  // Pastikan nama ini persis sama
// --------------------------------------------------------------------

// Style dasar yang bisa dipakai bersama (opsional)
const baseToastStyleProps = {
  style: { height: 'auto', minHeight: 60, paddingVertical: 8, borderLeftWidth: 5 },
  contentContainerStyle: { paddingHorizontal: 15, paddingVertical: 10 },
  text1Style: {
    fontSize: 16,
    fontFamily: FONT_FAMILY_BOLD,
    color: '#2D3748', // Warna teks judul
    fontWeight: 'normal' as 'normal', // Reset default bold jika font family sudah bold
  },
  text2Style: {
    fontSize: 14,
    fontFamily: FONT_FAMILY_REGULAR,
    color: '#4A5568', // Warna teks pesan
  },
};

export const toastConfig = {
  success: (props: ToastConfigParams<any>) => (
    <BaseToast
      {...props}
      {...baseToastStyleProps} // Sebarkan style dasar
      style={{ ...baseToastStyleProps.style, borderLeftColor: '#4CAF50', backgroundColor: '#E8F5E9' }} // Timpa warna
    />
  ),
  error: (props: ToastConfigParams<any>) => (
    <ErrorToast // ErrorToast sudah memiliki ikon error default
      {...props}
      {...baseToastStyleProps}
      style={{ ...baseToastStyleProps.style, borderLeftColor: '#D32F2F', backgroundColor: '#FFEBEE' }}
      text1Style={{...baseToastStyleProps.text1Style, color: '#B71C1C'}} // Warna judul error lebih gelap
      text2Style={{...baseToastStyleProps.text2Style, color: '#D32F2F'}}  // Warna pesan error
    />
  ),
  info: (props: ToastConfigParams<any>) => (
    <InfoToast // InfoToast sudah memiliki ikon info default
      {...props}
      {...baseToastStyleProps}
      style={{ ...baseToastStyleProps.style, borderLeftColor: '#1976D2', backgroundColor: '#E3F2FD' }}
    />
  ),
  // Anda bisa menambahkan tipe toast kustom lain di sini jika perlu
  // Misalnya, 'warning': ({ text1, text2 }) => ( ... custom JSX ... )
};