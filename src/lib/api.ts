import axios from 'axios';
import type { ProjectApiResponse, ProjectListParams } from '@/types/project';
import type { NodeListApiResponse } from '@/types/projectNodeList';
import { CreateNodePayload } from '@/types/projectNode';
import type {
  CsPostListApiResponse,
  CsPostListParams,
  CreateCsPostPayload,
  CsPostDetailResponse,
  CsQnaListApiResponse,
  CsQnaListParams,
  CsPostUpdateRequest,
} from '@/types/csPost';

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
    // 세션 기반 인증이라 JSESSIONID 쿠키만 있으면 됨. withCredentials 옵션으로 자동 전송됨.
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
      localStorage.removeItem('user');
      localStorage.setItem('workhub:auth', 'false');
      if (typeof window !== 'undefined' && window.location.pathname !== '/') {
        // 새 세션으로 다시 로그인하도록 랜딩/로그인 페이지로 이동
        window.location.replace('/');
      }
    }
    return Promise.reject(error); // 호출한 쪽에서 에러를 처리하도록 던짐
  }
);

// 로그인 API
export const authApi = {
  login: async (loginId: string, password: string) => {
    const response = await apiClient.post('/api/v1/users/login', {
      loginId,
      password,
    });
    return response.data; // axios 응답 객체 중 data만 반환해 UI가 쉽게 사용하도록 함
  },
};

// 프로젝트 API
export const projectApi = {
  /**
   * 프로젝트 목록 조회
   * @param params - 필터링 및 페이지네이션 파라미터 (모두 선택사항)
   * @returns 프로젝트 목록 및 페이지네이션 정보
   */
  getList: async (params?: ProjectListParams): Promise<ProjectApiResponse> => {
    const response = await apiClient.get('/api/v1/projects/list', {
        params: params, // axios가 자동으로 쿼리스트링으로 변환
    });

    const { success, message, data } = response.data; // 응답 구조 분해 할당.

    // success가 true일 때
    if(success === true)
        return data;

    // success가 false일 때
    throw new Error(message || '프로젝트 목록 조회에 실패했습니다.');
  },

  /**
   * 프로젝트 노드 목록 조회
   * @param projectId - 프로젝트 ID
   * @returns 노드 목록
   */
  getNodes: async (projectId: string): Promise<NodeListApiResponse> => {
    const response = await apiClient.get(`/api/v1/projects/${projectId}/nodes/list`);

    const { success, message, data } = response.data;

    // success가 true일 때
    if (success === true)
      return data;

    // success가 false일 때
    throw new Error(message || '노드 목록 조회에 실패했습니다.');
  },


    /**
     * 프로젝트 노드 생성
     * @param projectId 프로젝트 ID
     * @param payload 요청 Body
     */
  createNode: async (projectId: string, payload: CreateNodePayload) => {
      const response = await apiClient.post(
          `/api/v1/projects/${projectId}/nodes/create`,
          payload
      );

      const { success, message, data } = response.data;

      if(success === true)
          return data;

      throw new Error(message || '노드 생성에 실패했습니다.');
  },
};

export const userApi = {
  /**
   * 프로필 이미지 업로드/변경
   * @param file 업로드할 이미지 파일
   * @returns 업로드된 이미지 URL
   */
  updateProfileImage: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient.patch("/api/v1/users/profile", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    const { success, message, data } = response.data;
    if (success === true && typeof data === "string") {
      return data;
    }
    throw new Error(message || "프로필 이미지 변경에 실패했습니다.");
  },

  /**
   * 관리자: 회원 상세 조회
   */
  getAdminUserDetail: async (userId: string | number) => {
    const response = await apiClient.get(`/api/v1/users/${userId}`);
    const { success, message, data } = response.data;
    if (success === true) {
      return data;
    }
    throw new Error(message || "회원 상세 조회에 실패했습니다.");
  },

  /**
   * 관리자: 회원 목록 조회
   */
  getAdminUsers: async () => {
    const response = await apiClient.get(`/api/v1/users/list`);
    const payload = response.data;

    if (Array.isArray(payload)) {
      return payload;
    }

    const { success, message, data } = payload;
    if (success === true && Array.isArray(data)) {
      return data;
    }

    throw new Error(message || "회원 목록 조회에 실패했습니다.");
  },
};

