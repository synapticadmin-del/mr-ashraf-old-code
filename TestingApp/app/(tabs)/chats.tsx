import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { NewsSlider } from '@/components/news-slider';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, SemanticColors } from '@/constants/theme';
import {
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  View,
  Animated,
  Alert,
  RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useState, useEffect, useRef } from 'react';
import { useGetStudentQuery } from '@/store/api/apiSlice';
import { getStudentIdFromToken } from '@/utils/tokenUtils';
import { Audio } from 'expo-av';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderType: 'student' | 'teacher';
  message: string;
  timestamp: Date;
  audioUri?: string;
  isAudio?: boolean;
}

export default function ChatsScreen() {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];
  const [studentId, setStudentId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      senderId: 'teacher-1',
      senderName: 'أستاذ أحمد',
      senderType: 'teacher',
      message: 'مرحباً بكم جميعاً في المجموعة! أتمنى أن تكونوا مستعدين للدراسة اليوم.',
      timestamp: new Date(Date.now() - 3600000),
    },
    {
      id: '2',
      senderId: 'student-1',
      senderName: 'محمد',
      senderType: 'student',
      message: 'شكراً أستاذ، نحن مستعدون!',
      timestamp: new Date(Date.now() - 3300000),
    },
    {
      id: '3',
      senderId: 'student-2',
      senderName: 'فاطمة',
      senderType: 'student',
      message: 'هل يمكنك توضيح الدرس السابق؟',
      timestamp: new Date(Date.now() - 3000000),
    },
    {
      id: '4',
      senderId: 'teacher-1',
      senderName: 'أستاذ أحمد',
      senderType: 'teacher',
      message: 'بالطبع، سأقوم بشرح الدرس مرة أخرى في الساعة القادمة.',
      timestamp: new Date(Date.now() - 2700000),
    },
    {
      id: '5',
      senderId: 'student-3',
      senderName: 'علي',
      senderType: 'student',
      message: 'ممتاز! شكراً جزيلاً',
      timestamp: new Date(Date.now() - 2400000),
    },
  ]);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadStudentId();
    // Request audio permissions
    (async () => {
      try {
        await Audio.requestPermissionsAsync();
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
        });
      } catch (err) {
        console.error('Failed to get audio permissions', err);
      }
    })();

    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      if (sound) {
        sound.unloadAsync();
      }
      if (recording) {
        recording.stopAndUnloadAsync();
      }
    };
  }, []);

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const loadStudentId = async () => {
    try {
      const id = await getStudentIdFromToken();
      setStudentId(id);
    } catch (error) {
      console.error('Error loading student ID:', error);
    }
  };

  const {
    data: studentResponse,
    isLoading: isLoadingStudent,
    refetch: refetchStudent,
    isFetching: isFetchingStudent,
  } = useGetStudentQuery(studentId!, {
    skip: !studentId,
  });

  const currentStudent = studentResponse?.data;

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const startRecording = async () => {
    try {
      // Check permissions first
      const permissionResponse = await Audio.requestPermissionsAsync();
      if (permissionResponse.status !== 'granted') {
        Alert.alert('صلاحيات', 'يجب السماح بالوصول إلى الميكروفون');
        return;
      }

      // Stop any existing recording safely
      if (recording) {
        try {
          const status = await recording.getStatusAsync();
          if (status.isRecording) {
            await recording.stopAndUnloadAsync();
          } else if (!status.canRecord) {
            // Already stopped, just unload if needed
            try {
              await recording.unloadAsync();
            } catch (e) {
              // Ignore if already unloaded
            }
          }
        } catch (e) {
          // Ignore errors when stopping existing recording
          console.log('Error stopping existing recording:', e);
        }
        setRecording(null);
      }

      // Set audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      // Create recording with proper options
      const recordingOptions = {
        ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
        android: {
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000,
        },
      };

      // Create and start recording
      const { recording: newRecording } = await Audio.Recording.createAsync(
        recordingOptions
      );

      setRecording(newRecording);
      setIsRecording(true);
      setRecordingDuration(0);

      // Start pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Start timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('خطأ', `فشل في بدء التسجيل: ${err instanceof Error ? err.message : 'خطأ غير معروف'}`);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
      pulseAnim.setValue(1);

      // Check status before stopping
      const status = await recording.getStatusAsync();
      let uri: string | null = null;

      if (status.isRecording) {
        await recording.stopAndUnloadAsync();
        uri = recording.getURI();
      } else {
        // Already stopped, just get URI
        uri = recording.getURI();
        try {
          await recording.unloadAsync();
        } catch (e) {
          // Ignore if already unloaded
        }
      }

      if (uri && currentStudent) {
        // Create audio message
        const audioMessage: Message = {
          id: Date.now().toString(),
          senderId: currentStudent.id,
          senderName: currentStudent.username,
          senderType: 'student',
          message: `رسالة صوتية (${formatDuration(recordingDuration)})`,
          timestamp: new Date(),
          audioUri: uri,
          isAudio: true,
        };

        setMessages([...messages, audioMessage]);

        // Simulate teacher response
        setTimeout(() => {
          const teacherResponse: Message = {
            id: (Date.now() + 1).toString(),
            senderId: 'teacher-1',
            senderName: 'أستاذ أحمد',
            senderType: 'teacher',
            message: 'شكراً على الرسالة الصوتية!',
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, teacherResponse]);
        }, 2000);
      }

      setRecording(null);
      setRecordingDuration(0);
    } catch (err) {
      console.error('Failed to stop recording', err);
      Alert.alert('خطأ', 'فشل في إيقاف التسجيل');
      setRecording(null);
      setIsRecording(false);
      setRecordingDuration(0);
    }
  };

  const cancelRecording = async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
      pulseAnim.setValue(1);

      // Check status before stopping
      try {
        const status = await recording.getStatusAsync();
        if (status.isRecording) {
          await recording.stopAndUnloadAsync();
        } else {
          try {
            await recording.unloadAsync();
          } catch (e) {
            // Ignore if already unloaded
          }
        }
      } catch (e) {
        // Ignore errors when canceling
        console.log('Error canceling recording:', e);
      }

      setRecording(null);
      setRecordingDuration(0);
    } catch (err) {
      console.error('Failed to cancel recording', err);
      setRecording(null);
      setIsRecording(false);
      setRecordingDuration(0);
    }
  };

  const playAudio = async (uri: string) => {
    try {
      if (sound) {
        await sound.unloadAsync();
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true }
      );

      setSound(newSound);
      setPlayingAudio(uri);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setPlayingAudio(null);
          newSound.unloadAsync();
        }
      });
    } catch (err) {
      console.error('Failed to play audio', err);
      Alert.alert('خطأ', 'فشل في تشغيل الصوت');
    }
  };

  const stopAudio = async () => {
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
      setSound(null);
      setPlayingAudio(null);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSendMessage = () => {
    if (!messageText.trim() || !currentStudent) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: currentStudent.id,
      senderName: currentStudent.username,
      senderType: 'student',
      message: messageText.trim(),
      timestamp: new Date(),
    };

    setMessages([...messages, newMessage]);
    setMessageText('');

    setTimeout(() => {
      const teacherResponse: Message = {
        id: (Date.now() + 1).toString(),
        senderId: 'teacher-1',
        senderName: 'أستاذ أحمد',
        senderType: 'teacher',
        message: 'شكراً على مشاركتك! سأرد عليك قريباً.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, teacherResponse]);
    }, 2000);
  };

  const isCurrentUser = (message: Message) => {
    return (
      message.senderType === 'student' &&
      message.senderId === currentStudent?.id
    );
  };

  return (
    <KeyboardAvoidingView
      style={[
        styles.container,
        { backgroundColor: themeColors.surfaceDarker },
      ]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* News Slider */}
      <View style={styles.newsSliderContainer}>
        <NewsSlider />
      </View>

      {/* Simple Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor:
              themeColors.card,
            borderBottomColor: themeColors.borderStrong,
          },
        ]}
      >
        <View style={styles.headerContent}>
          <View
            style={[
              styles.avatarContainer,
              { backgroundColor: themeColors.tint + '15' },
            ]}
          >
            <MaterialIcons
              name="groups"
              size={22}
              color={themeColors.tint}
            />
          </View>
          <View style={styles.headerText}>
            <ThemedText style={styles.headerTitle}>
              مجموعة الطلاب والمعلم
            </ThemedText>
            <ThemedText style={styles.headerSubtitle}>
              {messages.length} رسالة
            </ThemedText>
          </View>
        </View>
      </View>

      {/* Messages List */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isFetchingStudent}
            onRefresh={refetchStudent}
            tintColor={themeColors.tint}
            colors={[themeColors.tint]}
          />
        }
      >
        {messages.map((message, index) => {
          const isUser = isCurrentUser(message);
          const isTeacher = message.senderType === 'teacher';
          const showAvatar = !isUser && index === 0 || 
            (index > 0 && messages[index - 1].senderId !== message.senderId);

          return (
            <View
              key={message.id}
              style={[
                styles.messageRow,
                isUser && styles.messageRowRight,
              ]}
            >
              {!isUser && showAvatar && (
                <View
                  style={[
                    styles.avatar,
                    {
                      backgroundColor: isTeacher
                        ? themeColors.tint + '20'
                        : colorScheme === 'dark'
                        ? themeColors.input
                        : themeColors.borderStrong,
                    },
                  ]}
                >
                  <MaterialIcons
                    name={isTeacher ? 'school' : 'person'}
                    size={18}
                    color={isTeacher ? themeColors.tint : themeColors.icon}
                  />
                </View>
              )}
              {!isUser && !showAvatar && <View style={styles.avatarSpacer} />}
              
              <View
                style={[
                  styles.messageBubble,
                  {
                    backgroundColor: isUser
                      ? themeColors.tint
                      : isTeacher
                      ? themeColors.tint + '15'
                      : colorScheme === 'dark'
                      ? themeColors.bubbleOther
                      : themeColors.bubbleOther,
                    borderTopLeftRadius: isUser ? 20 : 4,
                    borderTopRightRadius: isUser ? 4 : 20,
                  },
                ]}
              >
                {!isUser && (
                  <ThemedText
                    style={[
                      styles.senderName,
                      {
                        color: isTeacher
                          ? themeColors.tint
                          : themeColors.text,
                      },
                    ]}
                  >
                    {message.senderName}
                  </ThemedText>
                )}
                {message.isAudio && message.audioUri ? (
                  <View style={styles.audioContainer}>
                    <TouchableOpacity
                      style={[
                        styles.audioButton,
                        {
                          backgroundColor: isUser
                            ? SemanticColors.onTintAlpha20
                            : themeColors.tint + '20',
                        },
                      ]}
                      onPress={() => {
                        if (playingAudio === message.audioUri) {
                          stopAudio();
                        } else {
                          playAudio(message.audioUri!);
                        }
                      }}
                    >
                      <MaterialIcons
                        name={
                          playingAudio === message.audioUri
                            ? 'pause'
                            : 'play-arrow'
                        }
                        size={24}
                        color={isUser ? SemanticColors.onTint : themeColors.tint}
                      />
                      <ThemedText
                        style={[
                          styles.audioDuration,
                          {
                            color: isUser
                              ? SemanticColors.onTint
                              : themeColors.text,
                          },
                        ]}
                      >
                        {message.message.match(/\(([^)]+)\)/)?.[1] || '0:00'}
                      </ThemedText>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <ThemedText
                    style={[
                      styles.messageText,
                      {
                        color: isUser
                          ? SemanticColors.onTint
                          : themeColors.text,
                      },
                    ]}
                  >
                    {message.message}
                  </ThemedText>
                )}
                <ThemedText
                  style={[
                    styles.messageTime,
                    {
                      color: isUser
                        ? SemanticColors.onTintAlpha70
                        : themeColors.icon,
                    },
                  ]}
                >
                  {formatTime(message.timestamp)}
                </ThemedText>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Input Area */}
      <View
        style={[
          styles.inputArea,
          {
            backgroundColor:
              themeColors.card,
            borderTopColor: themeColors.borderStrong,
          },
        ]}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={[
              styles.textInput,
              {
                color: themeColors.text,
                backgroundColor:
                  themeColors.surfaceDarker,
              },
            ]}
            placeholder="اكتب رسالتك..."
            placeholderTextColor={themeColors.icon + '80'}
            value={messageText}
            onChangeText={setMessageText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              {
                backgroundColor:
                  messageText.trim() && currentStudent
                    ? themeColors.tint
                    : colorScheme === 'dark'
                    ? themeColors.input
                    : themeColors.borderStrong,
              },
            ]}
            onPress={handleSendMessage}
            disabled={!messageText.trim() || !currentStudent || isLoadingStudent}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name="send"
              size={20}
              color={
                messageText.trim() && currentStudent
                  ? SemanticColors.onTint
                  : themeColors.icon + '60'
              }
            />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  newsSliderContainer: {
    paddingTop: 8,
    paddingBottom: 8,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    opacity: 0.6,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 20,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
    gap: 8,
  },
  messageRowRight: {
    flexDirection: 'row-reverse',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  avatarSpacer: {
    width: 32,
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  senderName: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 4,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  inputArea: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 20 : 16,
    borderTopWidth: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  textInput: {
    flex: 1,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 15,
    maxHeight: 100,
    minHeight: 48,
    textAlignVertical: 'top',
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 20 : 16,
    borderTopWidth: 1,
    gap: 12,
  },
  recordingButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingInfo: {
    flex: 1,
    marginLeft: 8,
  },
  recordingText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  recordingDuration: {
    fontSize: 12,
    opacity: 0.6,
  },
  cancelButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: SemanticColors.errorAlpha20,
  },
  sendRecordButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioContainer: {
    marginTop: 4,
  },
  audioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
    minWidth: 120,
  },
  audioDuration: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
});
