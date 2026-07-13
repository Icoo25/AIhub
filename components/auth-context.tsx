"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isDemo } from "@/lib/data";
import type { UserRole } from "@/lib/types";

type AuthProfile = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  loading: boolean;
};

const AuthContext = createContext<AuthProfile>({ id: "", name: "Потребител", email: "", role: "member", loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<AuthProfile>({
    id: "",
    name: isDemo ? "Демо администратор" : "Потребител",
    email: "",
    role: isDemo ? "admin" : "member",
    loading: !isDemo,
  });

  useEffect(() => {
    if (isDemo) return;
    const supabase = createClient();
    if (!supabase) return;

    supabase.auth.getSession().then(async ({ data }) => {
      const user = data.session?.user;
      if (!user) {
        setProfile(current => ({ ...current, loading: false }));
        return;
      }

      const { data: dbProfile } = await supabase
        .from("profiles")
        .select("full_name,email,role")
        .eq("id", user.id)
        .maybeSingle();

      setProfile({
        id: user.id,
        name: dbProfile?.full_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "Потребител",
        email: dbProfile?.email || user.email || "",
        role: (["admin", "editor", "researcher", "viewer"] as const).includes(dbProfile?.role as "admin" | "editor" | "researcher" | "viewer") ? dbProfile!.role as UserRole : "member",
        loading: false,
      });
    });
  }, []);

  const value = useMemo(() => profile, [profile]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthProfile() {
  return useContext(AuthContext);
}
