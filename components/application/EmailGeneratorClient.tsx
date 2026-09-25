"use client";

import { useState } from "react";
import { FileText, Copy, Check, RefreshCw, Plus, Sparkles } from "lucide-react";
import { AppHeader, type HeaderUser } from "@/components/app/AppHeader";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, FieldGroup } from "@/components/ui/Field";
import { useCopy } from "@/lib/use-copy";
import { generateApplicationEmail } from "@/lib/email/template";
import { cn } from "@/lib/utils";
import type { WizardCV } from "./ApplicationWizard";

export function EmailGeneratorClient({
  user,
  cvs,
}: {
  user: HeaderUser;
  cvs: WizardCV[];
}) {
  const [cvId, setCvId] = useState<string | null>(cvs[0]?.id ?? null);
  const [companyName, setCompanyName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [hiringManager, setHiringManager] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [generated, setGenerated] = useState(false);
  const [generationCount, setGenerationCount] = useState(0);
  const { copied, copy } = useCopy();

  const selectedCv = cvs.find((c) => c.id === cvId) ?? null;

  const generate = () => {
    const gen = generateApplicationEmail(
      {
        applicantName: selectedCv?.name || user.name || "",
        jobTitle,
        companyName,
        hiringManager,
        applicantEmail: selectedCv?.email,
        applicantPhone: selectedCv?.phone,
      },
      generationCount
    );
    setSubject(gen.subject);
    setContent(gen.content);
    setGenerated(true);
    setGenerationCount((count) => count + 1);
  };

  return (
    <div className="min-h-screen bg-canvas">
      <AppHeader user={user} nav />
      <main className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-8 sm:py-12">
        <p className="eyebrow">Application email</p>
        <h1 className="mt-2 text-heading font-extrabold text-ink">
          Generate an application email
        </h1>
        <p className="mt-2 text-ink-muted">
          A professional, structured email you can copy and send. Populated from
          your CV — edit anything before you send.
        </p>

        {cvs.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-ink-faint">
              CV to reference
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {cvs.map((cv) => (
                <button
                  key={cv.id}
                  type="button"
                  onClick={() => setCvId(cv.id)}
                  aria-pressed={cvId === cv.id}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border p-3.5 text-left transition-all",
                    cvId === cv.id
                      ? "border-brand-600 bg-brand-50/60 ring-2 ring-brand-500/20"
                      : "border-line bg-surface hover:border-ink/25"
                  )}
                >
                  <FileText className="h-4 w-4 text-brand-600" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-ink">
                      {cv.title}
                    </span>
                    <span className="block truncate text-xs text-ink-muted">
                      {cv.name || "No name yet"}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        <section className="mt-8 grid grid-cols-1 gap-4 rounded-2xl border border-line bg-surface p-5 sm:grid-cols-2">
          <FieldGroup label="Company name">
            <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="XYZ Technologies" />
          </FieldGroup>
          <FieldGroup label="Job title">
            <Input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="Frontend Developer" />
          </FieldGroup>
          <FieldGroup label="Hiring manager (optional)" className="sm:col-span-2">
            <Input value={hiringManager} onChange={(e) => setHiringManager(e.target.value)} placeholder="Sarah Williams" />
          </FieldGroup>
          <div className="sm:col-span-2">
            <Button onClick={generate}>
              {generated ? <RefreshCw className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
              {generated ? "Regenerate Template" : "Generate Email"}
            </Button>
          </div>
        </section>

        {generated && (
          <section className="mt-8 space-y-4">
            <FieldGroup label="Subject">
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
            </FieldGroup>
            <FieldGroup label="Email body">
              <Textarea value={content} onChange={(e) => setContent(e.target.value)} className="min-h-[260px]" />
            </FieldGroup>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => copy(`${subject}\n\n${content}`)}
                className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-canvas transition-colors hover:bg-black"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied!" : "Copy Email"}
              </button>
              <button
                type="button"
                onClick={() => copy(subject)}
                className="inline-flex items-center gap-2 rounded-xl border border-line-strong bg-surface px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-ink/30"
              >
                <Copy className="h-4 w-4" /> Copy Subject
              </button>
            </div>
          </section>
        )}

        {cvs.length === 0 && (
          <div className="mt-8 rounded-2xl border border-dashed border-line-strong bg-surface/60 px-6 py-10 text-center">
            <p className="text-ink-muted">
              Create a CV first so your email can reference your details.
            </p>
            <div className="mt-4 flex justify-center">
              <Button href="/builder/new" variant="secondary">
                <Plus className="h-4 w-4" /> Create CV
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
