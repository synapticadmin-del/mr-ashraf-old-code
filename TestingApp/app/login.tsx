import { toast } from '@/hooks/use-toast';
import { useParentLoginMutation, useStudentLoginMutation } from '@/store/api/apiSlice';
import { studentStorage, tokenStorage } from '@/utils/tokenStorage';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const PrimaryBlue = '#1A73E8';
const EmeraldGreen = '#10B981';
const ButtonOrange = '#FF6F00';
const ButtonYellow = '#F6A500';
const TaglineGray = '#5F6368';
const SegmentInactiveBg = '#E8EAED';

export default function LoginScreen() {
  const router = useRouter();
  const [studentLogin, { isLoading: isStudentLoading }] = useStudentLoginMutation();
  const [parentLogin, { isLoading: isParentLoading }] = useParentLoginMutation();
  const [isParentMode, setIsParentMode] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    password: '',
  });

  const isLoading = isStudentLoading || isParentLoading;

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleLogin = async () => {
    if (!formData.code.trim()) {
      toast({
        title: 'خطأ',
        description: 'يرجى إدخال الكود',
      });
      return;
    }

    if (!formData.password.trim()) {
      toast({
        title: 'خطأ',
        description: 'يرجى إدخال كلمة المرور',
      });
      return;
    }

    try {
      if (isParentMode) {
        const response = await parentLogin({
          code: formData.code,
          password: formData.password,
        }).unwrap();

        if (response.success) {
          const token = response.token || response.data?.token;
          if (token) {
            await tokenStorage.setToken(token);
          }

          toast({
            title: 'نجاح',
            description: response.message || 'تم تسجيل الدخول بنجاح',
          });

          const studentId = response.data?.student?.id;
          if (studentId) {
            router.replace({
              pathname: '/parent-home',
              params: { studentId },
            });
          } else {
            router.replace('/parent-home');
          }
        } else {
          toast({
            title: 'خطأ',
            description: response.message || 'حدث خطأ أثناء تسجيل الدخول',
          });
        }
      } else {
        const response = await studentLogin({
          code: formData.code,
          password: formData.password,
        }).unwrap();

        if (response.success) {
          const token = response.token || response.data?.token;
          if (token) {
            await tokenStorage.setToken(token);
          }

          if (response.data?.student) {
            await studentStorage.setStudent(response.data.student);
          }

          toast({
            title: 'نجاح',
            description: response.message || 'تم تسجيل الدخول بنجاح',
          });
          router.replace('/(tabs)/profile');
        } else {
          toast({
            title: 'خطأ',
            description: response.message || 'حدث خطأ أثناء تسجيل الدخول',
          });
        }
      }
    } catch (error: any) {
      const errorMessage =
        'data' in error
          ? (error.data as any)?.message
          : 'حدث خطأ أثناء تسجيل الدخول';
      toast({
        title: 'خطأ',
        description: errorMessage,
      });
    }
  };

  return (
    <ImageBackground
      source={require('../assets/images/login_bg.jpeg')}
      style={styles.container}
      resizeMode="cover"
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.overlay}>
          {/* EduSky logo + tagline */}
       

          {/* Student / Parent segmented control */}
          <View style={styles.modeToggle}>
            <TouchableOpacity
              style={[
                styles.modeButton,
                styles.modeButtonLeft,
                !isParentMode && styles.modeButtonActive,
                { backgroundColor: !isParentMode ? PrimaryBlue : 'transparent' },
              ]}
              onPress={() => setIsParentMode(false)}
            >
              <Text
                style={[
                  styles.modeButtonText,
                  { color: !isParentMode ? '#fff' : TaglineGray },
                ]}
              >
                Student
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modeButton,
                styles.modeButtonRight,
                isParentMode && styles.modeButtonActive,
                { backgroundColor: isParentMode ? PrimaryBlue : 'transparent' },
              ]}
              onPress={() => setIsParentMode(true)}
            >
              <Text
                style={[
                  styles.modeButtonText,
                  { color: isParentMode ? '#fff' : TaglineGray },
                ]}
              >
                Parent
              </Text>
            </TouchableOpacity>
          </View>

          {/* Inputs - white, rounded, icon on left */}
          <View style={styles.inputWrapper}>
            <MaterialIcons
              name="badge"
              size={20}
              color={TaglineGray}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              value={formData.code}
              onChangeText={(value) => handleInputChange('code', value)}
              placeholder="Enter your access code"
              placeholderTextColor={TaglineGray}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputWrapper}>
            <MaterialIcons
              name="lock"
              size={20}
              color={TaglineGray}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              value={formData.password}
              onChangeText={(value) => handleInputChange('password', value)}
              placeholder="Enter your password"
              placeholderTextColor={TaglineGray}
              secureTextEntry
            />
          </View>

          {/* Log In button - gradient orange to yellow */}
          <TouchableOpacity
            style={styles.loginButtonWrap}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[ButtonOrange, ButtonYellow]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.loginButton, isLoading && styles.buttonDisabled]}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginButtonText}>Log In</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Sign up link */}
          <TouchableOpacity
            style={styles.registerLink}
            onPress={() => router.push('/register')}
            disabled={isLoading}
          >
            <Text style={styles.registerLinkText}>Don't have an account? </Text>
            <Text style={styles.registerLinkHighlight}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 80,
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    width: '100%',
    maxWidth: 360,
    // backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    // shadowColor: SemanticColors.shadow,
    // shadowOffset: { width: 0, height: 4 },
    // shadowOpacity: 0.15,
    // shadowRadius: 12,
    // elevation: 6,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoIcon: {
    width: 56,
    height: 56,
    marginBottom: 10,
  },
  logoTextRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 6,
  },
  logoEdu: {
    fontSize: 28,
    fontWeight: '700',
  },
  logoSky: {
    fontSize: 28,
    fontWeight: '700',
  },
  tagline1: {
    fontSize: 11,
    fontWeight: '600',
    color: TaglineGray,
    letterSpacing: 1.2,
  },
  taglineLine: {
    width: 24,
    height: 2,
    backgroundColor: PrimaryBlue,
    marginVertical: 4,
    borderRadius: 1,
  },
  tagline2: {
    fontSize: 11,
    fontWeight: '600',
    color: TaglineGray,
    letterSpacing: 1.2,
  },
  modeToggle: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: SegmentInactiveBg,
    borderRadius: 999,
    padding: 4,
    marginBottom: 24,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeButtonLeft: {
    borderTopLeftRadius: 999,
    borderBottomLeftRadius: 999,
  },
  modeButtonRight: {
    borderTopRightRadius: 999,
    borderBottomRightRadius: 999,
  },
  modeButtonActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  modeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 52,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#DADCE0',
    borderRadius: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#202124',
    paddingVertical: 0,
  },
  loginButtonWrap: {
    width: '100%',
    marginTop: 8,
  },
  loginButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  registerLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  registerLinkText: {
    fontSize: 16,
    color: TaglineGray,
  },
  registerLinkHighlight: {
    fontSize: 16,
    fontWeight: '600',
    color: PrimaryBlue,
  },
});
