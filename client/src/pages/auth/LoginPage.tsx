import { useState, useEffect, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/authUtils";

export default function LoginPage() {
  const { login, socialLogin, isLoading, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/app";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(user.role === "stylist" ? "/stylist/dashboard" : redirectTo, {
        replace: true,
      });
    }
  }, [isAuthenticated, user, navigate, redirectTo]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please fill in all fields");
      return;
    }

    try {
      const user = await login(email.trim(), password);
      navigate(user.role === "stylist" ? "/stylist/dashboard" : redirectTo, {
        replace: true,
      });
    } catch (err: any) {
      setError(err.message || "Invalid email or password");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAF8F4] dark:bg-gray-950 p-4">
      <div className="w-full max-w-md space-y-6 bg-white dark:bg-gray-900 p-8 shadow-lg rounded-xl">
        {/* Logo / Brand */}
        <div className="text-center">
          <Link to="/">
            <h1 className="text-3xl font-bold text-[#2D2A24] dark:text-white">Styles</h1>
          </Link>
          <p className="mt-1 text-sm text-[#7A7168] dark:text-gray-400">Welcome back!</p>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-400 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-[#2D2A24] dark:text-gray-200"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded border border-[#D4C9B8] dark:border-gray-700 bg-[#FAF8F4] dark:bg-gray-800 px-3 py-2 text-sm text-[#2D2A24] dark:text-gray-200 placeholder-[#A69E94] dark:placeholder-gray-500 outline-none focus:border-[#8B7E6B] dark:focus:border-indigo-500 focus:ring-1 focus:ring-[#8B7E6B] dark:focus:ring-indigo-500"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-[#2D2A24] dark:text-gray-200"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded border border-[#D4C9B8] dark:border-gray-700 bg-[#FAF8F4] dark:bg-gray-800 px-3 py-2 text-sm text-[#2D2A24] dark:text-gray-200 placeholder-[#A69E94] dark:placeholder-gray-500 outline-none focus:border-[#8B7E6B] dark:focus:border-indigo-500 focus:ring-1 focus:ring-[#8B7E6B] dark:focus:ring-indigo-500"
              placeholder="Your password"
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-[#7A7168] dark:text-gray-400">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-[#D4C9B8] dark:border-gray-600 text-[#8B7E6B] dark:text-indigo-500"
              />
              Remember me
            </label>
            <Link
              to="/forgot-password"
              className="text-[#7A7168] dark:text-gray-400 hover:text-[#2D2A24] dark:hover:text-white"
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded bg-[#2D2A24] dark:bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#4A443B] dark:hover:bg-indigo-500 disabled:opacity-50"
          >
            {isLoading ? "Logging in\u2026" : "Log in"}
          </button>
        </form>

        <p className="text-center text-sm text-[#7A7168] dark:text-gray-400">
          Don"t have an account?{" "}
          <Link
            to="/signup"
            className="font-medium text-[#2D2A24] dark:text-gray-200 hover:underline"
          >
            Sign up
          </Link>
        </p>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-[#D4C9B8] dark:border-gray-700" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white dark:bg-gray-900 px-2 text-[#7A7168] dark:text-gray-400">Or continue with</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={isLoading}
            onClick={async () => {
              try {
                const u = await socialLogin("google");
                navigate(u.role === "stylist" ? "/stylist/dashboard" : redirectTo, { replace: true });
              } catch (err: any) {
                setError(err.message || "Google login failed");
              }
            }}
            className="flex items-center justify-center gap-2 rounded border border-[#D4C9B8] dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm font-medium text-[#2D2A24] dark:text-gray-200 transition hover:bg-[#FAF8F4] dark:hover:bg-gray-700 disabled:opacity-50"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Google
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={async () => {
              try {
                const u = await socialLogin("apple");
                navigate(u.role === "stylist" ? "/stylist/dashboard" : redirectTo, { replace: true });
              } catch (err: any) {
                setError(err.message || "Apple login failed");
              }
            }}
            className="flex items-center justify-center gap-2 rounded border border-[#D4C9B8] dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm font-medium text-[#2D2A24] dark:text-gray-200 transition hover:bg-[#FAF8F4] dark:hover:bg-gray-700 disabled:opacity-50"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"
                fill="currentColor"
              />
            </svg>
            Apple
          </button>
        </div>
      </div>
    </div>
  );
}
