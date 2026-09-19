import { MasterResumeData } from "../types/jobpilot.ts";

/**
 * Downloads a file to the user's computer or mobile device.
 */
export function triggerDownload(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 300);
}

/**
 * Converts a MasterResumeData object into cleanly formatted plain text (ATS optimized).
 */
export function formatResumeAsPlainText(
  resume: MasterResumeData,
  jobTitle?: string,
  company?: string
): string {
  const lines: string[] = [];

  // Header
  lines.push(resume.contactInfo.name.toUpperCase());
  const contacts = [
    resume.contactInfo.location,
    resume.contactInfo.email,
    resume.contactInfo.phone,
    resume.contactInfo.linkedin,
    resume.contactInfo.github,
  ].filter(Boolean);
  lines.push(contacts.join(" | "));
  lines.push("");

  if (jobTitle && company) {
    lines.push(`TARGET ROLE: ${jobTitle} — ${company}`);
    lines.push("");
  }

  // Summary
  if (resume.professionalSummary) {
    lines.push("PROFESSIONAL SUMMARY");
    lines.push("--------------------");
    lines.push(resume.professionalSummary);
    lines.push("");
  }

  // Technical Skills
  if (resume.technicalSkills) {
    lines.push("TECHNICAL SKILLS");
    lines.push("----------------");
    const skills = resume.technicalSkills;
    if (skills.languages?.length) lines.push(`Languages: ${skills.languages.join(", ")}`);
    if (skills.frameworks?.length) lines.push(`Frameworks & Libraries: ${skills.frameworks.join(", ")}`);
    if (skills.cloudDevOps?.length) lines.push(`Cloud & DevOps: ${skills.cloudDevOps.join(", ")}`);
    if (skills.databases?.length) lines.push(`Databases: ${skills.databases.join(", ")}`);
    if (skills.tools?.length) lines.push(`Tools & Methodologies: ${skills.tools.join(", ")}`);
    lines.push("");
  }

  // Experience
  if (resume.experience?.length) {
    lines.push("PROFESSIONAL EXPERIENCE");
    lines.push("-----------------------");
    resume.experience.forEach((exp) => {
      lines.push(`${exp.title} | ${exp.company}`);
      const meta = [exp.period, exp.location].filter(Boolean).join(" • ");
      if (meta) lines.push(meta);
      exp.bullets.forEach((b) => lines.push(`• ${b}`));
      lines.push("");
    });
  }

  // Projects
  if (resume.projects?.length) {
    lines.push("KEY PROJECTS");
    lines.push("------------");
    resume.projects.forEach((proj) => {
      lines.push(proj.name);
      if (proj.technologies?.length) {
        lines.push(`Technologies: ${proj.technologies.join(", ")}`);
      }
      if (proj.description) lines.push(proj.description);
      if (proj.bullets?.length) {
        proj.bullets.forEach((b) => lines.push(`• ${b}`));
      }
      lines.push("");
    });
  }

  // Education
  if (resume.education?.length) {
    lines.push("EDUCATION");
    lines.push("---------");
    resume.education.forEach((edu) => {
      lines.push(`${edu.degree} — ${edu.school} (${edu.year})`);
    });
    lines.push("");
  }

  // Certifications
  if (resume.certifications?.length) {
    lines.push("CERTIFICATIONS");
    lines.push("--------------");
    resume.certifications.forEach((cert) => lines.push(`• ${cert}`));
    lines.push("");
  }

  return lines.join("\n");
}

/**
 * Converts a MasterResumeData into cleanly formatted Markdown.
 */
