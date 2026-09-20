import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, jsonError } from "@/lib/server/api";
import { syncUsageRow } from "@/lib/server/billing";
import { checkAccess, upgradeResponse } from "@/lib/server/gate";
import { validateAtsInput, matchCvToJob } from "@/lib/server/ats";
import { getOwnedCV } from "@/lib/server/cv-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  try {
    const analyses = await prisma.atsAnalysis.findMany({
      where: { userId: auth.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({
      analyses: analyses.map((analysis) => {
        const payload =
          typeof analysis.analysis === "object" && analysis.analysis !== null
            ? (analysis.analysis as Record<string, unknown>)
            : {};
        return {
          id: analysis.id,
          cvId: analysis.cvId,
          jobTitle: analysis.jobTitle,
          score: analysis.score,
          matchScore:
            typeof payload.matchScore === "number"
              ? payload.matchScore
              : analysis.score,
          createdAt: analysis.createdAt.toISOString(),
          summary: payload,
        };
      }),
    });
  } catch (error) {
    console.error("GET /api/ats failed:", error);
    return jsonError("We couldn't load your ATS history. Please try again.", 500);
  }
}

export async function POST(req: Request) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid request body.", 400);
  }

  try {
    const access = await checkAccess(auth.id, "ATS_ANALYZER");
    if (!access.allowed) return upgradeResponse(access);

    const payload = validateAtsInput(body);

    let cvData = payload.cv;
    if (payload.cvId) {
      const owned = await getOwnedCV(auth.id, payload.cvId);
      if (!owned) return jsonError("CV not found.", 404);
      cvData = owned.data;
    }

    if (!cvData) {
      return jsonError("A CV is required to run an ATS check.", 400);
    }

    const analysis = matchCvToJob(cvData, {
      jobTitle: payload.jobTitle,
      jobDescription: payload.jobDescription,
    });

    const saved = await prisma.atsAnalysis.create({
      data: {
        userId: auth.id,
        cvId: payload.cvId ?? null,
        jobTitle: payload.jobTitle,
        jobDescription: payload.jobDescription,
        score: analysis.score,
        analysis: analysis as unknown as Prisma.InputJsonValue,
      },
    });

    await syncUsageRow(auth.id);

    return NextResponse.json({
      analysis: {
        id: saved.id,
        cvId: saved.cvId,
        jobTitle: saved.jobTitle,
        ...analysis,
        score: saved.score,
        matchScore: analysis.matchScore ?? saved.score,
        createdAt: saved.createdAt.toISOString(),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "We couldn't run the ATS analysis.";
    if (message === "Invalid request body." || message === "A CV is required to run an ATS check." || message === "CV must be an object when provided.") {
      return jsonError(message, 400);
    }
    console.error("POST /api/ats failed:", error);
    return jsonError("We couldn't run the ATS analysis. Please try again.", 500);
  }
}
