import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = { title: "Política de Privacidade" };

export default function PrivacidadePage() {
  return (
    <main className="container mx-auto max-w-3xl space-y-6 p-8">
      <div>
        <Link
          href="/login"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Voltar
        </Link>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Política de Privacidade
        </h1>
        <p className="text-sm text-muted-foreground">
          Versão preliminar. Substituir pelo texto aprovado pelo jurídico antes
          da produção.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>1. Quem somos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            A Dacto é uma empresa de contabilidade que opera esta plataforma
            interna para registro e certificação dos treinamentos realizados
            por seus colaboradores.
          </p>
          <p>
            O conteúdo dos cursos é hospedado pela Cefis e seguido fora desta
            plataforma; aqui registramos apenas o consumo do colaborador, suas
            tentativas no quiz interno e o certificado nominal emitido.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Dados coletados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>Coletamos os seguintes dados pessoais:</p>
          <ul className="list-disc space-y-1 pl-6">
            <li>Nome completo e email corporativo (obrigatórios).</li>
            <li>Cargo e departamento.</li>
            <li>CPF (opcional — apenas quando o colaborador fornece).</li>
            <li>
              Registros de acesso e uso da plataforma (login, conclusão de
              cursos, tentativas de quiz, certificados emitidos).
            </li>
            <li>
              Metadados técnicos: endereço IP, user-agent e timestamps das
              ações.
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>3. Bases legais (LGPD)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            O tratamento de dados é fundamentado em <strong>execução de
            contrato de trabalho</strong> e em <strong>obrigação legal</strong>{" "}
            (registro de capacitação obrigatória prevista em normas do CFC e
            CRC).
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>4. Direitos do titular</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>Como titular dos dados você tem direito a:</p>
          <ul className="list-disc space-y-1 pl-6">
            <li>
              Acessar e exportar seus dados (na tela <em>Perfil</em>, botão{" "}
              <em>Exportar meus dados</em>).
            </li>
            <li>Corrigir dados incorretos (entrando em contato com o RH).</li>
            <li>
              Solicitar anonimização: o registro de cursos e certificados
              permanece com snapshots, mas seu cadastro pessoal é apagado.
            </li>
            <li>
              Saber com quem compartilhamos seus dados — esta plataforma é
              interna; não compartilhamos com terceiros.
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>5. Retenção</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            Os dados de capacitação são preservados enquanto persistir a
            obrigação legal de comprovação (mínimo de 5 anos após emissão dos
            certificados). Após esse período, podem ser anonimizados a pedido.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>6. Contato</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            Dúvidas, solicitações ou denúncias de incidentes podem ser
            enviadas para o encarregado pelo tratamento de dados:{" "}
            <a
              href="mailto:dpo@dacto.com.br"
              className="text-primary underline-offset-4 hover:underline"
            >
              dpo@dacto.com.br
            </a>
            .
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
