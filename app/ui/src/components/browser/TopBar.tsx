import Link from "next/link";
import Image from "next/image";

interface TopBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  children?: React.ReactNode;
}

export function TopBar({ searchQuery, onSearchChange, children }: TopBarProps) {
  return (
    <nav className="bg-zinc-900 border-b border-zinc-800">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex-shrink-0">
              <Image
                src="/Cirrus-Horizontal-White.svg"
                alt="Cirrus"
                width={120}
                height={28}
                priority
              />
            </Link>
            <span className="text-lg font-semibold text-white">Technical Publications</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-64 rounded-lg border border-zinc-700 bg-zinc-800 py-1.5 pl-9 pr-3 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-zinc-900"
              />
            </div>
            {children}
          </div>
        </div>
      </div>
    </nav>
  );
}
