import type { UserRole } from "./types";

export const canManageTeam = (role: UserRole) => role === "admin";
export const canEditContent = (role: UserRole) => role === "admin" || role === "editor";
export const canContributeKnowledge = (role: UserRole) => role === "admin" || role === "editor" || role === "researcher";
export const roleLabel = (role: UserRole) => ({
  admin: "Администратор",
  editor: "Редактор",
  researcher: "Изследовател",
  viewer: "Наблюдател",
  member: "Наблюдател",
}[role]);
