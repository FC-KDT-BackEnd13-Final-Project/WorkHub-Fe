import axios from 'axios';
import type { ProjectApiResponse, ProjectListParams, ProjectApiItem, UpdateProjectPayload, ProjectStatus } from '@/types/project';
import type {
  CheckListCreateRequest,
  CheckListItemStatus,
  CheckListResponse,
  CheckListUpdateRequest,
} from '@/types/checkList';
import type { NodeListApiResponse, NodeApiItem } from '@/types/projectNodeList';
import { CreateNodePayload, UpdateNodePayload, type NodeStatusPayload, type UpdateNodeOrderPayload } from '@/types/projectNode';

import type {
  CsPostListApiResponse,
  CsPostListParams,
  CreateCsPostPayload,
  CsPostDetailResponse,
  CsQnaListApiResponse,
  CsQnaListParams,
  CsPostUpdateRequest,
  CsPostStatus,
  CsQnaRequest,
  CsQnaResponse,
  CsQnaUpdateRequest,
} from '@/types/csPost';

type CreateProjectPayload = {
  projectName: string;
  projectDescription: string;
  company: number;
  managerIds: number[];
  developerIds: number[];
  starDate: string;
  endDate: string;
};

export type FileDownloadResponse = {
  fileName: string;
  originalFileName?: string;
  presignedUrl: string;
  fileUrl?: string;
};

type CompanyListResponse = {
  success: boolean;
  code: string;
  message: string;
  data: Array<{
    companyId: number;
    companyName: string;
  }>;
};

type CompanyMemberListResponse = {
  success: boolean;
  code: string;
  message: string;
  data: Array<{
    userId: number;
    loginId: string;
    userName: string;
    profileImg?: string | null;
  }>;
};

const buildChecklistFormData = (
  data: unknown,
  options?: {
    files?: File[];
    fileFieldName?: string;
  },
): FormData => {
  const formData = new FormData();
  const jsonBlob = new Blob([JSON.stringify(data ?? {})], { type: 'application/json' });
  formData.append('data', jsonBlob);
  const fileFieldName = options?.fileFieldName ?? 'files';
  const files = options?.files;
  if (files && files.length > 0) {
    files.forEach((file) => {
      formData.append(fileFieldName, file);
    });
  }
  return formData;
};

// 모든 API 요청이 갈 기본 서버 주소
const API_BASE_URL = 'https://workhub.o-r.kr'

