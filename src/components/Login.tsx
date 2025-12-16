'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { authApi } from '../lib/api'
import { PROFILE_STORAGE_KEY, normalizeUserRole } from '../constants/profile';

const STORAGE_EVENT_NAME = 'workhub:local-storage';

const broadcastStorageChange = (key: string, value: unknown) => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(
        new CustomEvent(STORAGE_EVENT_NAME, {
            detail: { key, value },
        }),
    );
};

interface LoginScreenProps {
    onSuccess?: () => void;
    initialResetStage?: 'login' | 'request' | 'verify' | 'newPassword';
    defaultResetId?: string;
    defaultResetEmail?: string;
    variant?: "page" | "modal";
    onCancel?: () => void;
    allowLoginNavigation?: boolean;
    cancelLabel?: string;
}

export function LoginScreen({
    onSuccess,
    initialResetStage = 'login',
    defaultResetId = '',
    defaultResetEmail = '',
    variant = "page",
    onCancel,
    allowLoginNavigation = true,
    cancelLabel,
}: LoginScreenProps) {
    const [userId, setUserId] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [errors, setErrors] = useState<{ userId?: string; password?: string }>({})
    const [resetStage, setResetStage] = useState<'login' | 'request' | 'verify' | 'newPassword'>(initialResetStage)
    const [resetId, setResetId] = useState(defaultResetId)
    const [resetEmail, setResetEmail] = useState(defaultResetEmail)
    const [resetCode, setResetCode] = useState('')
    const [resetErrors, setResetErrors] = useState<{ userId?: string; email?: string; code?: string; newPassword?: string; confirmPassword?: string }>({})
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [isResetSubmitting, setIsResetSubmitting] = useState(false)

    const validateForm = () => {
        const newErrors: { userId?: string; password?: string } = {}

        if (!userId) {
            newErrors.userId = '아이디를 입력해주세요'
        }

        if (!password) {
            newErrors.password = '비밀번호를 입력해주세요'
        } else if (password.length < 6) {
            newErrors.password = '비밀번호는 최소 6자 이상이어야 합니다'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const syncProfileStorage = (userData?: Partial<{ name: string; loginId: string; email: string; phone: string; role: string; avatarUrl?: string; photoUrl?: string }>) => {
        if (typeof window === 'undefined') return;
        const normalizedRole = normalizeUserRole(userData?.role) ?? 'DEVELOPER';
        const profilePayload = {
            profile: {
                id: userData?.name || userData?.loginId || userId,
                email: userData?.email || '',
                phone: userData?.phone || '',
                role: normalizedRole,
            },
            photo: userData?.avatarUrl || userData?.photoUrl || '/default-profile.png',
            twoFactorEnabled: false,
            updatedAt: new Date().toISOString(),
        };
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profilePayload));
        broadcastStorageChange(PROFILE_STORAGE_KEY, profilePayload);
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) return

        setIsLoading(true)
        setErrors({})

        try {
            const response = await authApi.login(userId, password) // 로그인 API 연결 시 주석 해제

            const { success, data, message } = response ?? {};
            if (!success || !data) {
                throw new Error(message || '로그인에 실패했습니다');
            }

            // 세션 기반 로그인: 토큰 대신 서버가 내려주는 사용자 정보만 저장
            const userPayload = {
                userId: data.userId,
                loginId: data.loginId,
                userName: data.userName,
                email: data.email,
                phone: data.phone,
                profileImg: data.profileImg,
                role: data.role,
            };

            localStorage.setItem('user', JSON.stringify(userPayload));
            broadcastStorageChange('user', userPayload);

            syncProfileStorage({
                name: data.userName,
                loginId: data.loginId || String(data.userId),
                email: data.email,
                phone: data.phone,
                role: data.role,
                avatarUrl: data.profileImg,
                photoUrl: data.profileImg,
            });

            onSuccess?.();

        } catch (error: any) {
            console.error('Login error:', error)
            
            let errorMessage = '로그인에 실패했습니다'
            
            if (error.response) {
                errorMessage = error.response.data?.message || 
                              error.response.data?.error || 
                              '아이디 또는 비밀번호가 올바르지 않습니다'
            } else if (error.request) {
                errorMessage = '서버와 연결할 수 없습니다. 네트워크를 확인해주세요.'
            }
            
            setErrors({
                userId: errorMessage,
                password: errorMessage,
            })
        } finally {
            setIsLoading(false)
        }
    }

    const validateResetRequestForm = () => {
        const newErrors: { userId?: string; email?: string } = {}

        if (!resetId) {
            newErrors.userId = '아이디를 입력해주세요'
        }

        if (!resetEmail) {
            newErrors.email = '이메일을 입력해주세요'
        } else if (!/\S+@\S+\.\S+/.test(resetEmail)) {
            newErrors.email = '이메일 형식이 올바르지 않습니다'
        }

        setResetErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleResetRequest = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateResetRequestForm()) return

        setIsResetSubmitting(true)

        try {
            await new Promise((resolve) => setTimeout(resolve, 1000))
            setResetStage('verify')
            setResetErrors({})
        } finally {
            setIsResetSubmitting(false)
        }
    }

    const handleResetCodeSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const newErrors: { code?: string } = {}
        if (!resetCode) {
            newErrors.code = '인증 코드를 입력해주세요'
        }
        setResetErrors(newErrors)
        if (Object.keys(newErrors).length > 0) return

        setIsResetSubmitting(true)
        try {
            await new Promise((resolve) => setTimeout(resolve, 1000))
            setResetStage('newPassword')
            setResetErrors({})
        } finally {
            setIsResetSubmitting(false)
        }
    }

    const handleNewPasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const newErrors: { newPassword?: string; confirmPassword?: string } = {}

        if (!newPassword) {
            newErrors.newPassword = '새 비밀번호를 입력해주세요'
        } else if (newPassword.length < 6) {
            newErrors.newPassword = '비밀번호는 최소 6자 이상이어야 합니다'
        }

        if (!confirmPassword) {
            newErrors.confirmPassword = '비밀번호를 확인해주세요'
        } else if (confirmPassword !== newPassword) {
            newErrors.confirmPassword = '비밀번호가 일치하지 않습니다'
        }

        setResetErrors(newErrors)
        if (Object.keys(newErrors).length > 0) return

        setIsResetSubmitting(true)
        try {
            await new Promise((resolve) => setTimeout(resolve, 1000))
            setResetId('')
            setResetEmail('')
            setResetCode('')
            setNewPassword('')
            setConfirmPassword('')
            setResetErrors({})
            if (allowLoginNavigation) {
                setResetStage('login')
            } else {
                onCancel?.()
            }
        } finally {
            setIsResetSubmitting(false)
        }
    }

    const isModalVariant = variant === "modal";
    const isResetFieldsReadOnly = isModalVariant;

    const handleReturnToLoginOrCancel = (options?: { resetNewPassword?: boolean }) => {
        setResetErrors({});
        if (options?.resetNewPassword) {
            setNewPassword('');
            setConfirmPassword('');
        }
        if (allowLoginNavigation) {
            setResetStage('login');
        } else {
            onCancel?.();
        }
    };

    return (
        <div
            className={`flex items-center justify-center p-4 ${
                isModalVariant ? "" : "min-h-screen bg-white"
            }`}
        >
            <div
                className="w-full"
                style={{ maxWidth: "var(--login-card-max-width, 42rem)" }}
            >
                {/* Login Card */}
                <Card variant="modal" className="login-theme border-0 shadow-lg">
                    <CardHeader className="space-y-2 pb-6">
                        <h2 className="text-xl text-center">
                            {resetStage !== 'login' ? (
                                <>
                                    비밀번호 <span style={{ color: "var(--point-color)" }}>재설정</span>
                                </>
                            ) : (
                                <>
                                    Work <span style={{ color: "var(--point-color)" }}>Hub</span>
                                </>
                            )}
                        </h2>
                        <p className="text-sm text-muted-foreground text-center">
                            {resetStage === 'login'
                                ? '워크스페이스에 접근하려면 로그인하세요.'
                                : resetStage === 'request'
                                ? '아이디와 이메일을 입력해 인증 코드를 받아보세요.'
                                : resetStage === 'verify'
                                ? '이메일로 받은 인증 코드를 입력하세요.'
                                : '새 비밀번호를 설정해 비밀번호 재설정을 완료하세요.'}
                        </p>
                    </CardHeader>
                    <CardContent>
                        {resetStage === 'login' ? (
                        <form onSubmit={handleLogin} className="space-y-6">
                            {/* Email Field */}
                            <div className="space-y-2">
                                <Label htmlFor="userId" className="text-gray-700">아이디</Label>
                                <Input
                                    id="userId"
                                    type="text"
                                    placeholder="아이디를 입력하세요"
                                    value={userId}
                                    onChange={(e) => setUserId(e.target.value)}
                                    className={`h-12 rounded-xl border-gray-200 bg-gray-50 px-4 focus:bg-white focus:border-primary transition-colors ${
                                        errors.userId ? 'border-red-300 focus:border-red-500' : ''
                                    }`}
                                />
                                {errors.userId && (
                                    <p className="text-sm" style={{ color: "var(--point-color)" }}>
                                        {errors.userId}
                                    </p>
                                )}
                            </div>

                            {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700">비밀번호</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="비밀번호를 입력하세요"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`h-12 rounded-xl border-gray-200 bg-gray-50 pr-16 px-4 focus:bg-white focus:border-primary transition-colors ${
                      errors.password ? 'border-red-300 focus:border-red-500' : ''
                    }`}
                  />
                </div>
                                {errors.password && (
                                    <p className="text-sm" style={{ color: "var(--point-color)" }}>
                                        {errors.password}
                                    </p>
                                )}
                            </div>

                            {/* Login Button */}
                            <Button
                                type="submit"
                                className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 w-full h-12 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-3"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <div className="flex items-center justify-center">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                        로그인 중...
                                    </div>
                                ) : (
                                    '로그인'
                                )}
                            </Button>

                            <div className="flex justify-between items-center text-sm">
                                <button
                                    type="button"
                                    className="text-primary hover:text-primary/80 transition-colors"
                                    onClick={() => {
                                        setResetStage('request')
                                        setErrors({})
                                    }}
                                >
                                    비밀번호를 잊으셨나요?
                                </button>
                            </div>

                        </form>
                        ) : resetStage === 'request' ? (
                        <form onSubmit={handleResetRequest} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="resetId" className="text-gray-700">아이디</Label>
                                <Input
                                    id="resetId"
                                    type="text"
                                    placeholder="아이디를 입력하세요"
                                    value={resetId}
                                    onChange={(e) => setResetId(e.target.value)}
                                    readOnly={isResetFieldsReadOnly}
                                    aria-readonly={isResetFieldsReadOnly}
                                    className={`h-12 rounded-xl border-gray-200 bg-gray-50 px-4 focus:bg-white focus:border-primary transition-colors ${
                                        resetErrors.userId ? 'border-red-300 focus:border-red-500' : ''
                                    }`}
                                />
                                {resetErrors.userId && (
                                    <p className="text-sm" style={{ color: "var(--point-color)" }}>
                                        {resetErrors.userId}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="resetEmail" className="text-gray-700">이메일</Label>
                                <Input
                                    id="resetEmail"
                                    type="email"
                                    placeholder="이메일을 입력하세요"
                                    value={resetEmail}
                                    onChange={(e) => setResetEmail(e.target.value)}
                                    readOnly={isResetFieldsReadOnly}
                                    aria-readonly={isResetFieldsReadOnly}
                                    className={`h-12 rounded-xl border-gray-200 bg-gray-50 px-4 focus:bg-white focus:border-primary transition-colors ${
                                        resetErrors.email ? 'border-red-300 focus:border-red-500' : ''
                                    }`}
                                />
                                {resetErrors.email && (
                                    <p className="text-sm" style={{ color: "var(--point-color)" }}>
                                        {resetErrors.email}
                                    </p>
                                )}
                            </div>

                            <div className="flex justify-between gap-2">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    className="w-1/2"
                                    onClick={() => handleReturnToLoginOrCancel()}
                                >
                                    {cancelLabel ?? "뒤로가기"}
                                </Button>
                                <Button
                                    type="submit"
                                    className="w-1/2"
                                    disabled={isResetSubmitting}
                                >
                                    {isResetSubmitting ? '전송 중...' : '인증 코드 받기'}
                                </Button>
                            </div>
                        </form>
                        ) : resetStage === 'verify' ? (
                        <form onSubmit={handleResetCodeSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="verificationCode" className="text-gray-700">인증 코드</Label>
                                <Input
                                    id="verificationCode"
                                    type="text"
                                    placeholder="코드를 입력하세요"
                                    value={resetCode}
                                    onChange={(e) => setResetCode(e.target.value)}
                                    className={`h-12 rounded-xl border-gray-200 bg-gray-50 px-4 focus:bg-white focus:border-primary transition-colors ${
                                        resetErrors.code ? 'border-red-300 focus:border-red-500' : ''
                                    }`}
                                />
                                {resetErrors.code && (
                                    <p className="text-sm" style={{ color: "var(--point-color)" }}>
                                        {resetErrors.code}
                                    </p>
                                )}
                            </div>

                            <div className="flex justify-between gap-2">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    className="w-1/2"
                                    onClick={() => {
                                        setResetStage('request')
                                        setResetErrors({})
                                    }}
                                >
                                    뒤로
                                </Button>
                                <Button
                                    type="submit"
                                    className="w-1/2"
                                    disabled={isResetSubmitting}
                                >
                                    {isResetSubmitting ? '확인 중...' : '확인'}
                                </Button>
                            </div>
                        </form>
                        ) : (
                        <form onSubmit={handleNewPasswordSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="newPassword" className="text-gray-700">새 비밀번호</Label>
                                <Input
                                    id="newPassword"
                                    type="password"
                                    placeholder="새 비밀번호를 입력하세요"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className={`h-12 rounded-xl border-gray-200 bg-gray-50 px-4 focus:bg-white focus:border-primary transition-colors ${
                                        resetErrors.newPassword ? 'border-red-300 focus:border-red-500' : ''
                                    }`}
                                />
                                {resetErrors.newPassword && (
                                    <p className="text-sm" style={{ color: "var(--point-color)" }}>
                                        {resetErrors.newPassword}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword" className="text-gray-700">비밀번호 확인</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="새 비밀번호를 다시 입력하세요"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className={`h-12 rounded-xl border-gray-200 bg-gray-50 px-4 focus:bg-white focus:border-primary transition-colors ${
                                        resetErrors.confirmPassword ? 'border-red-300 focus:border-red-500' : ''
                                    }`}
                                />
                                {resetErrors.confirmPassword && (
                                    <p className="text-sm" style={{ color: "var(--point-color)" }}>
                                        {resetErrors.confirmPassword}
                                    </p>
                                )}
                            </div>

                            <div className="flex justify-between gap-2">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    className="w-1/2"
                                    onClick={() =>
                                        handleReturnToLoginOrCancel({ resetNewPassword: true })
                                    }
                                >
                                    {cancelLabel ?? "취소"}
                                </Button>
                                <Button
                                    type="submit"
                                    className="w-1/2"
                                    disabled={isResetSubmitting}
                                >
                                    {isResetSubmitting ? '저장 중...' : '비밀번호 변경'}
                                </Button>
                            </div>
                        </form>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
