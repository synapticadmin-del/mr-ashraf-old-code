import { NewsSlider } from '@/components/news-slider';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BASE_URL } from '@/constants/config';
import { Colors, SemanticColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useGetPaymentWalletsQuery, useGetStudentQuery } from '@/store/api/apiSlice';
import type { PaymentWallet } from '@/store/api/apiSlice';
import { getStudentIdFromToken } from '@/utils/tokenUtils';
import { MaterialIcons } from '@expo/vector-icons';
import { useMemo, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];
  const [studentId, setStudentId] = useState<string | null>(null);
  const [isLoadingId, setIsLoadingId] = useState(true);
  const [showPartnerModal, setShowPartnerModal] = useState(false);

  useEffect(() => {
    loadStudentId();
  }, []);

  const loadStudentId = async () => {
    try {
      const id = await getStudentIdFromToken();
      setStudentId(id);
    } catch (error) {
      console.error('Error loading student ID:', error);
    } finally {
      setIsLoadingId(false);
    }
  };

  const {
    data: studentResponse,
    isLoading: isLoadingStudent,
    error,
    refetch,
    isFetching,
  } = useGetStudentQuery(studentId!, {
    skip: !studentId,
  });

  const student = studentResponse?.data;
  const hidePaymentSection = student?.studentCode === 'ST4327';
  const { data: walletsResponse } = useGetPaymentWalletsQuery(
    undefined,
    { skip: !studentId }
  );
  const activeWallets = useMemo(
    () => (walletsResponse?.data ?? []).filter((w) => w.isActive),
    [walletsResponse?.data]
  );
  const isLoading = isLoadingId || isLoadingStudent;

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const getImageUrl = (imagePath: string) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    const baseUrl = BASE_URL.replace('/api', '');
    return `${baseUrl}${imagePath}`;
  };

  const partnerShareMessage =
    'تقدر تبقي شريك وتكسب فلوس او نقاط تاخد بيها امتحانات لو شاركت الكود بتاعك و جه من خلال طلاب. كودي: ' +
    (student?.studentCode ?? '—');

  const handleShareWhatsApp = () => {
    try {
      const url = 'https://wa.me/?text=' + encodeURIComponent(partnerShareMessage);
      Linking.openURL(url);
    } catch {
      // ignore
    }
  };

  const handleShareFacebook = () => {
    try {
      const appUrl = 'https://example.com';
      const url =
        'https://www.facebook.com/sharer/sharer.php?u=' +
        encodeURIComponent(appUrl) +
        '&quote=' +
        encodeURIComponent(partnerShareMessage);
      Linking.openURL(url);
    } catch {
      // ignore
    }
  };

  if (isLoading || !studentId) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={themeColors.tint} />
          <ThemedText style={styles.loaderText}>جاري التحميل...</ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  if (error || !student) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={48} color={themeColors.icon} />
          <ThemedText style={styles.errorText}>
            {error ? 'حدث خطأ أثناء تحميل البيانات' : 'لا توجد بيانات متاحة'}
          </ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  const imageUrl = getImageUrl(student.image);
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
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={refreshControl}
      >
        {/* News Slider */}
        <NewsSlider />

        {/* Header Section with Profile Image and Level Badge */}
        <ThemedView style={styles.headerSection}>
          <ThemedView style={styles.profileImageContainer}>
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={[styles.profileImage, { borderColor: themeColors.card }]} />
            ) : (
              <ThemedView
                style={[
                  styles.profileImagePlaceholder,
                  { backgroundColor: themeColors.tint + '20', borderColor: themeColors.card },
                ]}
              >
                <MaterialIcons
                  name="person"
                  size={56}
                  color={themeColors.tint}
                />
              </ThemedView>
            )}
            <ThemedView
              style={[
                styles.levelBadge,
                { backgroundColor: themeColors.tint },
              ]}
            >
              <MaterialIcons name="star" size={18} color={SemanticColors.onTint} />
              <ThemedText style={styles.levelText}>المستوى {student.level}</ThemedText>
            </ThemedView>
          </ThemedView>

          <ThemedView style={styles.nameSection}>
            <ThemedText type="title" style={styles.name}>
              {student.username}
            </ThemedText>
            <ThemedText style={styles.studentCode}>
              {student.studentCode}
            </ThemedText>
          </ThemedView>
        </ThemedView>

        {/* Stats Card */}
        <ThemedView
          style={[
            styles.statsCard,
            {
              backgroundColor: themeColors.card,
              borderColor: themeColors.icon + '20',
            },
          ]}
        >
          <ThemedView style={styles.statItem}>
            <ThemedView
              style={[
                styles.statIconContainer,
                { backgroundColor: themeColors.tint + '15' },
              ]}
            >
              <MaterialIcons name="star" size={28} color={themeColors.tint} />
            </ThemedView>
            <ThemedText style={[styles.statValue, { color: themeColors.tint }]}>
              {student.totalPoints}
            </ThemedText>
            <ThemedText style={styles.statLabel}>إجمالي النقاط</ThemedText>
          </ThemedView>
        </ThemedView>

        <TouchableOpacity
          style={[styles.partnerCtaButton, { backgroundColor: themeColors.cta }]}
          onPress={() => setShowPartnerModal(true)}
          activeOpacity={0.85}
        >
          <MaterialIcons name="people" size={22} color={SemanticColors.onTint} />
          <ThemedText style={styles.partnerCtaText}>خليك شريك معانا</ThemedText>
        </TouchableOpacity>

        {/* Information Cards */}
        <ThemedView style={styles.infoSection}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            المعلومات الشخصية
          </ThemedText>

          <ThemedView
            style={[
              styles.infoCard,
              {
                backgroundColor: themeColors.card,
                borderColor: themeColors.icon + '20',
              },
            ]}
          >
            <InfoRow
              icon="badge"
              label="اسم المستخدم"
              value={student.username}
              themeColors={themeColors}
              isLast={false}
            />
            <InfoRow
              icon="phone"
              label="رقم الهاتف"
              value={student.phoneNumber}
              themeColors={themeColors}
              isLast={false}
            />
            <InfoRow
              icon="calendar-today"
              label="تاريخ الميلاد"
              value={formatDate(student.birthday)}
              themeColors={themeColors}
              isLast={true}
            />
          </ThemedView>

          <ThemedText type="subtitle" style={[styles.sectionTitle, styles.sectionTitleSpacing]}>
            معلومات الطالب
          </ThemedText>

          <ThemedView
            style={[
              styles.infoCard,
              {
                backgroundColor: themeColors.card,
                borderColor: themeColors.icon + '20',
              },
            ]}
          >
            <InfoRow
              icon="school"
              label="كود الطالب"
              value={student.studentCode}
              themeColors={themeColors}
              isLast={false}
            />
            <InfoRow
              icon="star"
              label="المستوى"
              value={`المستوى ${student.level}`}
              themeColors={themeColors}
              isLast={false}
            />
            <InfoRow
              icon="trending-up"
              label="إجمالي النقاط"
              value={student.totalPoints.toString()}
              themeColors={themeColors}
              isLast={!hidePaymentSection ? false : true}
            />
            {!hidePaymentSection && (
              <InfoRow
                icon="account-balance"
                label="رقم التحويل"
                value="٠١٠٢١٨٩٧٢٩٢"
                themeColors={themeColors}
                isLast={true}
              />
            )}
          </ThemedView>

          {!hidePaymentSection && activeWallets.length > 0 && (
            <>
              <ThemedText type="subtitle" style={[styles.sectionTitle, styles.sectionTitleSpacing]}>
                محافظ الدفع
              </ThemedText>
              <View style={styles.walletsGrid}>
                {activeWallets.map((wallet) => (
                  <WalletCard
                    key={wallet.id}
                    wallet={wallet}
                    themeColors={themeColors}
                  />
                ))}
              </View>
            </>
          )}
        </ThemedView>
      </ScrollView>

      <Modal
        visible={showPartnerModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPartnerModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowPartnerModal(false)}>
          <View style={styles.partnerModalOverlay}>
            <TouchableOpacity
              style={[styles.partnerModalCard, { backgroundColor: themeColors.card }]}
              activeOpacity={1}
              onPress={() => {}}
            >
              <View style={styles.partnerModalHeader}>
                <ThemedText type="title" style={styles.partnerModalTitle}>
                  خليك شريك معانا
                </ThemedText>
                <TouchableOpacity
                  onPress={() => setShowPartnerModal(false)}
                  style={styles.partnerModalCloseBtn}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <MaterialIcons name="close" size={24} color={themeColors.icon} />
                </TouchableOpacity>
              </View>
              <ScrollView
                style={styles.partnerModalScroll}
                showsVerticalScrollIndicator={false}
                bounces={false}
              >
                <ThemedText style={[styles.partnerCodeLabel, { color: themeColors.icon }]}>
                  كود الشريك
                </ThemedText>
                <View style={[styles.partnerCodeBox, { backgroundColor: themeColors.tint + '15', borderColor: themeColors.tint + '50' }]}>
                  <ThemedText style={[styles.partnerCodeValue, { color: themeColors.tint }]}>
                    {student?.studentCode ?? '—'}
                  </ThemedText>
                </View>
                <ThemedText style={[styles.partnerDescription, { color: themeColors.text }]}>
                  تقدر تبقي شريك وتكسب فلوس او نقاط تاخد بيها امتحانات لو شاركت الكود بتاعك و جه من خلال طلاب
                </ThemedText>
                <View style={styles.partnerShareRow}>
                  <TouchableOpacity
                    style={[styles.partnerShareBtn, { backgroundColor: '#25D366' }]}
                    onPress={handleShareWhatsApp}
                    activeOpacity={0.85}
                  >
                    <MaterialIcons name="chat" size={24} color={SemanticColors.onTint} />
                    <ThemedText style={styles.partnerShareBtnText}>واتساب</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.partnerShareBtn, { backgroundColor: SemanticColors.socialFacebook }]}
                    onPress={handleShareFacebook}
                    activeOpacity={0.85}
                  >
                    <MaterialIcons name="facebook" size={24} color={SemanticColors.onTint} />
                    <ThemedText style={styles.partnerShareBtnText}>فيسبوك</ThemedText>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </ThemedView>
  );
}

