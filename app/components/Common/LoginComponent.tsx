"use client";

import { useEffect, useState } from "react";
import { ClientSafeProvider, getProviders, signIn } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";
import { FaFacebook, FaGithub, FaApple } from "react-icons/fa";
import { useLoginModal } from "@/lib/store";

type Props = {
  closeModal?: () => void;
};

const LoginComponent = ({ closeModal }: Props) => {
  const { onClose } = useLoginModal();
  const [providers, setProviders] = useState<Record<string, ClientSafeProvider> | null>(null);
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  useEffect(() => {
    const fetchProviders = async () => {
      const p = await getProviders();
      setProviders(p);
    };
    fetchProviders();
  }, []);

const handleSignIn = async (providerId: string) => {
  setLoadingProvider(providerId);

  try {
    const res = await signIn(providerId, {
      callbackUrl: "/",
      redirect: false,
    });

    if (!res) throw new Error("No response from NextAuth signIn");
    if (res.error) throw new Error(res.error);

    // סוגרים מודאלים רק אחרי שיש URL תקין
    onClose();
    closeModal?.();

    // מפעילים redirect בצורה ודאית
    window.location.assign(res.url ?? "/");
  } catch (error) {
    console.error("Login failed:", error);
  } finally {
    setLoadingProvider(null);
  }
};


  // פונקציה עזר להתאמת אייקון לספק
  const getProviderIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case "google":
        return <FcGoogle size={24} />;
      case "facebook":
        return <FaFacebook size={24} className="text-[#1877F2]" />;
      case "github":
        return <FaGithub size={24} className="text-black" />;
      case "apple":
        return <FaApple size={24} className="text-black" />;
      default:
        return null;
    }
  };

  if (!providers) {
    return (
      <div className="flex flex-col gap-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-[48px] w-full animate-pulse rounded-lg bg-slate-100" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {Object.values(providers).map((provider) => (
        <button
          key={provider.id}
          type="button"
          disabled={!!loadingProvider}
          onClick={() => handleSignIn(provider.id)}
          className={`
            flex min-h-[48px] w-full items-center justify-center gap-3 rounded-xl 
            bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 
            border border-slate-200 shadow-sm transition-all duration-200
            hover:bg-green-50 hover:border-green-200 hover:text-green-700
            focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          {loadingProvider === provider.id ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
          ) : (
            getProviderIcon(provider.name)
          )}
          <span>Continue with {provider.name}</span>
        </button>
      ))}
    </div>
  );
};

export default LoginComponent;