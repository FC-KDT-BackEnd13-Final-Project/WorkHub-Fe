'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'

interface LoginScreenProps {
    onSuccess?: () => void;
}

export function LoginScreen({ onSuccess }: LoginScreenProps) {
    const [userId, setUserId] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [errors, setErrors] = useState<{ userId?: string; password?: string }>({})
    const [resetStage, setResetStage] = useState<'login' | 'request' | 'verify' | 'newPassword'>('login')
    const [resetId, setResetId] = useState('')
    const [resetEmail, setResetEmail] = useState('')
    const [resetCode, setResetCode] = useState('')
    const [resetErrors, setResetErrors] = useState<{ userId?: string; email?: string; code?: string; newPassword?: string; confirmPassword?: string }>({})
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [isResetSubmitting, setIsResetSubmitting] = useState(false)

    const validateForm = () => {
        const newErrors: { userId?: string; password?: string } = {}

        if (!userId) {
            newErrors.userId = 'Please enter your ID'
        }

        if (!password) {
            newErrors.password = 'Password is required'
        } else if (password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) return

        setIsLoading(true)

        try {
            // Firebase authentication would go here
            // Example: await signInWithEmailAndPassword(auth, userId, password)
            console.log('Login attempt:', { userId, password })

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000))

            // Handle successful login (redirect to dashboard, etc.)
            console.log('Login successful')
            onSuccess?.()

        } catch (error) {
            console.error('Login error:', error)
            setErrors({
                userId: 'Invalid ID or password',
                password: 'Invalid ID or password',
            })
        } finally {
            setIsLoading(false)
        }
    }

    const validateResetRequestForm = () => {
        const newErrors: { userId?: string; email?: string } = {}

        if (!resetId) {
            newErrors.userId = 'Please enter your ID'
        }

        if (!resetEmail) {
            newErrors.email = 'Please enter your email'
        } else if (!/\S+@\S+\.\S+/.test(resetEmail)) {
            newErrors.email = 'Email format looks incorrect'
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
            newErrors.code = 'Please enter the verification code'
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
            newErrors.newPassword = 'Please enter a new password'
        } else if (newPassword.length < 6) {
            newErrors.newPassword = 'Password must be at least 6 characters'
        }

        if (!confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password'
        } else if (confirmPassword !== newPassword) {
            newErrors.confirmPassword = 'Passwords do not match'
        }

        setResetErrors(newErrors)
        if (Object.keys(newErrors).length > 0) return

        setIsResetSubmitting(true)
        try {
            await new Promise((resolve) => setTimeout(resolve, 1000))
            setResetStage('login')
            setResetId('')
            setResetEmail('')
            setResetCode('')
            setNewPassword('')
            setConfirmPassword('')
            setResetErrors({})
        } finally {
            setIsResetSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-4">
            <div
                className="w-full"
                style={{ maxWidth: "var(--login-card-max-width, 42rem)" }}
            >
                {/* Login Card */}
                <Card className="border-0 shadow-lg">
                    <CardHeader className="space-y-2 pb-6">
                        <h2 className="text-xl text-center">
                            {resetStage !== 'login' ? (
                                <>
                                    Reset <span style={{ color: "var(--point-color)" }}>Password</span>
                                </>
                            ) : (
                                <>
                                    Work <span style={{ color: "var(--point-color)" }}>Hub</span>
                                </>
                            )}
                        </h2>
                        <p className="text-sm text-muted-foreground text-center">
                            {resetStage === 'login'
                                ? 'Sign in to access your workspace.'
                                : resetStage === 'request'
                                ? 'Enter your ID and email to receive a verification code.'
                                : resetStage === 'verify'
                                ? 'Enter the verification code we sent to your email.'
                                : 'Choose a new password to finish resetting your account.'}
                        </p>
                    </CardHeader>
                    <CardContent>
                        {resetStage === 'login' ? (
                        <form onSubmit={handleLogin} className="space-y-6">
                            {/* Email Field */}
                            <div className="space-y-2">
                                <Label htmlFor="userId" className="text-gray-700">ID</Label>
                                <Input
                                    id="userId"
                                    type="text"
                                    placeholder="Enter your ID"
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
                <Label htmlFor="password" className="text-gray-700">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
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
                                        Signing in...
                                    </div>
                                ) : (
                                    'Sign In'
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
                                    Forgot password?
                                </button>
                            </div>

                        </form>
                        ) : resetStage === 'request' ? (
                        <form onSubmit={handleResetRequest} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="resetId" className="text-gray-700">ID</Label>
                                <Input
                                    id="resetId"
                                    type="text"
                                    placeholder="Enter your ID"
                                    value={resetId}
                                    onChange={(e) => setResetId(e.target.value)}
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
                                <Label htmlFor="resetEmail" className="text-gray-700">Email</Label>
                                <Input
                                    id="resetEmail"
                                    type="email"
                                    placeholder="Enter your email"
                                    value={resetEmail}
                                    onChange={(e) => setResetEmail(e.target.value)}
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
                                    onClick={() => {
                                        setResetStage('login')
                                        setResetErrors({})
                                    }}
                                >
                                    Back
                                </Button>
                                <Button
                                    type="submit"
                                    className="w-1/2"
                                    disabled={isResetSubmitting}
                                >
                                    {isResetSubmitting ? 'Sending...' : 'Send Code'}
                                </Button>
                            </div>
                        </form>
                        ) : resetStage === 'verify' ? (
                        <form onSubmit={handleResetCodeSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="verificationCode" className="text-gray-700">Verification Code</Label>
                                <Input
                                    id="verificationCode"
                                    type="text"
                                    placeholder="Enter the code"
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
                                    Back
                                </Button>
                                <Button
                                    type="submit"
                                    className="w-1/2"
                                    disabled={isResetSubmitting}
                                >
                                    {isResetSubmitting ? 'Verifying...' : 'Verify'}
                                </Button>
                            </div>
                        </form>
                        ) : (
                        <form onSubmit={handleNewPasswordSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="newPassword" className="text-gray-700">New Password</Label>
                                <Input
                                    id="newPassword"
                                    type="password"
                                    placeholder="Enter a new password"
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
                                <Label htmlFor="confirmPassword" className="text-gray-700">Confirm Password</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="Re-enter the new password"
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
                                    onClick={() => {
                                        setResetStage('login')
                                        setResetErrors({})
                                        setNewPassword('')
                                        setConfirmPassword('')
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="w-1/2"
                                    disabled={isResetSubmitting}
                                >
                                    {isResetSubmitting ? 'Saving...' : 'Update Password'}
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