function getWalletIcon(name: string): keyof typeof MaterialIcons.glyphMap {
  const n = name.toLowerCase();
  if (n.includes('vodafone')) return 'phone-android';
  if (n.includes('orange')) return 'sim-card';
  if (n.includes('instapay')) return 'flash-on';
  if (n.includes('we cash') || n.includes('wecash')) return 'account-balance-wallet';
  return 'account-balance-wallet';
}

function WalletCard({
  wallet,
  themeColors,
}: {
  wallet: PaymentWallet;
  themeColors: (typeof Colors.light);
}) {
  const iconName = getWalletIcon(wallet.name);
  return (
    <ThemedView
      style={[
        styles.walletCard,
        {
          backgroundColor: themeColors.card,
          borderColor: themeColors.tint + '40',
        },
      ]}
    >
      <View style={[styles.walletIconWrap, { backgroundColor: themeColors.tint + '18' }]}>
        <MaterialIcons name={iconName} size={28} color={themeColors.tint} />
      </View>
      <ThemedText type="subtitle" style={[styles.walletName, { color: themeColors.text }]} numberOfLines={1}>
        {wallet.name}
      </ThemedText>
      <View style={styles.walletPhoneRow}>
        <MaterialIcons name="phone" size={16} color={themeColors.icon} />
        <ThemedText style={[styles.walletPhone, { color: themeColors.icon }]} numberOfLines={1}>
          {wallet.phone}
        </ThemedText>
      </View>
      <View style={[styles.walletActiveBadge, { backgroundColor: SemanticColors.success + '22' }]}>
        <MaterialIcons name="check-circle" size={14} color={SemanticColors.success} />
        <ThemedText style={styles.walletActiveText}>نشط</ThemedText>
      </View>
    </ThemedView>
  );
}

