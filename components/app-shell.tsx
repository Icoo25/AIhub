"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Activity, Beaker, Bell, BookOpen, Bot, FlaskConical, LayoutDashboard, LogOut, Menu, Newspaper, Search, Settings, Upload, Users, X } from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isDemo } from "@/lib/data";
import { AuthProvider, useAuthProfile } from "@/lib/auth-context";
import { ConfirmationProvider } from "@/components/ui";

const navigation = [
  { href: "/", label: "Общ преглед", icon: LayoutDashboard },
  { href: "/tools", label: "AI инструменти", icon: Bot },
  { href: "/news", label: "AI новини", icon: Newspaper },
  { href: "/experiments", label: "Експерименти", icon: Beaker },
  { href: "/library", label: "AI Библиотека", icon: BookOpen },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return <AuthProvider><ConfirmationProvider><AppShellContent>{children}</AppShellContent></ConfirmationProvider></AuthProvider>;
}

function AppShellContent({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const [mobile, setMobile] = useState(false);
  const [globalQuery, setGlobalQuery] = useState("");
  const profile = useAuthProfile();
  const visibleNavigation = profile.role === "admin" ? [...navigation, { href: "/import", label: "Импорт", icon: Upload }, { href: "/team", label: "Екип и роли", icon: Users }, { href: "/activity", label: "Активност", icon: Activity }] : [...navigation, { href: "/activity", label: "Активност", icon: Activity }];

  const logout = async () => { await createClient()?.auth.signOut(); router.push("/login"); router.refresh(); };

  return <div className="min-h-screen bg-[#fbfaf0]">
    {mobile && <button aria-label="Затвори менюто" className="fixed inset-0 z-30 bg-[#1b1c16]/25 lg:hidden" onClick={() => setMobile(false)}/>} 
    <aside className={`fixed inset-y-0 left-0 z-40 flex w-[232px] flex-col border-r border-[#e4e3d9] bg-[#f5f4ea] px-3 py-4 transition-transform lg:translate-x-0 ${mobile ? "translate-x-0" : "-translate-x-full"}`}>
      <div className="mb-7 flex items-center justify-between px-2">
        <Link href="/" className="flex items-center gap-2.5"><span className="grid h-8 w-8 place-items-center rounded-lg bg-[#52621c] text-white"><FlaskConical size={16}/></span><span><strong className="block text-[13px] font-semibold leading-none text-[#1b1c16]">AI Innovation</strong><span className="mt-1 block text-[8px] font-medium uppercase tracking-[.16em] text-[#767869]">Лаборатория за иновации</span></span></Link>
        <button className="text-[#767869] lg:hidden" onClick={() => setMobile(false)}><X size={18}/></button>
      </div>
      <nav className="space-y-1">{visibleNavigation.map(item => { const active = path === item.href; const Icon = item.icon; return <Link key={item.href} href={item.href} onClick={() => setMobile(false)} className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[12px] font-medium transition ${active ? "bg-[#e9edda] text-[#52621c]" : "text-[#46483b] hover:bg-[#efeee4]"}`}><Icon size={15}/><span>{item.label}</span>{active && <span className="absolute right-0 h-5 w-[2px] rounded-full bg-[#52621c]"/>}</Link>})}</nav>
      <div className="mt-auto space-y-2">
        <Link href="/settings" className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[11px] text-[#767869] hover:bg-[#efeee4] hover:text-[#52621c]"><Settings size={14}/> Настройки</Link>
        <button onClick={logout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[11px] text-[#767869] hover:text-[#ba1a1a]"><LogOut size={14}/> Изход</button>
      </div>
    </aside>
    <div className="lg:pl-[232px]">
      <header className="sticky top-0 z-20 flex h-14 items-center border-b border-[#efeee4] bg-[#fbfaf0]/90 px-4 backdrop-blur-xl sm:px-7">
        <button className="mr-3 rounded-lg p-2 text-[#46483b] lg:hidden" onClick={() => setMobile(true)}><Menu size={19}/></button>
        <form onSubmit={e => { e.preventDefault(); if (globalQuery.trim()) router.push(`/search?q=${encodeURIComponent(globalQuery.trim())}`); }} className="relative hidden w-full max-w-[340px] sm:block"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a9b8d]" size={14}/><input className="w-full rounded-full border-0 bg-[#f1f0e6] py-2 pl-9 pr-4 text-[11px] outline-none" value={globalQuery} onChange={e => setGlobalQuery(e.target.value)} placeholder="Търсене навсякъде..."/></form>
        <div className="ml-auto flex items-center gap-3">{isDemo && <span className="hidden rounded-full bg-[#fff1c7] px-2.5 py-1 text-[9px] font-semibold text-[#6d5b20] sm:inline">ДЕМО ДАННИ</span>}<Link href="/activity" title="Активност" className="rounded-lg p-2 text-[#767869] hover:bg-[#efeee4] hover:text-[#52621c]"><Bell size={15}/></Link><span className="hidden rounded-full bg-[#e9edda] px-2.5 py-1 text-[8px] font-semibold text-[#52621c] sm:inline">{profile.role === "admin" ? "Администратор" : "Потребител"}</span><div className="flex items-center gap-2"><span className="grid h-7 w-7 place-items-center rounded-full bg-[#d5bfff] text-[9px] font-bold text-[#5d4a82]">{profile.name.slice(0,2).toUpperCase()}</span><span className="hidden max-w-36 text-left sm:block"><span className="block truncate text-[10px] font-semibold text-[#1b1c16]">{profile.name}</span><span className="block truncate text-[8px] text-[#767869]">{profile.email}</span></span></div></div>
      </header>
      <main className="mx-auto max-w-[1320px] p-4 pb-24 sm:p-7 sm:pb-24 lg:p-8">{children}</main>
    </div>
    <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-[#e4e3d9] bg-[#fbfaf0]/95 px-2 py-2 backdrop-blur-xl lg:hidden">{navigation.map(item => { const Icon = item.icon; const active = path === item.href; return <Link key={item.href} href={item.href} className={`flex flex-col items-center gap-1 rounded-lg py-1.5 text-[7px] font-medium ${active ? "bg-[#52621c] text-white" : "text-[#767869]"}`}><Icon size={14}/><span>{item.label.replace("AI ", "")}</span></Link>})}</nav>
  </div>;
}
