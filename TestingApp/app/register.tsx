import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BASE_URL } from '@/constants/config';
import { Colors, SemanticColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { toast } from '@/hooks/use-toast';
import type { EducationalStage } from '@/store/api/apiSlice';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const BIRTHDAY_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: currentYear - 1980 }, (_, i) => currentYear - 15 - i);
const MONTHS = [
  { value: 1, label: 'يناير' }, { value: 2, label: 'فبراير' }, { value: 3, label: 'مارس' },
  { value: 4, label: 'أبريل' }, { value: 5, label: 'مايو' }, { value: 6, label: 'يونيو' },
  { value: 7, label: 'يوليو' }, { value: 8, label: 'أغسطس' }, { value: 9, label: 'سبتمبر' },
  { value: 10, label: 'أكتوبر' }, { value: 11, label: 'نوفمبر' }, { value: 12, label: 'ديسمبر' },
];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function parseBirthday(birthday: string): { y: number; m: number; d: number } {
  if (BIRTHDAY_REGEX.test(birthday)) {
    const [y, m, d] = birthday.split('-').map(Number);
    if (y >= 1980 && y <= currentYear && m >= 1 && m <= 12 && d >= 1) {
      const maxDay = getDaysInMonth(y, m);
      if (d <= maxDay) return { y, m, d };
    }
  }
  return { y: currentYear - 15, m: 1, d: 1 };
}

