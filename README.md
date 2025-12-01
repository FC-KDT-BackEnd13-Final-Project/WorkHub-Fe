# WorkHub Frontend

프로젝트 관리 · CS 문의 · 관리자 기능을 포함한 WorkHub 프론트엔드입니다. 백엔드 연동 시 참고할 수 있도록 주요 화면과 폴더 구조를 정리했습니다.

## 기능 개요

- **Landing / Auth**: `src/App.tsx`의 `/` 루트에서 `Main` 컴포넌트를 렌더링하며, 로그인 성공 시 `workhub:auth` 로컬 스토리지를 업데이트하고 `/dashboard`로 이동합니다.
- **Dashboard** (`/dashboard`): `src/components/dashboard` 내 카드/차트를 사용해 주요 KPI와 통계를 시각화합니다.
- **Projects** (`/projects`, `/projects/:projectId/...`): `src/components/projects` 내 컴포넌트로 리스트/체크리스트/게시판 흐름을 구성합니다. 현재는 더미 데이터(`initialProjects`)와 로컬 상태를 사용하며 추후 API 연동이 필요합니다.
- **Notifications** (`/notifications`): `src/pages/notifications/NotificationsPage.tsx`에서 알림 목록/필터를 제공하며, `initialNotifications` 더미 데이터를 사용 중입니다. API 도입 시 동일 스키마로 교체하면 됩니다.
- **Support (CS 문의)** (`/projects/:projectId/nodes/support`): 문의 목록과 작성 폼(`SupportPage`), 상세 보기(`SupportTicketDetail`)를 제공하며 `supportTickets` 더미 데이터를 사용합니다.
- **Admin Users** (`/admin/users` 이하): 관리자 페이지는 `src/components/admin`에 위치하며, 사용자 데이터는 `companyUsers` 더미 배열에 기반합니다.
- **Settings** (`/settings`): 프로필/보안 설정 화면으로, 현재는 로컬 상태와 `LoginScreen` 컴포넌트를 활용해 동작합니다.

## 폴더 구조

```
src/
  App.tsx              # 전역 라우팅 및 레이아웃
  components/
    layout/            # Navigation, Sidebar, Footer 등 공통 레이아웃
    dashboard/         # 대시보드 카드 및 차트
    projects/          # 프로젝트 리스트, 체크리스트, 게시판 등
    admin/             # 관리자(Users) 관련 UI
    notifications/     # 알림 탭/리스트 구성요소
    ui/                # 버튼, 카드 등 공통 UI 컴포넌트
  pages/
    notifications/     # /notifications 페이지
    settings/          # /settings 페이지
    support/           # CS 문의 목록/상세 페이지
  data/                # 더미 데이터(initialProjects, supportTickets 등)
  styles/              # 글로벌 스타일
```

## 데이터/상태 참고

- 로그인 여부는 로컬 스토리지 키 `workhub:auth`로 관리합니다.
- 알림 읽음 수는 `workhubUnreadNotificationCount` 로컬 스토리지/커스텀 이벤트로 동기화합니다.
- Support, Notifications, Projects 등은 현재 `src/data`의 더미 데이터를 사용하므로, 실제 API 도입 시 동일 스키마로 대체하거나 Fetch 훅을 추가하면 됩니다.
- URL 파라미터: `projectId`, `nodeId`, `ticketId` 등을 사용해 프로젝트/문의 상세 화면을 분기합니다.

## 실행 방법

```bash
npm install
npm run dev
```

프로덕션 빌드는 `npm run build`로 생성됩니다.
