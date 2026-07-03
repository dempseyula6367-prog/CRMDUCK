import { NextResponse } from "next/server";
import { ZodError } from "zod";

export class AppError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function created<T>(data: T) {
  return ok(data, 201);
}

export function empty(status = 204) {
  return new NextResponse(null, { status });
}

export function handleRouteError(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "Du lieu khong hop le.", issues: error.issues },
      { status: 400 }
    );
  }

  if (isDatabaseConnectivityError(error)) {
    return NextResponse.json(
      {
        error:
          "Chua ket noi duoc PostgreSQL. Vui long bat database va chay migrate truoc khi tao tai khoan."
      },
      { status: 503 }
    );
  }

  console.error(error);
  return NextResponse.json(
    { error: "Da co loi xay ra. Vui long thu lai." },
    { status: 500 }
  );
}

function isDatabaseConnectivityError(error: unknown) {
  if (!error || typeof error !== "object") return false;

  const maybeError = error as { code?: string; message?: string; name?: string };
  return (
    maybeError.code === "P1001" ||
    maybeError.name === "PrismaClientInitializationError" ||
    maybeError.message?.includes("Can't reach database server") === true ||
    maybeError.message?.includes("Error querying the database") === true
  );
}
