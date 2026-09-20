import type { CVData } from "@/lib/cv-types";

export interface AtsAnalysisResult {
  score: number;
  estimated: boolean;
  strengths: string[];
  weaknesses: string[];
  missingKeywords: string[];
  recommendations: string[];
  matchScore: number;
  matchingKeywords: string[];
  missingSkills: string[];
  matchingSkills: string[];
  relevantExperience: string[];
  missingSections: string[];
}

export interface AtsJobInput {
  jobTitle?: string;
  jobDescription?: string;
}

const COMMON_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "that",
  "this",
  "from",
  "into",
  "your",
  "their",
  "have",
  "will",
  "been",
  "than",
  "about",
  "over",
  "under",
  "using",
  "through",
  "across",
  "upon",
  "within",
  "between",
  "after",
  "before",
  "during",
  "without",
  "where",
  "when",
  "what",
  "which",
  "whereas",
  "while",
  "work",
  "role",
  "team",
  "company",
  "product",
  "business",
  "strong",
  "ability",
  "experience",
  "skills",
  "years",
  "candidate",
  "position",
  "responsibilities",
]);

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function toText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function hasText(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeTokens(value: string): string[] {
  return normalizeText(value)
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length > 2 && !COMMON_WORDS.has(token));
}

export function extractKeywords(text: string): string[] {
  const seen = new Set<string>();
  const keywords: string[] = [];
  for (const token of normalizeTokens(text)) {
    if (!seen.has(token)) {
      seen.add(token);
      keywords.push(token);
    }
  }
  return keywords;
}

function buildCvText(cv: Partial<CVData> | null | undefined): string {
  if (!cv) return "";
  const parts = [
    cv.personal?.fullName,
    cv.personal?.title,
    cv.personal?.location,
    cv.summary,
    ...(cv.experiences ?? []).flatMap((item) => [
      item.position,
      item.company,
      item.location,
      item.description,
    ]),
    ...(cv.educations ?? []).flatMap((item) => [
      item.institution,
      item.degree,
      item.field,
      item.description,
    ]),
    ...(cv.skills ?? []).map((item) => item.name),
    ...(cv.projects ?? []).flatMap((item) => [item.name, item.description]),
  ];
  return parts.join(" ");
}

export function getAtsLimitForPlan(planId: string): number | null {
  return planId === "free" ? 3 : null;
}

export function validateAtsInput(input: unknown): {
  cvId?: string;
  cv?: Partial<CVData>;
  jobTitle: string;
  jobDescription: string;
} {
  if (!input || typeof input !== "object") {
    throw new Error("Invalid request body.");
  }

  const body = input as Record<string, unknown>;
  const cvId = typeof body.cvId === "string" ? body.cvId.trim() : undefined;
  const jobTitle = typeof body.jobTitle === "string" ? body.jobTitle.trim() : "";
  const jobDescription =
    typeof body.jobDescription === "string" ? body.jobDescription.trim() : "";
  const cvCandidate = body.cv;

  if (cvCandidate !== undefined && cvCandidate !== null && typeof cvCandidate !== "object") {
    throw new Error("CV must be an object when provided.");
  }

  if (!cvId && !cvCandidate) {
    throw new Error("A CV is required to run an ATS check.");
  }

  return {
    cvId: cvId || undefined,
    cv: cvCandidate as Partial<CVData> | undefined,
    jobTitle,
    jobDescription,
  };
}

export function isOwnedByUser(analysisUserId: string, currentUserId: string): boolean {
  return analysisUserId === currentUserId;
}

export function analyzeCv(
  cv: Partial<CVData> | null | undefined
): AtsAnalysisResult {
  const safeCv = cv ?? {
    personal: { fullName: "", title: "", email: "", phone: "", location: "", linkedin: "", portfolio: "" },
    summary: "",
    experiences: [],
    educations: [],
    skills: [],
  };

  const personal = safeCv.personal ?? {
    fullName: "",
    title: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    portfolio: "",
  };

  const weaknesses: string[] = [];
  const strengths: string[] = [];
  const missingSections: string[] = [];
  const recommendations: string[] = [];
  let score = 100;

  if (!hasText(personal.fullName)) {
    score -= 18;
    weaknesses.push("Missing full name in the contact block.");
    missingSections.push("full name");
  } else {
    strengths.push("Contact information includes a full name.");
  }

  if (!hasText(personal.email) && !hasText(personal.phone)) {
    score -= 18;
    weaknesses.push("Missing contact details such as email or phone number.");
    missingSections.push("contact details");
  } else {
    strengths.push("Contact details are available.");
  }

  if (!hasText(safeCv.summary)) {
    score -= 16;
    weaknesses.push("Missing a professional summary.");
    missingSections.push("professional summary");
    recommendations.push("Add a concise professional summary that reflects your target role and key strengths.");
  } else {
    strengths.push("Professional summary is present.");
  }

  if (!safeCv.experiences || safeCv.experiences.length === 0) {
    score -= 20;
    weaknesses.push("Missing work experience.");
    missingSections.push("work experience");
    recommendations.push("Add recent roles with measurable outcomes and responsibilities relevant to your target job.");
  } else {
    strengths.push("Work experience section is included.");
  }

  if (!safeCv.educations || safeCv.educations.length === 0) {
    score -= 10;
    weaknesses.push("Missing education details.");
    missingSections.push("education");
  } else {
    strengths.push("Education details are included.");
  }

  if (!safeCv.skills || safeCv.skills.length === 0) {
    score -= 15;
    weaknesses.push("Missing skills section.");
    missingSections.push("skills");
    recommendations.push("List the tools, methods, and capabilities most relevant to the role.");
  } else {
    strengths.push("Skills are clearly listed.");
  }

  if (!hasText(personal.location)) {
    score -= 6;
    weaknesses.push("Location is missing from the CV.");
    missingSections.push("location");
  }

  const qualityScore = clamp(Math.round(score), 0, 100);

  if (qualityScore === 0) {
    return {
      score: 0,
      matchScore: 0,
      estimated: true,
      strengths: [],
      weaknesses: ["Unable to process document content."],
      missingKeywords: [],
      matchingKeywords: [],
      missingSkills: [],
      matchingSkills: [],
      relevantExperience: [],
      recommendations: ["Ensure the uploaded CV contains extractable text."],
      missingSections: [],
    };
  }

 return {
    score: qualityScore,
    matchScore: qualityScore,
    estimated: true,
    strengths: strengths.slice(0, 4),
    weaknesses: weaknesses.slice(0, 4),
    missingKeywords: [],
    matchingKeywords: [],
    missingSkills: [],
    matchingSkills: [],
    relevantExperience: [],
    recommendations: recommendations.slice(0, 4),
    missingSections: [],
  };
}

