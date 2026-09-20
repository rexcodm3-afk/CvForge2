"use client";

import { useEffect, useMemo, useState } from "react";
import { AppHeader } from "@/components/app/AppHeader";
import type { CVListItem } from "@/lib/server/cv-service";

export function AtsClient({
  user,
  cvs,
  isPro,
  atsLimit,
}: {
  user: { name: string | null; email: string; avatarUrl: string | null };
  cvs: CVListItem[];
  isPro: boolean;
  atsLimit: number | null;
}) {
  const [selectedCvId, setSelectedCvId] = useState<string>(cvs[0]?.id ?? "");
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const response = await fetch("/api/ats");
        if (!response.ok) return;
        const data = await response.json();
        const items = Array.isArray(data.analyses) ? data.analyses : [];
        setHistory(items);
        if (items[0]) setResult(items[0].summary ?? null);
      } catch {
        // ignore load failures here; main actions still work
      }
    };

    loadHistory();
  }, []);

  const selectedCv = useMemo(
    () => cvs.find((cv) => cv.id === selectedCvId) ?? cvs[0] ?? null,
    [cvs, selectedCvId]
  );

  const submit = async () => {
    if (!selectedCv) {
      setError("Create a CV before running an ATS check.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cvId: selectedCv.id,
          jobTitle,
          jobDescription,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error ?? "We couldn't run the ATS analysis.");
      }

      setResult(data.analysis);
      const nextHistory = [{ ...data.analysis }, ...history];
      setHistory(nextHistory);
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : "We couldn't run the ATS analysis.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AppHeader user={user} nav />
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">
              ATS check
            </p>
            <h1 className="mt-2 text-3xl font-bold text-ink">Check My CV</h1>
          </div>
          <div className="rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-ink-muted">
            {isPro ? "Unlimited ATS checks" : `Free plan limit: ${atsLimit ?? 0} checks / month`}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-3xl border border-line bg-surface p-6 shadow-lift">
            <h2 className="text-xl font-semibold text-ink">Match My CV to a Job</h2>
            <div className="mt-5 space-y-5">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-ink-soft">CV</span>
                <select
                  value={selectedCvId}
                  onChange={(event) => setSelectedCvId(event.target.value)}
                  className="w-full rounded-xl border border-line bg-canvas px-3 py-2.5 text-sm text-ink outline-none transition focus:border-brand-500"
                >
                  {cvs.map((cv) => (
                    <option key={cv.id} value={cv.id}>
                      {cv.title || "Untitled CV"}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-ink-soft">Job title</span>
                <input
                  value={jobTitle}
                  onChange={(event) => setJobTitle(event.target.value)}
                  placeholder="Senior Product Manager"
                  className="w-full rounded-xl border border-line bg-canvas px-3 py-2.5 text-sm text-ink outline-none transition focus:border-brand-500"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-ink-soft">Job description</span>
                <textarea
                  value={jobDescription}
                  onChange={(event) => setJobDescription(event.target.value)}
                  rows={12}
                  placeholder="Paste the full job description to compare keywords, skills, and experience."
                  className="w-full rounded-xl border border-line bg-canvas px-3 py-3 text-sm text-ink outline-none transition focus:border-brand-500"
                />
              </label>

              <button
                type="button"
                onClick={submit}
                disabled={loading || !selectedCv}
                className="inline-flex items-center justify-center rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Checking…" : "Check My CV"}
              </button>
            </div>
          </section>

          <section className="rounded-3xl border border-line bg-surface p-6 shadow-lift">
            <h2 className="text-xl font-semibold text-ink">CVForge Match Score</h2>
            {error && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {result ? (
              <div className="mt-5 space-y-4">
                <div className="rounded-2xl border border-brand-200 bg-brand-50 p-5">
                  <p className="text-sm text-brand-700">Estimated score</p>
                  <div className="mt-2 flex items-end gap-2">
                    <span className="text-4xl font-bold text-brand-900">{result.matchScore ?? result.score}</span>
                    <span className="pb-1 text-sm text-brand-700">/ 100</span>
                  </div>
                  <p className="mt-2 text-xs text-brand-700">
                    This is an estimate, not a guarantee of ATS compatibility.
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-ink-muted">
                    Strengths
                  </h3>
                  <ul className="mt-2 space-y-2 text-sm text-ink-soft">
                    {(result.strengths ?? []).map((item: string) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-ink-muted">
                    Missing keywords
                  </h3>
                  <ul className="mt-2 space-y-2 text-sm text-ink-soft">
                    {(result.missingKeywords ?? []).length ? (
                      (result.missingKeywords ?? []).map((item: string) => <li key={item}>• {item}</li>)
                    ) : (
                      <li>No obvious keyword gaps for the current job description.</li>
                    )}
                  </ul>
                </div>

                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-ink-muted">
                    Recommendations
                  </h3>
                  <ul className="mt-2 space-y-2 text-sm text-ink-soft">
                    {(result.recommendations ?? []).map((item: string) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-dashed border-line bg-canvas p-5 text-sm text-ink-muted">
                Your ATS score will appear here after you run a check.
              </div>
            )}

            {history.length > 0 && (
              <div className="mt-6 border-t border-line pt-5">
                <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-ink-muted">
                  Recent history
                </h3>
                <ul className="mt-3 space-y-2 text-sm text-ink-soft">
                  {history.slice(0, 4).map((item: any) => (
                    <li key={item.id} className="rounded-xl border border-line bg-canvas px-3 py-2">
                      <div className="flex items-center justify-between gap-4">
                        <span className="font-medium text-ink">{item.jobTitle || "General CV check"}</span>
                        <span className="text-xs text-ink-muted">{item.matchScore ?? item.score}/100</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
