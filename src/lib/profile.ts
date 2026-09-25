export function profileName(name: string | null | undefined, admin = false) {
  const value = name?.trim();
  return value && !value.includes("@") ? value : admin ? "Administrator" : "Team member";
}
