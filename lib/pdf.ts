import fs from "node:fs/promises";
import path from "node:path";

import { PDFDocument, type PDFFont, rgb, StandardFonts } from "pdf-lib";

const TEMPLATE_PATH = path.join(
  process.cwd(),
  "public",
  "templates",
  "certificate-template.pdf",
);

export type CertificateData = {
  userName: string;
  userCpf: string | null;
  courseTitle: string;
  courseDescription: string | null;
  workloadHours: number;
  score: number;
  issuedAt: Date;
  validationCode: string;
  validationUrl: string;
};

const MONTHS_PT = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

function formatDatePtBR(d: Date): string {
  return `${d.getDate()} de ${MONTHS_PT[d.getMonth()]} de ${d.getFullYear()}`;
}

function formatWorkload(hours: number): string {
  if (hours <= 0) return "—";
  if (hours === 1) return "1 Hora";
  return `${hours} Horas`;
}

function wrapTextByWidth(
  text: string,
  font: PDFFont,
  fontSize: number,
  maxWidth: number,
  maxLines: number,
): string[] {
  if (!text) return [];
  const words = text.replace(/\s+/g, " ").trim().split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    const w = font.widthOfTextAtSize(candidate, fontSize);
    if (w <= maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
      if (lines.length >= maxLines) break;
    }
  }
  if (current && lines.length < maxLines) lines.push(current);

  const joined = lines.join(" ");
  if (joined.length < text.length && lines.length > 0) {
    const last = lines[lines.length - 1]!;
    lines[lines.length - 1] = last.replace(/[.,;:]?\s*$/, "") + "...";
  }
  return lines;
}

// Coordenadas extraídas via pdfjs do template (842 × 595 pt).
// Cada placeholder tem: baseline (x,y) e a área a "apagar" antes de
// reescrever (mask).
const SLOTS = {
  name: {
    x: 131,
    y: 377,
    size: 30,
    mask: { x: 125, y: 374, w: 560, h: 42 },
  },
  courseTitle: {
    x: 131,
    y: 334,
    size: 21,
    mask: { x: 125, y: 331, w: 600, h: 28 },
  },
  durationLine: {
    x: 126,
    y: 310,
    size: 12,
    mask: { x: 120, y: 307, w: 600, h: 18 },
  },
  description: {
    x: 127,
    y: 237,
    size: 12,
    lineSpacing: 16,
    mask: { x: 120, y: 150, w: 620, h: 100 },
  },
  date: {
    x: 134,
    y: 43,
    size: 10,
    mask: { x: 128, y: 40, w: 220, h: 16 },
  },
  validationCode: {
    x: 667,
    y: 33,
    size: 8,
  },
};

export async function generateCertificatePdf(
  data: CertificateData,
): Promise<Buffer> {
  const templateBytes = await fs.readFile(TEMPLATE_PATH);
  const pdfDoc = await PDFDocument.load(templateBytes);
  const page = pdfDoc.getPages()[0];
  if (!page) {
    throw new Error("Template de certificado sem páginas.");
  }

  const fontSerifBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const fontSerif = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const fontSans = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontSansBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontMono = await pdfDoc.embedFont(StandardFonts.Courier);

  const dark = rgb(0.04, 0.07, 0.13);
  const muted = rgb(0.35, 0.41, 0.52);
  const white = rgb(1, 1, 1);

  const mask = (s: { x: number; y: number; w: number; h: number }) => {
    page.drawRectangle({
      x: s.x,
      y: s.y,
      width: s.w,
      height: s.h,
      color: white,
    });
  };

  // ============================================================
  // Nome (serif grande, posição exata do template)
  // ============================================================
  mask(SLOTS.name.mask);
  page.drawText(data.userName, {
    x: SLOTS.name.x,
    y: SLOTS.name.y,
    size: SLOTS.name.size,
    font: fontSerifBold,
    color: dark,
  });

  // ============================================================
  // Título do curso ("No curso de XXX")
  // ============================================================
  mask(SLOTS.courseTitle.mask);
  page.drawText(`No curso de ${data.courseTitle}`, {
    x: SLOTS.courseTitle.x,
    y: SLOTS.courseTitle.y,
    size: SLOTS.courseTitle.size,
    font: fontSerif,
    color: dark,
  });

  // ============================================================
  // Linha de duração: parte regular + workload em bold + parte regular
  // (espelha o estilo do template original)
  // ============================================================
  mask(SLOTS.durationLine.mask);
  const dy = SLOTS.durationLine.y;
  const dsize = SLOTS.durationLine.size;
  const part1 = "com duração de ";
  const part2 = formatWorkload(data.workloadHours);
  const part3 = ", abordando os seguintes temas:";
  const w1 = fontSans.widthOfTextAtSize(part1, dsize);
  const w2 = fontSansBold.widthOfTextAtSize(part2, dsize);
  page.drawText(part1, {
    x: SLOTS.durationLine.x,
    y: dy,
    size: dsize,
    font: fontSans,
    color: muted,
  });
  page.drawText(part2, {
    x: SLOTS.durationLine.x + w1,
    y: dy,
    size: dsize,
    font: fontSansBold,
    color: dark,
  });
  page.drawText(part3, {
    x: SLOTS.durationLine.x + w1 + w2,
    y: dy,
    size: dsize,
    font: fontSans,
    color: muted,
  });

  // ============================================================
  // Descrição do curso (substitui "Fale em poucas palavras...")
  // ============================================================
  mask(SLOTS.description.mask);
  if (data.courseDescription) {
    const maxWidth = 620;
    const descLines = wrapTextByWidth(
      data.courseDescription,
      fontSans,
      SLOTS.description.size,
      maxWidth,
      5,
    );
    let lineY = SLOTS.description.y;
    for (const line of descLines) {
      page.drawText(line, {
        x: SLOTS.description.x,
        y: lineY,
        size: SLOTS.description.size,
        font: fontSans,
        color: muted,
      });
      lineY -= SLOTS.description.lineSpacing;
    }
  }

  // ============================================================
  // Data (canto inferior esquerdo)
  // ============================================================
  mask(SLOTS.date.mask);
  page.drawText(formatDatePtBR(data.issuedAt), {
    x: SLOTS.date.x,
    y: SLOTS.date.y,
    size: SLOTS.date.size,
    font: fontSansBold,
    color: dark,
  });

  // ============================================================
  // Código de validação (canto inferior direito, abaixo do label)
  // ============================================================
  const code = data.validationCode;
  const codeWidth = fontMono.widthOfTextAtSize(code, SLOTS.validationCode.size);
  // Centraliza com o label "Código de Validação" (que está em x=667, w≈117)
  const labelCenter = 667 + 117 / 2;
  page.drawText(code, {
    x: labelCenter - codeWidth / 2,
    y: SLOTS.validationCode.y,
    size: SLOTS.validationCode.size,
    font: fontMono,
    color: muted,
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
