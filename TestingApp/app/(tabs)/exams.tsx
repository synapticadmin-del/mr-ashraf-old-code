import { NewsSlider } from '@/components/news-slider';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, SemanticColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  useGetStudentFreeExamsQuery,
  useGetStudentPaidExamsQuery,
  useGetStudentPlanExamsQuery,
  useGetStudentBuiltExamsQuery,
  useGetStudentQuery,
} from '@/store/api/apiSlice';
import { getStudentIdFromToken } from '@/utils/tokenUtils';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

export default function ExamsScreen() {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const [studentId, setStudentId] = useState<string | null>(null);

  useEffect(() => {
    loadStudentId();
  }, []);

  const loadStudentId = async () => {
    try {
      const id = await getStudentIdFromToken();
      setStudentId(id);
    } catch (error) {
      console.error('Error loading student ID:', error);
    }
  };

  const { data: studentResponse } = useGetStudentQuery(studentId!, { skip: !studentId });
  const hidePaidAndPlan = studentResponse?.data?.studentCode === 'ST4327';

  const { data: freeData, isLoading: isLoadingFree, error: errorFree, refetch: refetchFree, isFetching: isFetchingFree } = useGetStudentFreeExamsQuery(studentId!, { skip: !studentId });
  const { data: paidData, isLoading: isLoadingPaid, error: errorPaid, refetch: refetchPaid, isFetching: isFetchingPaid } = useGetStudentPaidExamsQuery(studentId!, { skip: !studentId });
  const { data: planData, isLoading: isLoadingPlan, error: errorPlan, refetch: refetchPlan, isFetching: isFetchingPlan } = useGetStudentPlanExamsQuery(studentId!, { skip: !studentId });
  const { data: builtData, isLoading: isLoadingBuilt, error: errorBuilt, refetch: refetchBuilt, isFetching: isFetchingBuilt } = useGetStudentBuiltExamsQuery(studentId!, { skip: !studentId });

  const freeExams = freeData?.data ?? [];
  const paidExams = paidData?.data ?? [];
  const planExams = planData?.data ?? [];
  const builtExams = builtData?.data ?? [];

  const isLoading = !studentId || isLoadingFree || isLoadingPaid || isLoadingPlan || isLoadingBuilt;
  const error = errorFree || errorPaid || errorPlan || errorBuilt;
  const isFetchingAny = isFetchingFree || isFetchingPaid || isFetchingPlan || isFetchingBuilt;

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={themeColors.tint} />
          <ThemedText style={styles.loaderText}>جاري تحميل الامتحانات...</ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  if (error) {
    const err = error as { status?: number; data?: { message?: string } };
    const errorMessage = err?.data?.message || 'حدث خطأ أثناء تحميل الامتحانات';
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={48} color={themeColors.icon} />
          <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
          <ThemedText style={styles.errorSubtext}>
            {err?.status === 401 ? 'يرجى تسجيل الدخول مرة أخرى' : 'يرجى المحاولة مرة أخرى'}
          </ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  // Check if exam is approved for current student
  const onRefresh = async () => {
    if (studentId) {
      await Promise.all([refetchFree(), refetchPaid(), refetchPlan(), refetchBuilt()]);
    }
  };

  const refreshControl = (
    <RefreshControl
      refreshing={isFetchingAny}
      onRefresh={onRefresh}
      tintColor={themeColors.tint}
      colors={[themeColors.tint]}
    />
  );

  const allCategories: { key: string; title: string; icon: string; count: number }[] = [
    { key: 'free', title: 'مجاني', icon: 'card-giftcard', count: freeExams.length },
    { key: 'paid', title: 'مدفوع', icon: 'payments', count: paidExams.length },
    { key: 'built', title: 'منشأة', icon: 'build', count: builtExams.length },
    { key: 'plan', title: 'خطة', icon: 'subscriptions', count: planExams.length },
  ];
  const categories = hidePaidAndPlan
    ? allCategories.filter((c) => c.key !== 'paid' && c.key !== 'plan')
    : allCategories;

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={refreshControl}
      >
        {/* News Slider */}
        <NewsSlider />
        <ThemedView style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            الامتحانات
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            اختر فئة ثم امتحانك
          </ThemedText>
          <TouchableOpacity
            style={[styles.buildExamButton, { backgroundColor: themeColors.cta }]}
            onPress={() => router.push('/build-exam')}
            activeOpacity={0.7}
          >
            <MaterialIcons name="add-circle-outline" size={22} color={SemanticColors.onTint} />
            <ThemedText style={styles.buildExamButtonText}>
              أنشئ امتحانك
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.materialExamsButton, { backgroundColor: themeColors.tint }]}
            onPress={() => router.push('/material-exams')}
            activeOpacity={0.7}
          >
            <MaterialIcons name="menu-book" size={22} color={SemanticColors.onTint} />
            <ThemedText style={styles.buildExamButtonText}>
              امتحانات المواد
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>

        <ThemedView style={styles.categoryGrid}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.key}
              style={[styles.categoryBox, { backgroundColor: themeColors.tint + '18', borderColor: themeColors.tint + '40' }]}
              onPress={() => router.push({ pathname: '/category-exams', params: { category: cat.key } })}
              activeOpacity={0.8}
            >
              <ThemedView style={[styles.categoryBoxIconWrap, { backgroundColor: themeColors.tint + '30' }]}>
                <MaterialIcons name={cat.icon as any} size={36} color={themeColors.tint} />
              </ThemedView>
              <ThemedText type="defaultSemiBold" style={[styles.categoryBoxTitle, { color: themeColors.text }]}>
                {cat.title}
              </ThemedText>
              <ThemedText style={[styles.categoryBoxCount, { color: themeColors.icon }]}>
                {cat.count} امتحان
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 24,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loaderText: {
    marginTop: 20,
    fontSize: 16,
    opacity: 0.7,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    marginTop: 20,
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  errorSubtext: {
    marginTop: 12,
    fontSize: 14,
    opacity: 0.5,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  header: {
    marginBottom: 28,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 4,
  },
  buildExamButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
    alignSelf: 'flex-start',
  },
  materialExamsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    marginTop: 12,
    gap: 8,
    alignSelf: 'flex-start',
  },
  buildExamButtonText: {
    color: SemanticColors.onTint,
    fontSize: 15,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  emptyText: {
    marginTop: 20,
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
  },
  categoryBox: {
    width: '47%',
    minHeight: 140,
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: SemanticColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  categoryBoxIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  categoryBoxTitle: {
    fontSize: 18,
    marginBottom: 4,
    textAlign: 'center',
  },
  categoryBoxCount: {
    fontSize: 14,
  },
  examsList: {
    gap: 16,
  },
  examCard: {
    borderRadius: 60,
    padding: 20,
    borderWidth: 1,

    marginBottom: 16,
    shadowColor: SemanticColors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  examHeader: {
    flexDirection: 'row',
    marginBottom: 20,
    borderRadius: 20,
    borderBottomWidth: 1,
    gap: 12,
    padding: 8,
  },
  examIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  examInfo: {
    flex: 1,
    paddingRight: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  examTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    flex: 1,
    lineHeight: 26,
  },
  lockedIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  approvedIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  examDescription: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 12,
    lineHeight: 20,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
  },
  priceText: {
    fontSize: 17,
    fontWeight: '600',
  },
  examDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    paddingBottom: 4,
    marginTop: 8,
    borderTopWidth: 1,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
  },
  detailText: {
    fontSize: 14,
    opacity: 0.8,
    fontWeight: '500',
  },
  solveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    marginTop: 16,
    gap: 10,
    shadowColor: SemanticColors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  solveButtonText: {
    color: SemanticColors.onTint,
    fontSize: 16,
    fontWeight: '600',
  },
  buyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    marginTop: 16,
    gap: 10,
    shadowColor: SemanticColors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  buyButtonText: {
    color: SemanticColors.onTint,
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: SemanticColors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingBottom: 32,
    paddingHorizontal: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  modalExamInfo: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  modalExamTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  modalExamPrice: {
    fontSize: 16,
    opacity: 0.7,
  },
  modalBody: {
    gap: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    borderWidth: 1,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  imagePickerButton: {
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    minHeight: 150,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  imagePickerContent: {
    alignItems: 'center',
    gap: 8,
  },
  imagePickerText: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 8,
  },
  previewImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  removeImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 6,
  },
  removeImageText: {
    color: SemanticColors.error,
    fontSize: 14,
    fontWeight: '500',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
    marginTop: 8,
    shadowColor: SemanticColors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  submitButtonText: {
    color: SemanticColors.onTint,
    fontSize: 16,
    fontWeight: '600',
  },
});
