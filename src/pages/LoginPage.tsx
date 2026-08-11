import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Lock, LogIn, Sun, Moon } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useObjectModelStore } from "../store/useObjectModelStore";

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const login = useAuthStore((s) => s.login);
  const { theme, toggleTheme } = useObjectModelStore();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username.trim()) {
      setError("Por favor, informe o usuário.");
      return;
    }
    if (!password.trim()) {
      setError("Por favor, informe a senha.");
      return;
    }

    setIsLoading(true);
    // Simulate minor delay for authenticating feel
    setTimeout(() => {
      login(username);
      setIsLoading(false);
      navigate("/");
    }, 800);
  };
  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-gradient-to-tr from-sky-50 via-white to-indigo-50 dark:from-slate-800 dark:via-slate-700 dark:to-indigo-900 p-4 relative overflow-hidden select-none transition-colors duration-300">
      {/* Dynamic Background Blurs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sky-400/15 dark:bg-sky-400/20 rounded-full blur-3xl -z-10 animate-pulse duration-4000" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-400/15 dark:bg-indigo-400/20 rounded-full blur-3xl -z-10 animate-pulse duration-3000" />

      {/* Floating Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="absolute top-6 right-6 p-2 rounded-xl bg-white/70 hover:bg-white/90 border border-slate-200 dark:bg-slate-700/60 dark:hover:bg-slate-600/60 dark:border-slate-500 text-slate-700 dark:text-white cursor-pointer transition-all hover:scale-105"
        title="Alternar Tema">
        {theme === "dark" ? (
          <Sun className="w-5 h-5 text-amber-400" />
        ) : (
          <Moon className="w-5 h-5 text-indigo-600" />
        )}
      </button>

      {/* Login Card */}
      <div className="w-full max-w-md bg-white/95 dark:bg-slate-700/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-500/50 rounded-3xl p-8 shadow-2xl dark:shadow-2xl dark:shadow-black/30 flex flex-col items-center">
        {/* Brand Logo & Name */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-sky-500 p-2 shadow-lg shadow-indigo-500/20 mb-3 flex items-center justify-center">
            <img
              src="/SerranoIcon.png"
              alt="Serrano Logo"
              className="w-12 h-12 object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
            Serrano Automação
          </h1>
          <p className="text-[11px] text-slate-500 dark:text-slate-300 font-semibold tracking-wider uppercase mt-0.5">
            POC de Gestão de Inventários e Movimentos
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="w-full mb-4 px-4 py-2.5 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-700 dark:text-rose-200 text-xs font-semibold text-center">
            {error}
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="w-full space-y-5 text-xs text-slate-700 dark:text-white">
          {/* Username Input */}
          <div className="space-y-1.5">
            <label className="block text-slate-600 dark:text-slate-200 font-semibold pl-1">
              Usuário / Login
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-400" />
              <input
                type="text"
                placeholder="Ex: bruno.kappi"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                className="w-full bg-white dark:bg-slate-600/60 border border-slate-200 dark:border-slate-500 focus:border-indigo-500 dark:focus:border-indigo-400 rounded-2xl pl-10 pr-4 py-3 outline-none text-slate-800 dark:text-slate-100 transition-all placeholder-slate-400 dark:placeholder-slate-400 font-semibold"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <label className="block text-slate-600 dark:text-slate-200 font-semibold pl-1">
              Senha de Acesso
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-400" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="w-full bg-white dark:bg-slate-600/60 border border-slate-200 dark:border-slate-500 focus:border-indigo-500 dark:focus:border-indigo-400 rounded-2xl pl-10 pr-4 py-3 outline-none text-slate-800 dark:text-slate-100 transition-all placeholder-slate-400 dark:placeholder-slate-400 font-semibold"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 bg-sky-600 hover:bg-sky-700 disabled:bg-sky-800 text-white font-bold text-xs rounded-2xl shadow-lg shadow-sky-500/20 hover:shadow-sky-600/30 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2">
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Autenticando...</span>
              </span>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Entrar no Sistema</span>
              </>
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="mt-8 text-center text-[10px] text-slate-400 dark:text-slate-400 font-semibold font-sans"></div>
      </div>
    </div>
  );
};
