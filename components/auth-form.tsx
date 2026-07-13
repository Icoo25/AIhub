"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, Compass, Eye, LockKeyhole, Mail } from "lucide-react";
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
    if (!token) { setError("Регистрацията е достъпна само с валидна фирмена покана."); return; }
    validateTeamInvite(token).then(invite => {
      if (!invite) setError("Поканата е невалидна или е изтекла.");
      else { setInviteToken(token); setEmail(invite.email); }
    });
  }, [mode]);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(""); setBusy(true);
    if (!hasSupabaseConfig) return router.push("/");
    const supabase = createClient()!;
    try {
      if (mode === "login") {
        const { data, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
        if (loginError) setError(authError(loginError.message));
        else if (!data.session) setError("Входът не създаде активна сесия.");
        else { router.replace("/"); router.refresh(); }
      } else {
        if (!inviteToken) { setError("Необходима е валидна фирмена покана."); return; }
        const { error: registerError } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name, invite_token: inviteToken }, emailRedirectTo: `${window.location.origin}/auth/callback` } });
        if (registerError) setError(authError(registerError.message)); else setSent(true);
      }
    } catch { setError("Няма връзка със Supabase. Проверете интернет връзката."); }
    finally { setBusy(false); }
  }

  return <div className="grid w-full max-w-[1000px] overflow-hidden rounded-xl border border-[#e4e3d9] bg-white shadow-[0_22px_80px_rgba(55,56,42,.09)] lg:grid-cols-2">
    <section className="relative hidden min-h-[620px] flex-col justify-between overflow-hidden bg-[#f5f4ea] p-10 lg:flex"><div><div className="flex items-center gap-2 text-[12px] font-semibold"><Compass className="text-[#52621c]" size={18}/> AI Компас</div><h1 className="mt-12 max-w-sm text-[38px] font-semibold leading-[1.15] tracking-[-.04em]">Посока към <span className="text-[#52621c]">по-умна работа с AI.</span></h1><p className="mt-5 max-w-sm text-[11px] leading-relaxed text-[#767869]">Вътрешна платформа за знания, инструменти и експерименти.</p></div><div className="relative h-52 overflow-hidden rounded-xl"><Image src="/ai-lab.jpg" alt="AI Компас" fill className="object-cover" priority/></div><p className="text-[8px] font-semibold uppercase tracking-[.18em] text-[#9a9b8d]">AI Компас · {new Date().getFullYear()}</p></section>
    <section className="flex min-h-[620px] items-center p-7 sm:p-12 lg:p-16"><div className="w-full"><div className="mb-8 flex items-center gap-2 lg:hidden"><Compass className="text-[#52621c]" size={18}/><span className="text-xs font-semibold">AI Компас</span></div><h2 className="text-2xl font-semibold tracking-[-.025em]">{mode === "login" ? "Добре дошли отново" : inviteToken ? "Приемане на покана" : "Създаване на профил"}</h2><p className="mt-2 text-[10px] text-[#767869]">{mode === "login" ? "Въведете данните си, за да продължите." : "Присъединете се към AI Компас."}</p>
      {sent ? <div className="mt-8 rounded-lg border border-[#bbcf7c] bg-[#f4f8e7] p-4 text-[11px] text-[#52621c]">Проверете имейла си, за да потвърдите профила.</div> : <form className="mt-8 space-y-5" onSubmit={submit}>{mode === "register" && <label className="block text-[9px] font-medium text-[#46483b]">Име и фамилия<input className="field mt-2" required value={name} onChange={e => setName(e.target.value)}/></label>}<label className="block text-[9px] font-medium text-[#46483b]">Имейл адрес<div className="relative mt-2"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a9b8d]" size={14}/><input className="field pl-9" required type="email" readOnly={mode === "register"} value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com"/></div></label><label className="block text-[9px] font-medium text-[#46483b]"><span className="flex justify-between">Парола{mode === "login" && <Link href="/forgot-password" className="text-[#67558d] hover:underline">Забравена парола?</Link>}</span><div className="relative mt-2"><LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a9b8d]" size={14}/><input className="field px-9" required minLength={6} type={show ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}/><button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9a9b8d]"><Eye size={14}/></button></div></label>{error && <p className="rounded-lg border border-[#ffdad6] bg-[#fff4f2] p-3 text-[10px] text-[#ba1a1a]">{error}</p>}<button disabled={busy || (mode === "register" && !inviteToken)} className="btn-primary w-full py-3">{busy ? "Моля, изчакайте..." : mode === "login" ? "Влез в системата" : "Създай профил"}<ArrowRight size={14}/></button></form>}
      {mode === "login" ? <p className="mt-7 text-center text-[9px] text-[#767869]">Достъпът е само за поканени служители.</p> : <p className="mt-7 text-center text-[9px] text-[#767869]">Вече имате акаунт? <Link className="font-semibold text-[#52621c] hover:underline" href="/login">Вход</Link></p>}
    </div></section>
  </div>;
}
