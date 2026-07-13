"use client";

import { useEffect, useState } from "react";
import { Copy, MailPlus, ShieldCheck, Trash2, UserRound, Users } from "lucide-react";
import { PageHeading } from "./page-heading";
import { createTeamInvite, deleteTeamInvite, getProfiles, getTeamInvites, updateProfileRole } from "@/lib/data";
import { useAuthProfile } from "@/lib/auth-context";
import type { TeamInvite, UserProfile, UserRole } from "@/lib/types";
import { useConfirmAction } from "./ui";
import { canManageTeam, roleLabel } from "@/lib/permissions";

const roles: Array<{value:UserRole;label:string;description:string}> = [
  { value: "viewer", label: "Наблюдател", description: "Разглежда съдържанието без промени." },
  { value: "researcher", label: "Изследовател", description: "Добавя и подрежда знания и източници." },
  { value: "editor", label: "Редактор", description: "Управлява цялото съдържание." },
  { value: "admin", label: "Администратор", description: "Управлява съдържание, роли и настройки." },
];

export function TeamView() {
  const confirmAction = useConfirmAction();
  const current = useAuthProfile();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [invites, setInvites] = useState<TeamInvite[]>([]);
  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>("viewer");
  const [notice, setNotice] = useState("");

  const load = async () => { const [users, pending] = await Promise.all([getProfiles(), getTeamInvites()]); setProfiles(users); setInvites(pending); };
  useEffect(() => { if (!current.loading && canManageTeam(current.role)) load().catch(() => setNotice("Данните за екипа не се заредиха.")); }, [current.loading, current.role]);

  async function changeRole(profile: UserProfile, role: UserRole) {
    if (profile.id === current.id) return setNotice("Собствената администраторска роля е защитена.");
    try { await updateProfileRole(profile.id, role); setProfiles(items => items.map(item => item.id === profile.id ? {...item,role} : item)); setNotice("Ролята е променена."); }
    catch { setNotice("Ролята не беше променена. Изпълнете новата SQL миграция."); }
  }

  async function invite(e: React.FormEvent) {
    e.preventDefault(); setNotice("");
    try { const created = await createTeamInvite(email, inviteRole); setInvites(items => [created, ...items]); setEmail(""); setNotice("Поканата е създадена. Копирайте линка и го изпратете."); }
    catch { setNotice("Поканата не беше създадена."); }
  }

  const inviteUrl = (token: string) => `${window.location.origin}/register?invite=${token}`;
  async function copyInvite(token: string) { await navigator.clipboard.writeText(inviteUrl(token)); setNotice("Линкът за поканата е копиран."); }
  async function removeInvite(id: string) { const target = invites.find(item => item.id === id); if (!(await confirmAction({ title: "Отмяна на покана", description: `Линкът за ${target?.email || "този потребител"} ще спре да работи.`, confirmLabel: "Отмени поканата" }))) return; await deleteTeamInvite(id); setInvites(items => items.filter(item => item.id !== id)); }

  if (!current.loading && !canManageTeam(current.role)) return <div className="panel p-8 text-center"><ShieldCheck className="mx-auto text-[#52621c]"/><h1 className="mt-3 text-xl font-semibold">Нямате достъп</h1><p className="mt-2 text-sm text-[#767869]">Само администратор управлява екипа.</p></div>;

  return <>
    <PageHeading eyebrow="Управление на достъпа" title="Екип и роли" description="Задайте ясно кой може да разглежда, проучва, редактира или администрира платформата."/>
    {notice && <div className="mb-4 rounded-xl border border-[#d7d6ca] bg-[#f5f4ea] px-4 py-3 text-sm text-[#52621c]">{notice}</div>}
    <div className="mb-5 grid gap-3 sm:grid-cols-3"><Stat icon={<Users size={20}/>} value={profiles.length} label="Потребители"/><Stat icon={<ShieldCheck size={20}/>} value={profiles.filter(item => item.role === "admin").length} label="Администратори"/><Stat icon={<MailPlus size={20}/>} value={invites.filter(item => !item.used_at && new Date(item.expires_at) > new Date()).length} label="Активни покани"/></div>
    <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
      <section className="panel overflow-hidden"><header className="border-b border-[#efeee4] p-5"><h2 className="font-semibold">Регистрирани потребители</h2><p className="mt-1 text-sm text-[#767869]">Вашата собствена администраторска роля е заключена за безопасност.</p></header>{profiles.map(profile => <div key={profile.id} className="flex flex-col gap-3 border-b border-[#efeee4] p-5 last:border-0 sm:flex-row sm:items-center"><span className="grid h-10 w-10 place-items-center rounded-full bg-[#e9edda] text-[#52621c]"><UserRound size={18}/></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{profile.full_name || "Потребител"}{profile.id === current.id && <span className="ml-2 text-xs font-normal text-[#767869]">Вие</span>}</p><p className="truncate text-xs text-[#767869]">{profile.email}</p></div><select className="field sm:w-48" value={profile.role === "member" ? "viewer" : profile.role} disabled={profile.id === current.id} onChange={event => changeRole(profile,event.target.value as UserRole)}>{roles.map(role => <option key={role.value} value={role.value}>{role.label}</option>)}</select></div>)}</section>
      <aside className="space-y-5"><section className="panel p-5"><h2 className="font-semibold">Нова покана</h2><p className="mt-1 text-sm text-[#767869]">Линкът е валиден 7 дни и работи само за посочения имейл.</p><form onSubmit={invite} className="mt-4 space-y-3"><input required type="email" className="field" placeholder="email@example.com" value={email} onChange={event => setEmail(event.target.value)}/><select className="field" value={inviteRole} onChange={event => setInviteRole(event.target.value as UserRole)}>{roles.map(role => <option key={role.value} value={role.value}>{role.label} — {role.description}</option>)}</select><button className="btn-primary w-full"><MailPlus size={14}/>Създай покана</button></form></section><section className="panel p-5"><h2 className="font-semibold">Покани</h2><div className="mt-3 space-y-2">{invites.length ? invites.map(item => <div key={item.id} className="rounded-lg bg-[#f5f4ea] p-3"><p className="truncate text-sm font-semibold">{item.email}</p><p className="mt-1 text-xs text-[#767869]">{item.used_at ? "Използвана" : new Date(item.expires_at) < new Date() ? "Изтекла" : `Активна · ${roleLabel(item.role)}`}</p>{!item.used_at && <div className="mt-2 flex gap-2"><button onClick={() => copyInvite(item.token)} className="rounded p-1 text-[#52621c]" title="Копирай"><Copy size={14}/></button><button onClick={() => removeInvite(item.id)} className="rounded p-1 text-[#ba1a1a]" title="Отмени"><Trash2 size={14}/></button></div>}</div>) : <p className="text-sm text-[#767869]">Няма създадени покани.</p>}</div></section></aside>
    </div>
    <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{roles.map(role => <article key={role.value} className="rounded-xl border border-[#e4e3d9] bg-white p-4"><h3 className="text-sm font-semibold">{role.label}</h3><p className="mt-2 text-sm text-[#767869]">{role.description}</p></article>)}</section>
  </>;
}

function Stat({icon,value,label}:{icon:React.ReactNode;value:number;label:string}) { return <div className="panel p-5"><span className="text-[#52621c]">{icon}</span><p className="mt-3 text-2xl font-semibold">{value}</p><p className="text-sm text-[#767869]">{label}</p></div>; }
