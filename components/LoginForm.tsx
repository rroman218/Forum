'use client'
import { Eye, EyeOff, Mail } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'
import React, { FormEvent, useState } from 'react'

export default function LoginForm() {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [remember, setRemember] = useState(true);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const router = useRouter();

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");

        try {
            setLoading(true);
        } catch {
            setError("Failed to log in!")
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <h2 className='text-[25px] font-bold tracking-tight'>
                З поверненням!
            </h2>
            <p className="mt-1 text-xs text-[#8794a9]">
                Увійдіть, щоб продовжити навчатися разом.
            </p>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <div className="">
                    <label htmlFor="login-email" className="auth-label">
                        Електронна пошта
                    </label>

                    <div className="auth-input-wrap">
                        <Mail size={15} className="shrink-0 text-[#8492a8]" />

                        <input
                            id="login-email"
                            name="email"
                            type="email"
                            placeholder="name@example.com"
                            autoComplete="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            maxLength={254}
                            className="auth-input"
                        />
                    </div>
                </div>
                <div>
                    <label htmlFor="login-password" className="auth-label">
                        Пароль
                    </label>

                    <div className="auth-input-wrap">
                        <input
                            id="login-password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            maxLength={72}
                            className="auth-input"
                        />

                        <button
                            type="button"
                            aria-label={showPassword ? "Приховати пароль" : "Показати пароль"}
                            aria-pressed={showPassword}
                            onClick={() => setShowPassword(!showPassword)}
                            className="text-[#8492a8] hover:text-[#5145e5]"
                        >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                </div>
                <div className="flex items-center justify-between gap-2 text-[11px]">
                    <label className="flex cursor-pointer items-center gap-1.5 text-[#75839a]">
                        <input
                            type="checkbox"
                            checked={remember}
                            onChange={(e) => setRemember(e.target.checked)}
                            className="accent-[#5145e5]"
                        />
                        Запам'ятати мене
                    </label>

                    <Link
                        href="/forgot-password"
                        className="text-[#5145e5] hover:underline"
                    >
                        Забули пароль?
                    </Link>
                </div>

                {error && (
                    <p role="alert" className="text-xs text-red-600">
                        {error}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="auth-primary-button"
                >
                    {loading ? "Входимо..." : "Увійти"}
                </button>
            </form>

            <div className="mt-4 text-center text-xs text-[#8794a9]">
                Ще не маєте облікового запису?
            </div>

            <Link href="/register" className="auth-secondary-button mt-3">
                Зареєструватися
            </Link>
        </>
    );
}