export function formatResumeAsMarkdown(
  resume: MasterResumeData,
  jobTitle?: string,
  company?: string
): string {
  const lines: string[] = [];

  lines.push(`# ${resume.contactInfo.name}`);
  const contacts = [
    resume.contactInfo.location,
    resume.contactInfo.email,
    resume.contactInfo.phone,
    resume.contactInfo.linkedin,
    resume.contactInfo.github,
  ].filter(Boolean);
  lines.push(`**${contacts.join(" • ")}**\n`);

  if (jobTitle && company) {
    lines.push(`> **Targeted Application:** ${jobTitle} at ${company}\n`);
  }

  if (resume.professionalSummary) {
    lines.push("## Professional Summary");
    lines.push(resume.professionalSummary + "\n");
  }

  if (resume.technicalSkills) {
    lines.push("## Technical Skills");
    const skills = resume.technicalSkills;
    if (skills.languages?.length) lines.push(`- **Languages:** ${skills.languages.join(", ")}`);
    if (skills.frameworks?.length) lines.push(`- **Frameworks:** ${skills.frameworks.join(", ")}`);
    if (skills.cloudDevOps?.length) lines.push(`- **Cloud & DevOps:** ${skills.cloudDevOps.join(", ")}`);
    if (skills.databases?.length) lines.push(`- **Databases:** ${skills.databases.join(", ")}`);
    if (skills.tools?.length) lines.push(`- **Tools:** ${skills.tools.join(", ")}`);
    lines.push("");
  }

  if (resume.experience?.length) {
    lines.push("## Professional Experience");
    resume.experience.forEach((exp) => {
      lines.push(`### ${exp.title} — ${exp.company}`);
      lines.push(`*${[exp.period, exp.location].filter(Boolean).join(" | ")}*`);
      exp.bullets.forEach((b) => lines.push(`- ${b}`));
      lines.push("");
    });
  }

  if (resume.projects?.length) {
    lines.push("## Key Projects");
    resume.projects.forEach((proj) => {
      lines.push(`### ${proj.name}`);
      if (proj.technologies?.length) lines.push(`*Technologies: ${proj.technologies.join(", ")}*`);
      if (proj.description) lines.push(proj.description);
      if (proj.bullets?.length) {
        proj.bullets.forEach((b) => lines.push(`- ${b}`));
      }
      lines.push("");
    });
  }

  if (resume.education?.length) {
    lines.push("## Education");
    resume.education.forEach((edu) => {
      lines.push(`- **${edu.degree}**, ${edu.school} (${edu.year})`);
    });
    lines.push("");
  }

  if (resume.certifications?.length) {
    lines.push("## Certifications");
    resume.certifications.forEach((cert) => lines.push(`- ${cert}`));
  }

  return lines.join("\n");
}

/**
 * Generates an HTML document styled specifically for ATS resumes and print / Word export.
 */
function generateResumeHTML(
  resume: MasterResumeData,
  jobTitle?: string,
  company?: string
): string {
  const contacts = [
    resume.contactInfo.location,
    resume.contactInfo.email,
    resume.contactInfo.phone,
    resume.contactInfo.linkedin,
    resume.contactInfo.github,
  ].filter(Boolean);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${resume.contactInfo.name} - Resume</title>
<style>
  @page {
    margin: 18mm 16mm;
    size: letter portrait;
  }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #111827;
    background: #ffffff;
    line-height: 1.5;
    font-size: 11pt;
    margin: 0;
    padding: 24px;
    max-width: 800px;
    margin: 0 auto;
  }
  header {
    text-align: center;
    border-bottom: 2px solid #2563eb;
    padding-bottom: 12px;
    margin-bottom: 16px;
  }
  h1 {
    font-size: 20pt;
    font-weight: 700;
    margin: 0 0 6px 0;
    color: #0f172a;
    letter-spacing: -0.5px;
  }
  .contact-bar {
    font-size: 9.5pt;
    color: #475569;
  }
  .target-badge {
    margin-top: 6px;
    font-size: 9pt;
    font-weight: 600;
    color: #2563eb;
  }
  section {
    margin-bottom: 16px;
  }
  h2 {
    font-size: 12pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #1e3a8a;
    border-bottom: 1px solid #cbd5e1;
    padding-bottom: 3px;
    margin: 14px 0 8px 0;
  }
  .experience-item, .project-item {
    margin-bottom: 12px;
    page-break-inside: avoid;
  }
  .job-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    font-weight: 700;
    font-size: 11pt;
    color: #0f172a;
  }
  .job-sub {
    display: flex;
    justify-content: space-between;
    font-size: 9.5pt;
    color: #64748b;
    margin-bottom: 4px;
    font-style: italic;
  }
  ul {
    margin: 4px 0 8px 0;
    padding-left: 20px;
  }
  li {
    margin-bottom: 3px;
    font-size: 10pt;
    color: #334155;
  }
  .skills-grid p {
    margin: 4px 0;
    font-size: 10pt;
  }
  .skills-grid strong {
    color: #0f172a;
  }
  @media print {
    body {
      padding: 0;
      max-width: 100%;
    }
  }
