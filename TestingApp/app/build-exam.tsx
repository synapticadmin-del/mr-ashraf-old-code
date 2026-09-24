import { useDefaultEducationalMaterial } from '@/contexts/default-educational-material';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, SemanticColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { toast } from '@/hooks/use-toast';
import { useBuildExamRequestMutation, useGetChaptersBySubMaterialIdsQuery, useGetStudentQuery, useGetSubMaterialsQuery } from '@/store/api/apiSlice';
import { getStudentIdFromToken } from '@/utils/tokenUtils';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHARACTER_HEIGHT = Math.floor((Dimensions.get('window').height * 0.38));
const CARD_GAP = 12;
const CARD_SIZE = (SCREEN_WIDTH - 32 - CARD_GAP) / 2;

const DURATION_OPTIONS = [15, 30, 45, 60];
const QUESTION_COUNT_OPTIONS = [5, 10, 15, 20];

/** Price in EGP by number of questions (hidden from user, sent automatically). */
function getPriceFromQuestionCount(n: number | null): number {
  if (n === 5) return 10;
  if (n === 10) return 15;
  if (n === 15) return 20;
  if (n === 20) return 25;
  return 0;
}

const STEP_QUESTIONS = [
  'أهلاً! كم مدة الامتحان اللي عايزه؟ 👋',
  'كم سؤال تحب تكون في الامتحان؟',
  'أي أقسام تحب تشملهم؟',
  'أي فصول تحب تشملهم؟',
  'عنوان ووصف الامتحان، وهيكون مدفوع؟',
];