// 공통 설정을 담은 axios 인스턴스
export const apiClient = axios.create({
  baseURL: API_BASE_URL, // 기본 URL을 매 요청마다 붙일 필요 없이 설정
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

  /**
   * 프로젝트 노드 삭제
   * @param projectId 프로젝트 ID
   * @param nodeId 노드 ID
   */
  deleteNode: async (projectId: string | number, nodeId: string | number): Promise<void> => {
    const response = await apiClient.delete(`/api/v1/projects/${projectId}/nodes/${nodeId}`);

    const { success, message } = response.data ?? {};

    if (success === true) {
      return;
    }

    throw new Error(message || '노드 삭제에 실패했습니다.');
  },

  /**
   * 프로젝트 노드 수정
   * @param projectId 프로젝트 ID
   * @param nodeId 노드 ID
   * @param payload 수정 데이터
   */
  updateNode: async (
    projectId: string | number,
    nodeId: string | number,
    payload: UpdateNodePayload,
  ): Promise<NodeApiItem> => {
    const response = await apiClient.put(
      `/api/v1/projects/${projectId}/nodes/${nodeId}`,
      payload,
    );

    const { success, message, data } = response.data;

    if (success === true && data) {
      return data;
    }

    throw new Error(message || '노드 수정에 실패했습니다.');
  },

  /**
   * 프로젝트 노드 상태 변경
   * @param projectId 프로젝트 ID
   * @param nodeId 노드 ID
   * @param status 변경할 노드 상태
   */
  changeNodeStatus: async (
    projectId: string | number,
    nodeId: string | number,
    status: NodeStatusPayload,
  ): Promise<void> => {
    const response = await apiClient.patch(
      `/api/v1/projects/${projectId}/nodes/${nodeId}/status`,
      { nodeStatus: status },
      {
        params: { nodeStatus: status },
      },
    );

    const { success, message } = response.data ?? {};

    if (success === true) {
      return;
    }

    throw new Error(message || '노드 상태 변경에 실패했습니다.');
  },

  /**
   * 프로젝트 노드 순서 변경
   * @param projectId 프로젝트 ID
   * @param orders 노드 순서 배열
   */
  updateNodeOrder: async (
    projectId: string | number,
    orders: UpdateNodeOrderPayload[],
  ): Promise<void> => {
    const response = await apiClient.patch(
      `/api/v1/projects/${projectId}/nodes/order`,
      orders,
    );

    const { success, message } = response.data ?? {};

    if (success === true) {
      return;
    }

    throw new Error(message || '노드 순서 변경에 실패했습니다.');
  },

  /**
   * 프로젝트 삭제 (소프트 삭제)
   * @param projectId - 삭제할 프로젝트 ID
   */
  delete: async (projectId: string | number): Promise<void> => {
    const response = await apiClient.delete(`/api/v1/projects/${projectId}`);

    const { success, message } = response.data;

    if (success === true) {
      return;
    }

    throw new Error(message || '프로젝트 삭제에 실패했습니다.');
  },

  /**
   * 프로젝트 수정
   * @param projectId - 수정할 프로젝트 ID
   * @param payload - 수정 데이터
   */
  update: async (
    projectId: string | number,
    payload: UpdateProjectPayload,
  ): Promise<ProjectApiItem> => {
    const response = await apiClient.put(`/api/v1/projects/${projectId}`, payload);
    const result = response.data;

    if (result && typeof result === 'object' && 'success' in result) {
      const { success, message, data } = result as {
        success: boolean;
        message?: string;
        data?: ProjectApiItem;
      };

      if (success === true && data) {
        return data;
      }

      throw new Error(message || '프로젝트 수정에 실패했습니다.');
    }

    if (result && typeof result === 'object' && 'projectId' in result) {
      return result as ProjectApiItem;
    }

    throw new Error('프로젝트 수정에 실패했습니다.');
  },

  /**
   * 프로젝트 상태 변경
   * @param projectId - 프로젝트 ID
   * @param status - 변경할 상태
   */
  changeStatus: async (projectId: string | number, status: ProjectStatus): Promise<void> => {
    const response = await apiClient.patch(`/api/v1/projects/${projectId}/status`, { status });

    const { success, message } = response.data ?? {};

    if (success === true) {
      return;
    }

    throw new Error(message || '프로젝트 상태 변경에 실패했습니다.');
  },

  /**
   * 프로젝트 생성
   */
  create: async (payload: CreateProjectPayload): Promise<ProjectApiItem> => {
    const response = await apiClient.post('/api/v1/projects', payload);
    const { success, message, data } = response.data ?? {};

    if (success === true && data) {
      return data;
    }

    // 백엔드가 바로 프로젝트 객체를 반환할 수도 있음
    if (response.data && typeof response.data === 'object' && 'projectId' in response.data) {
      return response.data as ProjectApiItem;
    }

    throw new Error(message || '프로젝트 생성에 실패했습니다.');
  },

  /**
   * 특정 노드의 체크리스트 조회
   */
  getCheckList: async (
    projectId: string,
    nodeId: string,
  ): Promise<CheckListResponse | null> => {
    try {
      const response = await apiClient.get(
        `/api/v1/projects/${projectId}/nodes/${nodeId}/checkLists`,
      );
      const { success, message, data } = response.data;
      if (success === true) {
        return data;
      }
      throw new Error(message || '체크리스트 조회에 실패했습니다.');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        if (status === 404 || status === 400) {
          // 서버에서 체크리스트가 없을 때 404 또는 400을 반환할 수 있으므로 null 처리
          return null;
        }
      }
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('체크리스트 조회에 실패했습니다.');
    }
  },

  /**
   * 체크리스트 생성
   */
  createCheckList: async (
    projectId: string,
    nodeId: string,
    payload: CheckListCreateRequest,
    files?: File[],
  ): Promise<CheckListResponse> => {
    const formData = buildChecklistFormData(payload, { files });
    const response = await apiClient.post(
      `/api/v1/projects/${projectId}/nodes/${nodeId}/checkLists`,
      formData,
    );

    const { success, message, data } = response.data;

    if (success === true) {
      return data;
    }

    throw new Error(message || '체크리스트 생성에 실패했습니다.');
  },

  /**
   * 체크리스트 업데이트
   */
  updateCheckList: async (
    projectId: string,
    nodeId: string,
    payload: CheckListUpdateRequest,
    newFiles?: File[],
  ): Promise<CheckListResponse> => {
    const formData = buildChecklistFormData(payload, {
      files: newFiles,
      fileFieldName: 'newFiles',
    });
    const response = await apiClient.patch(
      `/api/v1/projects/${projectId}/nodes/${nodeId}/checkLists`,
      formData,
    );

    const { success, message, data } = response.data;

    if (success === true) {
      return data;
    }

    throw new Error(message || '체크리스트 수정에 실패했습니다.');
  },

  /**
   * 체크리스트 항목 상태 변경
   */
  updateCheckListItemStatus: async (
    projectId: string,
    nodeId: string,
    checkListId: number | string,
    checkListItemId: number | string,
    status: CheckListItemStatus,
  ): Promise<CheckListItemStatus> => {
    const response = await apiClient.patch(
      `/api/v1/projects/${projectId}/nodes/${nodeId}/checkLists/${checkListId}/items/${checkListItemId}/status`,
      null,
      {
        params: { status },
      },
    );

    const { success, message, data } = response.data;

    if (success === true) {
      return data;
    }

    throw new Error(message || '체크리스트 항목 상태 변경에 실패했습니다.');
  },
};

