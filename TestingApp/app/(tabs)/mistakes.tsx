import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { NewsSlider } from '@/components/news-slider';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, SemanticColors } from '@/constants/theme';
import { StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useGetStudentMistakesQuery } from '@/store/api/apiSlice';
import { getStudentIdFromToken } from '@/utils/tokenUtils';
import { useState, useEffect } from 'react';
import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';
import { toast } from '@/hooks/use-toast';

export default function MistakesScreen() {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];
  const [studentId, setStudentId] = useState<string | null>(null);
  const [isLoadingId, setIsLoadingId] = useState(true);

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
    data: mistakesResponse,
    isLoading: isLoadingMistakes,
    error,
    refetch,
    isFetching,
  } = useGetStudentMistakesQuery(studentId!, {
    skip: !studentId,
  });

  const mistakes = mistakesResponse?.data || [];
  const isLoading = isLoadingId || isLoadingMistakes;

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const formatDateForPDF = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const generatePDFHTML = () => {
    const currentDate = new Date().toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const success = SemanticColors.success;
    const successDark = SemanticColors.successDark;
    const successLight = SemanticColors.successLight;
    const error = SemanticColors.error;
    const errorDark = SemanticColors.errorDark;
    const errorLight = SemanticColors.errorLight;
    const errorText = SemanticColors.errorText;
    const onTint = SemanticColors.onTint;

    let html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>تقرير الأخطاء</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Arial', 'Helvetica', sans-serif;
            direction: rtl;
            background: ${themeColors.input};
            padding: 20px;
            color: ${themeColors.text};
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
            background: ${themeColors.card};
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px ${SemanticColors.shadowRgba10};
          }
          .header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 3px solid ${success};
          }
          .header h1 {
            color: ${themeColors.text};
            font-size: 28px;
            margin-bottom: 10px;
            font-weight: bold;
          }
          .header .subtitle {
            color: ${themeColors.icon};
            font-size: 16px;
            margin-top: 10px;
          }
          .info-section {
            background: ${themeColors.surface};
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
            border-right: 4px solid ${success};
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding: 8px 0;
            border-bottom: 1px solid ${themeColors.border};
          }
          .info-row:last-child {
            border-bottom: none;
          }
          .info-label {
            font-weight: bold;
            color: ${themeColors.icon};
          }
          .info-value {
            color: ${themeColors.text};
          }
          .mistake-card {
            background: ${themeColors.card};
            border: 2px solid ${error};
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 25px;
            box-shadow: 0 2px 8px ${SemanticColors.errorShadowRgba};
            page-break-inside: avoid;
          }
          .mistake-header {
            background: linear-gradient(135deg, ${error} 0%, ${errorDark} 100%);
            color: ${onTint};
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
          }
          .mistake-header h2 {
            font-size: 18px;
            margin-bottom: 8px;
          }
          .mistake-header .exam-title {
            font-size: 16px;
            opacity: 0.95;
          }
          .mistake-header .exam-date {
            font-size: 14px;
            opacity: 0.85;
            margin-top: 5px;
          }
          .question-section {
            margin-bottom: 20px;
          }
          .question-number {
            display: inline-block;
            background: ${success};
            color: ${onTint};
            width: 30px;
            height: 30px;
            border-radius: 50%;
            text-align: center;
            line-height: 30px;
            font-weight: bold;
            margin-left: 10px;
            font-size: 14px;
          }
          .question-text {
            font-size: 18px;
            font-weight: 600;
            color: ${themeColors.text};
            margin: 15px 0;
            line-height: 1.6;
          }
          .options-container {
            margin-top: 15px;
          }
          .option-item {
            padding: 12px 15px;
            margin-bottom: 10px;
            border-radius: 8px;
            border: 2px solid ${themeColors.border};
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .option-item.correct {
            background: ${successLight};
            border-color: ${success};
            color: ${successDark};
          }
          .option-item.wrong {
            background: ${errorLight};
            border-color: ${error};
            color: ${errorText};
          }
          .option-item.neutral {
            background: ${themeColors.input};
            border-color: ${themeColors.border};
            color: ${themeColors.icon};
          }
          .option-text {
            flex: 1;
            font-size: 15px;
            font-weight: 500;
          }
          .option-icon {
            margin-left: 10px;
            font-size: 18px;
          }
          .answer-labels {
            display: flex;
            justify-content: space-around;
            margin-top: 20px;
            padding-top: 15px;
            border-top: 2px solid ${themeColors.border};
          }
          .answer-label {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            font-weight: 600;
          }
          .answer-label.correct {
            color: ${success};
          }
          .answer-label.wrong {
            color: ${error};
          }
          .points-badge {
            display: inline-block;
            background: ${error};
            color: ${onTint};
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: bold;
            margin-top: 10px;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid ${themeColors.border};
            color: ${themeColors.icon};
            font-size: 14px;
          }
          @media print {
            body {
              background: white;
              padding: 0;
            }
            .container {
              box-shadow: none;
            }
            .mistake-card {
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📋 تقرير الأخطاء</h1>
            <div class="subtitle">ملخص شامل لجميع الأخطاء في الامتحانات</div>
          </div>

          <div class="info-section">
            <div class="info-row">
              <span class="info-label">تاريخ التقرير:</span>
              <span class="info-value">${currentDate}</span>
            </div>
            <div class="info-row">
              <span class="info-label">إجمالي الأخطاء:</span>
              <span class="info-value">${mistakes.length} خطأ</span>
            </div>
            <div class="info-row">
              <span class="info-label">إجمالي النقاط المفقودة:</span>
              <span class="info-value">${mistakes.reduce((sum, m) => sum + m.points, 0)} نقطة</span>
            </div>
          </div>
    `;

    mistakes.forEach((mistake, index) => {
      html += `
          <div class="mistake-card">
            <div class="mistake-header">
              <h2>خطأ #${index + 1}</h2>
              <div class="exam-title">${mistake.examTitle}</div>
              <div class="exam-date">${formatDateForPDF(mistake.submittedAt)}</div>
              <div class="points-badge">-${mistake.points} نقطة</div>
            </div>

            <div class="question-section">
              <span class="question-number">${mistake.questionIndex + 1}</span>
              <div class="question-text">${mistake.question}</div>

              <div class="options-container">
      `;

      mistake.options.forEach((option, optionIndex) => {
        const isSelected = mistake.selectedAnswer === optionIndex;
        const isCorrect = mistake.correctAnswer === optionIndex;
        let className = 'neutral';
        let icon = '';

        if (isCorrect) {
          className = 'correct';
          icon = '✓';
        } else if (isSelected) {
          className = 'wrong';
          icon = '✗';
        }

        html += `
                <div class="option-item ${className}">
                  <span class="option-text">${option}</span>
                  ${icon ? `<span class="option-icon">${icon}</span>` : ''}
                </div>
        `;
      });

      html += `
              </div>

              <div class="answer-labels">
                <div class="answer-label wrong">
                  <span>✗</span>
                  <span>إجابتك</span>
                </div>
                <div class="answer-label correct">
                  <span>✓</span>
                  <span>الإجابة الصحيحة</span>
                </div>
              </div>
            </div>
          </div>
      `;
    });

    html += `
          <div class="footer">
            <p>تم إنشاء هذا التقرير تلقائياً من تطبيق اختبارات ثانوية عامة</p>
            <p>تاريخ الإنشاء: ${currentDate}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return html;
  };

  const handleExportPDF = async () => {
    if (mistakes.length === 0) {
      toast({
        title: 'تنبيه',
        description: 'لا توجد أخطاء لتصديرها',
      });
      return;
    }

    try {
      toast({
        title: 'جاري الإنشاء...',
        description: 'يرجى الانتظار',
      });

      const html = generatePDFHTML();
      
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
      });

      const canShare = await shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'تصدير تقرير الأخطاء',
        UTI: 'com.adobe.pdf',
      });

      if (canShare) {
        toast({
          title: 'نجاح',
          description: 'تم تصدير التقرير بنجاح',
        });
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء إنشاء PDF',
      });
    }
  };

  if (isLoading || !studentId) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={themeColors.tint} />
          <ThemedText style={styles.loaderText}>جاري تحميل الأخطاء...</ThemedText>
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
            حدث خطأ أثناء تحميل الأخطاء
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

        <ThemedView style={styles.header}>
          <ThemedView
            style={[
              styles.iconContainer,
              { backgroundColor: themeColors.tint + '20' },
            ]}
          >
            <MaterialIcons
              name="error-outline"
              size={48}
              color={themeColors.tint}
            />
          </ThemedView>
          <ThemedText type="title" style={styles.title}>
            الأخطاء
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            {mistakes.length} خطأ تم تسجيله
          </ThemedText>
          
          {mistakes.length > 0 && (
            <TouchableOpacity
              style={[
                styles.exportButton,
                { backgroundColor: themeColors.cta },
              ]}
              onPress={handleExportPDF}
            >
              <MaterialIcons name="picture-as-pdf" size={20} color={SemanticColors.onTint} />
              <ThemedText style={styles.exportButtonText}>
                تصدير PDF
              </ThemedText>
            </TouchableOpacity>
          )}
        </ThemedView>

        {mistakes.length === 0 ? (
          <ThemedView style={styles.emptyContainer}>
            <MaterialIcons
              name="check-circle"
              size={64}
              color="#4caf50"
            />
            <ThemedText style={styles.emptyText}>
              ممتاز! لا توجد أخطاء
            </ThemedText>
            <ThemedText style={styles.emptySubtext}>
              استمر في المذاكرة والتدريب
            </ThemedText>
          </ThemedView>
        ) : (
          <ThemedView style={styles.mistakesList}>
            {mistakes.map((mistake, index) => (
              <ThemedView
                key={mistake.id}
                style={[
                  styles.mistakeCard,
                  {
                    backgroundColor:
                      themeColors.card,
                    borderColor: themeColors.icon + '20',
                  },
                ]}
              >
                {/* Exam Info Header */}
                <ThemedView style={[styles.examHeader, { borderBottomColor: themeColors.border }]}>
                  <ThemedView
                    style={[
                      styles.examIconContainer,
                      { backgroundColor: themeColors.tint + '15' },
                    ]}
                  >
                    <MaterialIcons
                      name="assignment"
                      size={20}
                      color={themeColors.tint}
                    />
                  </ThemedView>
                  <ThemedView style={styles.examInfo}>
                    <ThemedText type="subtitle" style={styles.examTitle}>
                      {mistake.examTitle}
                    </ThemedText>
                    <ThemedText style={styles.examDate}>
                      {formatDate(mistake.submittedAt)}
                    </ThemedText>
                  </ThemedView>
                  <ThemedView
                    style={[
                      styles.pointsBadge,
                      { backgroundColor: SemanticColors.errorAlpha20 },
                    ]}
                  >
                    <MaterialIcons name="close" size={16} color={SemanticColors.error} />
                    <ThemedText style={[styles.pointsText, { color: SemanticColors.error }]}>
                      -{mistake.points}
                    </ThemedText>
                  </ThemedView>
                </ThemedView>

                {/* Question */}
                <ThemedView style={styles.questionSection}>
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
                        {mistake.questionIndex + 1}
                      </ThemedText>
                    </ThemedView>
                    <ThemedText style={styles.questionText}>
                      {mistake.question}
                    </ThemedText>
                  </ThemedView>

                  {/* Options */}
                  <ThemedView style={styles.optionsContainer}>
                    {mistake.options.map((option, optionIndex) => {
                      const isSelected = mistake.selectedAnswer === optionIndex;
                      const isCorrect = mistake.correctAnswer === optionIndex;

                      let optionStyle = {};
                      let icon = null;

                      if (isCorrect) {
                        optionStyle = {
                          backgroundColor: SemanticColors.successAlpha20,
                          borderColor: SemanticColors.success,
                        };
                        icon = (
                          <MaterialIcons name="check-circle" size={20} color={SemanticColors.success} />
                        );
                      } else if (isSelected) {
                        optionStyle = {
                          backgroundColor: SemanticColors.errorAlpha20,
                          borderColor: SemanticColors.error,
                        };
                        icon = (
                          <MaterialIcons name="cancel" size={20} color={SemanticColors.error} />
                        );
                      } else {
                        optionStyle = {
                          backgroundColor: 'transparent',
                          borderColor: themeColors.icon + '20',
                        };
                      }

                      return (
                        <ThemedView
                          key={optionIndex}
                          style={[styles.optionRow, optionStyle]}
                        >
                          <ThemedView style={styles.optionLeft}>
                            <ThemedView
                              style={[
                                styles.optionRadio,
                                {
                                  borderColor: isCorrect
                                    ? SemanticColors.success
                                    : isSelected
                                    ? SemanticColors.error
                                    : themeColors.icon,
                                  backgroundColor: isCorrect
                                    ? SemanticColors.success
                                    : isSelected
                                    ? SemanticColors.error
                                    : 'transparent',
                                },
                              ]}
                            >
                              {(isSelected || isCorrect) && (
                                <ThemedView style={styles.optionRadioInner} />
                              )}
                            </ThemedView>
                            <ThemedText
                              style={[
                                styles.optionText,
                                {
                                  color: isCorrect
                                    ? SemanticColors.success
                                    : isSelected
                                    ? SemanticColors.error
                                    : themeColors.text,
                                  fontWeight:
                                    isSelected || isCorrect ? '600' : '400',
                                },
                              ]}
                            >
                              {option}
                            </ThemedText>
                          </ThemedView>
                          {icon && <ThemedView style={styles.optionIcon}>{icon}</ThemedView>}
                        </ThemedView>
                      );
                    })}
                  </ThemedView>

                  {/* Answer Labels */}
                  <ThemedView style={[styles.answerLabels, { borderTopColor: themeColors.border }]}>
                    <ThemedView style={styles.answerLabel}>
                      <MaterialIcons name="cancel" size={16} color={SemanticColors.error} />
                      <ThemedText style={[styles.answerLabelText, { color: SemanticColors.error }]}>
                        إجابتك
                      </ThemedText>
                    </ThemedView>
                    <ThemedView style={styles.answerLabel}>
                      <MaterialIcons name="check-circle" size={16} color={SemanticColors.success} />
                      <ThemedText style={[styles.answerLabelText, { color: SemanticColors.success }]}>
                        الإجابة الصحيحة
                      </ThemedText>
                    </ThemedView>
                  </ThemedView>
                </ThemedView>
              </ThemedView>
            ))}
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
    marginTop: 20,
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    color: SemanticColors.success,
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
  },
  mistakesList: {
    gap: 16,
  },
  mistakeCard: {
    borderRadius: 20,
    padding: 20,
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
  examHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  examIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  examInfo: {
    flex: 1,
  },
  examTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  examDate: {
    fontSize: 13,
    opacity: 0.6,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  pointsText: {
    fontSize: 13,
    fontWeight: '600',
  },
  questionSection: {
    marginTop: 4,
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
    lineHeight: 24,
  },
  optionsContainer: {
    gap: 10,
    marginBottom: 16,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
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
  optionIcon: {
    marginLeft: 8,
  },
  answerLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
  },
  answerLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  answerLabelText: {
    fontSize: 13,
    fontWeight: '500',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 20,
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
  exportButtonText: {
    color: SemanticColors.onTint,
    fontSize: 16,
    fontWeight: '600',
  },
});
