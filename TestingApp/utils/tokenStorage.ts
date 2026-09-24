import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = '@auth_token';
const STUDENT_KEY = '@student_data';

export interface CurrentPlan {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
}

export interface StudentData {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  country?: string;
  userType?: string;
  username: string;
  phoneNumber?: string;
  image: string;
  birthday: string;
  studentCode: string;
  educationalStageId: string;
  level: number;
  totalPoints: number;
  createdAt: string;
  updatedAt: string;
  stats?: {
    currentPlan?: CurrentPlan;
    numberOfExams?: number;
    numberOfPurchasedExams?: number;
    totalPoints?: number;
    successPercentage?: number;
    failedPercentage?: number;
  };
}

export const tokenStorage = {
  async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(TOKEN_KEY);
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  },

  async setToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(TOKEN_KEY, token);
    } catch (error) {
      console.error('Error setting token:', error);
    }
  },

  async removeToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
    } catch (error) {
      console.error('Error removing token:', error);
    }
  },
};

export const studentStorage = {
  async getStudent(): Promise<StudentData | null> {
    try {
      const studentJson = await AsyncStorage.getItem(STUDENT_KEY);
      return studentJson ? JSON.parse(studentJson) : null;
    } catch (error) {
      console.error('Error getting student:', error);
      return null;
    }
  },

  async setStudent(student: StudentData): Promise<void> {
    try {
      await AsyncStorage.setItem(STUDENT_KEY, JSON.stringify(student));
    } catch (error) {
      console.error('Error setting student:', error);
    }
  },

  async removeStudent(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STUDENT_KEY);
    } catch (error) {
      console.error('Error removing student:', error);
    }
  },
};
