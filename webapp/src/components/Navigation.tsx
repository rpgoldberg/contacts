"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Calendar, Plus, LogOut, Key } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";
import { PasswordChangeModal } from "./PasswordChangeModal";
import { useLogout } from "./AuthProvider";
import { isAuthenticated } from "@/lib/auth";

const navItems = [
  { href: "/", label: "Contacts", icon: Users },
  { href: "/upcoming", label: "Upcoming", icon: Calendar },
];

export function Navigation() {
  const pathname = usePathname();
  const logout = useLogout();
  const authed = typeof window !== 'undefined' && isAuthenticated();
  const [showPasswordChange, setShowPasswordChange] = useState(false);

  // Don't show nav on login page
  if (pathname === '/login') {
    return null;
  }

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-xl font-bold text-primary-600 dark:text-primary-400">
              Contacts
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 text-sm font-medium transition-colors",
                      isActive
                        ? "text-primary-600 dark:text-primary-400"
                        : "text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/contacts/new"
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Contact</span>
            </Link>
            {authed && (
              <>
                <button
                  onClick={() => setShowPasswordChange(true)}
                  className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
                  title="Change password"
                >
                  <Key className="w-4 h-4" />
                </button>
                <button
                  onClick={logout}
                  className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      <PasswordChangeModal
        isOpen={showPasswordChange}
        onClose={() => setShowPasswordChange(false)}
      />
    </header>
  );
}