</style>
</head>
<body>
  <header>
    <h1>${resume.contactInfo.name}</h1>
    <div class="contact-bar">${contacts.join(" &bull; ")}</div>
    ${
      jobTitle && company
        ? `<div class="target-badge">Target Role: ${jobTitle} &mdash; ${company}</div>`
        : ""
    }
  </header>

  ${
    resume.professionalSummary
      ? `<section>
          <h2>Professional Summary</h2>
          <p style="margin: 4px 0; font-size: 10pt; color: #334155;">${resume.professionalSummary}</p>
        </section>`
      : ""
  }

  ${
    resume.technicalSkills
      ? `<section>
          <h2>Technical Skills</h2>
          <div class="skills-grid">
            ${
              resume.technicalSkills.languages?.length
                ? `<p><strong>Languages:</strong> ${resume.technicalSkills.languages.join(", ")}</p>`
                : ""
            }
            ${
              resume.technicalSkills.frameworks?.length
                ? `<p><strong>Frameworks & Libraries:</strong> ${resume.technicalSkills.frameworks.join(", ")}</p>`
                : ""
            }
            ${
              resume.technicalSkills.cloudDevOps?.length
                ? `<p><strong>Cloud & DevOps:</strong> ${resume.technicalSkills.cloudDevOps.join(", ")}</p>`
                : ""
            }
            ${
              resume.technicalSkills.databases?.length
                ? `<p><strong>Databases:</strong> ${resume.technicalSkills.databases.join(", ")}</p>`
                : ""
            }
            ${
              resume.technicalSkills.tools?.length
                ? `<p><strong>Tools & Platforms:</strong> ${resume.technicalSkills.tools.join(", ")}</p>`
                : ""
            }
          </div>
        </section>`
      : ""
  }

  ${
    resume.experience?.length
      ? `<section>
          <h2>Professional Experience</h2>
          ${resume.experience
            .map(
              (exp) => `
            <div class="experience-item">
              <div class="job-header">
                <span>${exp.title}</span>
                <span>${exp.company}</span>
              </div>
              <div class="job-sub">
                <span>${exp.location || ""}</span>
                <span>${exp.period || ""}</span>
              </div>
              <ul>
                ${exp.bullets.map((b) => `<li>${b}</li>`).join("")}
              </ul>
            </div>
          `
            )
            .join("")}
        </section>`
      : ""
  }

  ${
    resume.projects?.length
      ? `<section>
          <h2>Key Projects</h2>
          ${resume.projects
            .map(
              (proj) => `
            <div class="project-item">
              <div class="job-header">
                <span>${proj.name}</span>
                ${
                  proj.technologies?.length
                    ? `<span style="font-size: 9pt; font-weight: normal; color: #64748b;">${proj.technologies.join(", ")}</span>`
                    : ""
                }
              </div>
              ${proj.description ? `<p style="margin: 2px 0 4px 0; font-size: 9.5pt; color: #475569;">${proj.description}</p>` : ""}
              ${
                proj.bullets?.length
                  ? `<ul>${proj.bullets.map((b) => `<li>${b}</li>`).join("")}</ul>`
                  : ""
              }
            </div>
          `
            )
            .join("")}
        </section>`
      : ""
  }

  ${
    resume.education?.length
      ? `<section>
          <h2>Education</h2>
          ${resume.education
            .map(
              (edu) => `
            <div style="display: flex; justify-content: space-between; font-size: 10pt; margin-bottom: 4px;">
              <strong>${edu.degree} &mdash; ${edu.school}</strong>
              <span style="color: #64748b;">${edu.year}</span>
            </div>
          `
            )
            .join("")}
        </section>`
      : ""
  }

  ${
    resume.certifications?.length
      ? `<section>
          <h2>Certifications</h2>
          <ul>
            ${resume.certifications.map((cert) => `<li>${cert}</li>`).join("")}
          </ul>
        </section>`
      : ""
  }
