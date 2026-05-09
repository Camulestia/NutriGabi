import { prisma } from "@/lib/prisma";
import { jsonUtf8 } from "@/lib/api-response";

export const runtime = "nodejs";

export async function GET() {
  const timestamp = new Date().toISOString();

  if (!process.env.DATABASE_URL) {
    return jsonUtf8(
      {
        status: "error",
        database: "unconfigured",
        timestamp
      },
      { status: 503 }
    );
  }

  try {
    await prisma.$queryRaw`SELECT 1`;

    return jsonUtf8({
      status: "ok",
      database: "ok",
      timestamp
    });
  } catch {
    return jsonUtf8(
      {
        status: "error",
        database: "error",
        timestamp
      },
      { status: 503 }
    );
  }
}
