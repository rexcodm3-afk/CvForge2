import React from "react";
import { Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import type { CVData } from "@/lib/cv-types";
import { pdfDate, contactList, PdfFlags, SKILL_PCT } from "./pdf-utils";

const GREEN = "#0A4531";
const GREEN_MID = "#0E6B49";
const GREEN_DARK = "#0B573C";

const s = StyleSheet.create({
  page: { fontFamily: "Helvetica", color: "#262626", fontSize: 10, lineHeight: 1.45 },
  header: { backgroundColor: GREEN, paddingVertical: 30, paddingHorizontal: 44 },
  name: { fontFamily: "Helvetica-Bold", fontSize: 24, color: "#ffffff", letterSpacing: -0.4 },
  title: { fontSize: 12.5, color: "#A9D2BF", marginTop: 4, fontFamily: "Helvetica-Bold" },
  contactRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 10 },
  contactItem: { fontSize: 9, color: "#e5efe9", marginRight: 16, marginTop: 2 },
  body: { paddingVertical: 26, paddingHorizontal: 44 },
  section: { marginBottom: 15 },
  heading: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  headingSquare: { width: 6, height: 6, backgroundColor: GREEN_MID, marginRight: 6 },
  headingText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10.5,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: GREEN_DARK,
  },
  entry: { marginBottom: 9 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  entryTitle: { fontFamily: "Helvetica-Bold", fontSize: 11.5, color: "#111827" },
  entryOrg: { fontFamily: "Helvetica-Bold", fontSize: 10, color: GREEN_MID, marginTop: 1 },
  dates: { fontSize: 9, color: "#6b7280", fontFamily: "Helvetica-Bold" },
  para: { fontSize: 9.5, color: "#4b5563", marginTop: 3, lineHeight: 1.5 },
  summary: { fontSize: 10, color: "#374151", lineHeight: 1.55 },
  // skills grid
  skillGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  skill: { width: "47%", marginBottom: 8 },
  skillRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
  skillName: { fontSize: 9.5, fontFamily: "Helvetica-Bold", color: "#1f2937" },
  skillLevel: { fontSize: 8.5, color: "#6b7280" },
  bar: { height: 4, backgroundColor: "#e5e7eb", borderRadius: 2 },
  barFill: { height: 4, backgroundColor: GREEN_MID, borderRadius: 2 },
  twoCol: { flexDirection: "row", justifyContent: "space-between" },
  col: { width: "47%" },
  liName: { fontFamily: "Helvetica-Bold", fontSize: 9.5, color: "#1f2937" },
  liMeta: { fontSize: 8.5, color: "#6b7280", marginTop: 1 },
});

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <View style={s.heading}>
      <View style={s.headingSquare} />
      <Text style={s.headingText}>{children}</Text>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={s.section} minPresenceAhead={46}>
      <Heading>{title}</Heading>
      {children}
    </View>
  );
}

export function ModernPdf({ data, f }: { data: CVData; f: PdfFlags }) {
  const p = data.personal;
  const contacts = (["email", "phone", "location", "linkedin", "portfolio"] as const).filter(
    (k) => p[k]?.trim()
  );

  return (
    <Page size="A4" style={s.page} wrap>
      <View style={s.header}>
        <Text style={s.name}>{p.fullName.trim() || "Your Name"}</Text>
        {p.title.trim() ? <Text style={s.title}>{p.title}</Text> : null}
        {contacts.length ? (
          <View style={s.contactRow}>
            {contacts.map((k) => (
              <Text key={k} style={s.contactItem}>
                {p[k]}
              </Text>
            ))}
          </View>
        ) : null}
      </View>

      <View style={s.body}>
        {f.summary ? (
          <Section title="Summary">
            <Text style={s.summary}>{data.summary}</Text>
          </Section>
        ) : null}

        {f.experience ? (
          <Section title="Experience">
            {data.experiences.map((e) => (
              <View key={e.id} style={s.entry}>
                <View style={s.rowBetween}>
                  <Text style={s.entryTitle}>{e.position || "Position"}</Text>
                  <Text style={s.dates}>{pdfDate(e.startDate, e.endDate, e.current)}</Text>
                </View>
                <Text style={s.entryOrg}>
                  {[e.company, e.location].filter(Boolean).join("  ·  ") || "Company"}
                </Text>
                {e.description.trim() ? <Text style={s.para}>{e.description}</Text> : null}
              </View>
            ))}
          </Section>
        ) : null}

        {f.education ? (
          <Section title="Education">
            {data.educations.map((ed) => (
              <View key={ed.id} style={s.entry}>
                <View style={s.rowBetween}>
                  <Text style={s.entryTitle}>
                    {ed.degree || "Degree"}
                    {ed.field ? `, ${ed.field}` : ""}
                  </Text>
                  <Text style={s.dates}>{pdfDate(ed.startDate, ed.endDate)}</Text>
                </View>
                <Text style={s.entryOrg}>{ed.institution || "Institution"}</Text>
                {ed.description.trim() ? <Text style={s.para}>{ed.description}</Text> : null}
              </View>
            ))}
          </Section>
        ) : null}

        {f.skills ? (
          <Section title="Skills">
            <View style={s.skillGrid}>
              {data.skills.map((sk) => (
                <View key={sk.id} style={s.skill}>
                  <View style={s.skillRow}>
                    <Text style={s.skillName}>{sk.name || "Skill"}</Text>
                    <Text style={s.skillLevel}>{sk.level}</Text>
                  </View>
                  <View style={s.bar}>
                    <View style={[s.barFill, { width: `${SKILL_PCT[sk.level] ?? 60}%` }]} />
                  </View>
                </View>
              ))}
            </View>
          </Section>
        ) : null}

        {f.projects ? (
          <Section title="Projects">
            {data.projects.map((pr) => (
              <View key={pr.id} style={s.entry}>
                <View style={s.rowBetween}>
                  <Text style={s.entryTitle}>{pr.name || "Project"}</Text>
                  {pr.url.trim() ? (
                    <Text style={[s.dates, { color: GREEN_MID }]}>{pr.url}</Text>
                  ) : null}
                </View>
                {pr.description.trim() ? <Text style={s.para}>{pr.description}</Text> : null}
                {pr.technologies.length ? (
                  <Text style={[s.entryOrg, { marginTop: 2 }]}>
                    {pr.technologies.join(" · ")}
                  </Text>
                ) : null}
              </View>
            ))}
          </Section>
        ) : null}

        {f.certifications || f.languages ? (
          <View style={s.twoCol} minPresenceAhead={40}>
            {f.certifications ? (
              <View style={s.col}>
                <Heading>Certifications</Heading>
                {data.certifications.map((c) => (
                  <View key={c.id} style={{ marginBottom: 5 }}>
                    <Text style={s.liName}>{c.name || "Certification"}</Text>
                    <Text style={s.liMeta}>
                      {[c.issuer, c.date].filter(Boolean).join(" · ")}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={s.col} />
            )}
            {f.languages ? (
              <View style={s.col}>
                <Heading>Languages</Heading>
                {data.languages.map((l) => (
                  <View
                    key={l.id}
                    style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}
                  >
                    <Text style={s.liName}>{l.name || "Language"}</Text>
                    <Text style={s.liMeta}>{l.level}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={s.col} />
            )}
          </View>
        ) : null}
      </View>
    </Page>
  );
}
