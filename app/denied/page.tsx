import Link from "next/link";
import { ShieldAlert } from "lucide-react";

import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function DeniedPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center px-4 py-10">
      <Card className="w-full p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-[#fff7eb] text-[#b45309]">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight text-ink">Acesso negado</h1>
        <p className="mt-3 text-sm leading-7 text-muted">
          Você não tem permissão para acessar este recurso com a sessão atual. Se isso parece incorreto, revise sua conta ou tente novamente após autenticar.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/" className={buttonStyles({ variant: "secondary" })}>Voltar ao dashboard</Link>
          <Link href="/sign-in" className={buttonStyles({})}>Entrar novamente</Link>
        </div>
      </Card>
    </div>
  );
}
