import React from "react";
import { Document, renderToBuffer } from "@react-pdf/renderer";
import { ModernPdf } from "../components/pdf/ModernPdf";
import { pdfFlags } from "../components/pdf/pdf-utils";

const base = {
  template: "modern" as const,
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
  projects: [
    {
      id: "pr-1",
      name: "Analytics Monitor",
      description: "Built a dashboard for leadership reporting and performance analytics.",
      technologies: ["React", "Node.js", "SQL"],
      url: "example.com/analytics",
    },
  ],
  certifications: [
    {
      id: "c-1",
      name: "PMI Agile Certified Practitioner",
      issuer: "PMI",
      date: "2023",
      url: "",
    },
  ],
  languages: [
    { id: "l-1", name: "French", level: "Native" },
    { id: "l-2", name: "English", level: "Professional" },
  ],
};

const onePage = {
  ...base,
  experiences: [base.experiences[0]],
  projects: [base.projects[0]],
  certifications: [base.certifications[0]],
};

const manyExperiences = Array.from({ length: 8 }, (_, i) => ({
  ...base.experiences[0],
  id: `exp-${i + 1}`,
  position: `Senior Product Manager ${i + 1}`,
  company: `Company ${i + 1}`,
  description:
    "Led roadmap planning, stakeholder alignment, analytics reporting, and cross-functional delivery across a fast-moving SaaS platform with measurable business outcomes.",
}));

const twoPage = {
  ...base,
  experiences: manyExperiences,
  projects: [
    {
      ...base.projects[0],
      description:
        "Built a dashboard for leadership reporting and performance analytics across multiple products and teams. This project involved stakeholder alignment, metrics instrumentation, and reporting workflows to support executive decision making.",
    },
    {
      ...base.projects[0],
      id: "pr-2",
      name: "Operations Portal",
      description:
        "Designed an internal operations portal covering projects, metrics, objectives, and delivery health for a distributed team.",
    },
  ],
  certifications: Array.from({ length: 4 }, (_, i) => ({
    id: `c-${i + 1}`,
    name: `Certification ${i + 1}`,
    issuer: "PMI",
    date: "2023",
    url: "",
  })),
  languages: [...base.languages, { id: "l-3", name: "Spanish", level: "Conversational" }],
};

(async () => {
  const oneBuf = await renderToBuffer(
    <Document>
      <ModernPdf data={onePage} f={pdfFlags(onePage)} />
    </Document>
  );
  const twoBuf = await renderToBuffer(
    <Document>
      <ModernPdf data={twoPage} f={pdfFlags(twoPage)} />
    </Document>
  );

  const onePageCount = (oneBuf.toString("latin1").match(/\/Type \/Page/g) || []).length;
  const twoPageCount = (twoBuf.toString("latin1").match(/\/Type \/Page/g) || []).length;

  console.log(`onePagePages=${onePageCount}`);
  console.log(`twoPagePages=${twoPageCount}`);
})();
