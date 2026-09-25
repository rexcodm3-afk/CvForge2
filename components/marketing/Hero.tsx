"use client";

import { useRef } from "react";
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { A4Frame } from "@/components/cv/A4Frame";
import { CVDocument } from "@/components/cv/CVDocument";
import { sampleCV } from "@/lib/cv-types";

const ease = [0.22, 1, 0.36, 1] as const;

export function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const yRaw = useTransform(scrollYProgress, [0, 1], [0, -70]);
  const rotRaw = useTransform(scrollYProgress, [0, 1], [-1.4, 1.2]);
  const y = useSpring(yRaw, { stiffness: 120, damping: 26, mass: 0.4 });
  const rot = useSpring(rotRaw, { stiffness: 120, damping: 26, mass: 0.4 });

  return (
    <section ref={ref} className="relative overflow-hidden">
      {/* Soft ambient background — subtle, not a glowing blob */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-x-0 top-0 h-[560px] bg-gradient-to-b from-brand-50/70 to-transparent" />
        <div
          className="absolute inset-0 opacity-[0.5]"
          style={{
            backgroundImage:
              "radial-gradient(#E9E5DD 1px, transparent 1px)",
            backgroundSize: "26px 26px",
            maskImage:
              "radial-gradient(ellipse 80% 55% at 50% 0%, black 20%, transparent 75%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 80% 55% at 50% 0%, black 20%, transparent 75%)",
          }}
        />
      </div>

      <div className="section-x grid grid-cols-1 items-center gap-12 pb-16 pt-12 sm:pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 lg:pb-24 lg:pt-20">
        {/* Left */}
        <div className="max-w-xl">
          <motion.p
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease }}
            className="eyebrow"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
            Your next job starts here
          </motion.p>

          <motion.h1
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease, delay: 0.05 }}
            className="mt-5 text-display-lg font-extrabold text-ink text-balance"
          >
            Create a professional CV in minutes.
          </motion.h1>

          <motion.p
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease, delay: 0.12 }}
            className="mt-5 text-lg leading-relaxed text-ink-muted text-pretty"
          >
            Build a polished, job-ready CV without fighting with Word or
            complicated templates. Choose a design, add your experience, preview
            it instantly, and get ready to apply.
          </motion.p>

          <motion.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease, delay: 0.19 }}
            className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <SignedOut>
              <SignUpButton mode="modal" forceRedirectUrl="/dashboard" fallbackRedirectUrl="/dashboard">
                <button
                  type="button"
                  className="group inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
                >
                  Create My CV
                  <ArrowRight className="h-[18px] w-[18px] transition-transform duration-200 group-hover:translate-x-0.5" />
                </button>
              </SignUpButton>
              <SignInButton mode="modal" forceRedirectUrl="/dashboard" fallbackRedirectUrl="/dashboard">
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-xl border border-line bg-surface px-5 py-3 text-base font-semibold text-ink transition-colors hover:bg-ink/[0.04]"
                >
                  Sign In
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <div className="flex items-center gap-3">
                <UserButton afterSignOutUrl="/" />
              </div>
            </SignedIn>
            <Button href="/#templates" size="lg" variant="secondary">
              Explore Templates
            </Button>
          </motion.div>

          <motion.p
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease, delay: 0.26 }}
            className="mt-6 flex items-center gap-2 text-sm text-ink-muted"
          >
            <CheckCircle2 className="h-4 w-4 text-brand-500" />
            No design skills required
            <span className="text-line-strong">•</span>
            Built for job seekers
          </motion.p>
        </div>

        {/* Right — animated CV preview */}
        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease, delay: 0.15 }}
          className="relative mx-auto w-full max-w-[440px] lg:max-w-none"
        >
          <motion.div style={reduce ? undefined : { y, rotate: rot }}>
            {/* Floating accent chips */}
            <div className="pointer-events-none absolute -left-5 top-1/2 z-10 hidden -translate-y-1/2 rounded-xl border border-line bg-surface px-3.5 py-2.5 shadow-card sm:block">
              <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-brand-600">
                Live preview
              </p>
              <p className="text-xs text-ink-muted">Updates as you type</p>
            </div>
            <div className="pointer-events-none absolute -right-3 bottom-16 z-10 hidden rounded-xl border border-line bg-surface px-3.5 py-2.5 shadow-card sm:block">
              <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-brand-600">
                PDF ready
              </p>
              <p className="text-xs text-ink-muted">Send-ready format</p>
            </div>

            <A4Frame>
              <CVDocument data={sampleCV} />
            </A4Frame>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
