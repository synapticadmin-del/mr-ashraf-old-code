import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, SemanticColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { NewsItemApi } from '@/store/api/apiSlice';
import { useGetNewsQuery } from '@/store/api/apiSlice';
import { MaterialIcons } from '@expo/vector-icons';
import { useMemo, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  View,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';

export interface NewsItem {
  id: string;
  title: string;
  description?: string;
  icon: keyof typeof MaterialIcons.glyphMap;
}

const NEWS_ICONS: (keyof typeof MaterialIcons.glyphMap)[] = [
  'event',
  'campaign',
  'notifications',
  'newspaper',
  'info',
  'star',
  'lightbulb',
  'school',
  'article',
  'announcement',
  'campaign',
  'notifications-active',
  'favorite',
  'eco',
  'psychology',
];

function getIconForNewsId(id: string): keyof typeof MaterialIcons.glyphMap {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % NEWS_ICONS.length;
  return NEWS_ICONS[index];
}

function mapApiNewsToItems(apiData: NewsItemApi[]): NewsItem[] {
  return (apiData ?? [])
    .filter((item) => item.published)
    .map((item) => ({
      id: item.id,
      title: item.title,
      description: item.content || undefined,
      icon: getIconForNewsId(item.id),
    }));
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SLIDE_WIDTH = SCREEN_WIDTH - 40;
const SLIDE_MARGIN = 20;
const SLIDE_INTERVAL = SLIDE_WIDTH + SLIDE_MARGIN;
const LIST_PADDING = 20;
/** Time each slide stays visible before advancing (ms) - same on Android & iOS */
const SLIDE_DISPLAY_MS = 7000;

export function NewsSlider() {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];
  const { data: newsData, isLoading } = useGetNewsQuery();
  const news = useMemo(
    () => mapApiNewsToItems(newsData?.data ?? []),
    [newsData?.data]
  );
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollPositionRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isUserScrollingRef = useRef(false);

  const startTimer = () => {
    if (news.length <= 1) return;
    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = prev + 1 >= news.length ? 0 : prev + 1;
        const offset = LIST_PADDING + next * SLIDE_INTERVAL;
        scrollPositionRef.current = offset;
        flatListRef.current?.scrollToOffset({ offset, animated: true });
        return next;
      });
    }, SLIDE_DISPLAY_MS);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    if (news.length <= 1) return;
    if (!isUserScrollingRef.current) startTimer();
    return stopTimer;
  }, [news.length]);

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    scrollPositionRef.current = contentOffsetX;
    const index = Math.min(
      news.length - 1,
      Math.max(0, Math.round((contentOffsetX - LIST_PADDING) / SLIDE_INTERVAL))
    );
    setCurrentIndex(index);
  };

  const onScrollBeginDrag = () => {
    isUserScrollingRef.current = true;
    stopTimer();
  };

  const onScrollEndDrag = () => {
    isUserScrollingRef.current = false;
    if (news.length > 1) startTimer();
  };

  const onMomentumScrollEnd = () => {
    isUserScrollingRef.current = false;
    if (news.length > 1) startTimer();
  };

  const renderNewsItem = ({ item }: { item: NewsItem }) => {
    return (
      <ThemedView
        style={[
          styles.slide,
          {
            backgroundColor:
              themeColors.card,
            borderColor: themeColors.tint + '30',
          },
        ]}
      >
        <ThemedView
          style={[
            styles.iconContainer,
            { backgroundColor: themeColors.tint + '20' },
          ]}
        >
          <MaterialIcons
            name={item.icon}
            size={24}
            color={themeColors.tint}
          />
        </ThemedView>
        <ThemedView style={styles.textContainer}>
          <ThemedText style={styles.title}>{item.title}</ThemedText>
          {item.description && (
            <ThemedText style={styles.description}>{item.description}</ThemedText>
          )}
        </ThemedView>
        <MaterialIcons
          name="chevron-left"
          size={20}
          color={themeColors.icon}
          style={styles.chevron}
        />
      </ThemedView>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="small" color={themeColors.tint} />
      </View>
    );
  }

  if (news.length === 0) return null;

  const getItemLayout = (_: unknown, index: number) => ({
    length: SLIDE_INTERVAL,
    offset: LIST_PADDING + SLIDE_INTERVAL * index,
    index,
  });

  return (
    <ThemedView style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={news}
        renderItem={renderNewsItem}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        scrollEnabled={true}
        onScrollBeginDrag={onScrollBeginDrag}
        onScrollEndDrag={onScrollEndDrag}
        onMomentumScrollEnd={onMomentumScrollEnd}
        snapToOffsets={news.map((_, i) => LIST_PADDING + i * SLIDE_INTERVAL)}
        decelerationRate="fast"
        contentContainerStyle={styles.listContent}
        getItemLayout={getItemLayout}
        onScrollToIndexFailed={() => {
          setTimeout(() => {
            flatListRef.current?.scrollToOffset({
              offset: currentIndex * SLIDE_INTERVAL,
              animated: false,
            });
          }, 100);
        }}
      />
      {news.length > 1 && (
        <ThemedView style={styles.dotsContainer}>
          {news.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    index === currentIndex
                      ? themeColors.tint
                      : themeColors.icon + '40',
                },
              ]}
            />
          ))}
        </ThemedView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  listContent: {
    paddingHorizontal: 20,
  },
  slide: {
    width: SLIDE_WIDTH,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: SemanticColors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginRight: 20,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    opacity: 0.7,
    lineHeight: 18,
  },
  chevron: {
    marginLeft: 8,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  loaderContainer: {
    marginBottom: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
