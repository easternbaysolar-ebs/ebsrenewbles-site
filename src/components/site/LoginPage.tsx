import { useState } from "react";
import { Page } from "./PublicPages";
import { useMyRoles, useSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
export function LoginPage() {
  const [mode, setMode] = useState("login"),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const { user } = useSession();
  const { isAdmin, isStaff } = useMyRoles();
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const result =
        mode === "reset"
          ? await db.auth.resetPasswordForEmail(email, {
              redirectTo: window.location.origin + "/auth?recovery=1",
            })
          : mode === "password"
            ? await db.auth.updateUser({ password })
            : mode === "register"
              ? await db.auth.signUp({
                  email,
                  password,
                  options: { emailRedirectTo: window.location.origin + "/auth" },
                })
              : await db.auth.signInWithPassword({ email, password });
      if (result.error) throw result.error;
      setMessage(
        mode === "reset"
          ? "If this account exists, a recovery link has been sent."
          : mode === "register"
            ? "Check your email to confirm your account. An administrator must grant access before you can use the workspace."
            : mode === "password"
              ? "Password updated."
              : "Signed in.",
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not complete sign in.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Page
      title="Your Easternbay workspace."
      subtitle="Secure access for administrators and employees."
    >
      <div className="mx-auto max-w-lg panel p-8">
        {user && mode !== "password" ? (
          <>
            <p className="mb-6">Signed in as {user.email}</p>
            {isStaff ? (
              <div className="flex flex-wrap gap-3">
                {isAdmin && (
                  <Button asChild>
                    <a href="/admin">Admin dashboard</a>
                  </Button>
                )}
                <Button asChild variant="outline">
                  <a href="/employee">Employee dashboard</a>
                </Button>
              </div>
            ) : (
              <p>
                Your account is awaiting staff access. Ask the Easternbay administrator to approve
                it.
              </p>
            )}
            <div className="mt-6 flex gap-4">
              <button className="underline" onClick={() => setMode("password")}>
                Set a new password
              </button>
              <button
                className="underline"
                onClick={async () => {
                  await db.auth.signOut();
                  window.location.reload();
                }}
              >
                Sign out
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={submit} className="space-y-5">
            <h2 className="text-2xl font-semibold">
              {mode === "reset"
                ? "Reset password"
                : mode === "register"
                  ? "Request staff access"
                  : mode === "password"
                    ? "Set password"
                    : "Team login"}
            </h2>
            {mode !== "password" && (
              <label className="block space-y-2">
                Email
                <Input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
            )}
            {mode !== "reset" && (
              <label className="block space-y-2">
                Password
                <Input
                  type="password"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  minLength={mode === "login" ? 1 : 12}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
            )}
            <Button disabled={busy} className="w-full">
              {busy
                ? "Please wait…"
                : mode === "login"
                  ? "Sign in"
                  : mode === "reset"
                    ? "Send recovery email"
                    : mode === "register"
                      ? "Create account"
                      : "Save password"}
            </Button>
            <div className="flex flex-wrap gap-4 text-sm">
              {["login", "reset", "register"]
                .filter((x) => x !== mode)
                .map((x) => (
                  <button
                    type="button"
                    key={x}
                    onClick={() => {
                      setMode(x);
                      setMessage("");
                    }}
                    className="underline"
                  >
                    {x === "login"
                      ? "Back to login"
                      : x === "reset"
                        ? "Forgot password?"
                        : "Request staff access"}
                  </button>
                ))}
            </div>
          </form>
        )}
        {message && (
          <p role="status" className="mt-5 border-t pt-5">
            {message}
          </p>
        )}
      </div>
    </Page>
  );
}
