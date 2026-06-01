import Link from "next/link";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = { title: "Termos de Uso" };

export default function TermosPage() {
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
          Termos de Uso
        </h1>
        <p className="text-sm text-muted-foreground">
          Versão preliminar. Substituir pelo texto aprovado pelo jurídico antes
          da produção.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>1. Objeto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            Esta plataforma é de uso exclusivo dos colaboradores da Dacto para
            gestão interna de treinamentos. Não é um serviço público — o acesso
            depende de credenciais individuais fornecidas pelo RH.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Conta e credenciais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <ul className="list-disc space-y-1 pl-6">
            <li>
              Cada colaborador recebe um convite por email e define sua própria
              senha.
            </li>
            <li>
              Não compartilhe sua senha com outras pessoas. Senhas trocadas
              encerram automaticamente sessões em outros dispositivos.
            </li>
            <li>
              Após 5 tentativas de login com senha errada, a conta fica
              bloqueada por 15 minutos.
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>3. Uso correto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <ul className="list-disc space-y-1 pl-6">
            <li>
              Os certificados emitidos têm <strong>validade interna</strong>{" "}
              (uso para registros de capacitação do escritório). Não substituem
              certificados oficiais para fins externos.
            </li>
            <li>
              É vedado tentar burlar o quiz, compartilhar gabaritos, ou
              fazer quiz no lugar de outra pessoa.
            </li>
            <li>
              Toda atividade é auditada (login, conclusão, downloads). O uso
              indevido pode levar a sanções disciplinares.
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>4. Conteúdo de terceiros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            Os cursos em si são hospedados pela Cefis (parceira). Esta
            plataforma apenas registra o consumo e a validação por quiz
            interno. A Dacto não se responsabiliza pela disponibilidade ou
            conteúdo da Cefis.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>5. Disposições gerais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            Estes termos podem ser atualizados periodicamente. Mudanças
            relevantes serão comunicadas pelo RH. O uso continuado da plataforma
            após mudanças implica aceitação.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
