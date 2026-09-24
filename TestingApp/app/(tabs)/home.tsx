import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, SemanticColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { toast } from '@/hooks/use-toast';
import type { Plan } from '@/store/api/apiSlice';
import { useGetPlansQuery, useGetStudentQuery, useRequestPlanPurchaseMutation } from '@/store/api/apiSlice';
import { studentStorage } from '@/utils/tokenStorage';
import { getStudentIdFromToken } from '@/utils/tokenUtils';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  ListRenderItem,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Fixed dimensions for consistent layout
const CARD_MARGIN = 20;
const CARD_WIDTH = SCREEN_WIDTH - CARD_MARGIN * 2;
const CARD_HEIGHT = 420;
const CAROUSEL_ITEM_WIDTH = CARD_WIDTH + CARD_MARGIN * 2;
const HEADER_HEIGHT = 100;
const CAROUSEL_HEIGHT = CARD_HEIGHT + 40;

function PlanCard({
  plan,
  themeColors,
  currentPlanId,
  onSubscribe,
  hidePrice,
}: {
  plan: Plan;
  themeColors: (typeof Colors.light);
  currentPlanId: string | null;
  onSubscribe: (plan: Plan) => void;
  hidePrice?: boolean;
}) {
  const handleUpgrade = useCallback(() => {
    onSubscribe(plan);
  }, [plan, onSubscribe]);

  const features = plan.features ?? [];
  const isCurrentPlan = currentPlanId != null && plan.id === currentPlanId;

  return (
    <View style={[styles.cardWrapper, { width: CAROUSEL_ITEM_WIDTH }]}>
      <ThemedView style={[styles.card, { borderColor: themeColors.tint + '50', borderWidth: 2 }]}>
        <View style={styles.cardInner}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <ThemedText type="defaultSemiBold" style={styles.cardTitle} numberOfLines={1}>
                {plan.name}
              </ThemedText>
              {isCurrentPlan && (
                <View style={[styles.currentBadge, { backgroundColor: SemanticColors.success }]}>
                  <ThemedText style={styles.currentBadgeText}>الحالية</ThemedText>
                </View>
              )}
            </View>
            <ThemedText style={styles.cardDescription} numberOfLines={2}>
              {plan.description}
            </ThemedText>
          </View>

          {!hidePrice && (
            <View style={styles.priceSection}>
              <View style={[styles.priceBadge, { backgroundColor: themeColors.tint + '18' }]}>
                <ThemedText type="defaultSemiBold" style={[styles.price, { color: themeColors.tint }]}>
                  {plan.price}
                </ThemedText>
                <ThemedText style={styles.priceLabel}>ر.س</ThemedText>
              </View>
            </View>
          )}

          <View style={styles.featuresSection}>
            {features.length > 0 ? (
              features.slice(0, 5).map((feature, index) => (
                <View key={index} style={styles.featureRow}>
                  <MaterialIcons
                    name="check-circle"
                    size={20}
                    color={themeColors.tint}
                    style={styles.featureIcon}
                  />
                  <ThemedText style={styles.featureText} numberOfLines={1}>
                    {feature}
                  </ThemedText>
                </View>
              ))
            ) : (
              <ThemedText style={styles.noFeatures}>لا توجد ميزات محددة</ThemedText>
            )}
          </View>

          {!isCurrentPlan && (
            <TouchableOpacity
              style={[styles.subscribeBtn, { backgroundColor: themeColors.cta }]}
              onPress={handleUpgrade}
              activeOpacity={0.85}
            >
              <MaterialIcons name="trending-up" size={22} color={SemanticColors.onTint} />
              <ThemedText style={styles.subscribeBtnText}>{hidePrice ? 'تغيير' : 'ترقية'}</ThemedText>
            </TouchableOpacity>
          )}
        </View>
      </ThemedView>
    </View>
  );
}

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];
  const [studentId, setStudentId] = useState<string | null>(null);

  useEffect(() => {
    getStudentIdFromToken().then(setStudentId).catch(console.error);
  }, []);

  const { data: studentResponse } = useGetStudentQuery(studentId!, { skip: !studentId });
  const hidePrice = studentResponse?.data?.studentCode === 'ST4327';

  const { data: plansData, isLoading, error, refetch, isFetching } = useGetPlansQuery();
  const [requestPlanPurchase, { isLoading: isSubmitting }] = useRequestPlanPurchaseMutation();
  const flatListRef = useRef<FlatList<Plan> | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showBuyPlanModal, setShowBuyPlanModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [transferScreenshot, setTransferScreenshot] = useState<string | null>(null);
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);

  useEffect(() => {
    studentStorage.getStudent().then((student) => {
      const planId = student?.stats?.currentPlan?.id ?? null;
      setCurrentPlanId(planId);
    });
  }, []);

  const plans = plansData?.data ?? [];

  const handleOpenBuyPlan = useCallback((plan: Plan) => {
    setSelectedPlan(plan);
    setTransferScreenshot(null);
    setShowBuyPlanModal(true);
  }, []);

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
        aspect: [4, 3],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        setTransferScreenshot(result.assets[0].uri);
      }
    } catch (err) {
      console.error('Error picking image:', err);
      toast({ title: 'خطأ', description: 'فشل في اختيار الصورة' });
    }
  }, []);

  const handleSubmitPlanPurchase = useCallback(async () => {
    if (!selectedPlan) return;
    if (!transferScreenshot) {
      toast({
        title: 'خطأ',
        description: 'يرجى رفع صورة إثبات التحويل',
      });
      return;
    }
    try {
      const formData = new FormData();
      formData.append('planId', selectedPlan.id);
      const filename = transferScreenshot.split('/').pop() || 'image.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      formData.append('transferScreenshot', {
        uri: transferScreenshot,
        name: filename,
        type,
      } as any);
      const response = await requestPlanPurchase(formData).unwrap();
      if (response.success) {
        toast({
          title: 'نجاح',
          description: response.message || 'تم إرسال طلب الاشتراك بنجاح',
        });
        setShowBuyPlanModal(false);
        setSelectedPlan(null);
        setTransferScreenshot(null);
      } else {
        toast({
          title: 'خطأ',
          description: response.message || 'حدث خطأ أثناء إرسال الطلب',
        });
      }
    } catch (err: unknown) {
      const errorMessage =
        err && typeof err === 'object' && 'data' in err
          ? (err.data as { message?: string })?.message ?? 'حدث خطأ أثناء إرسال الطلب'
          : 'حدث خطأ أثناء إرسال الطلب';
      toast({ title: 'خطأ', description: errorMessage });
    }
  }, [selectedPlan, transferScreenshot, requestPlanPurchase]);

  const onMomentumScrollEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offset = e.nativeEvent.contentOffset.x;
    const index = Math.round(offset / CAROUSEL_ITEM_WIDTH);
    setCurrentIndex(index);
  }, []);

  const goPrev = useCallback(() => {
    const next = Math.max(0, currentIndex - 1);
    setCurrentIndex(next);
    flatListRef.current?.scrollToOffset({ offset: next * CAROUSEL_ITEM_WIDTH, animated: true });
  }, [currentIndex]);

  const goNext = useCallback(() => {
    const next = Math.min(plans.length - 1, currentIndex + 1);
    setCurrentIndex(next);
    flatListRef.current?.scrollToOffset({ offset: next * CAROUSEL_ITEM_WIDTH, animated: true });
  }, [currentIndex, plans.length]);

  const renderItem: ListRenderItem<Plan> = useCallback(
    ({ item }) => (
      <PlanCard
        plan={item}
        themeColors={themeColors}
        currentPlanId={currentPlanId}
        onSubscribe={handleOpenBuyPlan}
        hidePrice={hidePrice}
      />
    ),
    [themeColors, currentPlanId, handleOpenBuyPlan, hidePrice]
  );

  const keyExtractor = useCallback((item: Plan) => item.id, []);

  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({
      length: CAROUSEL_ITEM_WIDTH,
      offset: CAROUSEL_ITEM_WIDTH * index,
      index,
    }),
    []
  );

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={themeColors.tint} />
          <ThemedText style={styles.loaderText}>جاري تحميل الباقات...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (error) {
    const errorMessage =
      'data' in error
        ? (error.data as { message?: string })?.message ?? 'حدث خطأ أثناء تحميل الباقات'
        : 'حدث خطأ أثناء تحميل الباقات';
    return (
      <ThemedView style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={48} color={themeColors.icon} />
          <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (plans.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.emptyContainer}>
          <MaterialIcons name="inbox" size={64} color={themeColors.icon} />
          <ThemedText style={styles.emptyText}>لا توجد باقات متاحة حالياً</ThemedText>
        </View>
      </ThemedView>
    );
  }

  const refreshControl = (
    <RefreshControl
      refreshing={isFetching}
      onRefresh={refetch}
      tintColor={themeColors.tint}
      colors={[themeColors.tint]}
    />
  );

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={refreshControl}
      >
        {!hidePrice && (
          <View style={styles.header}>
            <ThemedText type="title" style={styles.screenTitle}>
              الباقات والخطط
            </ThemedText>
            <ThemedText style={styles.screenSubtitle}>
              اختر الباقة المناسبة واشترك للوصول إلى الامتحانات
            </ThemedText>
          </View>
        )}

        <View style={styles.carouselWrapper}>
        <TouchableOpacity
          style={[styles.navBtn, styles.navBtnLeft, { backgroundColor: themeColors.tint + '25' }]}
          onPress={goPrev}
          disabled={currentIndex === 0}
          activeOpacity={0.7}
        >
          <MaterialIcons
            name="chevron-left"
            size={28}
            color={currentIndex === 0 ? themeColors.icon + '60' : themeColors.tint}
          />
        </TouchableOpacity>

        <FlatList<Plan>
          ref={flatListRef}
          data={plans}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          bounces={false}
          contentContainerStyle={styles.carouselContent}
          style={styles.carouselList}
          snapToInterval={CAROUSEL_ITEM_WIDTH}
          snapToAlignment="start"
          decelerationRate="fast"
          getItemLayout={getItemLayout}
          onMomentumScrollEnd={onMomentumScrollEnd}
        />

        <TouchableOpacity
          style={[styles.navBtn, styles.navBtnRight, { backgroundColor: themeColors.tint + '25' }]}
          onPress={goNext}
          disabled={currentIndex >= plans.length - 1}
          activeOpacity={0.7}
        >
          <MaterialIcons
            name="chevron-right"
            size={28}
            color={currentIndex >= plans.length - 1 ? themeColors.icon + '60' : themeColors.tint}
          />
        </TouchableOpacity>
      </View>
      </ScrollView>

      {/* Buy Plan Modal - Upload transfer screenshot */}
      <Modal
        visible={showBuyPlanModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowBuyPlanModal(false)}
      >
        <ThemedView style={styles.modalOverlay}>
          <ThemedView
            style={[
              styles.modalContent,
              { backgroundColor: themeColors.card },
            ]}
          >
            <View style={styles.modalHeader}>
              <ThemedText type="title" style={styles.modalTitle}>
                شراء الباقة
              </ThemedText>
              <TouchableOpacity
                onPress={() => setShowBuyPlanModal(false)}
                style={styles.modalCloseBtn}
              >
                <MaterialIcons name="close" size={24} color={themeColors.icon} />
              </TouchableOpacity>
            </View>

            {selectedPlan && (
              <View style={styles.modalPlanInfo}>
                <ThemedText type="subtitle" style={styles.modalPlanName}>
                  {selectedPlan.name}
                </ThemedText>
                {!hidePrice && (
                  <ThemedText style={styles.modalPlanPrice}>
                    السعر: {selectedPlan.price} ر.س
                  </ThemedText>
                )}
              </View>
            )}

            <View style={styles.modalBody}>
              {!hidePrice && (
                <ThemedText style={styles.uploadLabel}>
                  صورة إثبات التحويل *
                </ThemedText>
              )}
              <TouchableOpacity
                style={[
                  styles.imagePickerButton,
                  {
                    backgroundColor: themeColors.input,
                    borderColor: themeColors.icon + '30',
                  },
                ]}
                onPress={handlePickImage}
              >
                {transferScreenshot ? (
                  <Image
                    source={{ uri: transferScreenshot }}
                    style={styles.previewImage}
                  />
                ) : (
                  <View style={styles.imagePickerContent}>
                    <MaterialIcons
                      name="add-photo-alternate"
                      size={32}
                      color={themeColors.icon}
                    />
                    <ThemedText style={styles.imagePickerText}>
                      اضغط لاختيار الصورة
                    </ThemedText>
                  </View>
                )}
              </TouchableOpacity>
              {transferScreenshot && (
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => setTransferScreenshot(null)}
                >
                  <MaterialIcons name="delete" size={20} color={SemanticColors.error} />
                  <ThemedText style={styles.removeImageText}>إزالة الصورة</ThemedText>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[
                  styles.submitPlanButton,
                  { backgroundColor: themeColors.cta, opacity: isSubmitting ? 0.6 : 1 },
                ]}
                onPress={handleSubmitPlanPurchase}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={SemanticColors.onTint} />
                ) : (
                  <>
                    <MaterialIcons name="check" size={20} color={SemanticColors.onTint} />
                    <ThemedText style={styles.submitPlanButtonText}>
                      إرسال طلب الاشتراك
                    </ThemedText>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ThemedView>
        </ThemedView>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    height: HEADER_HEIGHT,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 38 : 16,
  },
  screenTitle: {
    textAlign: 'center',
    // marginBottom: 4,
    marginTop: 24,
  },
  screenSubtitle: {
    textAlign: 'center',
    fontSize: 14,
    opacity: 0.8,
    lineHeight: 20,
  },
  carouselWrapper: {
    height: CAROUSEL_HEIGHT,
    width: SCREEN_WIDTH,
    position: 'relative',
  },
  navBtn: {
    position: 'absolute',
    top: '50%',
    marginTop: -28,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    ...Platform.select({
      ios: {
        shadowColor: SemanticColors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  navBtnLeft: {
    left: 8,
  },
  navBtnRight: {
    right: 8,
  },
  carouselList: {
    flexGrow: 0,
  },
  carouselContent: {
    paddingVertical: 20,
  },
  cardWrapper: {
    height: CARD_HEIGHT + 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: SemanticColors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  cardInner: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  cardHeader: {
    marginBottom: 8,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  currentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  currentBadgeText: {
    color: SemanticColors.onTint,
    fontSize: 12,
    fontWeight: '600',
  },
  cardDescription: {
    fontSize: 14,
    opacity: 0.85,
    lineHeight: 20,
    textAlign: 'center',
    minHeight: 40,
  },
  priceSection: {
    alignItems: 'center',
    marginVertical: 16,
  },
  priceBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 16,
    gap: 4,
  },
  price: {
    fontSize: 20,
  },
  priceLabel: {
    fontSize: 15,
    opacity: 0.9,
  },
  featuresSection: {
    flex: 1,
    justifyContent: 'center',
    minHeight: 100,
    maxHeight: 140,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureIcon: {
    marginLeft: 8,
  },
  featureText: {
    fontSize: 14,
    flex: 1,
  },
  noFeatures: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
  },
  subscribeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 14,
    gap: 8,
  },
  subscribeBtnText: {
    color: SemanticColors.onTint,
    fontSize: 17,
    fontWeight: '600',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loaderText: {
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: SemanticColors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: SemanticColors.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12 },
      android: { elevation: 8 },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: SemanticColors.borderModal,
  },
  modalTitle: {
    fontSize: 20,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalPlanInfo: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  modalPlanName: {
    fontSize: 16,
    marginBottom: 4,
  },
  modalPlanPrice: {
    fontSize: 14,
    opacity: 0.9,
  },
  modalBody: {
    padding: 20,
  },
  uploadLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  imagePickerButton: {
    height: 140,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePickerContent: {
    alignItems: 'center',
    gap: 8,
  },
  imagePickerText: {
    fontSize: 14,
    opacity: 0.8,
  },
  removeImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  removeImageText: {
    color: SemanticColors.error,
    fontSize: 14,
  },
  submitPlanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 14,
    marginTop: 24,
  },
  submitPlanButtonText: {
    color: SemanticColors.onTint,
    fontSize: 17,
    fontWeight: '600',
  },
});
