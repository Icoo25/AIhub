"use client";

import { useEffect, useState } from "react";
import { Copy, MailPlus, ShieldCheck, Trash2, UserRound, Users } from "lucide-react";
import { PageHeading } from "./page-heading";
import { createTeamInvite, deleteTeamInvite, getProfiles, getTeamInvites, updateProfileRole } from "@/lib/data";
import { useAuthProfile } from "@/lib/auth-context";
import type { TeamInvite, UserProfile } from "@/lib/types";
import { useConfirmAction } from "./ui";

export function TeamView() {
  const confirmAction = useConfirmAction();
  const current = useAuthProfile();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [invites, setInvites] = useState<TeamInvite[]>([]);
  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<TeamInvite["role"]>("member");
  const [notice, setNotice] = useState("");

  const load = async () => { const [users, pending] = await Promise.all([getProfiles(), getTeamInvites()]); setProfiles(users); setInvites(pending); };
  useEffect(() => { if (!current.loading && current.role === "admin") load().catch(() => setNotice("Данните за екипа не се заредиха.")); }, [current.loading, current.role]);

  async function changeRole(profile: UserProfile, role: UserProfile["role"]) {
    if (profile.id === current.id) return setNotice("Собствената администраторска роля е защитена.");
    try { await updateProfileRole(profile.id, role); setProfiles(items => items.map(item => item.id === profile.id ? {...item,role} : item)); setNotice("Ролята е променена."); }
    catch { setNotice("Ролята не беше променена."); }
  }

  async function invite(e: React.FormEvent) {
    e.preventDefault(); setNotice("");
    try { const created = await createTeamInvite(email, inviteRole); setInvites(items => [created, ...items]); setEmail(""); setNotice("Поканата е създадена. Копирайте линка и го изпратете на човека."); }
    catch { setNotice("Поканата не беше създадена. Изпълнете platform-enhancements.sql."); }
  }

  const inviteUrl = (token: string) => `${window.location.origin}/register?invite=${token}`;
  async function copyInvite(token: string) { await navigator.clipboard.writeText(inviteUrl(token)); setNotice("Линкът за покана е копиран."); }
  async function removeInvite(id: string) { const invite = invites.find(item => item.id === id); if (!(await confirmAction({ title: "Отмяна на покана", description: `Линкът за ${invite?.email || "този потребител"} ще спре да работи.`, confirmLabel: "Отмени поканата" }))) return; await deleteTeamInvite(id); setInvites(items => items.filter(item => item.id !== id)); }

  if (!current.loading && current.role !== "admin") return <div className="panel p-8 text-center"><ShieldCheck className="mx-auto text-[#52621c]"/><h1 className="mt-3 text-xl font-semibold">Нямате достъп</h1><p className="mt-2 text-sm text-[#767869]">Само администратор управлява екипа.</p></div>;

  return <>
    <PageHeading eyebrow="Управление на достъпа" title="Екип и роли" description="Поканете хора и задайте кой може да редактира съдържанието." />
    {notice && <div className="mb-4 rounded-xl border border-[#d7d6ca] bg-[#f5f4ea] px-4 py-3 text-xs text-[#52621c]">{notice}</div>}
    <div className="mb-5 grid gap-3 sm:grid-cols-3"><Stat icon={<Users size={20}/>} value={profiles.length} label="Потребители"/><Stat icon={<ShieldCheck size={20}/>} value={profiles.filter(item => item.role === "admin").length} label="Администратори"/><Stat icon={<MailPlus size={20}/>} value={invites.filter(item => !item.used_at && new Date(item.expires_at) > new Date()).length} label="Активни покани"/></div>
    <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
      <div className="panel overflow-hidden"><div className="border-b border-[#efeee4] p-5"><h2 className="text-sm font-semibold">Регистрирани потребители</h2><p className="mt-1 text-[10px] text-[#767869]">Променете ролята от менюто вдясно. Вашата роля е заключена.</p></div>{profiles.map(profile => <div key={profile.id} className="flex flex-col gap-3 border-b border-[#efeee4] p-5 last:border-0 sm:flex-row sm:items-center"><span className="grid h-10 w-10 place-items-center rounded-full bg-[#e9edda] text-[#52621c]"><UserRound size={18}/></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{profile.full_name || "Потребител"}{profile.id === current.id && <span className="ml-2 text-[9px] font-normal text-[#767869]">Вие</span>}</p><p className="truncate text-xs text-[#767869]">{profile.email}</p></div><select className="field sm:w-44" value={profile.role} disabled={profile.id === current.id} onChange={e => changeRole(profile,e.target.value as UserProfile["role"])}><option value="member">Потребител</option><option value="admin">Администратор</option></select></div>)}</div>
      <aside className="space-y-5"><div className="panel p-5"><h2 className="text-sm font-semibold">Нова покана</h2><p className="mt-1 text-[10px] text-[#767869]">Линкът е валиден 7 дни и работи само за посочения имейл.</p><form onSubmit={invite} className="mt-4 space-y-3"><input required type="email" className="field" placeholder="email@example.com" value={email} onChange={e => setEmail(e.target.value)}/><select className="field" value={inviteRole} onChange={e => setInviteRole(e.target.value as TeamInvite["role"])}><option value="member">Потребител</option><option value="admin">Администратор</option></select><button className="btn-primary w-full"><MailPlus size={14}/> Създай покана</button></form></div><div className="panel p-5"><h2 className="text-sm font-semibold">Покани</h2><div className="mt-3 space-y-2">{invites.length ? invites.map(item => <div key={item.id} className="rounded-lg bg-[#f5f4ea] p-3"><p className="truncate text-[10px] font-semibold">{item.email}</p><p className="mt-1 text-[8px] text-[#767869]">{item.used_at ? "Използвана" : new Date(item.expires_at) < new Date() ? "Изтекла" : `Активна · ${item.role === "admin" ? "Администратор" : "Потребител"}`}</p>{!item.used_at && <div className="mt-2 flex gap-2"><button onClick={() => copyInvite(item.token)} className="text-[#52621c]" title="Копирай"><Copy size={13}/></button><button onClick={() => removeInvite(item.id)} className="text-[#ba1a1a]" title="Отмени"><Trash2 size={13}/></button></div>}</div>) : <p className="text-[10px] text-[#767869]">Няма създадени покани.</p>}</div></div></aside>
    </div>
  </>;
}

function Stat({icon,value,label}:{icon:React.ReactNode;value:number;label:string}) { return <div className="panel p-5"><span className="text-[#52621c]">{icon}</span><p className="mt-3 text-2xl font-semibold">{value}</p><p className="text-xs text-[#767869]">{label}</p></div>; }
