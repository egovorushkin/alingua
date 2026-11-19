import { Suspense } from "react";
import LoginForm from "@/components/auth/LoginForm";

async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return <LoginForm callbackError={Boolean(error)} />;
}

export default function LoginPage(props: PageProps<"/login">) {
  return <Suspense fallback={<p role="status" className="p-8 text-center font-bold">Готовим вход…</p>}><Login {...props} /></Suspense>;
}
