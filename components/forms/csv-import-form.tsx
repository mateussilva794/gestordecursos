"use client";

import { useState, useTransition } from "react";

import { importUsersFromCsv } from "@/app/(admin)/admin/usuarios/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const SAMPLE = `name,email,department,position,role,cpf
Maria Silva,maria.silva@dacto.com.br,Contábil,Assistente Contábil,COLABORADOR,
João Pereira,joao.pereira@dacto.com.br,Fiscal,Analista Fiscal,COLABORADOR,123.456.789-09`;

type ImportSuccess = {
  ok: true;
  created: number;
  skipped: number;
  errors: { line: number; reason: string }[];
};
type ImportError = { ok: false; message: string };
type ImportResult = ImportSuccess | ImportError;

export function CsvImportForm() {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ImportResult | null>(null);
  const [csv, setCsv] = useState("");

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setResult(null);
    startTransition(async () => {
      const r = await importUsersFromCsv(csv);
      setResult(r as ImportResult);
    });
  }

  function fillSample() {
    setCsv(SAMPLE);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="csv">Conteúdo do CSV</Label>
        <Textarea
          id="csv"
          rows={12}
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          placeholder={SAMPLE}
          className="font-mono text-xs"
        />
        <p className="text-xs text-muted-foreground">
          Cabeçalho obrigatório: <code>name,email</code>. Opcionais:{" "}
          <code>department,position,role,cpf</code>. Aceita aspas duplas para
          campos com vírgula.
        </p>
      </div>

      {result ? (
        result.ok ? (
          <Alert>
            <AlertDescription>
              <strong>Importação concluída.</strong>
              <br />
              Criados: {result.created} · Já existentes (pulados):{" "}
              {result.skipped} · Erros: {result.errors.length}
              {result.errors.length > 0 ? (
                <ul className="mt-2 list-disc pl-5 text-xs">
                  {result.errors.slice(0, 20).map((err, i) => (
                    <li key={i}>
                      Linha {err.line}: {err.reason}
                    </li>
                  ))}
                  {result.errors.length > 20 ? (
                    <li>... e mais {result.errors.length - 20}</li>
                  ) : null}
                </ul>
              ) : null}
            </AlertDescription>
          </Alert>
        ) : (
          <Alert variant="destructive">
            <AlertDescription>{result.message}</AlertDescription>
          </Alert>
        )
      ) : null}

      <div className="flex gap-3">
        <Button type="submit" disabled={pending || csv.trim() === ""}>
          {pending ? "Importando..." : "Importar usuários"}
        </Button>
        <Button type="button" variant="outline" onClick={fillSample}>
          Preencher com exemplo
        </Button>
      </div>
    </form>
  );
}
