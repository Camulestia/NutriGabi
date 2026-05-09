import Link from "next/link";
import { SearchX } from "lucide-react";

import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center px-4 py-10">
      <Card className="w-full p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-sage text-moss">
          <SearchX className="h-7 w-7" />
        </div>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight text-ink">Página não encontrada</h1>
        <p className="mt-3 text-sm leading-7 text-muted">
          O endereço pode ter sido alterado, removido ou você pode não ter permissão para visualizar esse conteúdo.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/" className={buttonStyles({})}>Ir para a visão geral</Link>
          <Link href="/patients" className={buttonStyles({ variant: "secondary" })}>Abrir pacientes</Link>
        </div>
      </Card>
    </div>
  );
}