interface InfoRowProps {
  icon: string;
  label: string;
  value: string;
  themeColors: any;
  isLast: boolean;
}

function InfoRow({ icon, label, value, themeColors, isLast }: InfoRowProps) {
  return (
    <ThemedView style={[styles.infoRow, isLast && styles.infoRowLast, !isLast && { borderBottomColor: themeColors.borderSubtle }]}>
      <ThemedView style={styles.infoRowLeft}>
        <ThemedView
          style={[
            styles.infoIconContainer,
            { backgroundColor: themeColors.tint + '15' },
          ]}
        >
          <MaterialIcons name={icon as any} size={18} color={themeColors.tint} />
        </ThemedView>
        <ThemedText style={styles.infoLabel}>{label}</ThemedText>
      </ThemedView>
      <ThemedText style={styles.infoValue}>{value}</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
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
  headerSection: {
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 20,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  profileImage: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 5,
    shadowColor: SemanticColors.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  profileImagePlaceholder: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 5,
    shadowColor: SemanticColors.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  levelBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 24,
    gap: 6,
    shadowColor: SemanticColors.shadow,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  levelText: {
    color: SemanticColors.onTint,
    fontSize: 13,
    fontWeight: 'bold',
  },
  nameSection: {
    alignItems: 'center',
    marginTop: 8,
  },
  name: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  studentCode: {
    fontSize: 17,
    opacity: 0.65,
    fontWeight: '500',
  },
  statsCard: {
    borderRadius: 20,
    padding: 28,
    borderWidth: 1,
    marginBottom: 28,
    alignItems: 'center',
    shadowColor: SemanticColors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  statItem: {
    alignItems: 'center',
  },
  statIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 36,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    marginTop: 12,
    letterSpacing: 0.5,
  },
  statLabel: {
    fontSize: 15,
    opacity: 0.7,
    fontWeight: '500',
  },
  partnerCtaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
    marginBottom: 24,
    gap: 10,
    shadowColor: SemanticColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  partnerCtaText: {
    color: SemanticColors.onTint,
    fontSize: 17,
    fontWeight: '700',
  },
  partnerModalOverlay: {
    flex: 1,
    backgroundColor: SemanticColors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  partnerModalCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    maxHeight: '85%',
    shadowColor: SemanticColors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  partnerModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  partnerModalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    flex: 1,
  },
  partnerModalCloseBtn: {
    padding: 4,
  },
  partnerModalScroll: {
    maxHeight: 400,
  },
  partnerCodeLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  partnerCodeBox: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 20,
    alignItems: 'center',
  },
  partnerCodeValue: {
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  partnerDescription: {
    fontSize: 15,
    lineHeight: 24,
    opacity: 0.9,
    marginBottom: 24,
  },
  partnerShareRow: {
    flexDirection: 'row',
    gap: 12,
  },
  partnerShareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  partnerShareBtnText: {
    color: SemanticColors.onTint,
    fontSize: 15,
    fontWeight: '600',
  },
  infoSection: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    marginTop: 4,
    paddingHorizontal: 4,
  },
  sectionTitleSpacing: {
    marginTop: 28,
  },
  infoCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    marginBottom: 20,
    shadowColor: SemanticColors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
  },
  infoRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 4,
  },
  infoRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  infoIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 15,
    opacity: 0.7,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
    paddingLeft: 12,
  },
  walletsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  walletCard: {
    width: '47%',
    minWidth: 140,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    shadowColor: SemanticColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  walletIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  walletName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  walletPhoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  walletPhone: {
    fontSize: 14,
    flex: 1,
  },
  walletActiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  walletActiveText: {
    fontSize: 12,
    fontWeight: '600',
    color: SemanticColors.success,
  },
});
