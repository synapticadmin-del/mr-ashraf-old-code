import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, SemanticColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { toast } from '@/hooks/use-toast';
import type { Exam, ExamResult } from '@/store/api/apiSlice';
import { useSolveExamMutation } from '@/store/api/apiSlice';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

export default function SolveExamScreen() {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const params = useLocalSearchParams<{ exam: string }>();
  const [solveExam, { isLoading }] = useSolveExamMutation();

  const exam: Exam = params.exam ? JSON.parse(params.exam) : null;
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [timeRemaining, setTimeRemaining] = useState(exam?.duration * 60 || 0); // Convert minutes to seconds
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [examResult, setExamResult] = useState<ExamResult | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timeRemaining > 0 && !isSubmitted) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timeRemaining, isSubmitted]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (questionIndex: number, answerIndex: number) => {
    if (isSubmitted) return;
    setAnswers((prev) => ({
      ...prev,
      [questionIndex]: answerIndex,
    }));
  };

  const handleAutoSubmit = () => {
    if (isSubmitted) return;
    Alert.alert('انتهى الوقت', 'تم إرسال الإجابات تلقائياً', [{ text: 'موافق' }]);
    handleSubmit();
  };

  const handleSubmit = async () => {
    if (isSubmitted) return;

    // Check if all questions are answered
    const unansweredQuestions = exam.questions.filter(
      (_, index) => answers[index] === undefined
    );

    if (unansweredQuestions.length > 0) {
      Alert.alert(
        'تنبيه',
        `لديك ${unansweredQuestions.length} سؤال غير مجاب. هل تريد الإرسال؟`,
        [
          { text: 'إلغاء', style: 'cancel' },
          {
            text: 'إرسال',
            onPress: () => submitAnswers(),
          },
        ]
      );
    } else {
      submitAnswers();
    }
  };

  const submitAnswers = async () => {
    if (isSubmitted) return;
    setIsSubmitted(true);

    // Stop the timer
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setTimeRemaining(0);

    try {
      // Send answers as a simple array of numbers
      // -1 for unanswered questions
      const answersArray: number[] = exam.questions.map(
        (_, index) => answers[index] ?? -1
      );

      const response = await solveExam({
        examId: exam.id,
        body: { answers: answersArray },
      }).unwrap();

      if (response.success) {
        // Store the result to display
        setExamResult(response.data.result);
        toast({
          title: 'نجاح',
          description: response.message || 'تم إرسال الإجابات بنجاح',
        });
      } else {
        toast({
          title: 'خطأ',
          description: response.message || 'حدث خطأ أثناء إرسال الإجابات',
        });
        setIsSubmitted(false);
      }
    } catch (error: any) {
      const errorMessage =
        'data' in error
          ? (error.data as any)?.message
          : 'حدث خطأ أثناء إرسال الإجابات';
      toast({
        title: 'خطأ',
        description: errorMessage,
      });
      setIsSubmitted(false);
    }
  };

  if (!exam) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.errorContainer}>
          <ThemedText>خطأ: لم يتم العثور على الامتحان</ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Header with timer and back button */}
      <ThemedView
        style={[
          styles.header,
          {
            backgroundColor: themeColors.input,
            borderBottomColor: themeColors.border,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <MaterialIcons name="arrow-back" size={24} color={themeColors.text} />
        </TouchableOpacity>
        <ThemedView style={styles.timerContainer}>
          {examResult ? (
            <ThemedText style={[styles.timerText, { color: themeColors.tint }]}>
              تم الإرسال
            </ThemedText>
          ) : (
            <>
              <MaterialIcons
                name="timer"
                size={20}
                color={timeRemaining < 300 ? SemanticColors.warning : themeColors.tint}
              />
              <ThemedText
                style={[
                  styles.timerText,
                  {
                    color: timeRemaining < 300 ? SemanticColors.warning : themeColors.text,
                  },
                ]}
              >
                {formatTime(timeRemaining)}
              </ThemedText>
            </>
          )}
        </ThemedView>
      </ThemedView>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ThemedView style={styles.examHeader}>
          <ThemedText type="title" style={styles.examTitle}>
            {exam.title}
          </ThemedText>
          <ThemedText style={styles.examDescription}>{exam.description}</ThemedText>
          <ThemedView style={styles.examInfo}>
            <ThemedText style={styles.examInfoText}>
              {exam.questions.length} سؤال • {exam.totalPoints} نقطة • {exam.duration} دقيقة
            </ThemedText>
          </ThemedView>
        </ThemedView>

        {/* Results Summary */}
        {examResult && (
          <ThemedView
            style={[
              styles.resultsCard,
              {
                backgroundColor: themeColors.input,
                borderColor: themeColors.icon + '30',
              },
            ]}
          >
            <ThemedText type="subtitle" style={styles.resultsTitle}>
              النتيجة
            </ThemedText>
            <ThemedView style={styles.resultsStats}>
              <ThemedView style={styles.statItem}>
                <MaterialIcons name="check-circle" size={24} color={SemanticColors.success} />
                <ThemedText style={styles.statValue}>
                  {examResult.answers.filter((a) => a.isCorrect).length}
                </ThemedText>
                <ThemedText style={styles.statLabel}>صحيح</ThemedText>
              </ThemedView>
              <ThemedView style={styles.statItem}>
                <MaterialIcons name="cancel" size={24} color={SemanticColors.error} />
                <ThemedText style={styles.statValue}>
                  {examResult.answers.filter((a) => !a.isCorrect).length}
                </ThemedText>
                <ThemedText style={styles.statLabel}>خطأ</ThemedText>
              </ThemedView>
              <ThemedView style={styles.statItem}>
                <MaterialIcons name="star" size={24} color={themeColors.tint} />
                <ThemedText style={[styles.statValue, { color: themeColors.tint }]}>
                  {examResult.totalScore}/{examResult.totalPoints}
                </ThemedText>
                <ThemedText style={styles.statLabel}>النقاط</ThemedText>
              </ThemedView>
              <ThemedView style={styles.statItem}>
                <MaterialIcons name="percent" size={24} color={themeColors.tint} />
                <ThemedText style={[styles.statValue, { color: themeColors.tint }]}>
                  {examResult.percentage.toFixed(1)}%
                </ThemedText>
                <ThemedText style={styles.statLabel}>النسبة</ThemedText>
              </ThemedView>
            </ThemedView>
          </ThemedView>
        )}

        <ThemedView style={styles.questionsContainer}>
          {exam.questions.map((question, questionIndex) => {
            const resultAnswer = examResult?.answers.find(
              (a) => a.questionIndex === questionIndex
            );
            const showReason =
              examResult &&
              resultAnswer &&
              !resultAnswer.isCorrect &&
              resultAnswer.correctAnswerReason;
            const correctOptionText =
              resultAnswer &&
              resultAnswer.correctAnswer >= 0 &&
              resultAnswer.options?.[resultAnswer.correctAnswer];

            return (
            <ThemedView
              key={questionIndex}
              style={[
                styles.questionCard,
                {
                  backgroundColor:
                    themeColors.input,
                  borderColor: themeColors.icon + '30',
                },
              ]}
            >
              <ThemedView style={styles.questionHeader}>
                <ThemedView
                  style={[
                    styles.questionNumber,
                    { backgroundColor: themeColors.tint + '20' },
                  ]}
                >
                  <ThemedText
                    style={[styles.questionNumberText, { color: themeColors.tint }]}
                  >
                    {questionIndex + 1}
                  </ThemedText>
                </ThemedView>
                <ThemedText style={styles.questionText}>{question.question}</ThemedText>
              </ThemedView>

              <ThemedView style={styles.optionsContainer}>
                {(question.options ?? []).map((option, optionIndex) => {
                  const isSelected = answers[questionIndex] === optionIndex;
                  const isCorrect = resultAnswer?.isCorrect;
                  const isCorrectAnswer = resultAnswer?.correctAnswer === optionIndex;
                  const wasSelected = resultAnswer?.selectedAnswer === optionIndex;

                  // Determine styling based on results
                  let optionStyle = {};
                  let icon = null;

                  if (examResult) {
                    if (isCorrectAnswer) {
                      // Correct answer - always show in green
                      optionStyle = {
                        backgroundColor: SemanticColors.successAlpha20,
                        borderColor: SemanticColors.success,
                      };
                      icon = (
                        <MaterialIcons name="check-circle" size={20} color={SemanticColors.success} />
                      );
                    } else if (wasSelected && !isCorrect) {
                      // Wrong selected answer - show in red
                      optionStyle = {
                        backgroundColor: SemanticColors.errorAlpha20,
                        borderColor: SemanticColors.error,
                      };
                      icon = (
                        <MaterialIcons name="cancel" size={20} color={SemanticColors.error} />
                      );
                    }
                  } else {
                    optionStyle = {
                      backgroundColor: isSelected
                        ? themeColors.tint + '21'
                        : 'transparent',
                      borderColor: isSelected
                        ? themeColors.tint
                        : themeColors.icon + '30',
                    };
                  }

                  return (
                    <TouchableOpacity
                      key={optionIndex}
                      style={[
                        styles.optionButton,
                        optionStyle,
                      ]}
                      onPress={() => handleAnswerSelect(questionIndex, optionIndex)}
                      disabled={isSubmitted || !!examResult}
                    >
                      <ThemedView
                        style={[
                          styles.optionRadio,
                          {
                            borderColor: examResult
                              ? isCorrectAnswer
                                ? SemanticColors.success
                                : wasSelected && !isCorrect
                                ? SemanticColors.error
                                : themeColors.icon
                              : isSelected
                              ? themeColors.tint
                              : themeColors.icon,
                            backgroundColor: examResult
                              ? isCorrectAnswer
                                ? SemanticColors.success
                                : wasSelected && !isCorrect
                                ? SemanticColors.error
                                : 'transparent'
                              : isSelected
                              ? themeColors.tint
                              : 'transparent',
                          },
                        ]}
                      >
                        {(isSelected || (examResult && isCorrectAnswer)) && (
                          <ThemedView style={styles.optionRadioInner} />
                        )}
                      </ThemedView>
                      <ThemedText
                        style={[
                          styles.optionText,
                          {
                            color: examResult
                              ? isCorrectAnswer
                                ? SemanticColors.success
                                : wasSelected && !isCorrect
                                ? SemanticColors.error
                                : themeColors.text
                              : isSelected
                              ? themeColors.tint
                              : themeColors.text,
                            fontWeight:
                              isSelected || (examResult && isCorrectAnswer)
                                ? '600'
                                : '400',
                          },
                        ]}
                      >
                        {option}
                      </ThemedText>
                      {icon && <ThemedView style={styles.optionIcon}>{icon}</ThemedView>}
                    </TouchableOpacity>
                  );
                })}
              </ThemedView>

              {showReason && (
                <ThemedView
                  style={[
                    styles.correctReasonBox,
                    {
                      backgroundColor: SemanticColors.successAlpha20,
                      borderColor: SemanticColors.success + '60',
                    },
                  ]}
                >
                  <MaterialIcons
                    name="lightbulb"
                    size={20}
                    color={SemanticColors.success}
                    style={styles.correctReasonIcon}
                  />
                  <ThemedText style={[styles.correctReasonText, { color: themeColors.text }]}>
                    {correctOptionText != null
                      ? `الإجابة الصحيحة هي «${correctOptionText}» لأن ${resultAnswer!.correctAnswerReason}`
                      : resultAnswer!.correctAnswerReason}
                  </ThemedText>
                </ThemedView>
              )}
            </ThemedView>
          );
          })}
        </ThemedView>

        <TouchableOpacity
          style={[
            styles.submitButton,
            {
              backgroundColor: themeColors.cta,
              opacity: isSubmitted ? 0.6 : 1,
            },
          ]}
          onPress={handleSubmit}
          disabled={isSubmitted || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={themeColors.background} />
          ) : (
            <>
              <MaterialIcons
                name="send"
                size={20}
                color={themeColors.background}
                style={styles.submitIcon}
              />
              <ThemedText
                style={[styles.submitButtonText, { color: themeColors.background }]}
              >
                {isSubmitted ? 'تم الإرسال' : 'إرسال الإجابات'}
              </ThemedText>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
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
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  examHeader: {
    marginBottom: 24,
  },
  examTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  examDescription: {
    fontSize: 16,
    opacity: 0.7,
    marginBottom: 12,
  },
  examInfo: {
    marginTop: 8,
  },
  examInfoText: {
    fontSize: 14,
    opacity: 0.6,
  },
  questionsContainer: {
    gap: 20,
  },
  questionCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  questionHeader: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  questionNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  questionNumberText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  questionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  optionRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
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
    fontSize: 15,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
    shadowColor: SemanticColors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  submitIcon: {
    marginRight: 4,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  resultsCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    marginBottom: 24,
    shadowColor: SemanticColors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  resultsStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    gap: 16,
  },
  statItem: {
    alignItems: 'center',
    minWidth: 80,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  optionIcon: {
    marginLeft: 8,
  },
  correctReasonBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 16,
    gap: 10,
  },
  correctReasonIcon: {
    marginTop: 2,
  },
  correctReasonText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
    opacity: 0.95,
  },
});
