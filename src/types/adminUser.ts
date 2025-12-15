export interface AdminUserResponse {
  userId: number;
  userName: string;
  loginId: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  companyId: number;
  profileImg?: string;
}

export interface AdminUserViewModel {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  company: string;
  avatarUrl?: string;
  loginId?: string;
  lastActive?: string;
  joined?: string;
  projectCount?: number;
}