export default function RegisterScreen() {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const [stages, setStages] = useState<EducationalStage[]>([]);
  const [stagesLoading, setStagesLoading] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phoneNumber: '',
    birthday: '',
    educationalStageId: '',
    password: '',
  });
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [stageModalVisible, setStageModalVisible] = useState(false);
  const [birthdayModalVisible, setBirthdayModalVisible] = useState(false);
  const [birthdayPick, setBirthdayPick] = useState({ year: currentYear - 15, month: 1, day: 1 });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    axios
      .get<{ success: boolean; data: EducationalStage[]; message?: string }>(`${BASE_URL}/educational-stages`)
      .then((res) => {
        if (!cancelled) {
          setStages(Array.isArray(res.data?.data) ? res.data.data : []);
        }
      })
      .catch(() => {
        if (!cancelled) setStages([]);
      })
      .finally(() => {
        if (!cancelled) setStagesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const selectedStage = stages.find((s) => s.id === formData.educationalStageId);

  const openBirthdayModal = useCallback(() => {
    const parsed = parseBirthday(formData.birthday);
    setBirthdayPick({ year: parsed.y, month: parsed.m, day: Math.min(parsed.d, getDaysInMonth(parsed.y, parsed.m)) });
    setBirthdayModalVisible(true);
  }, [formData.birthday]);

  const confirmBirthday = useCallback(() => {
    const { year, month, day } = birthdayPick;
    const dayPadded = String(day).padStart(2, '0');
    const monthPadded = String(month).padStart(2, '0');
    handleInputChange('birthday', `${year}-${monthPadded}-${dayPadded}`);
    setBirthdayModalVisible(false);
  }, [birthdayPick, handleInputChange]);

  const handlePickImage = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('صلاحيات', 'يجب السماح بالوصول إلى الصور');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch (err) {
      console.error('Error picking image:', err);
      toast({ title: 'خطأ', description: 'فشل في اختيار الصورة' });
    }
  }, []);

  const validate = (): boolean => {
    if (!formData.username.trim()) {
      toast({ title: 'خطأ', description: 'يرجى إدخال اسم المستخدم' });
      return false;
    }
    if (!formData.email.trim()) {
      toast({ title: 'خطأ', description: 'يرجى إدخال البريد الإلكتروني' });
      return false;
    }
    if (!EMAIL_REGEX.test(formData.email.trim())) {
      toast({ title: 'خطأ', description: 'البريد الإلكتروني غير صالح' });
      return false;
    }
    if (!formData.phoneNumber.trim()) {
      toast({ title: 'خطأ', description: 'يرجى إدخال رقم الهاتف' });
      return false;
    }
    if (!formData.birthday.trim()) {
      toast({ title: 'خطأ', description: 'يرجى إدخال تاريخ الميلاد' });
      return false;
    }
    if (!BIRTHDAY_REGEX.test(formData.birthday.trim())) {
      toast({
        title: 'خطأ',
        description: 'تاريخ الميلاد يجب أن يكون بالصيغة: سنة-شهر-يوم (مثال: 2026-02-03)',
      });
      return false;
    }
    if (!formData.educationalStageId) {
      toast({ title: 'خطأ', description: 'يرجى اختيار المرحلة التعليمية' });
      return false;
    }
    if (!formData.password.trim()) {
      toast({ title: 'خطأ', description: 'يرجى إدخال كلمة المرور' });
      return false;
    }
    if (formData.password.length < 6) {
      toast({ title: 'خطأ', description: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' });
      return false;
    }
    if (!imageUri) {
      toast({ title: 'خطأ', description: 'يرجى اختيار صورة شخصية' });
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      setIsSubmitting(true);

      const formDataToSend = new FormData();
      formDataToSend.append('username', formData.username.trim());
      formDataToSend.append('email', formData.email.trim());
      formDataToSend.append('phoneNumber', formData.phoneNumber.trim());
      formDataToSend.append('birthday', formData.birthday.trim());
      formDataToSend.append('educationalStageId', formData.educationalStageId);
      formDataToSend.append('password', formData.password);

      if (imageUri) {
        const filename = imageUri.split('/').pop() || 'image.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        formDataToSend.append('image', {
          uri: imageUri,
          name: filename,
          type,
        } as any);
      }

      const response = await axios.post<{ success: boolean; message?: string }>(
        `${BASE_URL}/students/register`,
        formDataToSend,
        { headers: {} }
      );
      console.log(response.data);
      if (response.data.success === false) {
        toast({
          title: 'خطأ',
          description: response.data.message || 'حدث خطأ أثناء التسجيل',
        });
      } else {
        toast({
          title: 'نجاح',
          description: response.data.message || 'تم إنشاء الحساب. تم إرسال الكود إلى بريدك الإلكتروني',
        });
        router.replace('/login');
      }
    } catch (error: unknown) {
      const message =
        axios.isAxiosError(error) && error.response?.data?.message
          ? String(error.response.data.message)
          : 'حدث خطأ أثناء التسجيل';
      toast({
        title: 'خطأ',
        description: message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <ThemedView style={styles.imageContainer}>
       
        </ThemedView>

        <ThemedText type="title" style={styles.title}>
          إنشاء حساب طالب
        </ThemedText>
        <ThemedText type="subtitle" style={styles.subtitle}>
          أدخل بياناتك للتسجيل
        </ThemedText>

        {/* Avatar / Image picker */}
        <ThemedView style={styles.avatarSection}>
          <TouchableOpacity
            onPress={handlePickImage}
            style={[
              styles.avatarTouchable,
              { borderColor: themeColors.icon, backgroundColor: themeColors.input },
            ]}
          >
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <MaterialIcons name="add-a-photo" size={40} color={themeColors.icon} />
                <ThemedText style={styles.avatarLabel}>اختر صورة</ThemedText>
              </View>
            )}
          </TouchableOpacity>
        </ThemedView>

        <ThemedView style={styles.formContainer}>
          <ThemedView style={styles.inputContainer}>
            <ThemedText style={styles.label}>اسم المستخدم</ThemedText>
            <ThemedView
              style={[
                styles.inputWrapper,
                {
                  borderColor: themeColors.icon,
                  backgroundColor: themeColors.input,
                },
              ]}
            >
              <MaterialIcons
                name="person"
                size={20}
                color={themeColors.icon}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { color: themeColors.text }]}
                value={formData.username}
                onChangeText={(v) => handleInputChange('username', v)}
                placeholder="أدخل اسم المستخدم"
                placeholderTextColor={themeColors.icon}
                autoCapitalize="none"
              />
            </ThemedView>
          </ThemedView>

          <ThemedView style={styles.inputContainer}>
            <ThemedText style={styles.label}>البريد الإلكتروني</ThemedText>
            <ThemedView
              style={[
                styles.inputWrapper,
                {
                  borderColor: themeColors.icon,
                  backgroundColor: themeColors.input,
                },
              ]}
            >
              <MaterialIcons
                name="email"
                size={20}
                color={themeColors.icon}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { color: themeColors.text }]}
                value={formData.email}
                onChangeText={(v) => handleInputChange('email', v)}
                placeholder="example@email.com"
                placeholderTextColor={themeColors.icon}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </ThemedView>
          </ThemedView>

          <ThemedView style={styles.inputContainer}>
            <ThemedText style={styles.label}>رقم الهاتف</ThemedText>
            <ThemedView
              style={[
                styles.inputWrapper,
                {
                  borderColor: themeColors.icon,
                  backgroundColor: themeColors.input,
                },
              ]}
            >
              <MaterialIcons
                name="phone"
                size={20}
                color={themeColors.icon}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { color: themeColors.text }]}
                value={formData.phoneNumber}
                onChangeText={(v) => handleInputChange('phoneNumber', v)}
                placeholder="+201021897565"
                placeholderTextColor={themeColors.icon}
                keyboardType="phone-pad"
              />
            </ThemedView>
          </ThemedView>

          <ThemedView style={styles.inputContainer}>
            <ThemedText style={styles.label}>تاريخ الميلاد</ThemedText>
            <TouchableOpacity
              onPress={openBirthdayModal}
              style={[
                styles.inputWrapper,
                styles.pickerTouchable,
                {
                  borderColor: themeColors.icon,
                  backgroundColor: themeColors.input,
                },
              ]}
            >
              <MaterialIcons
                name="calendar-today"
                size={20}
                color={themeColors.icon}
                style={styles.inputIcon}
              />
              <ThemedText
                style={[styles.pickerText, { color: formData.birthday ? themeColors.text : themeColors.icon }]}
                numberOfLines={1}
              >
                {formData.birthday || 'اختر تاريخ الميلاد'}
              </ThemedText>
              <MaterialIcons name="keyboard-arrow-down" size={24} color={themeColors.icon} />
            </TouchableOpacity>
          </ThemedView>

          <ThemedView style={styles.inputContainer}>
            <ThemedText style={styles.label}>المرحلة التعليمية</ThemedText>
            <TouchableOpacity
              onPress={() => setStageModalVisible(true)}
              style={[
                styles.inputWrapper,
                styles.pickerTouchable,
                {
                  borderColor: themeColors.icon,
                  backgroundColor: themeColors.input,
                },
              ]}
            >
              <MaterialIcons
                name="school"
                size={20}
                color={themeColors.icon}
                style={styles.inputIcon}
              />
              <ThemedText
                style={[styles.pickerText, { color: selectedStage ? themeColors.text : themeColors.icon }]}
                numberOfLines={1}
              >
                {stagesLoading ? 'جاري التحميل...' : selectedStage ? selectedStage.nameAr : 'اختر المرحلة التعليمية'}
              </ThemedText>
              <MaterialIcons name="keyboard-arrow-down" size={24} color={themeColors.icon} />
            </TouchableOpacity>
          </ThemedView>

          <ThemedView style={styles.inputContainer}>
            <ThemedText style={styles.label}>كلمة المرور</ThemedText>
            <ThemedView
              style={[
                styles.inputWrapper,
                {
                  borderColor: themeColors.icon,
                  backgroundColor: themeColors.input,
                },
              ]}
            >
              <MaterialIcons
                name="lock"
                size={20}
                color={themeColors.icon}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { color: themeColors.text }]}
                value={formData.password}
                onChangeText={(v) => handleInputChange('password', v)}
                placeholder="6 أحرف على الأقل"
                placeholderTextColor={themeColors.icon}
                secureTextEntry
              />
            </ThemedView>
          </ThemedView>

          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: themeColors.cta },
              isSubmitting && styles.buttonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color={themeColors.background} />
            ) : (
              <ThemedText style={[styles.buttonText, { color: themeColors.background }]}>
                إنشاء الحساب
              </ThemedText>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => router.push('/login')}
            disabled={isSubmitting}
          >
            <ThemedText style={styles.loginLinkText}>لديك حساب؟ </ThemedText>
            <ThemedText type="link" style={styles.loginLinkHighlight}>
              تسجيل الدخول
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ScrollView>

      <Modal
        visible={stageModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setStageModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setStageModalVisible(false)}
        >
          <ThemedView
            style={[styles.modalContent, { backgroundColor: themeColors.background }]}
            onStartShouldSetResponder={() => true}
          >
            <ThemedText type="defaultSemiBold" style={styles.modalTitle}>
              اختر المرحلة التعليمية
            </ThemedText>
            <ScrollView style={styles.modalList} keyboardShouldPersistTaps="handled">
              {stages.map((stage) => (
                <TouchableOpacity
                  key={stage.id}
                  style={[
                    styles.modalOption,
                    formData.educationalStageId === stage.id && {
                      backgroundColor: themeColors.input,
                    },
                  ]}
                  onPress={() => {
                    handleInputChange('educationalStageId', stage.id);
                    setStageModalVisible(false);
                  }}
                >
                  <ThemedText style={styles.modalOptionText}>{stage.nameAr}</ThemedText>
                  {formData.educationalStageId === stage.id && (
                    <MaterialIcons name="check" size={22} color={themeColors.tint} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={[styles.modalCloseButton, { backgroundColor: themeColors.input }]}
              onPress={() => setStageModalVisible(false)}
            >
              <ThemedText style={styles.modalCloseText}>إغلاق</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={birthdayModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setBirthdayModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setBirthdayModalVisible(false)}
        >
          <ThemedView
            style={[styles.modalContent, styles.birthdayModalContent, { backgroundColor: themeColors.background }]}
            onStartShouldSetResponder={() => true}
          >
            <ThemedText type="defaultSemiBold" style={styles.modalTitle}>
              اختر تاريخ الميلاد
            </ThemedText>
            <View style={styles.birthdayPickersRow}>
              <View style={styles.birthdayPickerColumn}>
                <ThemedText style={styles.birthdayPickerLabel}>السنة</ThemedText>
                <ScrollView style={styles.birthdayPickerScroll} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                  {YEARS.map((year) => (
                    <TouchableOpacity
                      key={year}
                      style={[
                        styles.birthdayPickerOption,
                        birthdayPick.year === year && { backgroundColor: themeColors.tint + '25' },
                      ]}
                      onPress={() => setBirthdayPick((p) => ({ ...p, year, day: Math.min(p.day, getDaysInMonth(year, p.month)) }))}
                    >
                      <ThemedText style={[styles.birthdayPickerOptionText, birthdayPick.year === year && { color: themeColors.tint, fontWeight: '600' }]}>
                        {year}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <View style={styles.birthdayPickerColumn}>
                <ThemedText style={styles.birthdayPickerLabel}>الشهر</ThemedText>
                <ScrollView style={styles.birthdayPickerScroll} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                  {MONTHS.map(({ value, label }) => (
                    <TouchableOpacity
                      key={value}
                      style={[
                        styles.birthdayPickerOption,
                        birthdayPick.month === value && { backgroundColor: themeColors.tint + '25' },
                      ]}
                      onPress={() => setBirthdayPick((p) => ({ ...p, month: value, day: Math.min(p.day, getDaysInMonth(p.year, value)) }))}
                    >
                      <ThemedText style={[styles.birthdayPickerOptionText, birthdayPick.month === value && { color: themeColors.tint, fontWeight: '600' }]}>
                        {label}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <View style={styles.birthdayPickerColumn}>
                <ThemedText style={styles.birthdayPickerLabel}>اليوم</ThemedText>
                <ScrollView style={styles.birthdayPickerScroll} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                  {Array.from({ length: getDaysInMonth(birthdayPick.year, birthdayPick.month) }, (_, i) => i + 1).map((day) => (
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.birthdayPickerOption,
                        birthdayPick.day === day && { backgroundColor: themeColors.tint + '25' },
                      ]}
                      onPress={() => setBirthdayPick((p) => ({ ...p, day }))}
                    >
                      <ThemedText style={[styles.birthdayPickerOptionText, birthdayPick.day === day && { color: themeColors.tint, fontWeight: '600' }]}>
                        {day}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.modalCloseButton, { backgroundColor: themeColors.tint }]}
              onPress={confirmBirthday}
            >
              <ThemedText style={[styles.modalCloseText, { color: '#fff' }]}>تأكيد</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalCloseButton, { backgroundColor: themeColors.input, marginTop: 8 }]}
              onPress={() => setBirthdayModalVisible(false)}
            >
              <ThemedText style={styles.modalCloseText}>إلغاء</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </TouchableOpacity>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 40,
    paddingBottom: 32,
    flexGrow: 1,
  },
  imageContainer: {
    width: '100%',
    marginBottom: 16,
    alignItems: 'center',
  },
  coverImage: {
    width: '100%',
    height: 160,
    maxWidth: 320,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.7,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarTouchable: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 18,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    minHeight: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 14,
  },
  pickerTouchable: {
    justifyContent: 'space-between',
  },
  pickerText: {
    flex: 1,
    fontSize: 16,
  },
  submitButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    shadowColor: SemanticColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loginLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginLinkText: {
    fontSize: 16,
  },
  loginLinkHighlight: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: SemanticColors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 16,
    padding: 20,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 18,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalList: {
    maxHeight: 280,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 4,
  },
  modalOptionText: {
    fontSize: 16,
  },
  modalCloseButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: '600',
  },
  birthdayModalContent: {
    maxHeight: '85%',
  },
  birthdayPickersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 16,
  },
  birthdayPickerColumn: {
    flex: 1,
    maxHeight: 220,
  },
  birthdayPickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  birthdayPickerScroll: {
    maxHeight: 200,
    borderWidth: 1,
    borderColor: SemanticColors.borderModal,
    borderRadius: 10,
  },
  birthdayPickerOption: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  birthdayPickerOptionText: {
    fontSize: 15,
  },
});
