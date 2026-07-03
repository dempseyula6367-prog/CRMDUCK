"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Surface } from "@/components/ui/surface";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
      organizationName: formData.get("organizationName")
    };

    let response: Response;

    try {
      response = await fetchWithTimeout("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } catch {
      setLoading(false);
      setError("Kết nối đăng ký phản hồi quá lâu. Anh thử bấm lại một lần nữa nhé.");
      return;
    }

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setLoading(false);
      setError(body?.error ?? "Không tạo được tài khoản.");
      return;
    }

    setLoading(false);
    router.push(
      `/login?registered=1&email=${encodeURIComponent(String(payload.email ?? ""))}`
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Surface className="w-full max-w-md p-6">
        <div className="mb-6">
          <p className="text-sm font-medium text-primary">CRM</p>
          <h1 className="mt-2 text-2xl font-semibold">Tạo tài khoản</h1>
        </div>

        <form className="space-y-4" method="post" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="name">Họ tên</Label>
            <Input id="name" name="name" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="organizationName">Tên công ty</Label>
            <Input id="organizationName" name="organizationName" />
          </div>
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

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Đang tạo..." : "Tạo tài khoản"}
          </Button>
        </form>

        <p className="mt-5 text-sm text-muted-foreground">
          Đã có tài khoản?{" "}
          <Link href="/login" className="text-primary">
            Đăng nhập
          </Link>
        </p>
      </Surface>
    </main>
  );
}

async function fetchWithTimeout(url: string, init: RequestInit) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 15_000);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    window.clearTimeout(timeout);
  }
}
