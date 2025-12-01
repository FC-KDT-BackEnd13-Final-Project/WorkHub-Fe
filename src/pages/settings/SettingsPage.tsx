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

// 사용자 프로필, 보안 설정, 로그인 미리보기를 관리하는 설정 페이지
export function SettingsPage() {
  const [profile, setProfile] = useState({
    id: "asdf1234",
    email: "asdf1234@example.com",
    phone: "010-1234-5678",
    role: "DEVELOPER",
  });

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [showResetPassword, setShowResetPassword] = useState(false);

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

  return (
      <>
        <div className="space-y-6 pb-12 pt-6 min-h-0">
        {/* 프로필 / 기본 정보 카드 */}
        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="border-b pb-4">
            <CardTitle>Settings</CardTitle>
          </CardHeader>
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
                  Change Photo
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
                  <Label htmlFor="id">Id</Label>
                  <Input
                      id="id"
                      value={profile.id}
                      onChange={handleProfileChange("id")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={handleProfileChange("email")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                      id="phone"
                      value={profile.phone}
                      onChange={handleProfileChange("phone")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                      value={profile.role}
                      onValueChange={(value) =>
                          setProfile((prev) => ({ ...prev, role: value }))
                      }
                  >
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Select role" />
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
              <Button style={{ marginLeft: "auto" }}>Save Changes</Button>
            </div>
          </CardContent>
        </Card>

        {/* Security 카드 */}
        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="pb-6">
            <CardTitle>Security</CardTitle>
            <p className="text-sm text-muted-foreground">
              Manage your account security settings
            </p>
            <Button
                size="sm"
                className="mt-4 w-fit"
                onClick={handleChangePasswordClick}
            >
              Change Password
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
