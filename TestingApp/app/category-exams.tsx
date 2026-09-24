import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, SemanticColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { toast } from '@/hooks/use-toast';
import type { Exam } from '@/store/api/apiSlice';
import {
  useBuyExamMutation,
  useGetApprovedExamsQuery,
  useGetStudentBuiltExamsQuery,
  useGetStudentFreeExamsQuery,
  useGetStudentPaidExamsQuery,
  useGetStudentPlanExamsQuery,
  useGetStudentQuery,
} from '@/store/api/apiSlice';
import { getStudentIdFromToken } from '@/utils/tokenUtils';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const CATEGORY_CONFIG: Record<string, { title: string; icon: string }> = {
  free: { title: 'امتحانات مجانية', icon: 'card-giftcard' },
  paid: { title: 'امتحانات مدفوعة', icon: 'payments' },
  built: { title: 'امتحانات منشأة', icon: 'build' },
  plan: { title: 'امتحانات الخطة', icon: 'subscriptions' },
};

export default function CategoryExamsScreen() {
  const { category } = useLocalSearchParams<{ category: string }>();
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const [studentId, setStudentId] = useState<string | null>(null);
  const [buyExam, { isLoading: isBuying }] = useBuyExamMutation();
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [address, setAddress] = useState('');
  const [transferScreenshot, setTransferScreenshot] = useState<string | null>(null);

  useEffect(() => {
    getStudentIdFromToken().then(setStudentId).catch(console.error);
  }, []);

  const { data: studentResponse } = useGetStudentQuery(studentId!, { skip: !studentId });
  const studentCode = studentResponse?.data?.studentCode ?? null;
  const hidePrice = studentCode === 'ST4327';

  const { data: approvedData } = useGetApprovedExamsQuery(studentId!, { skip: !studentId });
  const approvedExamIds = (approvedData?.data ?? [])
    .filter((p) => p.status === 'approved')
    .map((p) => {
      try {
        const m = p.examId.match(/ObjectId\('([^']+)'\)/);
        return m ? m[1] : p.examId;
      } catch {
        return p.examId;
      }
    });

  const { data: freeData, isLoading: loadFree, refetch: refetchFree } = useGetStudentFreeExamsQuery(studentId!, { skip: !studentId || category !== 'free' });
  const { data: paidData, isLoading: loadPaid, refetch: refetchPaid } = useGetStudentPaidExamsQuery(studentId!, { skip: !studentId || category !== 'paid' });
  const { data: planData, isLoading: loadPlan, refetch: refetchPlan } = useGetStudentPlanExamsQuery(studentId!, { skip: !studentId || category !== 'plan' });
  const { data: builtData, isLoading: loadBuilt, refetch: refetchBuilt } = useGetStudentBuiltExamsQuery(studentId!, { skip: !studentId || category !== 'built' });

  const exams: Exam[] =
    category === 'free' ? (freeData?.data ?? []) :
    category === 'paid' ? (paidData?.data ?? []) :
    category === 'plan' ? (planData?.data ?? []) :
    category === 'built' ? (builtData?.data ?? []) : [];

  const isLoading = !studentId || (category === 'free' && loadFree) || (category === 'paid' && loadPaid) || (category === 'plan' && loadPlan) || (category === 'built' && loadBuilt);
  const refetch = () => {
    if (category === 'free') refetchFree();
    else if (category === 'paid') refetchPaid();
    else if (category === 'plan') refetchPlan();
    else if (category === 'built') refetchBuilt();
  };

  const config = category ? CATEGORY_CONFIG[category] : null;
  const isPaidCategory = category === 'paid';

  const isExamApproved = (examId: string) => approvedExamIds.includes(examId);

  const handleBuyPress = (exam: Exam) => {
    setSelectedExam(exam);
    setShowBuyModal(true);
    setAddress('');
    setTransferScreenshot(null);
  };

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('صلاحيات', 'يجب السماح بالوصول إلى الصور');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) setTransferScreenshot(result.assets[0].uri);
    } catch {
      toast({ title: 'خطأ', description: 'فشل في اختيار الصورة' });
    }
  };

  const handleBuyExam = async () => {
    if (!selectedExam) return;
    if (!address.trim()) {
      toast({ title: 'خطأ', description: 'يرجى إدخال العنوان' });
      return;
    }
    if (!transferScreenshot) {
      toast({ title: 'خطأ', description: 'يرجى رفع صورة إثبات التحويل' });
      return;
    }
    try {
      const sid = await getStudentIdFromToken();
      if (!sid) {
        toast({ title: 'خطأ', description: 'لم يتم العثور على معرف الطالب' });
        return;
      }
      const formData = new FormData();
      formData.append('examId', selectedExam.id);
      formData.append('studentId', sid);
      formData.append('address', address.trim());
      const filename = transferScreenshot.split('/').pop() || 'image.jpg';
      const type = /\.(\w+)$/.exec(filename) ? `image/${/\.(\w+)$/.exec(filename)![1]}` : 'image/jpeg';
      formData.append('transferScreenshot', { uri: transferScreenshot, name: filename, type } as any);
      const res = await buyExam(formData).unwrap();
      if (res.success) {
        toast({ title: 'نجاح', description: res.message || 'تم شراء الامتحان بنجاح' });
        setShowBuyModal(false);
        setSelectedExam(null);
        setAddress('');
        setTransferScreenshot(null);
        refetch();
      } else {
        toast({ title: 'خطأ', description: res.message || 'حدث خطأ أثناء الشراء' });
      }
    } catch (err: any) {
      toast({ title: 'خطأ', description: (err?.data as any)?.message || 'حدث خطأ أثناء شراء الامتحان' });
    }
  };

  if (!category || !config) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.errorText}>فئة غير صالحة</ThemedText>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ThemedText>رجوع</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={themeColors.tint} />
          <ThemedText style={styles.loaderText}>جاري التحميل...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  const renderExamCard = (exam: Exam) => {
    const questionCount = (exam.questions ?? []).length;
    const approved = isExamApproved(exam.id);
    const treatAsFree = category === 'plan' || category === 'built';
    const canSolve = treatAsFree || !exam.isPaid || approved;
    return (
      <TouchableOpacity
        key={exam.id}
        style={[styles.examCard, { backgroundColor: themeColors.card, borderColor: themeColors.icon + '30' }]}
        activeOpacity={0.7}
      >
        <ThemedView style={[styles.examHeader, { borderBottomColor: themeColors.border }]}>
          <ThemedView style={[styles.examIconContainer, { backgroundColor: themeColors.tint + '20' }]}>
            <MaterialIcons name="assignment" size={24} color={themeColors.tint} />
          </ThemedView>
          <ThemedView style={styles.examInfo}>
            <ThemedView style={styles.titleRow}>
              <ThemedText type="subtitle" style={styles.examTitle}>{exam.title}</ThemedText>
              {!treatAsFree && exam.isPaid && !approved && (
                <ThemedView style={[styles.lockedIcon, { backgroundColor: SemanticColors.errorAlpha20 }]}>
                  <MaterialIcons name="lock" size={18} color={SemanticColors.error} />
                </ThemedView>
              )}
              {!treatAsFree && exam.isPaid && approved && (
                <ThemedView style={[styles.approvedIcon, { backgroundColor: SemanticColors.successAlpha20 }]}>
                  <MaterialIcons name="check-circle" size={18} color={SemanticColors.success} />
                </ThemedView>
              )}
            </ThemedView>
            <ThemedText style={styles.examDescription}>{exam.description}</ThemedText>
            {!hidePrice && !treatAsFree && exam.isPaid && exam.price != null && (
              <ThemedView style={styles.priceContainer}>
                <ThemedText style={[styles.priceText, { color: themeColors.tint }]}>{exam.price} جنيه</ThemedText>
              </ThemedView>
            )}
          </ThemedView>
        </ThemedView>
        <ThemedView style={[styles.examDetails, { borderTopColor: themeColors.border }]}>
          <ThemedView style={styles.detailItem}>
            <MaterialIcons name="timer" size={18} color={themeColors.icon} />
            <ThemedText style={styles.detailText}>{exam.duration} دقيقة</ThemedText>
          </ThemedView>
          <ThemedView style={styles.detailItem}>
            <MaterialIcons name="star" size={18} color={themeColors.icon} />
            <ThemedText style={styles.detailText}>{exam.totalPoints} نقطة</ThemedText>
          </ThemedView>
          <ThemedView style={styles.detailItem}>
            <MaterialIcons name="help-outline" size={18} color={themeColors.icon} />
            <ThemedText style={styles.detailText}>{questionCount} سؤال</ThemedText>
          </ThemedView>
        </ThemedView>
        {canSolve ? (
          <TouchableOpacity
            style={[styles.solveButton, { backgroundColor: themeColors.tint }]}
            onPress={() => router.push({ pathname: '/solve-exam', params: { exam: JSON.stringify(exam) } })}
          >
            <MaterialIcons name="edit" size={20} color={SemanticColors.onTint} />
            <ThemedText style={styles.solveButtonText}>حل الامتحان</ThemedText>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.buyButton, { backgroundColor: themeColors.cta }]} onPress={() => handleBuyPress(exam)}>
            <MaterialIcons name="shopping-cart" size={20} color={SemanticColors.onTint} />
            <ThemedText style={styles.buyButtonText}>شراء الامتحان {exam.price != null ? `(${exam.price} جنيه)` : ''}</ThemedText>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { borderBottomColor: themeColors.tint + '30' }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: themeColors.tint + '20' }]}>
          <MaterialIcons name="arrow-back" size={24} color={themeColors.tint} />
        </TouchableOpacity>
        <ThemedText type="title" style={styles.headerTitle}>{config.title}</ThemedText>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={themeColors.tint} />}
      >
        {exams.length === 0 ? (
          <ThemedView style={styles.emptyContainer}>
            <MaterialIcons name="assignment" size={64} color={themeColors.icon} />
            <ThemedText style={styles.emptyText}>لا توجد امتحانات في هذه الفئة</ThemedText>
          </ThemedView>
        ) : (
          <ThemedView style={styles.examsList}>
            {exams.map(renderExamCard)}
          </ThemedView>
        )}
      </ScrollView>

      {isPaidCategory && (
        <Modal visible={showBuyModal} animationType="slide" transparent onRequestClose={() => setShowBuyModal(false)}>
          <ThemedView style={styles.modalOverlay}>
            <ThemedView style={[styles.modalContent, { backgroundColor: themeColors.card }]}>
              <ThemedView style={styles.modalHeader}>
                <ThemedText type="title" style={styles.modalTitle}>شراء الامتحان</ThemedText>
                <TouchableOpacity onPress={() => setShowBuyModal(false)} style={styles.closeButton}>
                  <MaterialIcons name="close" size={24} color={themeColors.icon} />
                </TouchableOpacity>
              </ThemedView>
              {selectedExam && (
                <ThemedView style={[styles.modalExamInfo, { borderBottomColor: themeColors.border }]}>
                  <ThemedText style={styles.modalExamTitle}>{selectedExam.title}</ThemedText>
                  <ThemedText style={styles.modalExamPrice}>السعر: {selectedExam.price} جنيه</ThemedText>
                </ThemedView>
              )}
              <ThemedView style={styles.modalBody}>
                <ThemedView style={styles.inputGroup}>
                  <ThemedText style={styles.inputLabel}>العنوان *</ThemedText>
                  <TextInput
                    style={[styles.textInput, { color: themeColors.text, backgroundColor: themeColors.input, borderColor: themeColors.icon + '30' }]}
                    placeholder="أدخل عنوانك الكامل"
                    placeholderTextColor={themeColors.icon + '80'}
                    value={address}
                    onChangeText={setAddress}
                    multiline
                    numberOfLines={3}
                  />
                </ThemedView>
                <ThemedView style={styles.inputGroup}>
                  <ThemedText style={styles.inputLabel}>صورة إثبات التحويل *</ThemedText>
                  <TouchableOpacity style={[styles.imagePickerButton, { backgroundColor: themeColors.input, borderColor: themeColors.icon + '30' }]} onPress={handlePickImage}>
                    {transferScreenshot ? (
                      <Image source={{ uri: transferScreenshot }} style={styles.previewImage} />
                    ) : (
                      <ThemedView style={styles.imagePickerContent}>
                        <MaterialIcons name="add-photo-alternate" size={32} color={themeColors.icon} />
                        <ThemedText style={styles.imagePickerText}>اضغط لاختيار الصورة</ThemedText>
                      </ThemedView>
                    )}
                  </TouchableOpacity>
                  {transferScreenshot && (
                    <TouchableOpacity style={styles.removeImageButton} onPress={() => setTransferScreenshot(null)}>
                      <MaterialIcons name="delete" size={20} color={SemanticColors.error} />
                      <ThemedText style={styles.removeImageText}>إزالة الصورة</ThemedText>
                    </TouchableOpacity>
                  )}
                </ThemedView>
                <TouchableOpacity
                  style={[styles.submitButton, { backgroundColor: themeColors.cta, opacity: isBuying ? 0.6 : 1 }]}
                  onPress={handleBuyExam}
                  disabled={isBuying}
                >
                  {isBuying ? <ActivityIndicator color={SemanticColors.onTint} /> : (
                    <>
                      <MaterialIcons name="check" size={20} color={SemanticColors.onTint} />
                      <ThemedText style={styles.submitButtonText}>تأكيد الشراء</ThemedText>
                    </>
                  )}
                </TouchableOpacity>
              </ThemedView>
            </ThemedView>
          </ThemedView>
        </Modal>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loaderWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  loaderText: { marginTop: 16, fontSize: 16, opacity: 0.7 },
  errorText: { fontSize: 16, textAlign: 'center', padding: 24 },
  backBtn: { padding: 16, alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, paddingTop: 48, borderBottomWidth: 1 },
  backButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 80 },
  emptyText: { marginTop: 20, fontSize: 16, opacity: 0.7, textAlign: 'center' },
  examsList: { gap: 16 },
  examCard: { borderRadius: 16, padding: 20, borderWidth: 1, marginBottom: 16, shadowColor: SemanticColors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  examHeader: { flexDirection: 'row', marginBottom: 20, borderBottomWidth: 1, gap: 12, paddingBottom: 8 },
  examIconContainer: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center' },
  examInfo: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  examTitle: { fontSize: 19, fontWeight: 'bold', flex: 1 },
  lockedIcon: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  approvedIcon: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  examDescription: { fontSize: 14, opacity: 0.7, marginBottom: 12 },
  priceContainer: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  priceText: { fontSize: 17, fontWeight: '600' },
  examDetails: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: 16, marginTop: 8, borderTopWidth: 1 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailText: { fontSize: 14, opacity: 0.8, fontWeight: '500' },
  solveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, paddingHorizontal: 20, borderRadius: 14, marginTop: 16, gap: 10 },
  solveButtonText: { color: SemanticColors.onTint, fontSize: 16, fontWeight: '600' },
  buyButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, paddingHorizontal: 20, borderRadius: 14, marginTop: 16, gap: 10 },
  buyButtonText: { color: SemanticColors.onTint, fontSize: 16, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: SemanticColors.overlay, justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 24, paddingBottom: 32, paddingHorizontal: 20, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: 'bold' },
  closeButton: { padding: 4 },
  modalExamInfo: { marginBottom: 24, paddingBottom: 16, borderBottomWidth: 1 },
  modalExamTitle: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
  modalExamPrice: { fontSize: 16, opacity: 0.7 },
  modalBody: { gap: 20 },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 15, fontWeight: '600', marginBottom: 8 },
  textInput: { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, borderWidth: 1, textAlignVertical: 'top', minHeight: 80 },
  imagePickerButton: { borderRadius: 12, borderWidth: 2, borderStyle: 'dashed', minHeight: 150, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  imagePickerContent: { alignItems: 'center', gap: 8 },
  imagePickerText: { fontSize: 14, opacity: 0.7, marginTop: 8 },
  previewImage: { width: '100%', height: 200, resizeMode: 'cover' },
  removeImageButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12, gap: 6 },
  removeImageText: { color: SemanticColors.error, fontSize: 14, fontWeight: '500' },
  submitButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 14, gap: 10, marginTop: 8 },
  submitButtonText: { color: SemanticColors.onTint, fontSize: 16, fontWeight: '600' },
});
