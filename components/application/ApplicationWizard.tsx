"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  Mail,
  Loader2,
  AlertCircle,
  Plus,
  Copy,
  RefreshCw,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { AppHeader, type HeaderUser } from "@/components/app/AppHeader";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, FieldGroup } from "@/components/ui/Field";
import { relativeTime } from "@/lib/format";
import { useCopy } from "@/lib/use-copy";
import { generateApplicationEmail } from "@/lib/email/template";
import { PremiumUpgradeModal } from "@/components/billing/PremiumUpgradeModal";
import { cn } from "@/lib/utils";

export interface WizardCV {
  id: string;
  title: string;
  template: string;
  updatedAt: string;
  name: string;
  email: string;
  phone: string;
}
export interface WizardCoverLetter {
  id: string;
  title: string;
  companyName: string;
  jobTitle: string;
  updatedAt: string;
}

const STEPS = ["Job details", "Select CV", "Cover letter", "Email", "Review"];

export function ApplicationWizard({
  user,
  cvs,
  coverLetters,
}: {
  user: HeaderUser;
  cvs: WizardCV[];
  coverLetters: WizardCoverLetter[];
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [upgradeMsg, setUpgradeMsg] = useState<string | null>(null);
  const { copied, copy } = useCopy();

  // Job details
  const [companyName, setCompanyName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobLocation, setJobLocation] = useState("");
  const [applicationDate, setApplicationDate] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [salaryRange, setSalaryRange] = useState("");
  const [recruiterName, setRecruiterName] = useState("");
  const [recruiterEmail, setRecruiterEmail] = useState("");
  const [notes, setNotes] = useState("");

  const [cvId, setCvId] = useState<string | null>(cvs[0]?.id ?? null);
  const [coverLetterId, setCoverLetterId] = useState<string | null>(null);

  const [emailSubject, setEmailSubject] = useState("");
  const [emailContent, setEmailContent] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [generationCount, setGenerationCount] = useState(0);

  const selectedCv = cvs.find((c) => c.id === cvId) ?? null;

  const buildEmail = () => {
    const gen = generateApplicationEmail(
      {
        applicantName: selectedCv?.name || user.name || "",
        jobTitle,
        companyName,
        applicantEmail: selectedCv?.email,
        applicantPhone: selectedCv?.phone,
        hasCoverLetter: Boolean(coverLetterId),
      },
      generationCount
    );
    setEmailSubject(gen.subject);
    setEmailContent(gen.content);
    setEmailTouched(false);
    setGenerationCount((count) => count + 1);
  };

  const goNext = () => {
    setError(null);
    if (step === 0 && !companyName.trim()) {
      setError("Please enter the company name.");
      return;
    }
    // Prepare the email template when first arriving at the Email step.
    if (step === 2 && !emailTouched && !emailContent) buildEmail();
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const goPrev = () => {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  };

  const save = async () => {
    if (saving) return;
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName,
          jobTitle,
          jobLocation,
          applicationDate,
          jobDescription,
          companyWebsite,
          jobUrl,
          salaryRange,
          recruiterName,
          recruiterEmail,
          notes,
          cvId,
          coverLetterId,
          status: "Preparing",
          email:
            emailSubject || emailContent
              ? { subject: emailSubject, content: emailContent }
              : undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (res.status === 403 && body.code === "UPGRADE_REQUIRED") {
          setUpgradeMsg(body.error || "Upgrade to track more applications.");
          setSaving(false);
          return;
        }
        throw new Error();
      }
      const { application } = await res.json();
      setSavedId(application.id);
    } catch {
      setError("We couldn't save your application. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (savedId) {
    return (
      <div className="min-h-screen bg-canvas">
        <AppHeader user={user} nav />
        <main className="mx-auto flex w-full max-w-lg flex-col items-center px-5 py-24 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-50 text-brand-600"
          >
            <CheckCircle2 className="h-8 w-8" />
          </motion.div>
          <h1 className="mt-6 text-heading font-extrabold text-ink">
            Application saved.
          </h1>
          <p className="mt-2 text-ink-muted">
            Your application for{" "}
            <span className="font-medium text-ink">
              {jobTitle || "this role"}
            </span>{" "}
            at{" "}
            <span className="font-medium text-ink">
              {companyName || "the company"}
            </span>{" "}
            is ready to manage. Remember to submit it through the employer&apos;s
            platform, then mark it as Applied.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button href={`/applications/${savedId}`} size="lg">
              View Application <ArrowRight className="h-[18px] w-[18px]" />
            </Button>
            <Button href="/applications" variant="secondary" size="lg">
              All Applications
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas">
      <AppHeader user={user} nav />
      <main className="mx-auto w-full max-w-3xl px-5 py-8 sm:px-8 sm:py-10">
        <p className="eyebrow">Track a job application</p>
        <h1 className="mt-2 text-heading font-extrabold text-ink">
          New application
        </h1>

        {/* Step indicator */}
        <ol className="mt-6 flex flex-wrap gap-2">
          {STEPS.map((label, i) => (
            <li key={label}>
              <button
                type="button"
                onClick={() => i < step && setStep(i)}
                disabled={i > step}
                className={cn(
                  "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                  i === step
                    ? "border-brand-600 bg-brand-600 text-white"
                    : i < step
                    ? "border-line-strong text-ink-soft hover:border-ink/30"
                    : "border-line text-ink-faint"
                )}
              >
                <span className="grid h-4 w-4 place-items-center rounded-full bg-white/25 text-[0.6rem]">
                  {i < step ? <Check className="h-2.5 w-2.5" /> : i + 1}
                </span>
                {label}
              </button>
            </li>
          ))}
        </ol>

        {error && (
          <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22 }}
            className="mt-7"
          >
            {step === 0 && (
              <div className="space-y-4 rounded-2xl border border-line bg-surface p-5 sm:p-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FieldGroup label="Company name *">
                    <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="XYZ Technologies" />
                  </FieldGroup>
                  <FieldGroup label="Job title">
                    <Input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="Frontend Developer" />
                  </FieldGroup>
                  <FieldGroup label="Job location">
                    <Input value={jobLocation} onChange={(e) => setJobLocation(e.target.value)} placeholder="Douala, Cameroon" />
                  </FieldGroup>
                  <FieldGroup label="Application date">
                    <Input value={applicationDate} onChange={(e) => setApplicationDate(e.target.value)} placeholder="1 January 2026" />
                  </FieldGroup>
                  <FieldGroup label="Company website">
                    <Input value={companyWebsite} onChange={(e) => setCompanyWebsite(e.target.value)} placeholder="xyztech.com" />
                  </FieldGroup>
                  <FieldGroup label="Job posting URL">
                    <Input value={jobUrl} onChange={(e) => setJobUrl(e.target.value)} placeholder="jobs.xyztech.com/123" />
                  </FieldGroup>
                  <FieldGroup label="Salary range (optional)">
                    <Input value={salaryRange} onChange={(e) => setSalaryRange(e.target.value)} placeholder="—" />
                  </FieldGroup>
                  <FieldGroup label="Recruiter name (optional)">
                    <Input value={recruiterName} onChange={(e) => setRecruiterName(e.target.value)} placeholder="—" />
                  </FieldGroup>
                  <FieldGroup label="Recruiter email (optional)" className="sm:col-span-2">
                    <Input value={recruiterEmail} onChange={(e) => setRecruiterEmail(e.target.value)} placeholder="—" />
                  </FieldGroup>
                </div>
                <FieldGroup label="Job description (stored for later tailoring)">
                  <Textarea value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} placeholder="Paste the full job description here." className="min-h-[120px]" />
                </FieldGroup>
                <FieldGroup label="Notes (optional)">
                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything to remember about this role." className="min-h-[70px]" />
                </FieldGroup>
              </div>
            )}

            {step === 1 && (
              <PickList
                emptyIcon={<FileText className="h-7 w-7" strokeWidth={1.8} />}
                emptyTitle="No CVs yet"
                emptyBody="Create a CV to attach to this application."
                emptyHref="/builder/new"
                emptyCta="Create CV"
                allowNone
                noneLabel="No CV for now"
                items={cvs.map((c) => ({
                  id: c.id,
                  title: c.title,
                  subtitle: `${c.template} · Updated ${relativeTime(c.updatedAt)}`,
                }))}
                selected={cvId}
                onSelect={setCvId}
              />
            )}

            {step === 2 && (
              <PickList
                emptyIcon={<Mail className="h-7 w-7" strokeWidth={1.8} />}
                emptyTitle="No cover letters yet"
                emptyBody="You can add one now or continue without it."
                emptyHref="/cover-letters/new"
                emptyCta="Create Cover Letter"
                allowNone
                noneLabel="No cover letter"
                items={coverLetters.map((c) => ({
                  id: c.id,
                  title: c.title,
                  subtitle: c.companyName
                    ? `${c.jobTitle || "Role"} · ${c.companyName}`
                    : `Updated ${relativeTime(c.updatedAt)}`,
                }))}
                selected={coverLetterId}
                onSelect={setCoverLetterId}
              />
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-ink-muted">
                    A structured starting point — edit anything before you send.
                  </p>
                  <button
                    type="button"
                    onClick={buildEmail}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-line-strong bg-surface px-3 py-1.5 text-xs font-semibold text-ink-soft transition-colors hover:text-ink"
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> Regenerate Template
                  </button>
                </div>
                <FieldGroup label="Subject">
                  <Input
                    value={emailSubject}
                    onChange={(e) => {
                      setEmailSubject(e.target.value);
                      setEmailTouched(true);
                    }}
                  />
                </FieldGroup>
                <FieldGroup label="Email body">
                  <Textarea
                    value={emailContent}
                    onChange={(e) => {
                      setEmailContent(e.target.value);
                      setEmailTouched(true);
                    }}
                    className="min-h-[240px] font-sans"
                  />
                </FieldGroup>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => copy(`${emailSubject}\n\n${emailContent}`)}
                    className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-canvas transition-colors hover:bg-black"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? "Copied!" : "Copy Email"}
                  </button>
                  <button
                    type="button"
                    onClick={() => copy(emailSubject)}
                    className="inline-flex items-center gap-2 rounded-xl border border-line-strong bg-surface px-4 py-2 text-sm font-semibold text-ink transition-colors hover:border-ink/30"
                  >
                    <Copy className="h-4 w-4" /> Copy Subject
                  </button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
                  <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.12em] text-ink-faint">
                    Review
                  </h2>
                  <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                    <Review label="Company" value={companyName || "—"} />
                    <Review label="Position" value={jobTitle || "—"} />
                    <Review label="Application date" value={applicationDate || "—"} />
                    <Review label="Location" value={jobLocation || "—"} />
                    <Review label="CV" value={cvs.find((c) => c.id === cvId)?.title || "None"} />
                    <Review
                      label="Cover letter"
                      value={
                        coverLetters.find((c) => c.id === coverLetterId)?.title ||
                        "None"
                      }
                    />
                    <Review
                      label="Email"
                      value={emailSubject || emailContent ? "Prepared" : "None"}
                    />
                  </dl>
                </div>
                <p className="text-xs text-ink-muted">
                  CVForge prepares your application — you submit it through the
                  employer. It&apos;ll be saved as <strong>Preparing</strong>; mark
                  it <strong>Applied</strong> once you&apos;ve sent it.
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 flex items-center justify-between border-t border-line pt-6">
          <Button variant="secondary" onClick={goPrev} disabled={step === 0}>
            <ChevronLeft className="h-4 w-4" /> Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={goNext}>
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={save} disabled={saving} size="lg">
              {saving ? (
                <>
                  <Loader2 className="h-[18px] w-[18px] animate-spin" /> Saving…
                </>
              ) : (
                "Save Application"
              )}
            </Button>
          )}
        </div>
      </main>

      <PremiumUpgradeModal
        open={Boolean(upgradeMsg)}
        onClose={() => setUpgradeMsg(null)}
        message={upgradeMsg ?? undefined}
      />
    </div>
  );
}

