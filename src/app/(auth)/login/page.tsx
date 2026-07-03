"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Surface } from "@/components/ui/surface";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("registered") === "1") {
      setMessage("Tài khoản đã được tạo. Anh đăng nhập để vào CRM nhé.");
      const email = params.get("email");
      if (email) {
        const input = document.querySelector<HTMLInputElement>('input[name="email"]');
        if (input && !input.value) input.value = email;
      }
    }
  }, []);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const result = await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false
    });

    setLoading(false);

    if (result?.error) {
      setError("Email hoặc mật khẩu chưa đúng.");
      return;
    }

    const callbackUrl = new URLSearchParams(window.location.search).get("callbackUrl");
    router.push(callbackUrl ?? "/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Surface className="w-full max-w-md p-6">
        <div className="mb-6">
          <p className="text-sm font-medium text-primary">CRM</p>
          <h1 className="mt-2 text-2xl font-semibold">Đăng nhập</h1>
        </div>

        <form className="space-y-4" method="post" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mật khẩu</Label>
            <Input
              id="password"
              name="password"
              type="password"
              minLength={8}
              required
            />
          </div>

          {error ? <p className="text-sm text-danger">{error}</p> : null}
          {message ? <p className="text-sm text-success">{message}</p> : null}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </Button>
        </form>

        <div className="mt-5 flex items-center justify-between text-sm">
          <Link href="/forgot-password" className="text-primary">
            Quên mật khẩu
          </Link>
          <Link href="/register" className="text-primary">
            Tạo tài khoản
          </Link>
        </div>
      </Surface>
    </main>
  );
}
