import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BASE_URL } from '@/constants/config';
import { Colors, SemanticColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useGetStudentQuery } from '@/store/api/apiSlice';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Image, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

export default function ParentHomeScreen() {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const params = useLocalSearchParams<{ studentId: string }>();
  const studentId = params.studentId;

  const {
    data: studentResponse,
    isLoading,
    error,
  } = useGetStudentQuery(studentId, {
    skip: !studentId,
  });

  const student = studentResponse?.data;

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

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={themeColors.tint} />
          <ThemedText style={styles.loaderText}>
            جاري تحميل بيانات الطالب...
          </ThemedText>
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
            حدث خطأ أثناء تحميل بيانات الطالب
          </ThemedText>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: themeColors.tint }]}
            onPress={() => router.back()}
          >
            <ThemedText style={styles.backButtonText}>العودة</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>
    );
  }

  const studentImage = getImageUrl(student.image);

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <ThemedView style={styles.header}>
          <TouchableOpacity
            style={styles.headerBackButton}
            onPress={() => router.back()}
          >
            <MaterialIcons name="arrow-back" size={24} color={themeColors.text} />
          </TouchableOpacity>
          <ThemedView
            style={[
              styles.headerIconContainer,
              { backgroundColor: themeColors.tint + '20' },
            ]}
          >
            <MaterialIcons name="family-restroom" size={32} color={themeColors.tint} />
          </ThemedView>
          <ThemedText type="title" style={styles.headerTitle}>
            بيانات الطالب
          </ThemedText>
        </ThemedView>

        {/* Profile Card */}
        <ThemedView
          style={[
            styles.profileCard,
            {
              backgroundColor:
                themeColors.card,
              borderColor: themeColors.icon + '20',
            },
          ]}
        >
          <ThemedView style={styles.profileImageContainer}>
            {studentImage ? (
              <Image source={{ uri: studentImage }} style={[styles.profileImage, { borderColor: themeColors.card }]} />
            ) : (
              <ThemedView
                style={[
                  styles.profileImagePlaceholder,
                  { backgroundColor: themeColors.tint + '20', borderColor: themeColors.card },
                ]}
              >
                <MaterialIcons name="person" size={48} color={themeColors.tint} />
              </ThemedView>
            )}
          </ThemedView>

          <ThemedView style={styles.levelBadgeContainer}>
            <ThemedView
              style={[
                styles.levelBadge,
                { backgroundColor: themeColors.tint + '20' },
              ]}
            >
              <MaterialIcons name="star" size={20} color={themeColors.tint} />
              <ThemedText
                style={[styles.levelText, { color: themeColors.tint }]}
              >
                المستوى {student.level}
              </ThemedText>
            </ThemedView>
          </ThemedView>

          <ThemedText type="title" style={styles.studentName}>
            {student.username}
          </ThemedText>
        </ThemedView>

        {/* Stats Card */}
        <ThemedView
          style={[
            styles.statsCard,
            {
              backgroundColor:
                themeColors.card,
              borderColor: themeColors.icon + '20',
            },
          ]}
        >
          <ThemedView style={styles.statItem}>
            <ThemedView
              style={[
                styles.statIconContainer,
                { backgroundColor: themeColors.tint + '20' },
              ]}
            >
              <MaterialIcons name="trending-up" size={24} color={themeColors.tint} />
            </ThemedView>
            <ThemedView style={styles.statInfo}>
              <ThemedText style={styles.statValue}>{student.totalPoints}</ThemedText>
              <ThemedText style={styles.statLabel}>إجمالي النقاط</ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>

        {/* Info Cards */}
        <ThemedView style={styles.infoSection}>
          <ThemedView
            style={[
              styles.infoCard,
              {
                backgroundColor:
                  themeColors.card,
                borderColor: themeColors.icon + '20',
              },
            ]}
          >
            <ThemedView style={styles.infoRow}>
              <ThemedView style={styles.infoLeft}>
                <MaterialIcons
                  name="badge"
                  size={20}
                  color={themeColors.tint}
                />
                <ThemedText style={styles.infoLabel}>كود الطالب</ThemedText>
              </ThemedView>
              <ThemedText style={styles.infoValue}>{student.studentCode}</ThemedText>
            </ThemedView>
          </ThemedView>

          <ThemedView
            style={[
              styles.infoCard,
              {
                backgroundColor:
                  themeColors.card,
                borderColor: themeColors.icon + '20',
              },
            ]}
          >
            <ThemedView style={styles.infoRow}>
              <ThemedView style={styles.infoLeft}>
                <MaterialIcons
                  name="phone"
                  size={20}
                  color={themeColors.tint}
                />
                <ThemedText style={styles.infoLabel}>رقم الهاتف</ThemedText>
              </ThemedView>
              <ThemedText style={styles.infoValue}>{student.phoneNumber}</ThemedText>
            </ThemedView>
          </ThemedView>

          <ThemedView
            style={[
              styles.infoCard,
              {
                backgroundColor:
                  themeColors.card,
                borderColor: themeColors.icon + '20',
              },
            ]}
          >
            <ThemedView style={styles.infoRow}>
              <ThemedView style={styles.infoLeft}>
                <MaterialIcons
                  name="cake"
                  size={20}
                  color={themeColors.tint}
                />
                <ThemedText style={styles.infoLabel}>تاريخ الميلاد</ThemedText>
              </ThemedView>
              <ThemedText style={styles.infoValue}>
                {formatDate(student.birthday)}
              </ThemedText>
            </ThemedView>
          </ThemedView>
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
    padding: 20,
    paddingTop: 60,
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
    marginBottom: 24,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    color: SemanticColors.onTint,
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    position: 'relative',
  },
  headerBackButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: 8,
  },
  headerIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  profileCard: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: SemanticColors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  profileImageContainer: {
    marginBottom: 16,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
  },
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
  },
  levelBadgeContainer: {
    marginBottom: 16,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  levelText: {
    fontSize: 16,
    fontWeight: '600',
  },
  studentName: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  statsCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    marginBottom: 20,
    shadowColor: SemanticColors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  statIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    opacity: 0.7,
  },
  infoSection: {
    gap: 12,
  },
  infoCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    shadowColor: SemanticColors.shadow,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 15,
    opacity: 0.7,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'right',
  },
});
