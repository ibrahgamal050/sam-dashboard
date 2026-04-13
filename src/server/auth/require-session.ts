import { NextResponse, type NextRequest } from "next/server";
import { getMeelzaUser } from "@/lib/auth/meelza-session";

type AuthHandlerParams<P extends Record<string, string> = Record<string, string>> = {
  req: NextRequest;
  params: P;
  auth: { user: any };
};

type AuthHandler<P extends Record<string, string> = Record<string, string>> = (
  params: AuthHandlerParams<P>
) => Promise<Response> | Response;

export const requireServerAuth = <P extends Record<string, string> = Record<string, string>>(
  handler: AuthHandler<P>
) => {
  return async (
    req: NextRequest,
    context: { params: Promise<P> }
  ) => {
    const params = await context.params;
    const user = await getMeelzaUser();

    if (!user) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    return handler({ req, params, auth: { user } });
  };
};