function Review({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm text-ink">{value}</dd>
    </div>
  );
}

function PickList({
  items,
  selected,
  onSelect,
  allowNone,
  noneLabel,
  emptyIcon,
  emptyTitle,
  emptyBody,
  emptyHref,
  emptyCta,
}: {
  items: { id: string; title: string; subtitle: string }[];
  selected: string | null;
  onSelect: (id: string | null) => void;
  allowNone?: boolean;
  noneLabel?: string;
  emptyIcon: React.ReactNode;
  emptyTitle: string;
  emptyBody: string;
  emptyHref: string;
  emptyCta: string;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line-strong bg-surface/60 px-6 py-12 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-600">
          {emptyIcon}
        </div>
        <h3 className="mt-4 font-display text-lg font-bold text-ink">
          {emptyTitle}
        </h3>
        <p className="mx-auto mt-1.5 max-w-sm text-sm text-ink-muted">{emptyBody}</p>
        <div className="mt-5 flex justify-center gap-3">
          <Button href={emptyHref} variant="secondary">
            <Plus className="h-4 w-4" /> {emptyCta}
          </Button>
          {allowNone && (
            <Button onClick={() => onSelect(null)}>Continue without</Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {allowNone && (
        <PickCard
          title={noneLabel || "None"}
          subtitle="Continue without attaching one"
          active={selected === null}
          onClick={() => onSelect(null)}
        />
      )}
      {items.map((it) => (
        <PickCard
          key={it.id}
          title={it.title}
          subtitle={it.subtitle}
          active={selected === it.id}
          onClick={() => onSelect(it.id)}
        />
      ))}
    </div>
  );
}

function PickCard({
  title,
  subtitle,
  active,
  onClick,
}: {
  title: string;
  subtitle: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex items-center justify-between gap-3 rounded-xl border p-4 text-left transition-all",
        active
          ? "border-brand-600 bg-brand-50/60 ring-2 ring-brand-500/20"
          : "border-line bg-surface hover:border-ink/25"
      )}
    >
      <div className="min-w-0">
        <p className="truncate font-semibold text-ink">{title}</p>
        <p className="mt-0.5 truncate text-xs capitalize text-ink-muted">
          {subtitle}
        </p>
      </div>
      <span
        className={cn(
          "grid h-6 w-6 shrink-0 place-items-center rounded-full border transition-colors",
          active
            ? "border-brand-600 bg-brand-600 text-white"
            : "border-line-strong text-transparent"
        )}
      >
        <Check className="h-3.5 w-3.5" />
      </span>
    </button>
  );
}
