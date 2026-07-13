"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, Compass, Eye, EyeOff, LockKeyhole, Mail, UserRound } from "lucide-react";
import { createClient, hasSupabaseConfig } from "@/lib/supabase/client";
import { validateTeamInvite } from "@/lib/data";

const authError = (message: string) => ({
  "Invalid login credentials": "Невалиден имейл или парола.",
  "Email not confirmed": "Имейлът все още не е потвърден.",
  "User already registered": "Вече съществува профил с този имейл.",
  "Password should be at least 6 characters": "Паролата трябва да съдържа поне 6 знака.",
}[message] || "Възникна грешка. Моля, опитайте отново.");

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [inviteToken, setInviteToken] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (mode !== "register") return;
    const token = new URLSearchParams(window.location.search).get("invite") || "";
    if (!token) {
      setError("Регистрацията е достъпна само с валидна фирмена покана.");
      return;
    }
    validateTeamInvite(token).then((invite) => {
      if (!invite) setError("Поканата е невалидна или е изтекла.");
      else {
        setInviteToken(token);
        setEmail(invite.email);
      }
    });
  }, [mode]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);

    if (!hasSupabaseConfig) {
      setError("Връзката със Supabase не е конфигурирана.");
      setBusy(false);
      return;
    }

    const supabase = createClient()!;
    try {
      if (mode === "login") {
        const { data, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
        if (loginError) setError(authError(loginError.message));
        else if (!data.session) setError("Входът не създаде активна сесия.");
        else {
          router.replace("/");
          router.refresh();
        }
      } else {
        if (!inviteToken) {
          setError("Необходима е валидна фирмена покана.");
          return;
        }
        const { error: registerError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name, invite_token: inviteToken },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (registerError) setError(authError(registerError.message));
        else setSent(true);
      }
    } catch {
      setError("Няма връзка със Supabase. Проверете интернет връзката.");
    } finally {
      setBusy(false);
    }
  }

  const isLogin = mode === "login";

  return (
    <div className="relative grid w-full max-w-[1240px] overflow-hidden border border-[#dedbcf] bg-[#fbfaf4] shadow-[0_28px_90px_rgba(63,58,43,.12)] lg:min-h-[760px] lg:grid-cols-[1.12fr_.88fr] lg:rounded-[28px]">
      <section className="relative flex min-h-[290px] flex-col overflow-hidden bg-[#e8e5da] sm:min-h-[360px] lg:min-h-0">
        <Image
          src="/ai-compass-login-3d.png"
          alt="3D AI лаборатория на AI Компас"
          fill
          priority
          sizes="(min-width: 1024px) 56vw, 100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#22251a]/45 via-transparent to-[#1f2417]/70 lg:bg-gradient-to-t lg:from-[#1d2117]/80 lg:via-transparent lg:to-[#272a20]/35" />

        <div className="relative z-10 flex items-center gap-3 p-5 text-white sm:p-7 lg:p-10">
          <span className="grid size-10 place-items-center rounded-xl border border-white/30 bg-white/15 shadow-sm backdrop-blur-md">
            <Compass size={21} strokeWidth={2.2} />
          </span>
          <div>
            <p className="text-[15px] font-semibold tracking-[-.02em]">AI Компас</p>
            <p className="text-[10px] font-medium uppercase tracking-[.18em] text-white/70">Вътрешна AI лаборатория</p>
          </div>
        </div>

        <div className="relative z-10 mt-auto max-w-[590px] p-5 pt-12 text-white sm:p-7 lg:p-10">
          <p className="mb-3 hidden text-[11px] font-semibold uppercase tracking-[.22em] text-[#dcecae] lg:block">Знание · Инструменти · Експерименти</p>
          <h1 className="max-w-[520px] text-[27px] font-semibold leading-[1.1] tracking-[-.04em] sm:text-[34px] lg:text-[46px]">
            Посока към <span className="text-[#dcecae]">по-умна работа с AI.</span>
          </h1>
          <p className="mt-3 max-w-lg text-[13px] leading-5 text-white/80 sm:text-sm lg:mt-5 lg:text-[15px] lg:leading-7">
            Вътрешна платформа за знания, инструменти и експерименти.
          </p>
        </div>
      </section>

      <section className="relative flex items-center bg-[rgba(255,255,255,.88)] px-5 py-9 backdrop-blur-xl sm:px-10 sm:py-12 lg:px-16 lg:py-16">
        <div className="mx-auto w-full max-w-[420px]">
          <div className="mb-8 lg:mb-10">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[.18em] text-[#667530]">
              {isLogin ? "Защитен фирмен достъп" : "Фирмена покана"}
            </p>
            <h2 className="text-[30px] font-semibold leading-tight tracking-[-.035em] text-[#27291f] sm:text-[34px]">
              {isLogin ? "Добре дошли отново" : inviteToken ? "Приемане на покана" : "Създаване на профил"}
            </h2>
            <p className="mt-3 text-sm leading-6 text-[#716f65]">
              {isLogin ? "Въведете служебните си данни, за да продължите в AI Компас." : "Завършете профила си, за да се присъедините към AI Компас."}
            </p>
          </div>

          {sent ? (
            <div className="rounded-2xl border border-[#c9d99a] bg-[#f4f8e8] p-5 text-sm leading-6 text-[#4f5f1d]" role="status">
              Проверете имейла си, за да потвърдите профила.
            </div>
          ) : (
            <form className="space-y-5" onSubmit={submit}>
              {!isLogin && (
                <label className="block text-xs font-semibold text-[#4d4e45]">
                  Име и фамилия
                  <div className="relative mt-2">
                    <UserRound className="absolute left-4 top-1/2 -translate-y-1/2 text-[#929184]" size={18} aria-hidden="true" />
                    <input
                      className="w-full rounded-xl border border-[#d8d5c9] bg-[#f8f7f1] py-3.5 pl-12 pr-4 text-sm text-[#27291f] outline-none transition placeholder:text-[#aaa89e] focus:border-[#73823b] focus:bg-white focus:ring-4 focus:ring-[#73823b]/10"
                      required
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Вашето име"
                    />
                  </div>
                </label>
              )}

              <label className="block text-xs font-semibold text-[#4d4e45]">
                Служебен имейл
                <div className="relative mt-2">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#929184]" size={18} aria-hidden="true" />
                  <input
                    className="w-full rounded-xl border border-[#d8d5c9] bg-[#f8f7f1] py-3.5 pl-12 pr-4 text-sm text-[#27291f] outline-none transition placeholder:text-[#aaa89e] focus:border-[#73823b] focus:bg-white focus:ring-4 focus:ring-[#73823b]/10 read-only:cursor-not-allowed read-only:opacity-70"
                    required
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    readOnly={!isLogin}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ime@company.bg"
                  />
                </div>
              </label>

              <label className="block text-xs font-semibold text-[#4d4e45]">
                <span className="flex items-center justify-between gap-4">
                  Парола
                  {isLogin && (
                    <Link href="/forgot-password" className="font-medium text-[#68782f] transition hover:text-[#445218] hover:underline">
                      Забравена парола?
                    </Link>
                  )}
                </span>
                <div className="relative mt-2">
                  <LockKeyhole className="absolute left-4 top-1/2 -translate-y-1/2 text-[#929184]" size={18} aria-hidden="true" />
                  <input
                    className="w-full rounded-xl border border-[#d8d5c9] bg-[#f8f7f1] py-3.5 pl-12 pr-12 text-sm text-[#27291f] outline-none transition placeholder:text-[#aaa89e] focus:border-[#73823b] focus:bg-white focus:ring-4 focus:ring-[#73823b]/10"
                    required
                    minLength={6}
                    type={show ? "text" : "password"}
                    autoComplete={isLogin ? "current-password" : "new-password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Въведете парола"
                  />
                  <button
                    type="button"
                    onClick={() => setShow((value) => !value)}
                    className="absolute right-3 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-[#858477] transition hover:bg-[#eceadf] hover:text-[#4f5f1d]"
                    aria-label={show ? "Скрий паролата" : "Покажи паролата"}
                  >
                    {show ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </label>

              {error && (
                <p className="rounded-xl border border-[#efc6c0] bg-[#fff5f3] p-3.5 text-sm text-[#a33127]" role="alert">
                  {error}
                </p>
              )}

              <button
                disabled={busy || (!isLogin && !inviteToken)}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#59691f] px-5 py-4 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(82,98,28,.2)] transition hover:bg-[#475616] hover:shadow-[0_12px_28px_rgba(82,98,28,.26)] active:scale-[.99] disabled:cursor-not-allowed disabled:opacity-55"
              >
                {busy ? "Моля, изчакайте..." : isLogin ? "Влез в AI Компас" : "Създай профил"}
                {!busy && <ArrowRight className="transition-transform group-hover:translate-x-0.5" size={17} />}
              </button>
            </form>
          )}

          <div className="mt-8 flex items-center gap-3 text-[#9a988d]">
            <span className="h-px flex-1 bg-[#e1ded3]" />
            <Compass size={15} />
            <span className="h-px flex-1 bg-[#e1ded3]" />
          </div>

          {isLogin ? (
            <p className="mt-5 text-center text-xs leading-5 text-[#77756b]">
              Достъпът е само за поканени членове на екипа.
            </p>
          ) : (
            <p className="mt-5 text-center text-xs text-[#77756b]">
              Вече имате профил?{" "}
              <Link className="font-semibold text-[#59691f] hover:underline" href="/login">Вход</Link>
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
