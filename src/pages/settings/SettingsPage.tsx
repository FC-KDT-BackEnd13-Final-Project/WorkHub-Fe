import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Switch } from "../../components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { LoginScreen } from "../../components/Login";
import { toast } from "sonner";
import { ModalShell } from "../../components/common/ModalShell";
import {
  PROFILE_STORAGE_KEY,
  PROFILE_UPDATE_EVENT,
  type UserRole,
  normalizeUserRole,
} from "../../constants/profile";
import { useLocalStorageValue } from "../../hooks/useLocalStorageValue";
import { userApi } from "../../lib/api";

type ProfileState = {
  id: string;
  email: string;
  phone: string;
  role: UserRole;
};

type StoredSettings = {
  profile: ProfileState;
  photo: string;
  twoFactorEnabled: boolean;
  updatedAt?: string;
};

// 사용자 프로필, 보안 설정, 로그인 미리보기를 관리하는 설정 페이지
export function SettingsPage() {
  const [profile, setProfile] = useState<ProfileState>({
    id: "asdf1234",
    email: "asdf1234@example.com",
    phone: "010-1234-5678",
    role: "DEVELOPER",
  });

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [isEmailVerificationOpen, setIsEmailVerificationOpen] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [emailForVerification, setEmailForVerification] = useState(profile.email);
  const [emailVerificationCode, setEmailVerificationCode] = useState("");
  const [emailVerificationError, setEmailVerificationError] = useState("");
  const [emailVerificationHint, setEmailVerificationHint] = useState("");
  const [isSendingEmailCode, setIsSendingEmailCode] = useState(false);
  const [isVerifyingEmailCode, setIsVerifyingEmailCode] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [displayLoginId, setDisplayLoginId] = useState("");
  // Sidebar 등 다른 화면과 설정 값을 공유하기 위해 로컬 스토리지에 저장한다.
  const [storedSettings, setStoredSettings] = useLocalStorageValue<StoredSettings | null>(
    PROFILE_STORAGE_KEY,
    {
      defaultValue: null,
      parser: (value) => JSON.parse(value),
      serializer: (value) => JSON.stringify(value),
    },
  );

  const handleProfileChange =
      (field: keyof typeof profile) =>
          (event: ChangeEvent<HTMLInputElement>) => {
            setProfile((prev) => ({ ...prev, [field]: event.target.value }));
          };

  // 프로필 이미지 변경 상태
  const [photo, setPhoto] = useState("/default-profile.png");
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target;
    const file = input.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    try {
      const uploadedUrl = await userApi.updateProfileImage(file);
      setPhoto(uploadedUrl);
      const payload = {
        profile,
        photo: uploadedUrl,
        twoFactorEnabled,
        updatedAt: new Date().toISOString(),
      };
      setStoredSettings(payload);
      toast.success("프로필 이미지가 변경되었습니다.");
    } catch (error: any) {
      console.error("Profile image upload failed", error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "프로필 이미지 변경에 실패했습니다.";
      toast.error(message);
    } finally {
      setIsUploadingPhoto(false);
      // input 초기화하여 동일 파일 재업로드 가능하게 처리
      input.value = "";
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (digits.length === 11) {
      return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
    }
    if (digits.length === 10) {
      if (digits.startsWith("02")) {
        return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6, 10)}`;
      }
      return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    }
    return digits;
  };

  const handlePhoneChange = (event: ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = event.target.value.replace(/\D/g, "");
    setProfile((prev) => ({ ...prev, phone: digitsOnly }));
  };
  const openEmailVerificationModal = () => {
    setEmailVerificationError("");
    setEmailVerificationCode("");
    setEmailForVerification("");
    setEmailVerificationHint("");
    setIsEmailVerificationOpen(true);
  };

  const closeEmailVerificationModal = () => {
    setIsEmailVerificationOpen(false);
    setEmailVerificationCode("");
    setEmailVerificationError("");
  };

  const getStoredUserName = () => {
    if (typeof window === "undefined") {
      return profile.id;
    }
    try {
      const rawUser = localStorage.getItem("user");
      if (rawUser) {
        const parsed = JSON.parse(rawUser);
        if (parsed?.userName) {
          return parsed.userName;
        }
      }
      const rawProfile = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (rawProfile) {
        const parsed = JSON.parse(rawProfile);
        return parsed?.profile?.id || profile.id;
      }
    } catch (error) {
      console.error("사용자 이름 조회 실패", error);
    }
    return profile.id;
  };

  const getStoredLoginId = () => {
    if (typeof window === "undefined") {
      return profile.id;
    }
    try {
      const rawUser = localStorage.getItem("user");
      if (rawUser) {
        const parsed = JSON.parse(rawUser);
        if (parsed?.loginId) {
          return parsed.loginId;
        }
      }
    } catch (error) {
      console.error("로그인 아이디 조회 실패", error);
    }
    return profile.id;
  };

  const updateStoredUserEmail = (nextEmail: string) => {
    if (typeof window === "undefined") return;
    try {
      const rawUser = localStorage.getItem("user");
      if (rawUser) {
        const parsed = JSON.parse(rawUser);
        localStorage.setItem(
          "user",
          JSON.stringify({
            ...parsed,
            email: nextEmail,
          }),
        );
      }
    } catch (error) {
      console.error("저장된 사용자 이메일 업데이트 실패", error);
    }
  };

  const sendEmailVerificationCode = async () => {
    if (!emailForVerification?.trim()) {
      setEmailVerificationError("인증할 이메일을 입력해주세요.");
      return;
    }
    setIsSendingEmailCode(true);
    setEmailVerificationHint("");
    setEmailVerificationError("");
    try {
      const userName = getStoredUserName();
      const targetEmail = emailForVerification.trim();
      const response = await userApi.sendEmailVerification(targetEmail, userName);
      const successMessage =
        response?.message ||
        `${targetEmail} 주소로 인증 코드를 전송했습니다.`;
      setEmailVerificationHint(successMessage);
      toast.success(successMessage);
    } catch (error: any) {
      console.error("이메일 인증 코드 전송 실패", error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "인증 코드 전송에 실패했습니다. 잠시 후 다시 시도해주세요.";
      setEmailVerificationError(message);
      toast.error(message);
    } finally {
      setIsSendingEmailCode(false);
    }
  };

  const handleVerifyEmailCode = async () => {
    if (!emailVerificationCode.trim()) {
      setEmailVerificationError("인증 코드를 입력해주세요.");
      return;
    }
    setIsVerifyingEmailCode(true);
    setEmailVerificationError("");
    try {
      const targetEmail = emailForVerification.trim();
      const response = await userApi.confirmEmailVerification(
        targetEmail,
        emailVerificationCode.trim(),
      );
      setIsEmailVerified(true);
      setEmailVerificationHint(response?.message || "");
      const successMessage = response?.message || "이메일 인증이 완료되었습니다.";
      const updatedProfile = { ...profile, email: targetEmail };
      setProfile(updatedProfile);
      const payload = {
        profile: updatedProfile,
        photo,
        twoFactorEnabled,
        updatedAt: new Date().toISOString(),
      };
      setStoredSettings(payload);
      updateStoredUserEmail(targetEmail);
      window.dispatchEvent(new CustomEvent<UserRole>(PROFILE_UPDATE_EVENT, { detail: profile.role }));
      toast.success(successMessage);
      closeEmailVerificationModal();
    } catch (error: any) {
      console.error("이메일 인증 실패", error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "인증에 실패했습니다. 다시 시도해주세요.";
      setEmailVerificationError(message);
      toast.error(message);
    } finally {
      setIsVerifyingEmailCode(false);
    }
  };

  // 페이지 최초 로드시 저장된 프로필/사진/보안 설정 복원
  useEffect(() => {
    const loginId = getStoredLoginId();
    setDisplayLoginId(loginId);
    if (storedSettings?.profile) {
      setProfile((prev) => ({
        ...storedSettings.profile,
        role: normalizeUserRole(storedSettings.profile.role) ?? prev.role,
      }));
    }
    if (storedSettings.photo) {
      setPhoto(storedSettings.photo);
    }
    if (typeof storedSettings.twoFactorEnabled === "boolean") {
      setTwoFactorEnabled(storedSettings.twoFactorEnabled);
    }
  }, [storedSettings]);

  useEffect(() => {
    if (!showResetPassword) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowResetPassword(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showResetPassword]);

  const handleChangePasswordClick = () => {
    setShowResetPassword(true);
  };

  // 변경 사항을 저장하고 결과를 사용자에게 알림
  const handleSaveProfile = () => {
    if (typeof window === "undefined") {
      return;
    }
    // 현재 폼 값과 저장된 값을 비교해 불필요한 저장을 막는다.
    const noChange =
      storedSettings !== null &&
      JSON.stringify(storedSettings.profile) === JSON.stringify(profile) &&
      storedSettings.photo === photo &&
      storedSettings.twoFactorEnabled === twoFactorEnabled;
    if (noChange) {
      toast("변경 사항이 없습니다.", {
        description: "수정 후 저장을 시도해주세요.",
      });
      return;
    }
    const payload = {
      profile,
      photo,
      twoFactorEnabled,
      updatedAt: new Date().toISOString(),
    };
    const normalizedPhone = profile.phone.replace(/\D/g, "");
    setIsSavingProfile(true);
    userApi
      .updatePhone(normalizedPhone)
      .then((response) => {
        setStoredSettings(payload);
        window.dispatchEvent(new CustomEvent<UserRole>(PROFILE_UPDATE_EVENT, { detail: profile.role }));
        toast.success(response?.message || "변경 사항이 저장되었습니다.", {
          description: "설정한 정보가 기기에 안전하게 보관됩니다.",
        });
      })
      .catch((error: any) => {
        console.error("전화번호 변경 실패", error);
        const message =
          error?.response?.data?.message ||
          error?.message ||
          "전화번호 변경에 실패했습니다. 잠시 후 다시 시도해주세요.";
        toast.error(message);
      })
      .finally(() => {
        setIsSavingProfile(false);
      });
  };

  return (
      <>
        <div className="space-y-6 pb-12 min-h-0">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
          <p className="mt-2 text-muted-foreground">
            프로필/보안 정보를 업데이트하고 계정 상태를 관리하세요.
          </p>
        </div>
        {/* 프로필 / 기본 정보 카드 */}
        <Card className="rounded-2xl shadow-sm">
          <CardHeader />
          <CardContent className="pt-6">
            <div className="pb-6 flex flex-col gap-6 md:flex-row">
              {/* 왼쪽: 사진 + Change Photo 버튼 */}
              <div className="flex flex-col items-center gap-3 md:w-1/4">
                <Avatar className="rounded-full h-32 w-32">
                  <AvatarImage
                    src={photo}
                    alt="Profile"
                    width={128}
                    height={128}
                    className="aspect-square size-full object-cover"
                  />
                  <AvatarFallback className="text-2xl font-semibold">
                    {profile.id.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <Button variant="outline" size="sm" onClick={triggerFileSelect}>
                  {isUploadingPhoto ? "업로드 중..." : "사진 변경"}
                </Button>

                <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handlePhotoChange}
                />
              </div>

              {/* 오른쪽: 폼 필드 */}
              <div className="grid flex-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="id">아이디</Label>
                      <Input
                          id="id"
                          value={displayLoginId || profile.id}
                          readOnly
                          aria-readonly="true"
                      />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">이메일</Label>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Input
                          id="email"
                          type="email"
                          value={profile.email}
                          onChange={(event) => {
                            handleProfileChange("email")(event);
                            setIsEmailVerified(false);
                          }}
                          className="flex-1"
                          readOnly
                          aria-readonly="true"
                      />
                      <Button
                          type="button"
                          variant={isEmailVerified ? "secondary" : "outline"}
                          className="whitespace-nowrap"
                          onClick={openEmailVerificationModal}
                          disabled={false}
                      >
                        {isEmailVerified ? "이메일 변경 완료" : "이메일 변경"}
                      </Button>
                    </div>
                    <p className={`text-xs ${isEmailVerified ? "text-emerald-600" : "text-muted-foreground"}`}>
                      {isEmailVerified ? "이메일 인증이 완료되었습니다." : "보안을 위해 이메일 인증을 진행해주세요."}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">전화번호</Label>
                  <Input
                      id="phone"
                      value={formatPhoneNumber(profile.phone)}
                      onChange={handlePhoneChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">역할</Label>
                  <Select
                      value={profile.role}
                      disabled
                  >
                    <SelectTrigger id="role">
                      <SelectValue placeholder="역할을 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CLIENT">CLIENT</SelectItem>
                      <SelectItem value="DEVELOPER">DEVELOPER</SelectItem>
                      <SelectItem value="ADMIN">ADMIN</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Save 버튼 – 카드 하단 오른쪽 정렬 */}
            <div className="mt-6 border-t pt-6" style={{ display: "flex" }}>
              <Button style={{ marginLeft: "auto" }} onClick={handleSaveProfile} disabled={isSavingProfile}>
                {isSavingProfile ? "저장 중..." : "변경 사항 저장"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security 카드 */}
        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="pb-6">
            <CardTitle>보안</CardTitle>
            <p className="text-sm text-muted-foreground">
              계정 보안 설정을 관리하세요
            </p>
            <Button
                size="sm"
                className="mt-4 w-fit"
                onClick={handleChangePasswordClick}
            >
              비밀번호 변경
            </Button>
          </CardHeader>
        </Card>
      </div>

      <ModalShell
        open={isEmailVerificationOpen}
        onClose={closeEmailVerificationModal}
        maxWidth="28rem"
      >
        <Card variant="modal" className="login-theme border border-border shadow-2xl">
          <CardHeader className="space-y-2 pb-2 text-center">
            <h2 className="text-xl font-semibold">이메일 인증</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            {emailVerificationHint && (
              <p className="text-sm text-primary text-center">{emailVerificationHint}</p>
            )}
            <div className="space-y-2">
              <Label htmlFor="emailForVerification" className="text-gray-700">이메일</Label>
              <div className="flex gap-2">
                <Input
                    id="emailForVerification"
                    type="email"
                    value={emailForVerification}
                    onChange={(event) => {
                      setEmailForVerification(event.target.value);
                      setIsEmailVerified(false);
                      setEmailVerificationError("");
                    }}
                    placeholder="인증할 이메일을 입력하세요"
                    className="flex-1"
                />
                <Button
                    type="button"
                    variant="secondary"
                    onClick={sendEmailVerificationCode}
                    disabled={isSendingEmailCode}
                >
                  {isSendingEmailCode ? "전송 중..." : "인증 코드 보내기"}
                </Button>
              </div>
            </div>
            <div className="rounded-md bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
              인증 코드는 10분간 유효합니다. 메일이 보이지 않으면 스팸함을 확인해주세요.
            </div>
            <div className="space-y-2">
              <Label htmlFor="emailVerificationCode" className="text-gray-700">인증 코드</Label>
              <Input
                  id="emailVerificationCode"
                  value={emailVerificationCode}
                  onChange={(event) => {
                    setEmailVerificationCode(event.target.value);
                    setEmailVerificationError("");
                  }}
                  placeholder="인증 코드를 입력하세요"
              />
            </div>
            {emailVerificationError && (
              <p className="text-sm text-destructive">{emailVerificationError}</p>
            )}
            <div className="flex justify-center gap-4">
              <Button
                  type="button"
                  variant="secondary"
                  className="h-9 px-6"
                  onClick={closeEmailVerificationModal}
                  disabled={isVerifyingEmailCode}
              >
                취소
              </Button>
              <Button
                  type="button"
                  className="h-9 px-6"
                  onClick={handleVerifyEmailCode}
                  disabled={!emailVerificationCode.trim() || isVerifyingEmailCode}
              >
                {isVerifyingEmailCode ? "확인 중..." : "인증 완료"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </ModalShell>

      <ModalShell
        open={showResetPassword}
        onClose={() => setShowResetPassword(false)}
        maxWidth="var(--login-card-max-width, 42rem)"
        className="login-theme"
      >
        <div className="w-full max-w-lg overflow-y-auto bg-card text-card-foreground shadow-2xl rounded-2xl border border-border">
          <LoginScreen
            initialResetStage="request"
            defaultResetId={getStoredLoginId()}
            defaultResetEmail={profile.email}
            variant="modal"
            allowLoginNavigation={false}
            onCancel={() => setShowResetPassword(false)}
            onSuccess={() => setShowResetPassword(false)}
            cancelLabel="취소하기"
          />
        </div>
      </ModalShell>
    </>
  );
}
