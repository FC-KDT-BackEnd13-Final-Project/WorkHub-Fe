import axios from 'axios';

const API_BASE_URL = 'https://workhub.o-r.kr'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'accept': 'application/json',
  },
  withCredentials: true,
});

// 요청 인터셉터 - 토큰이 있으면 자동으로 헤더에 추가
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터 - 401 에러 시 처리
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
    }
    return Promise.reject(error);
  }
);

// 로그인 API
export const authApi = {
  login: async (loginId: string, password: string) => {
    const response = await apiClient.post('/api/admin/users/login', {
      loginId,
      password,
    });
    return response.data;
  },
};