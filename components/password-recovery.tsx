"use client";

import Link from "next/link";
import { useState } from "react";
import { KeyRound, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function ForgotPassword() {
  const [email,setEmail]=useState(""),[busy,setBusy]=useState(false),[message,setMessage]=useState("");
  async function submit(e:React.FormEvent){e.preventDefault();setBusy(true);const {error}=await createClient()!.auth.resetPasswordForEmail(email,{redirectTo:`${window.location.origin}/auth/callback?next=/reset-password`});setMessage(error?"Линкът не беше изпратен.":"Проверете имейла си за линк за нова парола.");setBusy(false);}
  return <AuthCard title="Забравена парола" text="Ще изпратим защитен линк за задаване на нова парола."><form onSubmit={submit} className="space-y-4"><label className="block text-xs text-[#767869]">Имейл<div className="relative mt-2"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a9b8d]" size={14}/><input required type="email" className="field pl-9" value={email} onChange={e=>setEmail(e.target.value)}/></div></label>{message&&<p className="rounded-lg bg-[#f5f4ea] p-3 text-xs text-[#52621c]">{message}</p>}<button disabled={busy} className="btn-primary w-full">{busy?"Изпращане...":"Изпрати линк"}</button></form></AuthCard>;
}

export function ResetPassword() {
  const [password,setPassword]=useState(""),[busy,setBusy]=useState(false),[message,setMessage]=useState("");
  async function submit(e:React.FormEvent){e.preventDefault();setBusy(true);const {error}=await createClient()!.auth.updateUser({password});setMessage(error?"Паролата не беше променена. Отворете отново линка от имейла.":"Паролата е променена успешно.");setBusy(false);}
  return <AuthCard title="Нова парола" text="Изберете парола с поне 8 знака."><form onSubmit={submit} className="space-y-4"><label className="block text-xs text-[#767869]">Нова парола<div className="relative mt-2"><KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a9b8d]" size={14}/><input required minLength={8} type="password" className="field pl-9" value={password} onChange={e=>setPassword(e.target.value)}/></div></label>{message&&<p className="rounded-lg bg-[#f5f4ea] p-3 text-xs text-[#52621c]">{message}</p>}<button disabled={busy} className="btn-primary w-full">{busy?"Запазване...":"Запази паролата"}</button></form></AuthCard>;
}

function AuthCard({title,text,children}:{title:string;text:string;children:React.ReactNode}){return <div className="w-full max-w-md rounded-2xl border border-[#e4e3d9] bg-white p-8 shadow-xl"><h1 className="text-2xl font-semibold">{title}</h1><p className="mt-2 mb-6 text-xs text-[#767869]">{text}</p>{children}<Link href="/login" className="mt-6 block text-center text-xs text-[#52621c] hover:underline">Обратно към входа</Link></div>}