/**
 * CS 게시글 API
 */
export const csPostApi = {
  /**
   * CS 게시글 목록 조회
   * @param projectId - 프로젝트 ID
   * @param params - 검색 및 페이지네이션 파라미터
   * @returns CS 게시글 목록 및 페이지네이션 정보
   */
  getList: async (
    projectId: string,
    params?: CsPostListParams
  ): Promise<CsPostListApiResponse> => {
    const response = await apiClient.get(`/api/v1/projects/${projectId}/csPosts`, {
      params: params,
    });

    const { success, message, data } = response.data;

    if (success === true) {
      return data;
    }

    throw new Error(message || 'CS 게시글 목록 조회에 실패했습니다.');
  },

  /**
   * CS 게시글 생성
   * @param projectId - 프로젝트 ID
   * @param payload - 게시글 생성 데이터
   */
  create: async (projectId: string, payload: CreateCsPostPayload) => {
    const response = await apiClient.post(
      `/api/v1/projects/${projectId}/csPosts`,
      payload
    );

    const { success, message, data } = response.data;

    if (success === true) {
      return data;
    }

    throw new Error(message || 'CS 게시글 생성에 실패했습니다.');
  },

  /**
   * CS 게시글 단건 조회
   * @param projectId - 프로젝트 ID
   * @param csPostId - CS 게시글 ID
   * @returns CS 게시글 상세 정보
   */
  getDetail: async (
    projectId: string,
    csPostId: string
  ): Promise<CsPostDetailResponse> => {
    const response = await apiClient.get(
      `/api/v1/projects/${projectId}/csPosts/${csPostId}`
    );

    const { success, message, data } = response.data;

    if (success === true) {
      return data;
    }

    throw new Error(message || 'CS 게시글 조회에 실패했습니다.');
  },

  /**
   * CS 댓글 목록 조회 (계층 구조)
   * @param projectId - 프로젝트 ID
   * @param csPostId - CS 게시글 ID
   * @param params - 페이지네이션 파라미터
   * @returns CS 댓글 목록 및 페이지네이션 정보
   */
  getQnas: async (
    projectId: string,
    csPostId: string,
    params?: CsQnaListParams
  ): Promise<CsQnaListApiResponse> => {
    const response = await apiClient.get(
      `/api/v1/projects/${projectId}/csPosts/${csPostId}/qnas`,
      {
        params: params,
      }
    );

    const { success, message, data } = response.data;

    if (success === true) {
      return data;
    }

    throw new Error(message || 'CS 댓글 목록 조회에 실패했습니다.');
  },

  /**
   * CS 게시글 삭제
   * @param projectId - 프로젝트 ID
   * @param csPostId - CS 게시글 ID
   */
  delete: async (projectId: string, csPostId: string): Promise<number | undefined> => {
    const response = await apiClient.delete(
      `/api/v1/projects/${projectId}/csPosts/${csPostId}`
    );

    const { success, message, data } = response.data;

    if (success === true) {
      return data;
    }

    throw new Error(message || 'CS 게시글 삭제에 실패했습니다.');
  },

  /**
   * CS 게시글 수정
   * @param projectId - 프로젝트 ID
   * @param csPostId - CS 게시글 ID
   * @param payload - 수정 데이터
   */
  update: async (
    projectId: string,
    csPostId: string,
    payload: CsPostUpdateRequest,
  ): Promise<CsPostDetailResponse> => {
    const response = await apiClient.patch(
      `/api/v1/projects/${projectId}/csPosts/${csPostId}`,
      payload,
    );

    const { success, message, data } = response.data;

    if (success === true) {
      return data;
    }

    throw new Error(message || 'CS 게시글 수정에 실패했습니다.');
  },
};
