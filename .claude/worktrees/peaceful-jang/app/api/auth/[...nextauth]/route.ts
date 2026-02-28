import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { Adapter } from "next-auth/adapters";
import prisma from "@/lib/prisma";
import { NotificationPriority, NotificationStatus } from "@prisma/client";

const WELCOME_NOTIFICATION_TYPE = "WELCOME";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      allowDangerousEmailAccountLinking: true,
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID as string,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET as string,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET as string,
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  jwt: {
    secret: process.env.NEXTAUTH_JWT_SECRET as string,
  },

  /**
   * ✅ המקום הנכון לשלוח התראה ראשונה:
   * createUser רץ רק כשנוצר User חדש בדאטהבייס (פעם ראשונה בלבד).
   */
  events: {
    createUser: async ({ user }) => {
      const email = user.email ?? null;
      if (!email) return;

      try {
        // Idempotency: לא ליצור כפול (גם אם אירוע יקרה פעמיים במקרה נדיר)
        const exists = await prisma.notification.findFirst({
          where: { userEmail: email, type: WELCOME_NOTIFICATION_TYPE },
          select: { id: true },
        });

        if (exists) return;

        await prisma.notification.create({
          data: {
            userEmail: email,
            type: WELCOME_NOTIFICATION_TYPE,
            message:
              "Welcome to StarManag 👋 Start by browsing the menu, adding items to your cart, and completing your first order.",
            priority: NotificationPriority.NORMAL,
            status: NotificationStatus.UNREAD,
          },
        });
      } catch (err) {
        // חשוב: לא להפיל את ההתחברות אם יצירת ההתראה נכשלה
        console.error("[NextAuth][createUser] failed to create welcome notification:", err);
      }
    },
  },

  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
