import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker'; // Impor Picker
import * as MailComposer from 'expo-mail-composer';
import * as Device from 'expo-device';
import * as Application from 'expo-application';
import { Ionicons } from '@expo/vector-icons';
import { showAppToast } from './utils/toastHelper';

const MODERN_PALETTE = {
  background: '#f4f4f4',
  card: '#3f3c4d',
  textPrimary: '#2D3748', // Digunakan untuk teks item picker di dropdown jika backgroundnya terang
  textSecondary: '#718096',
  placeholderText: '#A0AEC0',
  borderColor: '#5a5766',
  primaryButton: '#211e2f',
  primaryButtonText: '#FFFFFF',
  secondaryButton: '#3f3c4d',
  secondaryButtonText: '#FFFFFF', // Warna teks item picker yang TERPILIH
  dangerButton: '#E53E3E',
  iconColor: '#A0AEC0',
  activityIndicator: '#211e2f',
};

const RECIPIENT_EMAIL = 'ustadcage48@gmail.com';
type FeedbackType = 'bug' | 'suggestion' | 'feedback' | 'other';

interface DeviceAppInfo {
  appName?: string;
  appVersion?: string;
  appBuildVersion?: string;
  osName?: string;
  osVersion?: string;
  deviceName?: string;
  deviceModelName?: string;
  deviceBrand?: string;
  isDevice?: boolean;
}

const FONT_FAMILY_REGULAR = 'Outfit Regular'; // Pastikan font ini sudah di-load

