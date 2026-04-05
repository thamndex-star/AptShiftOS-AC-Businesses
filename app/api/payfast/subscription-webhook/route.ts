import { handleNotify } from "@/lib/payfast-api";

export async function POST(request: Request) {
  return handleNotify(request);
}
