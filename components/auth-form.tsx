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
    <div className="fixed inset-0 isolate overflow-y-auto bg-[#dedbce]">
      <section className="fixed inset-0 flex flex-col overflow-hidden bg-[#e8e5da]">
        <Image
          src="/ai-compass-login-background-v3.png"
          alt="3D AI лаборатория на AI Компас"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[42%_center] lg:object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#202319]/55 via-[#313426]/5 to-[#1f2417]/65 lg:bg-gradient-to-r lg:from-[#1d2117]/50 lg:via-transparent lg:to-[#f6f2e8]/15" />

        <div className="relative z-10 flex items-center gap-3 p-5 text-white sm:p-7 lg:p-10">
          <span className="relative grid size-12 shrink-0 place-items-center rounded-full border border-[#f4df9b]/70 bg-[radial-gradient(circle_at_32%_24%,rgba(255,255,255,.9),rgba(225,199,121,.62)_34%,rgba(85,91,47,.78)_100%)] shadow-[0_10px_30px_rgba(32,31,20,.28),inset_0_1px_1px_rgba(255,255,255,.85)] backdrop-blur-xl">
            <span className="absolute inset-[4px] rounded-full border border-white/45" />
            <Compass className="relative z-10 text-[#fff8dc] drop-shadow-[0_2px_3px_rgba(39,40,21,.45)]" size={24} strokeWidth={1.8} />
            <span className="absolute left-1/2 top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#fff4bd] shadow-[0_0_8px_#fff4bd]" />
          </span>
          <div>
            <p className="text-[15px] font-semibold tracking-[-.02em]">AI Компас</p>
            <p className="text-[10px] font-medium uppercase tracking-[.18em] text-white/70">Вътрешна AI лаборатория</p>
          </div>
        </div>

        <div className="relative z-10 mt-auto hidden max-w-[590px] p-10 text-white lg:block">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[.22em] text-[#dcecae]">Знание · Инструменти · Експерименти</p>
          <h1 className="max-w-[520px] text-[27px] font-semibold leading-[1.1] tracking-[-.04em] sm:text-[34px] lg:text-[46px]">
            Посока към <span className="text-[#dcecae]">по-умна работа с AI.</span>
          </h1>
          <p className="mt-3 max-w-lg text-[13px] leading-5 text-white/80 sm:text-sm lg:mt-5 lg:text-[15px] lg:leading-7">
            Вътрешна платформа за знания, инструменти и експерименти.
          </p>
        </div>
      </section>

      <section className="relative z-20 ml-auto flex min-h-[100dvh] w-full items-center px-4 pb-8 pt-24 sm:px-8 sm:pt-28 lg:w-1/2 lg:px-[4vw] lg:py-10">
        <div className="mx-auto w-full max-w-[430px] rounded-[26px] border border-white/55 bg-white/85 p-6 shadow-[0_28px_80px_rgba(43,40,29,.22)] backdrop-blur-2xl sm:p-9 lg:-translate-y-5 lg:bg-[#fffef9]/90">
          <div className="mb-7 border-b border-[#dedbd0] pb-6 lg:hidden">
            <h1 className="text-[26px] font-semibold leading-[1.12] tracking-[-.04em] text-[#2d3025] sm:text-[30px]">
              Посока към <span className="text-[#64752c]">по-умна работа с AI.</span>
            </h1>
            <p className="mt-3 text-sm leading-6 text-[#6e6c62]">
              Вътрешна платформа за знания, инструменти и експерименти.
            </p>
          </div>
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
