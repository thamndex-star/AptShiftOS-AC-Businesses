import { handlePayFastGet, handlePayFastPost } from "@/lib/payfast-api";

export async function GET(request: Request) {
  return handlePayFastGet(request);
}

export async function POST(request: Request) {
  return handlePayFastPost(request);
}
