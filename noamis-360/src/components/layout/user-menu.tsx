"use client";
import Link from "next/link";
import { KeyRound, LogOut, Moon, ShieldCheck, Sun, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setTheme, signOut } from "@/features/auth/actions";
import { DropdownContent, DropdownItem, DropdownLabel, DropdownMenu, DropdownSeparator, DropdownTrigger } from "@/components/ui/dropdown";
import { ROLE_LABELS, type Role } from "@/lib/permissions";
import { initials } from "@/lib/utils";

export function UserMenu({ name, email, role, mfa }: { name: string; email: string; role: Role; mfa: boolean }) {
  const router = useRouter();
  const [, start] = useTransition();
  const toggleTheme = () =>
    start(async () => {
      const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
      document.documentElement.dataset.theme = next;
      await setTheme(next);
      router.refresh();
    });
  return (
    <DropdownMenu>
      <DropdownTrigger asChild>
        <button type="button" className="flex items-center gap-2 rounded-full p-0.5 pr-2 hover:bg-surface-2" aria-label={`Menu de ${name}`}>
          <span className="grid size-8 place-items-center rounded-full bg-gold text-xs font-semibold text-on-gold" aria-hidden>
            {initials(name)}
          </span>
          <span className="hidden max-w-36 truncate text-sm text-foreground md:inline">{name}</span>
        </button>
      </DropdownTrigger>
      <DropdownContent>
        <DropdownLabel>
          <span className="block text-sm text-foreground">{name}</span>
          <span className="block truncate">{email}</span>
          <span className="mt-1 block text-gold-text">{ROLE_LABELS[role]}</span>
        </DropdownLabel>
        <DropdownSeparator />
        <DropdownItem asChild>
          <Link href="/account">
            <UserRound /> Mon compte
          </Link>
        </DropdownItem>
        <DropdownItem asChild>
          <Link href="/account#securite">
            {mfa ? <ShieldCheck /> : <KeyRound />} Sécurité {mfa ? "(MFA active)" : ""}
          </Link>
        </DropdownItem>
        <DropdownItem onSelect={toggleTheme}>
          <Sun className="hidden [[data-theme=dark]_&]:block" />
          <Moon className="hidden [[data-theme=light]_&]:block" />
          Changer de thème
        </DropdownItem>
        <DropdownSeparator />
        <DropdownItem onSelect={() => start(() => signOut())}>
          <LogOut /> Se déconnecter
        </DropdownItem>
      </DropdownContent>
    </DropdownMenu>
  );
}
