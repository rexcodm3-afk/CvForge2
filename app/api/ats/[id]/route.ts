import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, jsonError } from "@/lib/server/api";
import { isOwnedByUser } from "@/lib/server/ats";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  try {
    const analysis = await prisma.atsAnalysis.findUnique({
      where: { id: params.id },
    });

    if (!analysis || !isOwnedByUser(analysis.userId, auth.id)) {
      return jsonError("ATS analysis not found.", 404);
    }

    const payload =
      typeof analysis.analysis === "object" && analysis.analysis !== null
        ? (analysis.analysis as Record<string, unknown>)
        : {};

    return NextResponse.json({
      analysis: {
        id: analysis.id,
        cvId: analysis.cvId,
        userId: analysis.userId,
        jobTitle: analysis.jobTitle,
        jobDescription: analysis.jobDescription,
        score: analysis.score,
        matchScore:
          typeof payload.matchScore === "number" ? payload.matchScore : analysis.score,
        result: payload,
        createdAt: analysis.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("GET /api/ats/[id] failed:", error);
    return jsonError("We couldn't load this ATS analysis. Please try again.", 500);
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  try {
    const analysis = await prisma.atsAnalysis.findUnique({
      where: { id: params.id },
      select: { userId: true },
    });

    if (!analysis || !isOwnedByUser(analysis.userId, auth.id)) {
      return jsonError("ATS analysis not found.", 404);
    }

    await prisma.atsAnalysis.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/ats/[id] failed:", error);
    return jsonError("We couldn't delete this ATS analysis. Please try again.", 500);
  }
}
