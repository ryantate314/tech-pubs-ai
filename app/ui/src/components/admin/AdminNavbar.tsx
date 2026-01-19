"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/admin/documents", label: "Documents" },
  { href: "/admin/upload", label: "Upload" },
  { href: "/admin/jobs", label: "Jobs" },
];

export function AdminNavbar() {
  const pathname = usePathname();

  return (
    <nav className="bg-zinc-900 border-b border-zinc-800">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/admin" className="flex-shrink-0">
              <Image
                src="/Cirrus-Horizontal-White.svg"
                alt="Cirrus"
                width={120}
                height={28}
                priority
              />
            </Link>
            <div className="flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href ||
                  (link.href !== "/admin" && pathname?.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-zinc-800 text-white"
                        : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
