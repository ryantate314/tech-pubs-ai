import Link from "next/link";
import Image from "next/image";

interface TopBarProps {
  children?: React.ReactNode;
}

export function TopBar({ children }: TopBarProps) {
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
          {children && <div className="flex items-center gap-4">{children}</div>}
        </div>
      </div>
    </nav>
  );
}
