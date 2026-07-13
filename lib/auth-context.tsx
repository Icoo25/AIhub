"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isDemo } from "@/lib/data";

export type UserRole = "admin" | "member";

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

    supabase.auth.getUser().then(async ({ data }) => {
      const user = data.user;
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
        role: dbProfile?.role === "admin" ? "admin" : "member",
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

