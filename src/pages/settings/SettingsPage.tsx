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
import {
  PROFILE_STORAGE_KEY,
  PROFILE_UPDATE_EVENT,
  type UserRole,
  normalizeUserRole,
} from "../../constants/profile";
import { useLocalStorageValue } from "../../hooks/useLocalStorageValue";

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
  const [photo, setPhoto] = useState("https://i.pravatar.cc/80?img=18");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const imageURL = URL.createObjectURL(file);
    setPhoto(imageURL);
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  // 페이지 최초 로드시 저장된 프로필/사진/보안 설정 복원
  useEffect(() => {
    if (!storedSettings) {
      return;
    }
    if (storedSettings.profile) {
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
    // 훅 setter를 통해 저장하면 storage 이벤트까지 자동으로 전파된다.
    setStoredSettings(payload);
    window.dispatchEvent(new CustomEvent<UserRole>(PROFILE_UPDATE_EVENT, { detail: profile.role }));
    toast.success("변경 사항이 저장되었습니다.", {
      description: "설정한 정보가 기기에 안전하게 보관됩니다.",
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
                <Avatar
                    className="rounded-full"
                    style={{ width: 80, height: 80 }}
                >
                  <AvatarImage
                      src={photo}
                      alt="Profile"
                      className="h-full w-full object-cover"
                  />
                  <AvatarFallback>{profile.id.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>

                <Button variant="outline" size="sm" onClick={triggerFileSelect}>
                  사진 변경
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
                      value={profile.id}
                      onChange={handleProfileChange("id")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">이메일</Label>
                  <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={handleProfileChange("email")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">전화번호</Label>
                  <Input
                      id="phone"
                      value={profile.phone}
                      onChange={handleProfileChange("phone")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">역할</Label>
                  <Select
                      value={profile.role}
                      onValueChange={(value) =>
                          setProfile((prev) => ({ ...prev, role: value }))
                      }
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
              <Button style={{ marginLeft: "auto" }} onClick={handleSaveProfile}>
                변경 사항 저장
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

      {showResetPassword && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-end">
          <div
              className="absolute inset-0"
              onClick={() => setShowResetPassword(false)}
              aria-hidden
          />
          <div className="relative z-10 h-full max-w-lg w-full overflow-y-auto bg-white shadow-2xl border-l">
            <LoginScreen
                initialResetStage="request"
                defaultResetId={profile.id}
                defaultResetEmail={profile.email}
                onSuccess={() => setShowResetPassword(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}
