import axios from 'axios';

// 모든 API 요청이 갈 기본 서버 주소
const API_BASE_URL = 'https://workhub.o-r.kr'

// 공통 설정을 담은 axios 인스턴스
export const apiClient = axios.create({
  baseURL: API_BASE_URL, // 기본 URL을 매 요청마다 붙일 필요 없이 설정
  headers: {
    'Content-Type': 'application/json',
    'accept': 'application/json',
  },
  withCredentials: true, // 서버와 쿠키 기반 세션을 사용할 수 있게 허용
});

// 요청 인터셉터 - 토큰이 있으면 자동으로 헤더에 추가
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken'); // 로컬 스토리지에 저장된 인증 토큰 조회
    if (token) {
      config.headers.Authorization = `Bearer ${token}`; // 서버에 인증 토큰을 실어 보냄
    }
    return config;
  },
  (error) => {
    return Promise.reject(error); // 요청 자체가 실패하면 그대로 에러 전달
  }
);

// 응답 인터셉터 - 401 에러 시 처리
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken'); // 인증 만료 시 토큰 삭제하여 재로그인 유도
    }
    return Promise.reject(error); // 호출한 쪽에서 에러를 처리하도록 던짐
  }
);

// 로그인 API
export const authApi = {
  login: async (loginId: string, password: string) => {
    const response = await apiClient.post('/api/v1/admin/users/login', {
      loginId,
      password,
    });
    return response.data; // axios 응답 객체 중 data만 반환해 UI가 쉽게 사용하도록 함
  },
};
