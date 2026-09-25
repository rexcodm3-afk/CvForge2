"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Templates", href: "/#templates" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Features", href: "/#features" },
  { label: "Pricing", href: "/pricing" },
];

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-line bg-canvas/85 backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      )}
    >
      <div className="section-x flex h-16 items-center justify-between sm:h-[70px]">
        <Logo />

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3.5 py-2 text-[0.92rem] font-medium text-ink-soft transition-colors hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <SignedOut>
            <SignInButton mode="modal" forceRedirectUrl="/dashboard" fallbackRedirectUrl="/dashboard">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-lg px-3.5 py-2 text-sm font-medium text-ink-soft transition-colors hover:text-ink"
              >
                Log In
              </button>
            </SignInButton>
            <SignUpButton mode="modal" forceRedirectUrl="/dashboard" fallbackRedirectUrl="/dashboard">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
              >
                Create My CV
              </button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="grid h-10 w-10 place-items-center rounded-lg text-ink transition-colors hover:bg-ink/[0.05] md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="border-t border-line bg-canvas md:hidden"
          >
            <nav className="section-x flex flex-col gap-1 py-4">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-3 text-base font-medium text-ink-soft transition-colors hover:bg-ink/[0.04] hover:text-ink"
                >
                  {item.label}
                </Link>
              ))}
              <div className="mt-3 flex flex-col gap-2.5">
                <SignedOut>
                  <SignInButton mode="modal" forceRedirectUrl="/dashboard" fallbackRedirectUrl="/dashboard">
                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-lg border border-line bg-surface px-4 py-2.5 text-base font-medium text-ink transition-colors hover:bg-ink/[0.04]"
                      onClick={() => setOpen(false)}
                    >
                      Log In
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal" forceRedirectUrl="/dashboard" fallbackRedirectUrl="/dashboard">
                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-lg bg-brand-600 px-4 py-2.5 text-base font-medium text-white transition-colors hover:bg-brand-700"
                      onClick={() => setOpen(false)}
                    >
                      Create My CV
                    </button>
                  </SignUpButton>
                </SignedOut>
                <SignedIn>
                  <div className="flex justify-center">
                    <UserButton afterSignOutUrl="/" />
                  </div>
                </SignedIn>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
