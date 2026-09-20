import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { TemplateId } from "@/lib/cv-types";
import {
  cvInclude,
  cvToData,
  normalizeCVInput,
  type CVWithRelations,
} from "./cv-mapper";

export interface CVListItem {
  id: string;
  title: string;
  template: TemplateId;
  updatedAt: string;
  createdAt: string;
  data: ReturnType<typeof cvToData>;
}

function toListItem(cv: CVWithRelations): CVListItem {
  return {
    id: cv.id,
    title: cv.title,
    template: (["classic", "modern", "minimal"].includes(cv.template)
      ? cv.template
      : "classic") as TemplateId,
    updatedAt: cv.updatedAt.toISOString(),
    createdAt: cv.createdAt.toISOString(),
    data: cvToData(cv),
  };
}

/** All CVs owned by the user, newest-updated first. */
export async function listCVs(userId: string): Promise<CVListItem[]> {
  const cvs = await prisma.cV.findMany({
    where: { userId },
    include: cvInclude,
    orderBy: { updatedAt: "desc" },
  });
  return cvs.map(toListItem);
}

export async function createCV(
  userId: string,
  opts: { title?: string; template?: TemplateId } = {}
): Promise<CVListItem> {
  const cv = await prisma.cV.create({
    data: {
      userId,
      title: opts.title?.trim() || "My CV",
      template: opts.template ?? "classic",
      personalInfo: {},
      summary: "",
    },
    include: cvInclude,
  });
  return toListItem(cv);
}

/** Load a CV only if it belongs to the user. Returns null otherwise. */
export async function getOwnedCV(
  userId: string,
  cvId: string
): Promise<CVListItem | null> {
  const cv = await prisma.cV.findFirst({
    where: { id: cvId, userId },
    include: cvInclude,
  });
  return cv ? toListItem(cv) : null;
}

/**
 * Full-replace update of a CV's content, inside a transaction, verifying
 * ownership first. Returns the new updatedAt, or null if not owned/found.
 */
export async function updateCV(
  userId: string,
  cvId: string,
  body: Record<string, unknown>
): Promise<{ updatedAt: string } | null> {
  const owned = await prisma.cV.findFirst({
    where: { id: cvId, userId },
    select: { id: true },
  });
  if (!owned) return null;

  const n = normalizeCVInput(body);

  const updated = await prisma.$transaction(
    async (tx) => {
      await tx.cV.update({
        where: { id: cvId },
        data: {
          ...(n.title !== undefined ? { title: n.title || "Untitled CV" } : {}),
          template: n.template,
          personalInfo: n.personal as unknown as Prisma.InputJsonValue,
          summary: n.summary,
        },
      });

      await tx.experience.deleteMany({ where: { cvId } });
      if (n.experiences.length)
        await tx.experience.createMany({
          data: n.experiences.map((e) => ({ ...e, cvId })),
        });

      await tx.education.deleteMany({ where: { cvId } });
      if (n.educations.length)
        await tx.education.createMany({
          data: n.educations.map((e) => ({ ...e, cvId })),
        });

      await tx.skill.deleteMany({ where: { cvId } });
      if (n.skills.length)
        await tx.skill.createMany({
          data: n.skills.map((s) => ({ ...s, cvId })),
        });

      await tx.project.deleteMany({ where: { cvId } });
      if (n.projects.length)
        await tx.project.createMany({
          data: n.projects.map((p) => ({ ...p, cvId })),
        });

      await tx.certification.deleteMany({ where: { cvId } });
      if (n.certifications.length)
        await tx.certification.createMany({
          data: n.certifications.map((c) => ({ ...c, cvId })),
        });

      await tx.language.deleteMany({ where: { cvId } });
      if (n.languages.length)
        await tx.language.createMany({
          data: n.languages.map((l) => ({ ...l, cvId })),
        });

      return tx.cV.findUniqueOrThrow({
        where: { id: cvId },
        select: { updatedAt: true },
      });
    },
    {
      timeout: 30000,
      maxWait: 30000,
    }
  );

  return { updatedAt: updated.updatedAt.toISOString() };
}

/** Delete a CV (and cascade sections). Returns true if a row was removed. */
export async function deleteCV(userId: string, cvId: string): Promise<boolean> {
  const result = await prisma.cV.deleteMany({ where: { id: cvId, userId } });
  return result.count > 0;
}

/** Record a PDF export event (foundation for later analytics / limits). */
export async function recordExportEvent(
  userId: string,
  cvId: string,
  template: string,
  type = "PDF_DOWNLOAD"
): Promise<void> {
  try {
    await prisma.exportEvent.create({
      data: { userId, cvId, template, type },
    });
  } catch (err) {
    // Never fail the download because analytics logging failed.
    console.error("recordExportEvent failed:", err);
  }
}

/** Duplicate a CV (owned by the user), copying all sections. */
export async function duplicateCV(
  userId: string,
  cvId: string
): Promise<CVListItem | null> {
  const source = await prisma.cV.findFirst({
    where: { id: cvId, userId },
    include: cvInclude,
  });
  if (!source) return null;

  const copy = await prisma.cV.create({
    data: {
      userId,
      title: `${source.title} Copy`,
      template: source.template,
      personalInfo: source.personalInfo ?? {},
      summary: source.summary ?? "",
      experiences: {
        create: source.experiences.map(({ id, cvId, ...rest }) => rest),
      },
      educations: {
        create: source.educations.map(({ id, cvId, ...rest }) => rest),
      },
      skills: { create: source.skills.map(({ id, cvId, ...rest }) => rest) },
      projects: { create: source.projects.map(({ id, cvId, ...rest }) => rest) },
      certifications: {
        create: source.certifications.map(({ id, cvId, ...rest }) => rest),
      },
      languages: {
        create: source.languages.map(({ id, cvId, ...rest }) => rest),
      },
    },
    include: cvInclude,
  });
  return toListItem(copy);
}
