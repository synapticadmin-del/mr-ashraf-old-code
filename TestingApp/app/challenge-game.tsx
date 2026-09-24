import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, SemanticColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { toast } from '@/hooks/use-toast';
import {
  useGetChallengeQuery,
  useGetChallengeQuestionsQuery,
  useSubmitChallengeMutation,
} from '@/store/api/apiSlice';
import type { ChallengeQuestionItem } from '@/store/api/apiSlice';
import { getStudentIdFromToken } from '@/utils/tokenUtils';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Linking,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

const TOTAL_TIME_SECONDS = 5 * 60;

export default function ChallengeGameScreen() {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const params = useLocalSearchParams<{ challengeId: string }>();
  const challengeId = params.challengeId as string | undefined;

  const { data: challengeResponse, isLoading: isLoadingChallenge, error: challengeError } = useGetChallengeQuery(
    challengeId!,
    { skip: !challengeId }
  );
  const { data: questionsResponse, isLoading: isLoadingQuestions } = useGetChallengeQuestionsQuery(challengeId!, {
    skip: !challengeId,
  });
  const [submitChallenge, { isLoading: isSubmitting }] = useSubmitChallengeMutation();

  const [currentStudentId, setCurrentStudentId] = useState<string | null>(null);
  const challenge = challengeResponse?.data;
  const questions: ChallengeQuestionItem[] = useMemo(() => questionsResponse?.data ?? [], [questionsResponse?.data]);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(TOTAL_TIME_SECONDS);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    myResult: { score: number; totalPoints: number };
    opponentResult: { score: number; totalPoints: number } | null;
  } | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    getStudentIdFromToken().then(setCurrentStudentId);
  }, []);

  const myName = useMemo(() => {
    if (!challenge || !currentStudentId) return '';
    return challenge.challengerStudentId === currentStudentId
      ? challenge.challengerName
      : challenge.challengedName;
  }, [challenge, currentStudentId]);

  const opponentName = useMemo(() => {
    if (!challenge || !currentStudentId) return '';
    return challenge.challengerStudentId === currentStudentId
      ? challenge.challengedName
      : challenge.challengerName;
  }, [challenge, currentStudentId]);

  useEffect(() => {
    if (questions.length > 0 && answers.length !== questions.length) {
      setAnswers((prev) => {
        const next = [...prev];
        while (next.length < questions.length) next.push(-1);
        return next.slice(0, questions.length);
      });
    }
  }, [questions.length]);

  useEffect(() => {
    if (timeRemaining > 0 && !isSubmitted) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timeRemaining, isSubmitted]);

  const hasWon = useMemo(() => {
    if (!submitResult?.opponentResult) return false;
    return submitResult.myResult.score > submitResult.opponentResult.score;
  }, [submitResult]);

  const hasLost = useMemo(() => {
    if (!submitResult?.opponentResult) return false;
    return submitResult.myResult.score < submitResult.opponentResult.score;
  }, [submitResult]);

  const isDraw = useMemo(() => {
    if (!submitResult?.opponentResult) return false;
    return submitResult.myResult.score === submitResult.opponentResult.score;
  }, [submitResult]);

  useEffect(() => {
    if (hasWon) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }),
        Animated.timing(confettiAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [hasWon, scaleAnim, confettiAnim]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const handleAnswerSelect = useCallback(
    (optionIndex: number) => {
      if (isSubmitted) return;
      setAnswers((prev) => {
        const next = [...prev];
        next[currentQuestionIndex] = optionIndex;
        return next;
      });
    },
    [currentQuestionIndex, isSubmitted]
  );

  const allAnswered = useMemo(
    () => questions.length > 0 && answers.length === questions.length && answers.every((a) => a >= 0),
    [questions.length, answers]
  );

  const handleSubmit = useCallback(async () => {
    if (!challengeId || isSubmitted || !allAnswered) return;
    const normalized = answers.map((a) => (a < 0 ? 0 : a));
    try {
      const result = await submitChallenge({ challengeId, body: { answers: normalized } }).unwrap();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      setIsSubmitted(true);
      setSubmitResult({
        myResult: result.data.myResult,
        opponentResult: result.data.opponentResult,
      });
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'data' in err
          ? (err.data as { message?: string })?.message
          : 'فشل إرسال الإجابات';
      toast({ title: 'خطأ', description: message });
    }
  }, [challengeId, isSubmitted, allAnswered, answers, submitChallenge]);

  const handleShare = useCallback(
    async (platform: 'facebook' | 'twitter') => {
      const message = `🎉 فزت في التحدي ضد ${opponentName}! 🏆`;
      const url =
        platform === 'facebook'
          ? `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://example.com')}&quote=${encodeURIComponent(message)}`
          : `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent('https://example.com')}`;
      try {
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) await Linking.openURL(url);
      } catch {
        // ignore
      }
    },
    [opponentName]
  );

  if (!challengeId) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.errorContainer}>
          <ThemedText>خطأ: لم يتم العثور على التحدي</ThemedText>
          <TouchableOpacity style={[styles.backButtonStyle, { backgroundColor: themeColors.tint }]} onPress={() => router.back()}>
            <ThemedText style={styles.backButtonText}>العودة</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>
    );
  }

  if (isLoadingChallenge || isLoadingQuestions || challengeError) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={themeColors.tint} />
          <ThemedText style={styles.loaderText}>جاري تحميل التحدي...</ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  if (!challenge || questions.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.errorContainer}>
          <ThemedText>لا توجد أسئلة لهذا التحدي</ThemedText>
          <TouchableOpacity style={[styles.backButtonStyle, { backgroundColor: themeColors.tint }]} onPress={() => router.back()}>
            <ThemedText style={styles.backButtonText}>العودة</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const selectedAnswer = currentQuestionIndex < answers.length ? answers[currentQuestionIndex] : -1;

  return (
    <ThemedView style={styles.container}>
      <ThemedView
        style={[
          styles.header,
          { backgroundColor: themeColors.input, borderBottomColor: themeColors.border },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={themeColors.text} />
        </TouchableOpacity>
        <ThemedView style={styles.timerContainer}>
          <MaterialIcons
            name="timer"
            size={20}
            color={timeRemaining < 60 ? SemanticColors.warning : themeColors.tint}
          />
          <ThemedText
            style={[
              styles.timerText,
              { color: timeRemaining < 60 ? SemanticColors.warning : themeColors.text },
            ]}
          >
            {formatTime(timeRemaining)}
          </ThemedText>
        </ThemedView>
      </ThemedView>

      <ThemedView style={[styles.playersSection, { backgroundColor: themeColors.borderSubtle }]}>
        <ThemedView style={styles.playerCard}>
          <ThemedView
            style={[
              styles.playerImagePlaceholder,
              { backgroundColor: themeColors.tint + '20', borderColor: themeColors.card },
            ]}
          >
            <MaterialIcons name="person" size={24} color={themeColors.tint} />
          </ThemedView>
          <ThemedText style={styles.playerName}>{myName}</ThemedText>
        </ThemedView>
        <ThemedView style={styles.vsContainer}>
          <ThemedText style={styles.vsText}>VS</ThemedText>
        </ThemedView>
        <ThemedView style={styles.playerCard}>
          <ThemedView
            style={[
              styles.playerImagePlaceholder,
              { backgroundColor: themeColors.icon + '20', borderColor: themeColors.card },
            ]}
          >
            <MaterialIcons name="person" size={24} color={themeColors.icon} />
          </ThemedView>
          <ThemedText style={styles.playerName}>{opponentName}</ThemedText>
        </ThemedView>
      </ThemedView>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {!isSubmitted ? (
          <>
            <ThemedView
              style={[
                styles.questionCard,
                { backgroundColor: themeColors.card, borderColor: themeColors.icon + '30' },
              ]}
            >
              <ThemedView style={styles.questionHeader}>
                <MaterialIcons name="quiz" size={24} color={themeColors.tint} />
                <ThemedText type="subtitle" style={styles.questionTitle}>
                  سؤال {currentQuestionIndex + 1} من {questions.length}
                </ThemedText>
              </ThemedView>
              <ThemedText style={styles.questionText}>{currentQuestion.question}</ThemedText>
              <ThemedView style={styles.optionsContainer}>
                {currentQuestion.options.map((option, index) => {
                  const isSelected = selectedAnswer === index;
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.optionButton,
                        {
                          backgroundColor: isSelected ? themeColors.tint + '20' : 'transparent',
                          borderColor: isSelected ? themeColors.tint : themeColors.icon + '30',
                        },
                      ]}
                      onPress={() => handleAnswerSelect(index)}
                    >
                      <ThemedView
                        style={[
                          styles.optionRadio,
                          {
                            borderColor: isSelected ? themeColors.tint : themeColors.icon,
                            backgroundColor: isSelected ? themeColors.tint : 'transparent',
                          },
                        ]}
                      >
                        {isSelected && <ThemedView style={styles.optionRadioInner} />}
                      </ThemedView>
                      <ThemedText
                        style={[styles.optionText, { color: isSelected ? themeColors.tint : themeColors.text }]}
                      >
                        {option}
                      </ThemedText>
                    </TouchableOpacity>
                  );
                })}
              </ThemedView>
            </ThemedView>

            <ThemedView style={styles.navRow}>
              <TouchableOpacity
                style={[styles.navButton, { backgroundColor: themeColors.input }]}
                onPress={() => setCurrentQuestionIndex((i) => Math.max(0, i - 1))}
                disabled={currentQuestionIndex === 0}
              >
                <MaterialIcons name="chevron-right" size={24} color={themeColors.text} />
                <ThemedText style={styles.navButtonText}>السابق</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.navButton, { backgroundColor: themeColors.input }]}
                onPress={() =>
                  setCurrentQuestionIndex((i) => Math.min(questions.length - 1, i + 1))
                }
                disabled={currentQuestionIndex === questions.length - 1}
              >
                <ThemedText style={styles.navButtonText}>التالي</ThemedText>
                <MaterialIcons name="chevron-left" size={24} color={themeColors.text} />
              </TouchableOpacity>
            </ThemedView>

            <TouchableOpacity
              style={[
                styles.submitButton,
                {
                  backgroundColor: themeColors.cta,
                  opacity: allAnswered && !isSubmitting ? 1 : 0.5,
                },
              ]}
              onPress={handleSubmit}
              disabled={!allAnswered || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={SemanticColors.onTint} />
              ) : (
                <MaterialIcons name="send" size={20} color={SemanticColors.onTint} />
              )}
              <ThemedText style={styles.submitButtonText}>إرسال الإجابات</ThemedText>
            </TouchableOpacity>

            <ThemedView style={styles.stepper}>
              {questions.map((_, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => setCurrentQuestionIndex(i)}
                  style={[
                    styles.stepperDot,
                    {
                      backgroundColor:
                        i === currentQuestionIndex
                          ? themeColors.tint
                          : answers[i] >= 0
                            ? themeColors.tint + '60'
                            : themeColors.icon + '40',
                    },
                  ]}
                />
              ))}
            </ThemedView>
          </>
        ) : (
          <ThemedView
            style={[
              styles.resultCard,
              { backgroundColor: themeColors.card, borderColor: themeColors.icon + '30' },
            ]}
          >
            <ThemedText type="title" style={styles.resultTitle}>
              النتيجة
            </ThemedText>
            <ThemedView style={styles.resultRow}>
              <ThemedText style={styles.resultLabel}>نقاطك:</ThemedText>
              <ThemedText style={styles.resultValue}>
                {submitResult!.myResult.score} / {submitResult!.myResult.totalPoints}
              </ThemedText>
            </ThemedView>
            {submitResult!.opponentResult ? (
              <>
                <ThemedView style={styles.resultRow}>
                  <ThemedText style={styles.resultLabel}>نقاط المنافس:</ThemedText>
                  <ThemedText style={styles.resultValue}>
                    {submitResult!.opponentResult.score} / {submitResult!.opponentResult.totalPoints}
                  </ThemedText>
                </ThemedView>
                <ThemedText type="subtitle" style={styles.resultOutcome}>
                  {hasWon && '🎉 مبروك! فزت! 🎉'}
                  {hasLost && 'حظ أوفر في المرة القادمة'}
                  {isDraw && 'تعادل!'}
                </ThemedText>
              </>
            ) : (
              <ThemedText style={[styles.waitingText, { color: themeColors.icon }]}>
                بانتظار منافسك
              </ThemedText>
            )}
            <TouchableOpacity
              style={[styles.backButtonStyle, { backgroundColor: themeColors.tint }]}
              onPress={() => router.back()}
            >
              <ThemedText style={styles.backButtonText}>العودة</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        )}

        {hasWon && (
          <Animated.View
            style={[
              styles.celebrationContainer,
              { transform: [{ scale: scaleAnim }], opacity: confettiAnim },
            ]}
          >
            <ThemedView style={[styles.celebrationContent, { backgroundColor: themeColors.card }]}>
              <MaterialIcons name="celebration" size={80} color={SemanticColors.rankGold} />
              <ThemedText type="title" style={styles.winTitle}>
                🎉 مبروك! فزت! 🎉
              </ThemedText>
              <ThemedText style={styles.winSubtitle}>تغلبت على {opponentName}</ThemedText>
              <ThemedView style={styles.shareButtons}>
                <TouchableOpacity
                  style={[styles.shareButton, { backgroundColor: SemanticColors.socialFacebook }]}
                  onPress={() => handleShare('facebook')}
                >
                  <MaterialIcons name="facebook" size={24} color={SemanticColors.onTint} />
                  <ThemedText style={styles.shareButtonText}>شارك على فيسبوك</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.shareButton, { backgroundColor: SemanticColors.socialTwitter }]}
                  onPress={() => handleShare('twitter')}
                >
                  <MaterialIcons name="campaign" size={24} color={SemanticColors.onTint} />
                  <ThemedText style={styles.shareButtonText}>شارك على تويتر</ThemedText>
                </TouchableOpacity>
              </ThemedView>
              <TouchableOpacity
                style={[styles.backButtonStyle, { backgroundColor: themeColors.tint }]}
                onPress={() => router.back()}
              >
                <ThemedText style={styles.backButtonText}>العودة</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </Animated.View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loaderText: {
    marginTop: 16,
    fontSize: 16,
    opacity: 0.7,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 60,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timerText: {
    fontSize: 18,
    fontWeight: '600',
  },
  playersSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  playerCard: {
    alignItems: 'center',
    gap: 8,
  },
  playerImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
  },
  playerName: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  vsContainer: {
    alignItems: 'center',
  },
  vsText: {
    fontSize: 20,
    fontWeight: 'bold',
    opacity: 0.5,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  questionCard: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    marginBottom: 16,
    shadowColor: SemanticColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  questionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 24,
    lineHeight: 28,
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    gap: 12,
  },
  optionRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: SemanticColors.onTint,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  stepper: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  stepperDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: SemanticColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  submitButtonText: {
    color: SemanticColors.onTint,
    fontSize: 16,
    fontWeight: '600',
  },
  resultCard: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    marginBottom: 20,
  },
  resultTitle: {
    marginBottom: 20,
    textAlign: 'center',
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  resultLabel: {
    fontSize: 16,
    opacity: 0.8,
  },
  resultValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  resultOutcome: {
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  waitingText: {
    marginTop: 8,
    marginBottom: 24,
    textAlign: 'center',
    fontSize: 16,
  },
  celebrationContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: SemanticColors.overlayStrong,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  celebrationContent: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 24,
    margin: 20,
    shadowColor: SemanticColors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  winTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  winSubtitle: {
    fontSize: 18,
    opacity: 0.7,
    marginBottom: 32,
    textAlign: 'center',
  },
  shareButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
    width: '100%',
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  shareButtonText: {
    color: SemanticColors.onTint,
    fontSize: 14,
    fontWeight: '600',
  },
  backButtonStyle: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  backButtonText: {
    color: SemanticColors.onTint,
    fontSize: 16,
    fontWeight: '600',
  },
});
