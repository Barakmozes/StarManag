import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";
import { authOptions } from "../auth/[...nextauth]/route";
import prisma from "../../../lib/prisma";

// This function prohibits a client without apiKey to access our graphql endpoint
function validateGraphApiKey(request: NextRequest): boolean {
  const expectedApiKey = process.env.GRAPHQL_API_KEY;

  // Check if the API key is in the request headers
  const apiKeyFromHeaders = request.headers.get("Authorization");

  // Check if the API key is in the request query parameters (e.g., apiKey=your-api-key)
  const apiKeyFromQuery = new URL(request.url).searchParams.get("apiKey");

  // Validate the API key
  return (
    apiKeyFromHeaders === `Bearer ${expectedApiKey}` ||
    apiKeyFromQuery === expectedApiKey
  );
}

export async function createContext({ req }: { req: NextRequest }) {
  // // Disable this function when testing in Apollo SandBox
  if (!validateGraphApiKey(req)) {
    throw new Error("Unauthorized: No Access");
  }

  const session = await getServerSession(authOptions);

  return {
    prisma,
    user: session?.user,
  };
}
