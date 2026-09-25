import { useState } from "react";
import { UserCircle, LogOut } from "lucide-react";
import { useMyProfile, useSignOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export function ProfileMenu({ admin }: { admin: boolean }) {
  const profile = useMyProfile();
  const signOut = useSignOut();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const name = profile.data?.full_name?.trim() || "Team member";
  const code = profile.data?.employee_code || (admin ? "Admin" : "ID pending");
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="h-auto max-w-48 gap-2 px-2 py-2"
            aria-label="Open profile menu"
          >
            <UserCircle size={18} className="shrink-0" />
            <span className="min-w-0 text-left">
              <span className="block max-w-28 truncate text-xs sm:text-sm">{name}</span>
              <span className="block text-xs text-muted-foreground">{code}</span>
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{name}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setOpen(true)}>
            <UserCircle size={16} className="mr-2" />
            My profile
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={busy}
            onSelect={async () => {
              setBusy(true);
              try {
                await signOut();
                window.location.href = "/auth";
              } catch {
                toast.error("Could not sign out. Please try again.");
                setBusy(false);
              }
            }}
          >
            <LogOut size={16} className="mr-2" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>My profile</DialogTitle>
            <DialogDescription>
              Your Easternbay team account. Ask an administrator to update your name or employee ID.
            </DialogDescription>
          </DialogHeader>
          {profile.error ? (
            <p role="alert">Unable to load profile.</p>
          ) : (
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <dt>Name</dt>
              <dd>{name}</dd>
              <dt>Employee ID</dt>
              <dd>{code}</dd>
              <dt>Email</dt>
              <dd className="break-all">{profile.data?.email || "—"}</dd>
              <dt>Phone</dt>
              <dd>{profile.data?.phone || "—"}</dd>
              <dt>Designation</dt>
              <dd>{profile.data?.designation || (admin ? "Administrator" : "Team member")}</dd>
            </dl>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
