import Link from "next/link";
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  const redirectUrl = process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL || "/dashboard";

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="panel hidden rounded-[32px] border px-8 py-10 lg:flex lg:flex-col lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-moss">NutriConsulta IA</p>
            <h1 className="mt-4 max-w-md text-4xl font-semibold tracking-tight text-ink">
              Acesse seu ambiente clínico com segurança.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-muted">
              Entre para continuar com prontuários, consultas, agenda e planejamento alimentar em um só lugar.
            </p>
          </div>

          <div className="rounded-[28px] border border-[#caece6] bg-sage p-5">
            <p className="text-sm font-medium text-ink">Acesso protegido por autenticação</p>
            <p className="mt-2 text-sm leading-6 text-muted">
              Sua sessão continua isolada por usuário, assinatura e onboarding profissional.
            </p>
          </div>
        </section>

        <section className="panel flex flex-col items-center justify-center rounded-[32px] border px-4 py-6 sm:px-6 sm:py-8">
          <SignIn path="/sign-in" routing="path" signUpUrl="/sign-up" fallbackRedirectUrl={redirectUrl} />
          <p className="mt-5 max-w-md text-center text-xs leading-6 text-muted">
            Ao acessar, você concorda em usar a plataforma conforme os
            <Link href="/terms" className="mx-1 text-moss underline">Termos de Uso</Link>
            e a
            <Link href="/privacy" className="ml-1 text-moss underline">Política de Privacidade</Link>.
          </p>
        </section>
      </div>
    </div>
  );
}
