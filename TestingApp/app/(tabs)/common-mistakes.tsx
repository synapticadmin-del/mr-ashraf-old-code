import { NewsSlider } from '@/components/news-slider';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, SemanticColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useGetCommonExamMistakesQuery } from '@/store/api/apiSlice';
import type { CommonExamMistake } from '@/store/api/apiSlice';
import { MaterialIcons } from '@expo/vector-icons';
import { useMemo } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

export default function CommonMistakesScreen() {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];
  const { data, isLoading, error, refetch, isFetching } = useGetCommonExamMistakesQuery();

  const items = useMemo(() => {
    if (!data?.data) return [];
    return [...data.data]
      .filter((m) => m.published)
      .sort((a, b) => a.order - b.order);
  }, [data?.data]);

  const refreshControl = (
    <RefreshControl
      refreshing={isFetching}
      onRefresh={refetch}
      tintColor={themeColors.tint}
      colors={[themeColors.tint]}
    />
  );

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={themeColors.tint} />
          <ThemedText style={styles.loaderText}>جاري تحميل الأخطاء الشائعة...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.centered}>
          <MaterialIcons name="error-outline" size={56} color={themeColors.icon} />
          <ThemedText style={styles.errorText}>حدث خطأ أثناء تحميل المحتوى</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={refreshControl}
      >
        <NewsSlider />

        <View style={styles.header}>
          <View style={[styles.headerIconWrap, { backgroundColor: SemanticColors.warning + '22' }]}>
            <MaterialIcons name="warning" size={40} color={SemanticColors.warning} />
          </View>
          <ThemedText type="title" style={styles.screenTitle}>
            الأخطاء الشائعة
          </ThemedText>
          <ThemedText style={[styles.screenSubtitle, { color: themeColors.icon }]}>
            تعرّف على الأخطاء المتكررة في الامتحانات وكيفية تجنبها
          </ThemedText>
        </View>

        {items.length === 0 ? (
          <View style={styles.emptyWrap}>
            <MaterialIcons name="check-circle-outline" size={64} color={themeColors.icon} />
            <ThemedText style={[styles.emptyText, { color: themeColors.icon }]}>
              لا توجد أخطاء شائعة متاحة حالياً
            </ThemedText>
          </View>
        ) : (
          <View style={styles.list}>
            {items.map((item, index) => (
              <CommonMistakeCard
                key={item.id}
                item={item}
                index={index}
                themeColors={themeColors}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

function CommonMistakeCard({
  item,
  index,
  themeColors,
}: {
  item: CommonExamMistake;
  index: number;
  themeColors: (typeof Colors.light);
}) {
  return (
    <ThemedView
      style={[
        styles.card,
        {
          backgroundColor: themeColors.card,
          borderColor: themeColors.icon + '25',
          borderRightWidth: 4,
          borderRightColor: SemanticColors.warning,
        },
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.orderBadge, { backgroundColor: SemanticColors.warning + '22' }]}>
          <ThemedText style={[styles.orderText, { color: SemanticColors.warning }]}>
            {index + 1}
          </ThemedText>
        </View>
        {item.subject ? (
          <View style={[styles.subjectBadge, { backgroundColor: themeColors.tint + '18' }]}>
            <ThemedText style={[styles.subjectText, { color: themeColors.tint }]}>
              {item.subject}
            </ThemedText>
          </View>
        ) : null}
      </View>
      <ThemedText type="subtitle" style={[styles.cardTitle, { color: themeColors.text }]}>
        {item.title}
      </ThemedText>
      <ThemedText
        style={[styles.cardContent, { color: themeColors.text, opacity: 0.9 }]}
        numberOfLines={undefined}
      >
        {item.content}
      </ThemedText>
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loaderText: {
    marginTop: 16,
    fontSize: 16,
    opacity: 0.8,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    opacity: 0.8,
    textAlign: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  headerIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  screenTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  screenSubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  list: {
    gap: 16,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    shadowColor: SemanticColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  orderBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderText: {
    fontSize: 14,
    fontWeight: '700',
  },
  subjectBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  subjectText: {
    fontSize: 13,
    fontWeight: '600',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
    lineHeight: 26,
  },
  cardContent: {
    fontSize: 15,
    lineHeight: 24,
  },
});