</body>
</html>`;
}

/**
 * Downloads the resume as a clean .txt plain text file.
 */
export function downloadResumeAsTxt(
  resume: MasterResumeData,
  company = "TargetCompany",
  role = "SoftwareEngineer"
) {
  const content = formatResumeAsPlainText(resume, role, company);
  const cleanName = resume.contactInfo.name.replace(/\s+/g, "_") || "Candidate";
  const filename = `${cleanName}_Resume_${company.replace(/\s+/g, "_")}.txt`;
  triggerDownload(filename, content, "text/plain;charset=utf-8");
}

/**
 * Downloads the resume as a Word-compatible .doc document.
 */
export function downloadResumeAsDoc(
  resume: MasterResumeData,
  company = "TargetCompany",
  role = "SoftwareEngineer"
) {
  const html = generateResumeHTML(resume, role, company);
  const cleanName = resume.contactInfo.name.replace(/\s+/g, "_") || "Candidate";
  const filename = `${cleanName}_Resume_${company.replace(/\s+/g, "_")}.doc`;
  triggerDownload(filename, html, "application/msword;charset=utf-8");
}

/**
 * Prints the resume or opens native browser Save as PDF dialog cleanly.
 */
export function printResumeAsPDF(
  resume: MasterResumeData,
  company = "TargetCompany",
  role = "SoftwareEngineer"
) {
  const html = generateResumeHTML(resume, role, company);
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (doc) {
    doc.open();
    doc.write(html);
    doc.close();
    iframe.contentWindow?.focus();
    setTimeout(() => {
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 2000);
    }, 400);
  }
}

/**
 * Generates an HTML document for a Cover Letter.
 */
function generateCoverLetterHTML(
  letterText: string,
  company: string,
  role: string,
  candidateName = "Candidate"
): string {
  const dateStr = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const formattedParagraphs = letterText
    .split(/\n\n+/)
    .map((p) => `<p style="margin-bottom: 14px; font-size: 11pt; line-height: 1.6; color: #334155;">${p.replace(/\n/g, "<br/>")}</p>`)
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Cover Letter - ${candidateName} - ${company}</title>
<style>
  @page {
    margin: 20mm 18mm;
    size: letter portrait;
  }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #111827;
    background: #ffffff;
    max-width: 760px;
    margin: 0 auto;
    padding: 30px;
  }
  .header {
    border-bottom: 2px solid #4f46e5;
    padding-bottom: 12px;
    margin-bottom: 24px;
  }
  h1 {
    margin: 0 0 4px 0;
    font-size: 18pt;
    color: #0f172a;
  }
  .date {
    font-size: 10pt;
    color: #64748b;
    margin-bottom: 16px;
  }
  .recipient {
    font-size: 10.5pt;
    color: #334155;
    margin-bottom: 20px;
    line-height: 1.4;
  }
  .body-content {
    font-size: 11pt;
  }
  .sign-off {
    margin-top: 24px;
    font-size: 11pt;
    color: #1e293b;
  }
  @media print {
    body {
      padding: 0;
    }
  }
</style>
</head>
<body>
  <div class="header">
    <h1>${candidateName}</h1>
    <div style="font-size: 10pt; color: #64748b;">Tailored Application for ${role} at ${company}</div>
  </div>

  <div class="date">${dateStr}</div>

  <div class="recipient">
    <strong>Hiring Team &amp; Engineering Leadership</strong><br/>
    ${company}<br/>
    Re: ${role} Position
  </div>

  <div class="body-content">
    ${formattedParagraphs}
  </div>

  <div class="sign-off">
    Sincerely,<br/>
    <strong>${candidateName}</strong>
  </div>
</body>
</html>`;
}

/**
 * Downloads cover letter as plain text (.txt).
 */
export function downloadCoverLetterAsTxt(
  letterText: string,
  company: string,
  candidateName = "Candidate"
) {
  const cleanName = candidateName.replace(/\s+/g, "_");
  const filename = `${cleanName}_Cover_Letter_${company.replace(/\s+/g, "_")}.txt`;
  triggerDownload(filename, letterText, "text/plain;charset=utf-8");
}

/**
 * Downloads cover letter as Word-compatible document (.doc).
 */
export function downloadCoverLetterAsDoc(
  letterText: string,
  company: string,
  role: string,
  candidateName = "Candidate"
) {
  const html = generateCoverLetterHTML(letterText, company, role, candidateName);
  const cleanName = candidateName.replace(/\s+/g, "_");
  const filename = `${cleanName}_Cover_Letter_${company.replace(/\s+/g, "_")}.doc`;
  triggerDownload(filename, html, "application/msword;charset=utf-8");
}

/**
 * Prints cover letter as PDF cleanly.
 */
export function printCoverLetterAsPDF(
  letterText: string,
  company: string,
  role: string,
  candidateName = "Candidate"
) {
  const html = generateCoverLetterHTML(letterText, company, role, candidateName);
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (doc) {
    doc.open();
    doc.write(html);
    doc.close();
    iframe.contentWindow?.focus();
    setTimeout(() => {
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 2000);
    }, 400);
  }
}

/**
 * Downloads application screening answers as plain text file (.txt).
 */
export function downloadAnswersAsTxt(
  answers: Array<{ question: string; suggestedAnswer: string }>,
  company: string,
  role: string
) {
  const lines: string[] = [];
  lines.push(`APPLICATION SCREENING ANSWERS`);
  lines.push(`Company: ${company}`);
  lines.push(`Role: ${role}`);
  lines.push(`Date: ${new Date().toLocaleDateString()}`);
  lines.push("=".repeat(50));
  lines.push("");

  answers.forEach((item, idx) => {
    lines.push(`QUESTION ${idx + 1}: ${item.question}`);
    lines.push("-".repeat(40));
    lines.push(item.suggestedAnswer);
    lines.push("");
  });

  const filename = `${company.replace(/\s+/g, "_")}_Screening_Answers.txt`;
  triggerDownload(filename, lines.join("\n"), "text/plain;charset=utf-8");
}
