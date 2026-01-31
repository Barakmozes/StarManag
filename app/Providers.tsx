"use client";

import React, { useMemo } from "react";
import {
  UrqlProvider,
  ssrExchange,
  cacheExchange,
  fetchExchange,
  createClient,
} from "@urql/next";
import AuthModal from "./components/Common/AuthModal";
import { Toaster } from "react-hot-toast";

type ProviderProps = {
  children: React.ReactNode;
  graphqlApiKey?: string; // ✅ optional (won't break)
};

const Providers = ({ children }: ProviderProps) => {
  const [client, ssr] = useMemo(() => {
    const graphql_api = process.env.NEXT_PUBLIC_GRAPHQL_API as string;

    // ✅ correct SSR exchange config
    const ssr = ssrExchange({ isClient: typeof window !== "undefined" });

    const client = createClient({
      url: graphql_api,
      exchanges: [cacheExchange, ssr, fetchExchange],
      // אם תרצה להחזיר auth בעתיד:
            // disable this in development for you to be able to access your sandbox
      // fetchOptions: () => ({
      //   headers: graphqlApiKey ? { authorization: `Bearer ${graphqlApiKey}` } : {},
      // }),
    });

    return [client, ssr] as const;
  }, []);

  return (
    <UrqlProvider client={client} ssr={ssr}>
      <Toaster />
      <AuthModal />
      {children}
    </UrqlProvider>
  );
};

export default Providers;
