"use client";

import { useEffect, useState } from "react";
import { KeyRound, Save, UserRound } from "lucide-react";
import { PageHeading } from "./page-heading";
import { useAuthProfile } from "@/lib/auth-context";
import { updateMyProfile } from "@/lib/data";
import { createClient } from "@/lib/supabase/client";

export function SettingsView(){
  const profile=useAuthProfile();
  const [name,setName]=useState(""),[password,setPassword]=useState(""),[notice,setNotice]=useState(""),[busy,setBusy]=useState(false);
  useEffect(()=>setName(profile.name),[profile.name]);
  async function saveProfile(e:React.FormEvent){e.preventDefault();setBusy(true);try{await updateMyProfile(name);setNotice("Профилът е запазен. Обновете страницата, за да видите името навсякъде.");}catch{setNotice("Профилът не беше запазен. Изпълнете platform-enhancements.sql.");}finally{setBusy(false)}}
  async function savePassword(e:React.FormEvent){e.preventDefault();setBusy(true);const {error}=await createClient()!.auth.updateUser({password});setNotice(error?"Паролата не беше променена.":"Паролата е променена успешно.");if(!error)setPassword("");setBusy(false)}
  return <><PageHeading eyebrow="Личен профил" title="Настройки" description="Управлявайте името и паролата на своя профил."/>{notice&&<div className="mb-4 rounded-xl bg-[#f5f4ea] p-4 text-xs text-[#52621c]">{notice}</div>}<div className="grid gap-5 lg:grid-cols-2"><form onSubmit={saveProfile} className="panel p-6"><UserRound className="text-[#52621c]"/><h2 className="mt-3 text-lg font-semibold">Профил</h2><label className="mt-5 block text-xs text-[#767869]">Име<input required className="field mt-2" value={name} onChange={e=>setName(e.target.value)}/></label><label className="mt-4 block text-xs text-[#767869]">Имейл<input disabled className="field mt-2 opacity-70" value={profile.email}/></label><button disabled={busy} className="btn-primary mt-5"><Save size={14}/> Запази профила</button></form><form onSubmit={savePassword} className="panel p-6"><KeyRound className="text-[#67558d]"/><h2 className="mt-3 text-lg font-semibold">Смяна на парола</h2><label className="mt-5 block text-xs text-[#767869]">Нова парола<input required minLength={8} type="password" className="field mt-2" value={password} onChange={e=>setPassword(e.target.value)}/></label><p className="mt-3 text-[10px] text-[#767869]">Използвайте поне 8 знака.</p><button disabled={busy} className="btn-primary mt-5"><Save size={14}/> Смени паролата</button></form></div></>;
}