export default function BuildExamScreen() {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { defaultMaterialId } = useDefaultEducationalMaterial();
  const [studentId, setStudentId] = useState<string | null>(null);

  useEffect(() => {
    getStudentIdFromToken().then(setStudentId).catch(console.error);
  }, []);

  const { data: studentResponse } = useGetStudentQuery(studentId!, { skip: !studentId });
  const hidePrice = studentResponse?.data?.studentCode === 'ST4327';

  const { data: subMaterialsData, isLoading: isLoadingSubMaterials } = useGetSubMaterialsQuery();
  const [buildExam, { isLoading: isBuilding }] = useBuildExamRequestMutation();

  const subMaterials = (subMaterialsData?.data ?? []).filter(
    (s) => !defaultMaterialId || s.educationalMaterial?.id === defaultMaterialId
  );
  const [step, setStep] = useState(0);
  const [duration, setDuration] = useState<number | null>(null);
  const [questionCount, setQuestionCount] = useState<number | null>(null);
  const [sections, setSections] = useState<string[]>([]);
  const [selectedChapters, setSelectedChapters] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPaid] = useState(true);
  const [transferScreenshot, setTransferScreenshot] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false);

  const { data: chaptersData, isLoading: isLoadingChapters } = useGetChaptersBySubMaterialIdsQuery(sections, {
    skip: sections.length === 0,
  });

  const toggleSection = (id: string) => {
    setSections((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const toggleChapter = (id: string) => {
    setSelectedChapters((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handlePickScreenshot = async () => {
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
    } catch (e) {
      toast({ title: 'خطأ', description: 'فشل في اختيار الصورة' });
    }
  };

  const handleNext = async () => {
    if (step === 0 && duration !== null) setStep(1);
    else if (step === 1 && questionCount !== null) setStep(2);
    else if (step === 2 && sections.length > 0) setStep(3);
    else if (step === 3 && selectedChapters.length > 0) setStep(4);
    else if (step === 4) {
      if (!defaultMaterialId) {
        toast({ title: 'خطأ', description: 'لم يتم تحميل المواد. حاول مرة أخرى.' });
        return;
      }
      if (!title.trim()) {
        toast({ title: 'خطأ', description: 'أدخل عنوان الامتحان' });
        return;
      }
      if (isPaid && !transferScreenshot) {
        toast({ title: 'خطأ', description: 'ارفع صورة إثبات التحويل' });
        return;
      }

      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim() || title.trim());
      formData.append('duration', String(duration!));
      formData.append('educationalMaterialId', defaultMaterialId ?? '');
      formData.append('subMaterialIds', JSON.stringify(sections));
      formData.append('chapterIds', JSON.stringify(selectedChapters));
      formData.append('numberOfQuestions', String(questionCount!));
      formData.append('isPaid', 'true');
      formData.append('price', String(getPriceFromQuestionCount(questionCount)));
      const filename = transferScreenshot!.split('/').pop() || 'image.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      formData.append('transferScreenshot', {
        uri: transferScreenshot!,
        name: filename,
        type,
      } as any);

      try {
        const res = await buildExam(formData).unwrap();
        if (res.success) {
          toast({ title: 'تم', description: res.message || 'طلب إنشاء الامتحان مُرسل' });
          setIsDone(true);
        } else {
          toast({ title: 'خطأ', description: res.message || 'فشل الإرسال' });
        }
      } catch (err: any) {
        const msg = err?.data?.message || err?.data?.error?.message || 'فشل في إرسال الطلب';
        toast({ title: 'خطأ', description: msg });
      }
    }
  };

  const chapters = chaptersData?.data ?? [];
  const canProceed =
    (step === 0 && duration !== null) ||
    (step === 1 && questionCount !== null) ||
    (step === 2 && sections.length > 0) ||
    (step === 3 && selectedChapters.length > 0) ||
    (step === 4 && !!defaultMaterialId && title.trim().length > 0 && !!transferScreenshot);

  const bubbleBg = themeColors.tint + '18';
  const cardBg = colorScheme === 'dark' ? themeColors.input : themeColors.surface;
  const cardBorder = themeColors.icon + '30';

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { borderBottomColor: themeColors.tint + '30' }]}>
        <TouchableOpacity
          onPress={() => (isDone ? setIsDone(false) : router.back())}
          style={[styles.backButton, { backgroundColor: themeColors.tint + '20' }]}
        >
          <MaterialIcons name="arrow-back" size={24} color={themeColors.tint} />
        </TouchableOpacity>
        <ThemedText type="title" style={styles.title}>
          أنشئ امتحانك
        </ThemedText>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* فقاعة الكلام فوق — طالعة من فوق راس الشخصية */}
        <View style={styles.bubbleWrap}>
          <View style={[styles.bubble, { backgroundColor: bubbleBg }]}>
            {!isDone ? (
              <ThemedText style={styles.bubbleText}>
                {step <= 4 ? STEP_QUESTIONS[step] : ''}
              </ThemedText>
            ) : (
              <ThemedText style={styles.bubbleText}>
                تمام! طلبك جاهز وقيد التنفيذ ✅
              </ThemedText>
            )}
          </View>
          <View style={[styles.bubbleTailDown, { borderTopColor: bubbleBg }]} />
        </View>

        {/* الشخصية صغيرة تحت الفقاعة */}
        <View style={styles.characterWrap}>
          <Image
            source={require('../assets/images/build-exam-character-male.png')}
            style={[styles.characterImage, { height: CHARACTER_HEIGHT }]}
            resizeMode="contain"
          />
        </View>

        {!isDone ? (
          <>
            {/* خيارات المدة — شبكة 2×2 مع أيقونة الساعة */}
            {step === 0 && (
              <View style={styles.optionsGrid}>
                {DURATION_OPTIONS.map((m) => (
                  <TouchableOpacity
                    key={m}
                    onPress={() => setDuration(m)}
                    style={[
                      styles.optionCard,
                      {
                        backgroundColor: duration === m ? themeColors.tint : cardBg,
                        borderColor: duration === m ? themeColors.tint : cardBorder,
                      },
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.optionCardText,
                        { color: duration === m ? SemanticColors.onTint : themeColors.text },
                      ]}
                    >
                      {m} دقيقة
                    </ThemedText>
                    <MaterialIcons
                      name="schedule"
                      size={22}
                      color={duration === m ? SemanticColors.onTint : themeColors.tint}
                      style={styles.optionCardIcon}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {step === 1 && (
              <View style={styles.optionsGrid}>
                {QUESTION_COUNT_OPTIONS.map((n) => (
                  <TouchableOpacity
                    key={n}
                    onPress={() => setQuestionCount(n)}
                    style={[
                      styles.optionCard,
                      {
                        backgroundColor: questionCount === n ? themeColors.tint : cardBg,
                        borderColor: questionCount === n ? themeColors.tint : cardBorder,
                      },
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.optionCardText,
                        { color: questionCount === n ? SemanticColors.onTint : themeColors.text },
                      ]}
                    >
                      {n} سؤال
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {step === 2 && (
              <View style={styles.sectionsGrid}>
                {isLoadingSubMaterials ? (
                  <View style={styles.sectionsLoading}>
                    <ActivityIndicator size="small" color={themeColors.tint} />
                    <ThemedText style={styles.sectionsLoadingText}>جاري تحميل الأقسام...</ThemedText>
                  </View>
                ) : subMaterials.length === 0 ? (
                  <ThemedText style={styles.sectionsEmpty}>لا توجد أقسام متاحة</ThemedText>
                ) : (
                  subMaterials.map((sec) => (
                    <TouchableOpacity
                      key={sec.id}
                      onPress={() => toggleSection(sec.id)}
                      style={[
                        styles.sectionCard,
                        {
                          backgroundColor: sections.includes(sec.id) ? themeColors.tint : cardBg,
                          borderColor: sections.includes(sec.id) ? themeColors.tint : cardBorder,
                        },
                      ]}
                    >
                      <ThemedText
                        style={[
                          styles.sectionCardText,
                          { color: sections.includes(sec.id) ? SemanticColors.onTint : themeColors.text },
                        ]}
                      >
                        {sec.nameAr}
                      </ThemedText>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            )}

            {step === 3 && (
              <View style={styles.sectionsGrid}>
                {isLoadingChapters ? (
                  <View style={styles.sectionsLoading}>
                    <ActivityIndicator size="small" color={themeColors.tint} />
                    <ThemedText style={styles.sectionsLoadingText}>جاري تحميل الفصول...</ThemedText>
                  </View>
                ) : chapters.length === 0 ? (
                  <ThemedText style={styles.sectionsEmpty}>لا توجد فصول لهذه الأقسام</ThemedText>
                ) : (
                  chapters.map((ch) => (
                    <TouchableOpacity
                      key={ch.id}
                      onPress={() => toggleChapter(ch.id)}
                      style={[
                        styles.sectionCard,
                        {
                          backgroundColor: selectedChapters.includes(ch.id) ? themeColors.tint : cardBg,
                          borderColor: selectedChapters.includes(ch.id) ? themeColors.tint : cardBorder,
                        },
                      ]}
                    >
                      <ThemedText
                        style={[
                          styles.sectionCardText,
                          { color: selectedChapters.includes(ch.id) ? SemanticColors.onTint : themeColors.text },
                        ]}
                      >
                        {ch.nameAr}
                      </ThemedText>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            )}

            {step === 4 && (
              <View style={styles.formStep}>
                <TextInput
                  style={[styles.input, { borderColor: cardBorder, color: themeColors.text }]}
                  placeholder="عنوان الامتحان"
                  placeholderTextColor={themeColors.icon}
                  value={title}
                  onChangeText={setTitle}
                />
                <TextInput
                  style={[styles.input, styles.inputArea, { borderColor: cardBorder, color: themeColors.text }]}
                  placeholder="وصف (اختياري)"
                  placeholderTextColor={themeColors.icon}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={2}
                />
                {!hidePrice && (
                  <ThemedText style={styles.priceText}>
                    السعر الإجمالي: {getPriceFromQuestionCount(questionCount)} جنيه
                  </ThemedText>
                )}
                <TouchableOpacity
                  onPress={handlePickScreenshot}
                  style={[styles.uploadBtn, { borderColor: themeColors.tint }]}
                >
                  <MaterialIcons name="add-photo-alternate" size={24} color={themeColors.tint} />
                  <ThemedText style={[styles.uploadBtnText, { color: themeColors.tint }]}>
                    {transferScreenshot ? 'تم اختيار الصورة' : 'صورة إثبات التحويل'}
                  </ThemedText>
                </TouchableOpacity>
                {transferScreenshot && (
                  <TouchableOpacity onPress={() => setTransferScreenshot(null)}>
                    <ThemedText style={styles.removePhoto}>إزالة الصورة</ThemedText>
                  </TouchableOpacity>
                )}
              </View>
            )}

            <View style={styles.actionsRow}>
              {step > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    if (step === 3) setSelectedChapters([]);
                    setStep((s) => s - 1);
                  }}
                  style={[styles.secondaryBtn, { borderColor: themeColors.tint }]}
                >
                  <ThemedText style={[styles.secondaryBtnText, { color: themeColors.tint }]}>
                    رجوع
                  </ThemedText>
                </TouchableOpacity>
              )}
            </View>
          </>
        ) : (
          <ThemedText style={styles.doneSubtext}>
            سنُعدّ الامتحان حسب اختياراتك قريباً
          </ThemedText>
        )}

        {/* زر التالي / أنشئ الامتحان — بعرض كامل */}
        {!isDone && (
          <TouchableOpacity
            onPress={handleNext}
            disabled={!canProceed || isBuilding}
            style={[
              styles.nextButton,
              { backgroundColor: themeColors.cta },
              (!canProceed || isBuilding) && styles.nextButtonDisabled,
            ]}
          >
            {isBuilding ? (
              <ActivityIndicator color={SemanticColors.onTint} />
            ) : (
              <ThemedText style={styles.nextButtonText}>
                {step < 4 ? 'التالي' : 'أنشئ الامتحان'}
              </ThemedText>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 48,
    gap: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    paddingTop: 20,
  },
  bubbleWrap: {
    alignItems: 'center',
    marginBottom: 0,
  },
  bubble: {
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 20,
    maxWidth: '92%',
    alignSelf: 'center',
  },
  bubbleText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  bubbleTailDown: {
    width: 0,
    height: 0,
    marginTop: -1,
    borderLeftWidth: 12,
    borderRightWidth: 12,
    borderTopWidth: 14,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  characterWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 24,
  },
  characterImage: {
    width: SCREEN_WIDTH * 0.6,
    height: CHARACTER_HEIGHT,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
    marginBottom: 24,
    justifyContent: 'space-between',
  },
  optionCard: {
    width: CARD_SIZE,
    minHeight: 72,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionCardText: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  optionCardIcon: {
    marginLeft: 8,
  },
  sectionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
    marginBottom: 24,
    justifyContent: 'space-between',
  },
  sectionsLoading: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 24,
    gap: 10,
  },
  sectionsLoadingText: {
    fontSize: 14,
    opacity: 0.8,
  },
  sectionsEmpty: {
    width: '100%',
    textAlign: 'center',
    paddingVertical: 24,
    fontSize: 15,
    opacity: 0.8,
  },
  sectionCard: {
    width: CARD_SIZE,
    minHeight: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionCardText: {
    fontSize: 15,
    fontWeight: '600',
  },
  formStep: {
    marginBottom: 24,
    gap: 14,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  inputArea: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  paidRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderRadius: 12,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '600',
    marginVertical: 4,
  },
  paidLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: SemanticColors.overlayLight,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  toggleDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignSelf: 'flex-start',
  },
  toggleDotOn: {
    alignSelf: 'flex-end',
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderWidth: 2,
    borderRadius: 12,
  },
  uploadBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  removePhoto: {
    fontSize: 13,
    opacity: 0.8,
    color: SemanticColors.error,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  secondaryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 14,
    borderWidth: 2,
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  nextButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonText: {
    color: SemanticColors.onTint,
    fontSize: 17,
    fontWeight: '700',
  },
  doneSubtext: {
    fontSize: 14,
    opacity: 0.85,
    textAlign: 'center',
    marginBottom: 24,
  },
});
