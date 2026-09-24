import { BASE_URL } from '@/constants/config';
import { tokenStorage } from '@/utils/tokenStorage';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface Country {
  id: string;
  name: string;
  code: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface City {
  id: string;
  name: string;
  countryId: string;
  country: {
    id: string;
    name: string;
    code: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface EducationalStage {
  id: string;
  nameAr: string;
  nameEn: string;
  description: string;
  order: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface EducationalMaterial {
  id: string;
  nameAr: string;
  nameEn: string;
  description: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface QualityOfEducation {
  id: string;
  nameAr: string;
  nameEn: string;
  description: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CountriesResponse {
  success: boolean;
  data: Country[];
  message: string;
}

export interface CitiesResponse {
  success: boolean;
  data: City[];
  message: string;
}

export interface EducationalStagesResponse {
  success: boolean;
  data: EducationalStage[];
  message: string;
}

export interface EducationalMaterialsResponse {
  success: boolean;
  data: EducationalMaterial[];
  message: string;
}

export interface SubMaterial {
  id: string;
  nameAr: string;
  nameEn: string;
  description?: string;
  educationalMaterialId?: string;
  educationalMaterial?: { id: string; nameAr: string; nameEn: string };
  createdAt?: string;
  updatedAt?: string;
}

export interface SubMaterialsResponse {
  success: boolean;
  data: SubMaterial[];
  message: string;
}

export interface Chapter {
  id: string;
  nameAr: string;
  nameEn: string;
  subMaterialId: string;
  subMaterial?: {
    id: string;
    nameAr: string;
    nameEn: string;
    educationalMaterialId: string;
    educationalMaterial?: { id: string; nameAr: string; nameEn: string };
  };
  order?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ChaptersResponse {
  success: boolean;
  data: Chapter[];
  message: string;
}

export interface QualityOfEducationsResponse {
  success: boolean;
  data: QualityOfEducation[];
  message: string;
}

export interface TeacherRegistrationRequest {
  name: string;
  email: string;
  phone: string;
  country: string;
  countryId: string;
  educationalStageId: string;
  educationalMaterialId: string;
  qualityOfEducationId: string;
  cityId: string;
  password: string;
}

export interface TeacherRegistrationResponse {
  success: boolean;
  data?: any;
  message: string;
}

export interface LoginRequest {
  type: 'teacher' | 'student' | 'parent';
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  data?: any;
  message: string;
  token?: string;
}

export interface StudentRegistrationRequest {
  username: string;
  email: string;
  phoneNumber: string;
  birthday: string;
  educationalStageId: string;
  password: string;
  image?: any; // File/Image data
}

export interface StudentRegistrationResponse {
  success: boolean;
  data?: any;
  message: string;
}

export interface StudentLoginRequest {
  code: string;
  password: string;
}

export interface StudentData {
  id: string;
  username: string;
  phoneNumber: string;
  birthday: string;
  educationalStageId: string;
  studentCode: string;
  image: string;
  level: number;
  totalPoints: number;
  createdAt: string;
  updatedAt: string;
}

export interface StudentResponse {
  success: boolean;
  data: StudentData;
  message: string;
}

export interface StudentsResponse {
  success: boolean;
  data: StudentData[];
  message: string;
}

export interface StudentMistake {
  id: string;
  examId: string;
  examTitle: string;
  examResultId: string;
  questionIndex: number;
  question: string;
  options: string[];
  selectedAnswer: number;
  correctAnswer: number;
  points: number;
  submittedAt: string;
  createdAt: string;
}

export interface StudentMistakesResponse {
  success: boolean;
  data: StudentMistake[];
  message: string;
}

export interface BuyExamRequest {
  examId: string;
  studentId: string;
  address: string;
  transferScreenshot: any; // File/Image
}

export interface BuyExamResponse {
  success: boolean;
  data?: any;
  message: string;
}

export interface ExamPurchase {
  id: string;
  studentId: string;
  examId: string;
  examTitle: string;
  studentName: string;
  status: 'pending' | 'approved' | 'rejected';
  price: number;
  transferScreenshot: string;
  requestedAt: string;
  approvedAt?: string;
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApprovedExamsResponse {
  success: boolean;
  data: ExamPurchase[];
  message: string;
}

export interface ParentRegistrationRequest {
  name: string;
  phone: string;
  studentCode: string;
  password: string;
}

export interface ParentData {
  id: string;
  name: string;
  phone: string;
  parentCode: string;
  userType: string;
  createdAt: string;
  updatedAt: string;
}

export interface ParentRegistrationResponse {
  success: boolean;
  data: {
    parent: ParentData;
    student: {
      id: string;
      name: string;
      username: string;
      studentCode: string;
    };
    token: string;
  };
  message: string;
}

export interface ParentLoginRequest {
  code: string;
  password: string;
}

export interface ParentLoginResponse {
  success: boolean;
  data?: {
    parent: ParentData;
    student: {
      id: string;
      name: string;
      username: string;
      studentCode: string;
    };
    token: string;
  };
  token?: string;
  message: string;
}

export interface StudentLoginResponse {
  success: boolean;
  data?: {
    student: StudentData;
    token: string;
  };
  message: string;
  token?: string;
}

export interface ExamQuestion {
  type?: string;
  question: string;
  options: string[];
  correctAnswer: number;
  points: number;
}

export interface Exam {
  id: string;
  title: string;
  description: string;
  duration: number;
  totalPoints: number;
  questions: ExamQuestion[];
  educationalMaterialId?: string;
  subMaterialId?: string;
  isPaid?: boolean;
  price?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ExamsResponse {
  success: boolean;
  data: Exam[];
  message: string;
}

export interface SolveExamRequest {
  answers: number[];
}

export interface ExamResultAnswer {
  questionIndex: number;
  selectedAnswer: number;
  isCorrect: boolean;
  pointsEarned: number;
  correctAnswer: number;
  question: string;
  options: string[];
  correctAnswerReason?: string;
}

export interface ExamResult {
  id: string;
  examId: string;
  studentId: string;
  totalScore: number;
  totalPoints: number;
  percentage: number;
  answers: ExamResultAnswer[];
  submittedAt: string;
  createdAt: string;
}

export interface SolveExamResponse {
  success: boolean;
  data: {
    result: ExamResult;
  };
  message: string;
}

export interface ColorsData {
  id: string;
  mainColor: string;
  secondColor: string;
  textMainColor: string;
  textSecondColor: string;
  sidebarBg: string;
  sidebarText: string;
  logo: string;
  logoText: string;
  logoTextColor: string;
  createdAt: string;
  updatedAt: string;
}

export interface ColorsResponse {
  success: boolean;
  data: ColorsData;
  message: string;
}

export interface BuildExamRequestResponse {
  success: boolean;
  data?: any;
  message: string;
}

export interface TabConfigItem {
  key: string;
  titleAr: string;
  titleEn: string;
  icon: string;
  order: number;
  isVisible: boolean;
}

export interface TabsConfigData {
  id: string;
  tabs: TabConfigItem[];
  createdAt: string;
  updatedAt: string;
}

export interface TabsConfigResponse {
  success: boolean;
  data: TabsConfigData;
  message: string;
}

export interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  features: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PlansResponse {
  success: boolean;
  data: Plan[];
  message: string;
}

export interface PlanPurchaseRequestResponse {
  success: boolean;
  data?: unknown;
  message: string;
}

export interface NewsItemApi {
  id: string;
  title: string;
  content: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NewsResponse {
  success: boolean;
  data: NewsItemApi[];
  message: string;
}

export interface CommonExamMistake {
  id: string;
  title: string;
  content: string;
  subject: string;
  order: number;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CommonExamMistakesResponse {
  success: boolean;
  data: CommonExamMistake[];
  message: string;
}

export interface PaymentWallet {
  id: string;
  name: string;
  phone: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentWalletsResponse {
  success: boolean;
  data: PaymentWallet[];
  message: string;
}

// Challenge flow types
export interface ChallengeRequest {
  id: string;
  fromStudentId: string;
  toStudentId: string;
  fromStudentName?: string;
  toStudentName?: string;
  status: string;
  challengeId?: string;
  createdAt: string;
}

export interface ChallengeRequestCreateRequest {
  toStudentId: string;
}

export interface ChallengeRequestCreateResponse {
  success: boolean;
  data: ChallengeRequest;
  message: string;
}

export interface ChallengeRequestsListResponse {
  success: boolean;
  data: ChallengeRequest[];
  message: string;
}

export interface ChallengeRequestAcceptResponse {
  success: boolean;
  data: { challengeId: string };
  message: string;
}

export interface Challenge {
  id: string;
  challengerStudentId: string;
  challengedStudentId: string;
  challengerName: string;
  challengedName: string;
  questionIds: string[];
  status: string;
  createdAt: string;
}

export interface ChallengeDetailResponse {
  success: boolean;
  data: Challenge;
  message: string;
}

export interface ChallengeQuestionItem {
  id: string;
  type: string;
  question: string;
  options: string[];
  points: number;
}

export interface ChallengeQuestionsResponse {
  success: boolean;
  data: ChallengeQuestionItem[];
  message: string;
}

export interface ChallengeSubmitRequest {
  answers: number[];
}

export interface ChallengeResultItem {
  score: number;
  totalPoints: number;
}

export interface ChallengeSubmitResponse {
  success: boolean;
  data: {
    score: number;
    totalPoints: number;
    percentage: number;
    myResult: ChallengeResultItem;
    opponentResult: ChallengeResultItem | null;
  };
  message: string;
}

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL,
    timeout: 60000,
    prepareHeaders: async (headers, { endpoint }) => {
      // Don't set Content-Type for student registration (formData), let browser set it with boundary
      if (endpoint !== 'registerStudent' && endpoint !== 'buyExam' && endpoint !== 'buildExamRequest' && endpoint !== 'requestPlanPurchase') {
        headers.set('Content-Type', 'application/json');
      }

      // Add token to header for authenticated endpoints
      const authEndpoints = ['getExams', 'getExamsByEducationalMaterialId', 'solveExam', 'getStudent', 'getStudents', 'getStudentMistakes', 'buyExam', 'getApprovedExams', 'getStudentFreeExams', 'getStudentPaidExams', 'getStudentPlanExams', 'getStudentBuiltExams', 'parentLogin', 'buildExamRequest', 'getSubMaterials', 'getChaptersBySubMaterialIds', 'getTabsConfig', 'getPlans', 'requestPlanPurchase', 'sendChallengeRequest', 'getIncomingChallengeRequests', 'getOutgoingChallengeRequests', 'acceptChallengeRequest', 'rejectChallengeRequest', 'getChallenge', 'getChallengeQuestions', 'submitChallenge', 'getCommonExamMistakes', 'getPaymentWallets'];
      if (authEndpoints.includes(endpoint)) {
        const token = await tokenStorage.getToken();
        if (token) {
          // Set Authorization header with Bearer token
          headers.set('Authorization', `Bearer ${token}`);
          console.log('Token added to header for', endpoint, ':', token.substring(0, 20) + '...');
        } else {
          console.warn('No token found in storage for', endpoint);
        }
      }
      
      return headers;
    },
  }),
  tagTypes: ['Countries', 'Cities', 'EducationalStages', 'EducationalMaterials', 'SubMaterials', 'Chapters', 'QualityOfEducations', 'Colors', 'Exams', 'Student', 'Students', 'Mistakes', 'TabsConfig', 'Plans', 'News', 'ChallengeRequests', 'Challenge', 'CommonExamMistakes', 'PaymentWallets'],
  endpoints: (builder) => ({
    getCountries: builder.query<CountriesResponse, void>({
      query: () => '/countries',
      providesTags: ['Countries'],
    }),
    getCities: builder.query<CitiesResponse, void>({
      query: () => '/cities',
      providesTags: ['Cities'],
    }),
    getEducationalStages: builder.query<EducationalStagesResponse, void>({
      query: () => '/educational-stages',
      providesTags: ['EducationalStages'],
    }),
    getEducationalMaterials: builder.query<EducationalMaterialsResponse, void>({
      query: () => '/educational-materials',
      providesTags: ['EducationalMaterials'],
    }),
    getSubMaterials: builder.query<SubMaterialsResponse, void>({
      query: () => '/sub-materials',
      providesTags: ['SubMaterials'],
    }),
    getChaptersBySubMaterialIds: builder.query<ChaptersResponse, string[]>({
      query: (subMaterialIds) => ({
        url: '/chapters',
        params: { subMaterialIds: subMaterialIds.length ? subMaterialIds.join(',') : undefined },
      }),
      providesTags: ['Chapters'],
    }),
    getTabsConfig: builder.query<TabsConfigResponse, void>({
      query: () => '/tabs-config',
      providesTags: ['TabsConfig'],
    }),
    getPlans: builder.query<PlansResponse, void>({
      query: () => '/plans',
      providesTags: ['Plans'],
    }),
    getNews: builder.query<NewsResponse, void>({
      query: () => '/news',
      providesTags: ['News'],
    }),
    getCommonExamMistakes: builder.query<CommonExamMistakesResponse, void>({
      query: () => '/common-exam-mistakes',
      providesTags: ['CommonExamMistakes'],
    }),
    getPaymentWallets: builder.query<PaymentWalletsResponse, void>({
      query: () => '/payment-wallets',
      providesTags: ['PaymentWallets'],
    }),
    getQualityOfEducations: builder.query<QualityOfEducationsResponse, void>({
      query: () => '/quality-of-educations',
      providesTags: ['QualityOfEducations'],
    }),
    registerTeacher: builder.mutation<TeacherRegistrationResponse, TeacherRegistrationRequest>({
      query: (body) => ({
        url: '/teachers/register',
        method: 'POST',
        body,
      }),
    }),
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (body) => ({
        url: '/auth/login',
        method: 'POST',
        body,
      }),
    }),
    getColors: builder.query<ColorsResponse, void>({
      query: () => '/colors',
      providesTags: ['Colors'],
    }),
    registerStudent: builder.mutation<StudentRegistrationResponse, FormData>({
      query: (formData) => ({
        url: '/students/register',
        method: 'POST',
        body: formData,
      }),
    }),
    studentLogin: builder.mutation<StudentLoginResponse, StudentLoginRequest>({
      query: (body) => ({
        url: '/users/student/login',
        method: 'POST',
        body,
      }),
    }),
    getExams: builder.query<ExamsResponse, void>({
      query: () => '/exams',
      providesTags: ['Exams'],
    }),
    getExamsByEducationalMaterialId: builder.query<ExamsResponse, string>({
      query: (educationalMaterialId) => ({
        url: '/exams',
        params: { educationalMaterialId },
      }),
      providesTags: ['Exams'],
    }),
    solveExam: builder.mutation<SolveExamResponse, { examId: string; body: SolveExamRequest }>({
      query: ({ examId, body }) => ({
        url: `/exams/${examId}/solve`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Exams'],
    }),
    getStudent: builder.query<StudentResponse, string>({
      query: (studentId) => `/students/${studentId}`,
      providesTags: ['Student'],
    }),
    getStudents: builder.query<StudentsResponse, void>({
      query: () => '/students',
      providesTags: ['Students'],
    }),
    getStudentMistakes: builder.query<StudentMistakesResponse, string>({
      query: (studentId) => `/students/${studentId}/mistakes`,
      providesTags: ['Mistakes'],
    }),
    buyExam: builder.mutation<BuyExamResponse, FormData>({
      query: (formData) => ({
        url: '/exam-purchases/buy',
        method: 'POST',
        body: formData,
      }),
    }),
    getApprovedExams: builder.query<ApprovedExamsResponse, string>({
      query: (studentId) => `/exam-purchases/student/${studentId}/approved`,
      providesTags: ['Exams'],
    }),
    getStudentFreeExams: builder.query<ExamsResponse, string>({
      query: (studentId) => `/students/${studentId}/exams/free`,
      providesTags: ['Exams'],
    }),
    getStudentPaidExams: builder.query<ExamsResponse, string>({
      query: (studentId) => `/students/${studentId}/exams/paid`,
      providesTags: ['Exams'],
    }),
    getStudentPlanExams: builder.query<ExamsResponse, string>({
      query: (studentId) => `/students/${studentId}/exams/plan`,
      providesTags: ['Exams'],
    }),
    getStudentBuiltExams: builder.query<ExamsResponse, string>({
      query: (studentId) => `/students/${studentId}/exams/built`,
      providesTags: ['Exams'],
    }),
    registerParent: builder.mutation<ParentRegistrationResponse, ParentRegistrationRequest>({
      query: (body) => ({
        url: '/parents/register',
        method: 'POST',
        body,
      }),
    }),
    parentLogin: builder.mutation<ParentLoginResponse, ParentLoginRequest>({
      query: (body) => ({
        url: '/parents/login',
        method: 'POST',
        body,
      }),
    }),
    buildExamRequest: builder.mutation<BuildExamRequestResponse, FormData>({
      query: (formData) => ({
        url: '/exam-builds/requests',
        method: 'POST',
        body: formData,
      }),
    }),
    requestPlanPurchase: builder.mutation<PlanPurchaseRequestResponse, FormData>({
      query: (formData) => ({
        url: '/plan-purchases/request',
        method: 'POST',
        body: formData,
      }),
    }),
    // Challenge flow
    sendChallengeRequest: builder.mutation<ChallengeRequestCreateResponse, ChallengeRequestCreateRequest>({
      query: (body) => ({
        url: '/challenge-requests',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['ChallengeRequests'],
    }),
    getIncomingChallengeRequests: builder.query<ChallengeRequestsListResponse, void>({
      query: () => '/challenge-requests/incoming',
      providesTags: ['ChallengeRequests'],
    }),
    getOutgoingChallengeRequests: builder.query<ChallengeRequestsListResponse, void>({
      query: () => '/challenge-requests/outgoing',
      providesTags: ['ChallengeRequests'],
    }),
    acceptChallengeRequest: builder.mutation<ChallengeRequestAcceptResponse, string>({
      query: (requestId) => ({
        url: `/challenge-requests/${requestId}/accept`,
        method: 'PUT',
      }),
      invalidatesTags: ['ChallengeRequests'],
    }),
    rejectChallengeRequest: builder.mutation<{ success: boolean; data: null; message: string }, string>({
      query: (requestId) => ({
        url: `/challenge-requests/${requestId}/reject`,
        method: 'PUT',
      }),
      invalidatesTags: ['ChallengeRequests'],
    }),
    getChallenge: builder.query<ChallengeDetailResponse, string>({
      query: (challengeId) => `/challenges/${challengeId}`,
      providesTags: (_result, _error, challengeId) => [{ type: 'Challenge', id: challengeId }],
    }),
    getChallengeQuestions: builder.query<ChallengeQuestionsResponse, string>({
      query: (challengeId) => `/challenges/${challengeId}/questions`,
      providesTags: (_result, _error, challengeId) => [{ type: 'Challenge', id: challengeId }],
    }),
    submitChallenge: builder.mutation<ChallengeSubmitResponse, { challengeId: string; body: ChallengeSubmitRequest }>({
      query: ({ challengeId, body }) => ({
        url: `/challenges/${challengeId}/submit`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, { challengeId }) => [{ type: 'Challenge', id: challengeId }],
    }),
  }),
});

export const {
  useGetCountriesQuery,
  useGetCitiesQuery,
  useGetEducationalStagesQuery,
  useGetEducationalMaterialsQuery,
  useGetSubMaterialsQuery,
  useGetChaptersBySubMaterialIdsQuery,
  useGetTabsConfigQuery,
  useGetPlansQuery,
  useGetNewsQuery,
  useGetCommonExamMistakesQuery,
  useGetPaymentWalletsQuery,
  useGetQualityOfEducationsQuery,
  useRegisterTeacherMutation,
  useLoginMutation,
  useGetColorsQuery,
  useRegisterStudentMutation,
  useStudentLoginMutation,
  useGetExamsQuery,
  useGetExamsByEducationalMaterialIdQuery,
  useSolveExamMutation,
  useGetStudentQuery,
  useGetStudentsQuery,
  useGetStudentMistakesQuery,
  useBuyExamMutation,
  useGetApprovedExamsQuery,
  useGetStudentFreeExamsQuery,
  useGetStudentPaidExamsQuery,
  useGetStudentPlanExamsQuery,
  useGetStudentBuiltExamsQuery,
  useRegisterParentMutation,
  useParentLoginMutation,
  useBuildExamRequestMutation,
  useRequestPlanPurchaseMutation,
  useSendChallengeRequestMutation,
  useGetIncomingChallengeRequestsQuery,
  useGetOutgoingChallengeRequestsQuery,
  useAcceptChallengeRequestMutation,
  useRejectChallengeRequestMutation,
  useGetChallengeQuery,
  useGetChallengeQuestionsQuery,
  useSubmitChallengeMutation,
} = apiSlice;

