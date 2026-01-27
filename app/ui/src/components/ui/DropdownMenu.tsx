"use client";

import { createPortal } from "react-dom";
import { useEffect, useRef, useSyncExternalStore, type ReactNode } from "react";

interface Position {
  top: number;
  left: number;
  placement: "above" | "below";
}

interface DropdownMenuProps {
  trigger: ReactNode;
  children: ReactNode;
  open: boolean;
  onOpenChange: (open: boolean, position?: Position) => void;
  position?: Position | null;
}

function subscribe() {
  return () => {};
}

function getSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}

export function DropdownMenu({
  trigger,
  children,
  open,
  onOpenChange,
  position,
}: DropdownMenuProps) {
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const isMounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        onOpenChange(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open, onOpenChange]);

  const menu =
    open && position && isMounted
      ? createPortal(
          <div
            ref={menuRef}
            className="fixed z-50 w-48 rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-800"
            style={{
              top: position.placement === "below" ? position.top : undefined,
              bottom:
                position.placement === "above"
                  ? window.innerHeight - position.top
                  : undefined,
              left: position.left - 192, // 192px = w-48 (12rem)
            }}
          >
            {children}
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <div ref={triggerRef}>{trigger}</div>
      {menu}
    </>
  );
}

interface DropdownMenuItemProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: "default" | "danger";
  href?: string;
}

export function DropdownMenuItem({
  children,
  onClick,
  variant = "default",
  href,
}: DropdownMenuItemProps) {
  const className = `block w-full px-4 py-2 text-left text-sm cursor-pointer ${
    variant === "danger"
      ? "text-red-600 hover:bg-zinc-100 dark:text-red-400 dark:hover:bg-zinc-700"
      : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700"
  }`;

  if (href) {
    return (
      <a href={href} className={className} onClick={onClick}>
        {children}
      </a>
    );
  }

  return (
    <button type="button" className={className} onClick={onClick}>
      {children}
    </button>
  );
}

// Helper to calculate position from an element
export function calculateDropdownPosition(element: HTMLElement): Position {
  const rect = element.getBoundingClientRect();
  const menuHeight = 120; // Approximate menu height
  const viewportHeight = window.innerHeight;
  const spaceBelow = viewportHeight - rect.bottom;
  const spaceAbove = rect.top;

  // Position above if not enough space below
  const placement = spaceBelow < menuHeight && spaceAbove > spaceBelow ? "above" : "below";

  return {
    top: placement === "below" ? rect.bottom + 4 : rect.top - 4,
    left: rect.right,
    placement,
  };
}
