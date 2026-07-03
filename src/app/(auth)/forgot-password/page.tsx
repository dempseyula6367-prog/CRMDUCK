"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Surface } from "@/components/ui/surface";

export default function ForgotPasswordPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const formData = new FormData(event.currentTarget);

    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: formData.get("email") })
    });

    setLoading(false);
    setMessage("Nếu email tồn tại, hướng dẫn đặt lại mật khẩu sẽ được gửi.");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Surface className="w-full max-w-md p-6">
        <div className="mb-6">
          <p className="text-sm font-medium text-primary">CRM</p>
          <h1 className="mt-2 text-2xl font-semibold">Quên mật khẩu</h1>
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>

          {message ? <p className="text-sm text-success">{message}</p> : null}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Đang gửi..." : "Gửi hướng dẫn"}
          </Button>
        </form>

        <Link href="/login" className="mt-5 block text-sm text-primary">
          Quay lại đăng nhập
        </Link>
      </Surface>
    </main>
  );
}