export default function FeedbackScreen(): JSX.Element {
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('feedback');
  const [subject, setSubject] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [deviceAppInfo, setDeviceAppInfo] = useState<DeviceAppInfo | null>(null);
  const [isMailAvailable, setIsMailAvailable] = useState<boolean>(false);

  useEffect(() => {
    const checkMailAvailability = async () => {
      const available = await MailComposer.isAvailableAsync();
      setIsMailAvailable(available);
    };

    const loadDeviceInfo = async () => {
      setDeviceAppInfo({
        appName: Application.applicationName || undefined,
        appVersion: Application.nativeApplicationVersion || undefined,
        appBuildVersion: Application.nativeBuildVersion || undefined,
        osName: Device.osName || undefined,
        osVersion: Device.osVersion || undefined,
        deviceName: Device.deviceName || undefined,
        deviceModelName: Device.modelName || undefined,
        deviceBrand: Device.brand || undefined,
        isDevice: Device.isDevice,
      });
    };

    checkMailAvailability();
    loadDeviceInfo();
  }, []);

  const generateSubject = (): string => {
    let typeText = '';
    switch (feedbackType) {
      case 'bug': typeText = 'Laporan Bug'; break;
      case 'suggestion': typeText = 'Saran/Ide Fitur'; break;
      case 'feedback': typeText = 'Kritik/Masukan Umum'; break;
      case 'other': typeText = 'Lainnya'; break;
    }
    const appName = deviceAppInfo?.appName || 'Aplikasi';
    return `[${appName}] ${typeText}${subject ? `: ${subject}` : ''}`;
  };

  const generateBody = (): string => {
    let deviceInfoString = "\n\n--- Info Tambahan ---\n";
    if (deviceAppInfo) {
      deviceInfoString += `Nama Aplikasi: ${deviceAppInfo.appName || 'N/A'}\n`;
      deviceInfoString += `Versi Aplikasi: ${deviceAppInfo.appVersion || 'N/A'}\n`;
      // ... (sisa info perangkat)
    } else {
      deviceInfoString += "Info perangkat tidak dapat dimuat.\n";
    }
    deviceInfoString += "---------------------\n";
    return `${message}\n${deviceInfoString}`;
  };

  const handleSendEmail = async () => {
    // ... (logika handleSendEmail)
    if (!isMailAvailable) {
      showAppToast('error', 'Tidak Dapat Mengirim Email', 'Tidak ada aplikasi email yang terkonfigurasi di perangkat Anda.');
      return;
    }
    if (!message.trim()) {
      showAppToast('error', 'Pesan Kosong', 'Harap isi pesan Anda sebelum mengirim.');
      return;
    }

    setIsSending(true);
    try {
      const finalSubject = generateSubject();
      const finalBody = generateBody();

      const { status } = await MailComposer.composeAsync({
        recipients: [RECIPIENT_EMAIL],
        subject: finalSubject,
        body: finalBody,
      });

      if (status === MailComposer.MailComposerStatus.SENT) {
        showAppToast('success', 'Email Terkirim', 'Terima kasih atas masukan Anda!');
        setMessage('');
        setSubject('');
      } else if (status === MailComposer.MailComposerStatus.CANCELLED) {
        showAppToast('info', 'Dibatalkan', 'Pengiriman email dibatalkan.');
      } else {
        showAppToast('info', 'Status Tidak Diketahui', 'Status pengiriman email tidak diketahui atau draft disimpan.');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      showAppToast('error', 'Kesalahan', 'Gagal mengirim email. Silakan coba lagi.');
    } finally {
      setIsSending(false);
    }
  };


  return (
    <ScrollView
      style={styles.pageContainer}
      contentContainerStyle={styles.scrollViewContent}
      keyboardShouldPersistTaps="handled"
    >
      {!isMailAvailable && (
        <View style={styles.warningBox}>
          <Ionicons name="warning-outline" size={20} color={MODERN_PALETTE.dangerButton} style={{ marginRight: 8 }}/>
          <Text style={styles.warningText}>
            Aplikasi email tidak ditemukan atau belum dikonfigurasi di perangkat Anda. Anda mungkin tidak dapat mengirim email.
          </Text>
        </View>
      )}

      <Text style={styles.label}>Jenis Masukan</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={feedbackType}
          onValueChange={(itemValue) => setFeedbackType(itemValue as FeedbackType)}
          style={styles.picker} // Style untuk Picker (termasuk font untuk teks terpilih)
          itemStyle={styles.pickerItemStyle} // Style untuk item di dropdown (Android & iOS 14+)
          dropdownIconColor={MODERN_PALETTE.iconColor}
        >
          <Picker.Item label="Kritik/Masukan Umum" value="feedback" style={styles.pickerItemLabelStyle} />
          <Picker.Item label="Laporan Bug/Kesalahan" value="bug" style={styles.pickerItemLabelStyle} />
          <Picker.Item label="Saran/Ide Fitur" value="suggestion" style={styles.pickerItemLabelStyle} />
          <Picker.Item label="Lainnya" value="other" style={styles.pickerItemLabelStyle} />
        </Picker>
      </View>

      <Text style={styles.label}>Subjek (Opsional)</Text>
      <TextInput
        style={styles.input}
        value={subject}
        onChangeText={setSubject}
        placeholder="Contoh: Tidak bisa tambah resep"
        placeholderTextColor={MODERN_PALETTE.placeholderText}
      />

      <Text style={styles.label}>Pesan Anda</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={message}
        onChangeText={setMessage}
        placeholder="Jelaskan kritik, saran, atau bug yang Anda temukan di sini..."
        placeholderTextColor={MODERN_PALETTE.placeholderText}
        multiline
        numberOfLines={6}
      />

      <View style={styles.deviceInfoContainer}>
        <Text style={styles.deviceInfoTitle}>Informasi berikut akan dilampirkan:</Text>
        <Text style={styles.deviceInfoText}>
          {`Aplikasi: ${deviceAppInfo?.appName || 'N/A'} v${deviceAppInfo?.appVersion || 'N/A'}`}
        </Text>
        <Text style={styles.deviceInfoText}>
          {`Perangkat: ${deviceAppInfo?.deviceName || deviceAppInfo?.deviceModelName || 'N/A'} (${Device.osName} ${Device.osVersion})`}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.button, isSending || !isMailAvailable ? styles.buttonDisabled : {}]}
        onPress={handleSendEmail}
        disabled={isSending || !isMailAvailable}
      >
        {isSending ? (
          <ActivityIndicator size="small" color={MODERN_PALETTE.primaryButtonText} style={{marginRight: 10}}/>
        ) : (
          <Ionicons name="send-outline" size={20} color={MODERN_PALETTE.primaryButtonText} style={{ marginRight: 10 }} />
        )}
        <Text style={styles.buttonText}>Kirim Email</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    backgroundColor: MODERN_PALETTE.background,
  },
  scrollViewContent: {
    padding: 20,
    paddingBottom: 40,
  },
  warningBox: {
    backgroundColor: '#ffebee',
    borderColor: MODERN_PALETTE.dangerButton,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  warningText: {
    flex: 1,
    color: MODERN_PALETTE.dangerButton,
    fontSize: 14,
    fontFamily: FONT_FAMILY_REGULAR,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: MODERN_PALETTE.textSecondary,
    fontFamily: FONT_FAMILY_REGULAR,
  },
  input: {
    backgroundColor: MODERN_PALETTE.card,
    borderWidth: 1,
    borderColor: MODERN_PALETTE.borderColor,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    fontSize: 16,
    color: MODERN_PALETTE.secondaryButtonText,
    marginBottom: 20,
    fontFamily: FONT_FAMILY_REGULAR,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  pickerContainer: {
    backgroundColor: MODERN_PALETTE.card,
    borderWidth: 1,
    borderColor: MODERN_PALETTE.borderColor,
    borderRadius: 10,
    marginBottom: 20,
    justifyContent: 'center',
  },
  picker: { // Style untuk komponen Picker (teks terpilih)
    height: Platform.OS === 'ios' ? undefined : 50,
    color: MODERN_PALETTE.secondaryButtonText, // Warna teks item terpilih
    fontFamily: FONT_FAMILY_REGULAR, // Mencoba menerapkan font pada teks terpilih
  },
  pickerItemStyle: { // Style untuk setiap item di dropdown (lebih berpengaruh di Android & iOS 14+)
    fontFamily: FONT_FAMILY_REGULAR, // Mencoba menerapkan font pada item dropdown
    color: MODERN_PALETTE.textPrimary, // Warna teks item di dropdown
    // backgroundColor: 'blue', // Biasanya tidak berfungsi untuk background item dropdown
  },
  pickerItemLabelStyle: { // Style spesifik untuk label Picker.Item (lebih berpengaruh di iOS)
    fontFamily: FONT_FAMILY_REGULAR, // Mencoba menerapkan font pada label item
    color: MODERN_PALETTE.textPrimary, // Warna teks item di dropdown
  },
  deviceInfoContainer: {
    marginVertical: 15,
    padding: 10,
    backgroundColor: MODERN_PALETTE.card,
    borderRadius: 8,
    opacity: 0.8,
  },
  deviceInfoTitle: {
    fontSize: 14,
    color: MODERN_PALETTE.secondaryButtonText,
    marginBottom: 5,
    fontFamily: FONT_FAMILY_REGULAR,
  },
  deviceInfoText: {
    fontSize: 13,
    color: MODERN_PALETTE.secondaryButtonText,
    fontFamily: FONT_FAMILY_REGULAR,
    lineHeight: 18,
  },
  button: {
    backgroundColor: MODERN_PALETTE.primaryButton,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: MODERN_PALETTE.iconColor,
  },
  buttonText: {
    color: MODERN_PALETTE.primaryButtonText,
    fontSize: 16,
    fontFamily: FONT_FAMILY_REGULAR,
  },
});
