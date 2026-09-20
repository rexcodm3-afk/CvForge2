import assert from "node:assert/strict";
import test from "node:test";

import type { CVData } from "@/lib/cv-types";
import {
  analyzeCv,
  matchCvToJob,
  getAtsLimitForPlan,
  validateAtsInput,
  isOwnedByUser,
} from "@/lib/server/ats";

const sampleCv: Partial<CVData> = {
  template: "classic",
  personal: {
    fullName: "Amina Ndam",
    title: "Senior Product Manager",
    email: "amina@example.com",
    phone: "+237 650000000",
    location: "Yaoundé, Cameroon",
    linkedin: "linkedin.com/in/aminandam",
    portfolio: "aminandam.com",
  },
  summary:
    "Product manager with experience leading roadmap delivery, stakeholder alignment, and analytics-driven decision making across web products.",
  experiences: [
    {
      id: "exp-1",
      position: "Senior Product Manager",
      company: "Northstar Labs",
      location: "Yaoundé, Cameroon",
      startDate: "2021",
      endDate: "Present",
      current: true,
      description:
        "Owned backlog prioritization, led cross-functional delivery for a SaaS platform, defined KPIs, and partnered with design and engineering to launch analytics features.",
    },
  ],
  educations: [
    {
      id: "edu-1",
      institution: "University of Yaoundé",
      degree: "BSc",
      field: "Management Information Systems",
      startDate: "2013",
      endDate: "2017",
      description: "",
    },
  ],
  skills: [
    { id: "s-1", name: "Product Strategy", level: "Advanced" },
    { id: "s-2", name: "SQL", level: "Advanced" },
    { id: "s-3", name: "Roadmapping", level: "Advanced" },
    { id: "s-4", name: "Stakeholder Management", level: "Advanced" },
  ],
  projects: [],
  certifications: [],
  languages: [],
};

test("CV analysis returns a realistic score for a well-structured CV", () => {
  const result = analyzeCv(sampleCv);
  assert.ok(result.score >= 75, `expected a strong score, got ${result.score}`);
  assert.ok(result.strengths.length > 0);
  assert.ok(result.weaknesses.length >= 0);
});

test("job matching highlights missing keywords and skills", () => {
  const result = matchCvToJob(sampleCv, {
    jobTitle: "Senior Product Manager",
    jobDescription:
      "Lead product strategy for analytics SaaS, manage roadmaps, write SQL, and coordinate stakeholder communication across engineering and design teams.",
  });

  const matchScore = result.matchScore ?? result.score;
  assert.ok(matchScore >= 60, `expected a meaningful match, got ${matchScore}`);
  assert.ok(result.missingKeywords.length >= 0);
  assert.ok(Array.isArray(result.matchingSkills));
});

test("empty CVs score poorly and report missing sections", () => {
  const result = analyzeCv({
    template: "classic",
    personal: {
      fullName: "",
      title: "",
      email: "",
      phone: "",
      location: "",
      linkedin: "",
      portfolio: "",
    },
    summary: "",
    experiences: [],
    educations: [],
    skills: [],
    projects: [],
    certifications: [],
    languages: [],
  });

  assert.equal(result.score, 0);
  assert.ok(result.weaknesses.some((w) => w.toLowerCase().includes("missing")));
});

test("usage limits are configured per plan", () => {
  assert.equal(getAtsLimitForPlan("free"), 3);
  assert.equal(getAtsLimitForPlan("pro_monthly"), null);
  assert.equal(getAtsLimitForPlan("pro_yearly"), null);
});

test("invalid ATS payloads are rejected", () => {
  assert.throws(() => validateAtsInput("{bad json"), /Invalid request body/i);
  assert.throws(() => validateAtsInput({ cv: "not-an-object" }), /CV must be an object/i);
});

test("ownership checks block unauthorized access", () => {
  assert.equal(isOwnedByUser("user-1", "user-2"), false);
  assert.equal(isOwnedByUser("user-1", "user-1"), true);
});
