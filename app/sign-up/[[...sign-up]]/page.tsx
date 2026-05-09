import Link from "next/link";
import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  const redirectUrl = process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL || "/onboarding";

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="panel hidden rounded-[32px] border px-8 py-10 lg:flex lg:flex-col lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-moss">NutriConsulta IA</p>
            <h1 className="mt-4 max-w-md text-4xl font-semibold tracking-tight text-ink">
              Crie seu acesso e entre no dashboard clínico.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-muted">
              O cadastro libera o ambiente privado do sistema para prontuários, evolução de pacientes e relatórios.
            </p>
          </div>

          <div className="rounded-[28px] border border-[#caece6] bg-sage p-5">
            <p className="text-sm font-medium text-ink">Fluxo seguro para dados clínicos</p>
            <p className="mt-2 text-sm leading-6 text-muted">
              Apenas usuários autenticados passam a visualizar os dados do aplicativo.
            </p>
          </div>
        </section>

        <section className="panel flex flex-col items-center justify-center rounded-[32px] border px-4 py-6 sm:px-6 sm:py-8">
          <SignUp path="/sign-up" routing="path" signInUrl="/sign-in" fallbackRedirectUrl={redirectUrl} />
          <p className="mt-5 max-w-md text-center text-xs leading-6 text-muted">
            Ao continuar, você seguirá para um onboarding com aceite obrigatório dos
            <Link href="/terms" className="mx-1 text-moss underline">Termos de Uso</Link>
            e da
            <Link href="/privacy" className="ml-1 text-moss underline">Política de Privacidade</Link>.
          </p>
        </section>
      </div>
    </div>
  );
}
