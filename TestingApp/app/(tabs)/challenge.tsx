import { NewsSlider } from '@/components/news-slider';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BASE_URL } from '@/constants/config';
import { Colors, SemanticColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { toast } from '@/hooks/use-toast';
import {
  useAcceptChallengeRequestMutation,
  useGetIncomingChallengeRequestsQuery,
  useGetOutgoingChallengeRequestsQuery,
  useGetStudentsQuery,
  useRejectChallengeRequestMutation,
  useSendChallengeRequestMutation,
} from '@/store/api/apiSlice';
import { getStudentIdFromToken } from '@/utils/tokenUtils';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, RefreshControl, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

export default function ChallengeScreen() {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { data: studentsResponse, isLoading, error, refetch, isFetching } = useGetStudentsQuery();
  const { data: incomingResponse } = useGetIncomingChallengeRequestsQuery();
  const { data: outgoingResponse } = useGetOutgoingChallengeRequestsQuery();
  const [sendChallengeRequest, { isLoading: isSending }] = useSendChallengeRequestMutation();
  const [acceptChallengeRequest, { isLoading: isAccepting }] = useAcceptChallengeRequestMutation();
  const [rejectChallengeRequest, { isLoading: isRejecting }] = useRejectChallengeRequestMutation();
  const [currentStudentId, setCurrentStudentId] = useState<string | null>(null);
  const [pendingSendToId, setPendingSendToId] = useState<string | null>(null);
  const [pendingAcceptId, setPendingAcceptId] = useState<string | null>(null);
  const [pendingRejectId, setPendingRejectId] = useState<string | null>(null);
  const [timeTick, setTimeTick] = useState(0);

  useEffect(() => {
    loadCurrentStudentId();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setTimeTick((t) => t + 1), 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadCurrentStudentId = async () => {
    const id = await getStudentIdFromToken();
    setCurrentStudentId(id);
  };

  const FIVE_MINUTES_MS = 5 * 60 * 1000;

  const isWithinFiveMinutes = useMemo(() => {
    return (createdAt: string) => {
      const created = new Date(createdAt).getTime();
      return Date.now() - created <= FIVE_MINUTES_MS;
    };
  }, []);

  const incomingRequests = useMemo(() => {
    if (!incomingResponse?.data) return [];
    return incomingResponse.data.filter(
      (r) => r.status === 'pending' && isWithinFiveMinutes(r.createdAt)
    );
  }, [incomingResponse?.data, isWithinFiveMinutes]);

  const outgoingRequests = useMemo(() => {
    if (!outgoingResponse?.data) return [];
    return outgoingResponse.data.filter(
      (r) => r.status !== 'pending' || isWithinFiveMinutes(r.createdAt)
    );
  }, [outgoingResponse?.data, isWithinFiveMinutes]);

  const handleSendChallenge = async (toStudentId: string) => {
    setPendingSendToId(toStudentId);
    try {
      await sendChallengeRequest({ toStudentId }).unwrap();
      toast({ title: 'تم إرسال طلب التحدي' });
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'data' in err
          ? (err.data as { message?: string })?.message
          : 'فشل إرسال طلب التحدي';
      toast({ title: 'خطأ', description: message });
    } finally {
      setPendingSendToId(null);
    }
  };

  const handleAccept = async (requestId: string) => {
    setPendingAcceptId(requestId);
    try {
      const result = await acceptChallengeRequest(requestId).unwrap();
      if (result.data?.challengeId) {
        router.push({
          pathname: '/challenge-game',
          params: { challengeId: result.data.challengeId },
        });
      }
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'data' in err
          ? (err.data as { message?: string })?.message
          : 'فشل قبول الطلب';
      toast({ title: 'خطأ', description: message });
    } finally {
      setPendingAcceptId(null);
    }
  };

  const handleReject = async (requestId: string) => {
    setPendingRejectId(requestId);
    try {
      await rejectChallengeRequest(requestId).unwrap();
      toast({ title: 'تم رفض الطلب' });
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'data' in err
          ? (err.data as { message?: string })?.message
          : 'فشل رفض الطلب';
      toast({ title: 'خطأ', description: message });
    } finally {
      setPendingRejectId(null);
    }
  };

  const handleEnterChallenge = (challengeId: string) => {
    router.push({ pathname: '/challenge-game', params: { challengeId } });
  };

  // Sort students by level (ascending - level 1 is first, level 10 is last)
  const sortedStudents = useMemo(() => {
    if (!studentsResponse?.data) return [];
    return [...studentsResponse.data].sort((a, b) => a.level - b.level);
  }, [studentsResponse?.data]);

  const getImageUrl = (imagePath: string) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    const baseUrl = BASE_URL.replace('/api', '');
    return `${baseUrl}${imagePath}`;
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return 'emoji-events'; // Gold
    if (index === 1) return 'workspace-premium'; // Silver
    if (index === 2) return 'military-tech'; // Bronze
    return 'star';
  };

  const getRankColor = (index: number) => {
    if (index === 0) return SemanticColors.rankGold;
    if (index === 1) return SemanticColors.rankSilver;
    if (index === 2) return SemanticColors.rankBronze;
    return themeColors.tint;
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={themeColors.tint} />
          <ThemedText style={styles.loaderText}>جاري تحميل الطلاب...</ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={48} color={themeColors.icon} />
          <ThemedText style={styles.errorText}>
            حدث خطأ أثناء تحميل البيانات
          </ThemedText>
        </ThemedView>
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
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={refreshControl}
      >
        {/* News Slider */}
        <NewsSlider />

        {/* Incoming challenge requests */}
        {incomingRequests.length > 0 && (
          <ThemedView style={[styles.requestsSection, { backgroundColor: themeColors.card, borderColor: themeColors.icon + '20' }]}>
            <ThemedText type="subtitle" style={styles.requestsSectionTitle}>
              طلبات التحدي الواردة
            </ThemedText>
            {incomingRequests.map((req) => {
              const isAcceptingThis = pendingAcceptId === req.id;
              const isRejectingThis = pendingRejectId === req.id;
              const busy = isAcceptingThis || isRejectingThis;
              return (
                <ThemedView
                  key={req.id}
                  style={[styles.requestCard, { borderColor: themeColors.border }]}
                >
                  <ThemedText style={styles.requestFromName}>{req.fromStudentName ?? 'طالب'}</ThemedText>
                  <ThemedView style={styles.requestActions}>
                    <TouchableOpacity
                      style={[styles.requestButton, styles.acceptButton, { backgroundColor: SemanticColors.success }]}
                      onPress={() => handleAccept(req.id)}
                      disabled={busy}
                    >
                      {isAcceptingThis ? (
                        <ActivityIndicator size="small" color={SemanticColors.onTint} />
                      ) : (
                        <ThemedText style={styles.requestButtonText}>قبول</ThemedText>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.requestButton, styles.rejectButton, { backgroundColor: SemanticColors.error }]}
                      onPress={() => handleReject(req.id)}
                      disabled={busy}
                    >
                      {isRejectingThis ? (
                        <ActivityIndicator size="small" color={SemanticColors.onTint} />
                      ) : (
                        <ThemedText style={styles.requestButtonText}>رفض</ThemedText>
                      )}
                    </TouchableOpacity>
                  </ThemedView>
                </ThemedView>
              );
            })}
          </ThemedView>
        )}

        {/* Outgoing challenge requests */}
        {outgoingRequests.length > 0 && (
          <ThemedView style={[styles.requestsSection, { backgroundColor: themeColors.card, borderColor: themeColors.icon + '20' }]}>
            <ThemedText type="subtitle" style={styles.requestsSectionTitle}>
              طلباتك المرسلة
            </ThemedText>
            {outgoingRequests.map((req) => (
              <ThemedView
                key={req.id}
                style={[styles.requestCard, { borderColor: themeColors.border }]}
              >
                <ThemedText style={styles.requestFromName}>{req.toStudentName ?? 'طالب'}</ThemedText>
                <ThemedText style={[styles.requestStatus, { color: themeColors.icon }]}>
                  {req.status === 'accepted' ? 'مقبول' : 'قيد الانتظار'}
                </ThemedText>
                {req.status === 'accepted' && req.challengeId && (
                  <TouchableOpacity
                    style={[styles.enterChallengeButton, { backgroundColor: themeColors.cta }]}
                    onPress={() => handleEnterChallenge(req.challengeId!)}
                  >
                    <ThemedText style={styles.requestButtonText}>دخول التحدي</ThemedText>
                  </TouchableOpacity>
                )}
              </ThemedView>
            ))}
          </ThemedView>
        )}

        <ThemedView style={styles.header}>
          <ThemedView
            style={[
              styles.iconContainer,
              { backgroundColor: themeColors.tint + '20' },
            ]}
          >
            <MaterialIcons
              name="emoji-events"
              size={48}
              color={themeColors.tint}
            />
          </ThemedView>
          <ThemedText type="title" style={styles.title}>
            لوحة المتصدرين
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            ترتيب الطلاب حسب المستوى
          </ThemedText>
        </ThemedView>

        {sortedStudents.length === 0 ? (
          <ThemedView style={styles.emptyContainer}>
            <MaterialIcons
              name="people-outline"
              size={64}
              color={themeColors.icon}
            />
            <ThemedText style={styles.emptyText}>
              لا يوجد طلاب متاحين
            </ThemedText>
          </ThemedView>
        ) : (
          <ThemedView style={styles.leaderboard}>
            {sortedStudents.map((student, index) => {
              const imageUrl = getImageUrl(student.image);
              const rankIcon = getRankIcon(index);
              const rankColor = getRankColor(index);
              const isTopThree = index < 3;

              return (
                <ThemedView
                  key={student.id}
                  style={[
                    styles.studentCard,
                    {
                      backgroundColor:
                        themeColors.card,
                      borderColor: themeColors.icon + '20',
                      borderLeftWidth: isTopThree ? 4 : 1,
                      borderLeftColor: isTopThree ? rankColor : themeColors.icon + '20',
                    },
                  ]}
                >
                  <ThemedView style={styles.studentCardContent}>
                    <ThemedView style={styles.studentCardMain}>
                      {/* Rank */}
                      <ThemedView style={styles.rankContainer}>
                        {isTopThree ? (
                          <MaterialIcons
                            name={rankIcon as any}
                            size={28}
                            color={rankColor}
                          />
                        ) : (
                          <ThemedView
                            style={[
                              styles.rankNumber,
                              { backgroundColor: themeColors.tint + '20' },
                            ]}
                          >
                            <ThemedText
                              style={[styles.rankNumberText, { color: themeColors.tint }]}
                            >
                              {index + 1}
                            </ThemedText>
                          </ThemedView>
                        )}
                      </ThemedView>

                      {/* Profile Image */}
                      <ThemedView style={styles.imageContainer}>
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
                              size={24}
                              color={themeColors.tint}
                            />
                          </ThemedView>
                        )}
                      </ThemedView>

                      {/* Student Info */}
                      <ThemedView style={styles.studentInfo}>
                        <ThemedText type="subtitle" style={styles.studentName}>
                          {student.username}
                        </ThemedText>
                        <ThemedText style={styles.studentCode}>
                          {student.studentCode}
                        </ThemedText>
                      </ThemedView>

                      {/* Level and Points */}
                      <ThemedView style={styles.statsContainer}>
                        <ThemedView
                          style={[
                            styles.levelBadge,
                            {
                              backgroundColor: isTopThree
                                ? rankColor + '20'
                                : themeColors.tint + '20',
                            },
                          ]}
                        >
                          <MaterialIcons
                            name="star"
                            size={16}
                            color={isTopThree ? rankColor : themeColors.tint}
                          />
                          <ThemedText
                            style={[
                              styles.levelText,
                              {
                                color: isTopThree ? rankColor : themeColors.tint,
                              },
                            ]}
                          >
                            المستوى {student.level}
                          </ThemedText>
                        </ThemedView>
                        <ThemedView style={styles.pointsContainer}>
                          <MaterialIcons
                            name="trending-up"
                            size={16}
                            color={themeColors.icon}
                          />
                          <ThemedText style={styles.pointsText}>
                            {student.totalPoints} نقطة
                          </ThemedText>
                        </ThemedView>
                      </ThemedView>
                    </ThemedView>

                    {/* Challenge Button - Don't show for current user */}
                    {currentStudentId && student.id !== currentStudentId && (
                      <TouchableOpacity
                        style={[
                          styles.challengeButton,
                          { backgroundColor: themeColors.cta, opacity: pendingSendToId === student.id ? 0.7 : 1 },
                        ]}
                        onPress={() => handleSendChallenge(student.id)}
                        disabled={pendingSendToId === student.id}
                      >
                        {pendingSendToId === student.id ? (
                          <ActivityIndicator size="small" color={SemanticColors.onTint} />
                        ) : (
                          <MaterialIcons name="sports-esports" size={18} color={SemanticColors.onTint} />
                        )}
                        <ThemedText style={styles.challengeButtonText}>
                          تحدي
                        </ThemedText>
                      </TouchableOpacity>
                    )}
                  </ThemedView>
                </ThemedView>
              );
            })}
          </ThemedView>
        )}
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
    paddingTop: 24,
    paddingBottom: 32,
  },
  requestsSection: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  requestsSectionTitle: {
    marginBottom: 12,
    fontSize: 18,
  },
  requestCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  requestFromName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  requestStatus: {
    fontSize: 14,
    marginBottom: 8,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  requestButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    minWidth: 80,
    alignItems: 'center',
  },
  acceptButton: {},
  rejectButton: {},
  requestButtonText: {
    color: SemanticColors.onTint,
    fontSize: 14,
    fontWeight: '600',
  },
  enterChallengeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 8,
    alignSelf: 'flex-start',
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
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
  },
  leaderboard: {
    gap: 12,
  },
  studentCard: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    shadowColor: SemanticColors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  studentCardContent: {
    padding: 16,
  },
  studentCardMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankNumberText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  imageContainer: {
    marginRight: 4,
  },
  profileImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
  },
  profileImagePlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  studentInfo: {
    flex: 1,
    marginRight: 8,
  },
  studentName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  studentCode: {
    fontSize: 14,
    opacity: 0.6,
  },
  statsContainer: {
    alignItems: 'flex-end',
    gap: 8,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  levelText: {
    fontSize: 13,
    fontWeight: '600',
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pointsText: {
    fontSize: 13,
    opacity: 0.7,
    fontWeight: '500',
  },
  challengeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 12,
    gap: 6,
    shadowColor: SemanticColors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 3,
  },
  challengeButtonText: {
    color: SemanticColors.onTint,
    fontSize: 14,
    fontWeight: '600',
  },
});