export const companyApi = {
  /**
   * 회사 목록 조회
   */
  getCompanies: async () => {
    const response = await apiClient.get<CompanyListResponse>('/api/v1/company/list');
    const { success, message, data } = response.data;
    if (success === true) {
      return data;
    }
    throw new Error(message || '회사 목록 조회에 실패했습니다.');
  },

  /**
   * 특정 회사 소속 직원 목록 조회
   */
  getCompanyMembers: async (companyId: number) => {
    const response = await apiClient.get<CompanyMemberListResponse>(`/api/v1/company/${companyId}/list`);
    const { success, message, data } = response.data;
    if (success === true) {
      return data;
    }
    throw new Error(message || '회사 구성원 목록 조회에 실패했습니다.');
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
    const response = await apiClient.get(`/api/v1/admin/users/${userId}`);
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
      const response = await apiClient.get(`/api/v1/admin/users/list`);
      const payload = response.data;

      if (Array.isArray(payload)) {
          return payload;
      }

      const {success, message, data} = payload;
      if (success === true && Array.isArray(data)) {
          return data;
      }

      throw new Error(message || "회원 목록 조회에 실패했습니다.");
  },

  /*
   * 이메일 인증 코드 발송
   * @param email 대상 이메일
   * @param userName 사용자 이름
   */
  sendEmailVerification: async (email: string, userName: string) => {
    const response = await apiClient.post("/api/v1/email-verification/send", {
      email,
      userName,
    });

    const { success, message, code, data } = response.data;
    if (success === true) {
      return { message, code, data };
    }
    throw new Error(message || "이메일 인증 코드 전송에 실패했습니다.");
  },

  /**
   * 이메일 인증 코드 검증
   * @param email 대상 이메일
   * @param code 인증 코드
   */
  confirmEmailVerification: async (email: string, code: string) => {
    const response = await apiClient.post("/api/v1/users/confirm", {
      email,
      code,
    });

    const { success, message, data } = response.data;
    if (success === true) {
      return { message, data };
    }
    throw new Error(message || "이메일 인증에 실패했습니다.");
  },

  /**
   * 전화번호 변경
   * @param phone 숫자만 포함된 전화번호
   */
  updatePhone: async (phone: string) => {
    const response = await apiClient.patch("/api/v1/users/phone", { phone });
    const { success, message, data } = response.data;
    if (success === true) {
      return { message, data };
    }
    throw new Error(message || "전화번호 변경에 실패했습니다.");
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
  create: async (projectId: string, payload: CreateCsPostPayload, files?: File[]) => {
    const formData = new FormData();
    formData.append(
      "data",
      new Blob([JSON.stringify(payload)], { type: "application/json" }),
    );
    files?.forEach((file) => {
      formData.append("files", file);
    });

    const response = await apiClient.post(
      `/api/v1/projects/${projectId}/csPosts`,
      formData,
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
   * CS 댓글 생성
   */
  createQna: async (
    projectId: string,
    csPostId: string,
    payload: CsQnaRequest,
  ): Promise<CsQnaResponse> => {
    const response = await apiClient.post(
      `/api/v1/projects/${projectId}/csPosts/${csPostId}/qnas`,
      payload,
    );

    const { success, message, data } = response.data;

    if (success === true) {
      return data;
    }

    throw new Error(message || 'CS 댓글 생성에 실패했습니다.');
  },

  /**
   * CS 댓글 수정
   */
  updateQna: async (
    projectId: string,
    csPostId: string,
    csQnaId: string,
    payload: CsQnaUpdateRequest,
  ): Promise<CsQnaResponse> => {
    const response = await apiClient.patch(
      `/api/v1/projects/${projectId}/csPosts/${csPostId}/qnas/${csQnaId}`,
      payload,
    );

    const { success, message, data } = response.data;

    if (success === true) {
      return data;
    }

    throw new Error(message || 'CS 댓글 수정에 실패했습니다.');
  },

  /**
   * CS 댓글 삭제
   */
  deleteQna: async (
    projectId: string,
    csPostId: string,
    csQnaId: string,
  ): Promise<void> => {
    const response = await apiClient.delete(
      `/api/v1/projects/${projectId}/csPosts/${csPostId}/qnas/${csQnaId}`,
    );

    const { success, message } = response.data;

    if (success === true) {
      return;
    }

    throw new Error(message || 'CS 댓글 삭제에 실패했습니다.');
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
   * CS 게시글 상태 변경
   * @param projectId - 프로젝트 ID
   * @param csPostId - CS 게시글 ID
   * @param status - 변경할 상태
   */
  changeStatus: async (
    projectId: string,
    csPostId: string,
    status: CsPostStatus,
  ): Promise<CsPostDetailResponse> => {
    const response = await apiClient.patch(
      `/api/v1/projects/${projectId}/csPosts/${csPostId}/status`,
      null,
      {
        params: { status },
      },
    );

    const { success, message, data } = response.data;

    if (success === true) {
      return data;
    }

    throw new Error(message || 'CS 게시글 상태 변경에 실패했습니다.');
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
    newFiles?: File[],
  ): Promise<CsPostDetailResponse> => {
    const formData = new FormData();
    formData.append(
      "data",
      new Blob([JSON.stringify(payload)], { type: "application/json" }),
    );
    newFiles?.forEach((file) => {
      formData.append("newFiles", file);
    });

    const response = await apiClient.patch(
      `/api/v1/projects/${projectId}/csPosts/${csPostId}`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );

    const { success, message, data } = response.data;

    if (success === true) {
      return data;
    }

    throw new Error(message || 'CS 게시글 수정에 실패했습니다.');
  },
};

/**
 * 파일 API
 */
export const fileApi = {
  /**
   * 파일명 기준으로 Pre-signed URL 목록을 조회한다.
   * @param fileNames - 저장된 파일명(UUID)
   */
  getDownloadUrls: async (fileNames: string[]): Promise<FileDownloadResponse[]> => {
    if (!fileNames || fileNames.length === 0) {
      return [];
    }

    const response = await apiClient.get('/api/v1/files/get-files', {
      params: { fileNames },
    });

    const { success, message, data } = response.data;

    if (success === true) {
      return data;
    }

    throw new Error(message || '파일 URL 조회에 실패했습니다.');
  },

  /**
   * 원본 파일명으로 다운로드할 수 있는 Pre-signed URL을 조회한다.
   * @param fileName - S3에 저장된 파일명(UUID)
   * @param originalFileName - 원본 파일명
   */
  getDownloadUrl: async (fileName: string, originalFileName: string): Promise<FileDownloadResponse> => {
    const response = await apiClient.get('/api/v1/files/download', {
      params: { fileName, originalFileName },
    });

    const { success, message, data } = response.data;

    if (success === true) {
      return data;
    }

    throw new Error(message || '파일 다운로드 URL 조회에 실패했습니다.');
  },
};
