import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import React from "react";

// Cores da marca Dacto — sincronizadas com app/globals.css (--primary)
const BRAND_PRIMARY = "#0d3b85";
const BRAND_ACCENT = "#1e5fbf";

const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
  },
  brandBand: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 12,
    backgroundColor: BRAND_PRIMARY,
  },
  border: {
    borderWidth: 2,
    borderColor: BRAND_PRIMARY,
    padding: 40,
    flexGrow: 1,
  },
  brandTag: {
    fontSize: 10,
    color: BRAND_ACCENT,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 4,
    textAlign: "center",
    marginBottom: 6,
  },
  header: {
    textAlign: "center",
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontFamily: "Helvetica-Bold",
    color: BRAND_PRIMARY,
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 8,
  },
  intro: {
    fontSize: 12,
    color: "#475569",
    marginTop: 30,
    textAlign: "center",
  },
  name: {
    fontSize: 24,
    fontFamily: "Helvetica-Bold",
    color: BRAND_PRIMARY,
    textAlign: "center",
    marginTop: 16,
  },
  cpf: {
    fontSize: 11,
    color: "#64748b",
    textAlign: "center",
    marginTop: 4,
  },
  body: {
    fontSize: 12,
    color: "#475569",
    textAlign: "center",
    marginTop: 30,
    lineHeight: 1.6,
  },
  course: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: BRAND_PRIMARY,
    textAlign: "center",
    marginTop: 12,
  },
  meta: {
    fontSize: 11,
    color: "#64748b",
    textAlign: "center",
    marginTop: 6,
  },
  validation: {
    marginTop: 28,
    padding: 12,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#f8fafc",
  },
  validationLabel: {
    fontSize: 9,
    color: "#64748b",
    textAlign: "center",
  },
  validationCode: {
    fontSize: 11,
    color: BRAND_PRIMARY,
    textAlign: "center",
    fontFamily: "Courier",
    marginTop: 3,
  },
  validationUrl: {
    fontSize: 9,
    color: "#64748b",
    textAlign: "center",
    marginTop: 3,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 50,
    right: 50,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 9,
    color: "#94a3b8",
  },
});

function formatCpf(cpf: string): string {
  const d = cpf.replace(/\D/g, "");
  if (d.length !== 11) return cpf;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

export type CertificateDocumentProps = {
  userName: string;
  userCpf: string | null;
  courseTitle: string;
  workloadHours: number;
  score: number;
  issuedAt: Date;
  validationCode: string;
  validationUrl: string;
};

export function CertificateDocument(props: CertificateDocumentProps) {
  const {
    userName,
    userCpf,
    courseTitle,
    workloadHours,
    score,
    issuedAt,
    validationCode,
    validationUrl,
  } = props;

  return (
    <Document title={`Certificado — ${userName}`}>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.brandBand} fixed />
        <View style={styles.border}>
          <Text style={styles.brandTag}>DACTO</Text>
          <View style={styles.header}>
            <Text style={styles.title}>CERTIFICADO</Text>
            <Text style={styles.subtitle}>
              Plataforma Interna de Treinamentos
            </Text>
          </View>

          <Text style={styles.intro}>Certificamos que</Text>
          <Text style={styles.name}>{userName}</Text>
          {userCpf ? (
            <Text style={styles.cpf}>CPF: {formatCpf(userCpf)}</Text>
          ) : null}

          <Text style={styles.body}>
            concluiu com aproveitamento o curso interno
          </Text>
          <Text style={styles.course}>{courseTitle}</Text>
          <Text style={styles.meta}>
            Carga horária: {workloadHours}h · Nota: {score}% · Concluído em{" "}
            {issuedAt.toLocaleDateString("pt-BR")}
          </Text>

          <View style={styles.validation}>
            <Text style={styles.validationLabel}>
              Código de validação
            </Text>
            <Text style={styles.validationCode}>{validationCode}</Text>
            <Text style={styles.validationUrl}>
              Valide em: {validationUrl}
            </Text>
          </View>
        </View>

        <View style={styles.footer} fixed>
          <Text>Emitido em {issuedAt.toLocaleString("pt-BR")}</Text>
          <Text>Documento interno — uso restrito</Text>
        </View>
      </Page>
    </Document>
  );
}