export function matchCvToJob(
  cv: Partial<CVData> | null | undefined,
  job: AtsJobInput
): AtsAnalysisResult {
  const general = analyzeCv(cv);
  const descriptionText = [job.jobTitle ?? "", job.jobDescription ?? ""].join(" ");
  const cvText = buildCvText(cv);

  const jobKeywords = extractKeywords(descriptionText);
  const cvKeywords = extractKeywords(cvText);

  const matchingKeywords = jobKeywords.filter((keyword) =>
    cvKeywords.some((cvKeyword) => cvKeyword === keyword)
  );
  const missingKeywords = jobKeywords.filter(
    (keyword) => !cvKeywords.some((cvKeyword) => cvKeyword === keyword)
  );

  const skillNames = (cv?.skills ?? []).map((skill) => normalizeText(skill.name));
  const jobSkillTerms = jobKeywords.filter(
    (keyword) => keyword.length >= 4 || keyword.includes("sql") || keyword.includes("crm")
  );

  const matchingSkills = skillNames.filter((skill) =>
    jobSkillTerms.some((term) => skill.includes(term) || term.includes(skill))
  );
  const missingSkills = jobSkillTerms.filter(
    (term) => !skillNames.some((skill) => skill.includes(term) || term.includes(skill))
  );

  const relevantExperience = (cv?.experiences ?? [])
    .filter((experience) => {
      const haystack = normalizeText(
        `${experience.position} ${experience.company} ${experience.description}`
      );
      return jobKeywords.some((keyword) => haystack.includes(keyword));
    })
    .map((experience) => `${experience.position} at ${experience.company}`)
    .slice(0, 3);

  const matchPercent =
    jobKeywords.length > 0
      ? Math.round((matchingKeywords.length / Math.max(jobKeywords.length, 1)) * 100)
      : 100;

  const sectionScore = general.score;
  const score = clamp(
    Math.round((matchPercent * 0.7) + (sectionScore * 0.3)),
    0,
    100
  );

  const strengths = [
    ...(general.strengths ?? []),
    ...(matchingKeywords.length > 0 ? [`Matches ${matchingKeywords.length} job keywords.`] : []),
    ...(matchingSkills.length > 0 ? [`Covers core skills like ${matchingSkills.slice(0, 3).join(", ")}.`] : []),
  ].slice(0, 4);

  const weaknesses = [
    ...(general.weaknesses ?? []),
    ...(missingKeywords.length > 0
      ? [`Missing high-value keywords: ${missingKeywords.slice(0, 4).join(", ")}.`] : []),
    ...(missingSkills.length > 0
      ? [`Missing skills expected by the role: ${missingSkills.slice(0, 4).join(", ")}.`] : []),
  ].slice(0, 4);

  const recommendations = [
    ...(general.recommendations ?? []),
    ...(missingKeywords.length > 0
      ? ["Add the missing keywords naturally in your summary, skills, and experience bullets."] : []),
    ...(missingSkills.length > 0
      ? ["Include the missing skills in your core competencies and work descriptions."] : []),
    ...((relevantExperience.length === 0 && (cv?.experiences ?? []).length > 0)
      ? ["Tighten experience bullets to reflect the job's responsibilities and achievements."] : []),
  ].slice(0, 4);

  return {
    score,
    estimated: true,
    strengths,
    weaknesses,
    missingKeywords: missingKeywords.slice(0, 8),
    recommendations,
    matchScore: score,
    matchingKeywords: matchingKeywords.slice(0, 8),
    matchingSkills: matchingSkills.slice(0, 6),
    missingSkills: missingSkills.slice(0, 6),
    relevantExperience: relevantExperience.slice(0, 3),
    missingSections: general.missingSections,
  };
}
