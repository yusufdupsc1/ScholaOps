import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import * as bcrypt from "bcryptjs";
import { db } from "@/lib/db";

const AUTH_SECRETS = [
  process.env.AUTH_SECRET,
  process.env.NEXTAUTH_SECRET,
].filter((secret): secret is string => Boolean(secret));

const ALLOW_DEMO_LOGIN = process.env.ALLOW_DEMO_LOGIN !== "false";

const DEMO_INSTITUTION = {
  slug: "scholaops-demo",
  name: "scholaOps Academy",
  email: "admin@school.edu",
  city: "Dhaka",
  country: "BD",
  timezone: "Asia/Dhaka",
  currency: "BDT",
};

const DEMO_USERS = [
  {
    email: "admin@school.edu",
    password: "admin123",
    name: "Alex Admin",
    role: "ADMIN",
  },
  {
    email: "principal@school.edu",
    password: "principal123",
    name: "Dr. Sarah Chen",
    role: "PRINCIPAL",
  },
] as const;

async function provisionDemoUserIfNeeded(email: string, password: string) {
  if (!ALLOW_DEMO_LOGIN) return null;

  const demoUser = DEMO_USERS.find(
    (candidate) => candidate.email === email && candidate.password === password,
  );
  if (!demoUser) return null;

  const institution = await db.institution.upsert({
    where: { slug: DEMO_INSTITUTION.slug },
    update: {
      name: DEMO_INSTITUTION.name,
      email: DEMO_INSTITUTION.email,
      city: DEMO_INSTITUTION.city,
      country: DEMO_INSTITUTION.country,
      timezone: DEMO_INSTITUTION.timezone,
      currency: DEMO_INSTITUTION.currency,
      isActive: true,
    },
    create: {
      name: DEMO_INSTITUTION.name,
      slug: DEMO_INSTITUTION.slug,
      email: DEMO_INSTITUTION.email,
      city: DEMO_INSTITUTION.city,
      country: DEMO_INSTITUTION.country,
      timezone: DEMO_INSTITUTION.timezone,
      currency: DEMO_INSTITUTION.currency,
    },
  });

  const hashedPassword = await bcrypt.hash(demoUser.password, 12);
  const user = await db.user.upsert({
    where: { email: demoUser.email },
    update: {
      name: demoUser.name,
      password: hashedPassword,
      role: demoUser.role,
      isActive: true,
      emailVerified: new Date(),
      institutionId: institution.id,
    },
    create: {
      name: demoUser.name,
      email: demoUser.email,
      password: hashedPassword,
      role: demoUser.role,
      isActive: true,
      emailVerified: new Date(),
      institutionId: institution.id,
    },
    include: { institution: { select: { name: true, slug: true } } },
  });

  return user;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

async function uniqueInstitutionSlug(base: string) {
  let slug = slugify(base) || "institution";
  let i = 1;
  while (await db.institution.findUnique({ where: { slug } })) {
    slug = `${slugify(base) || "institution"}-${i++}`;
  }
  return slug;
}

async function upsertGoogleUserContext(user: {
  email: string;
  name?: string | null;
  image?: string | null;
}) {
  const normalizedEmail = user.email.trim().toLowerCase();
  const localPart = normalizedEmail.split("@")[0] || "school-admin";
  const domain = normalizedEmail.split("@")[1] || "school.edu";
  const inferredInstitutionName = `${domain.split(".")[0] || "School"} Institution`;

  let dbUser = await db.user.findUnique({
    where: { email: normalizedEmail },
    include: { institution: { select: { name: true, slug: true } } },
  });

  if (!dbUser) {
    const institutionSlug = await uniqueInstitutionSlug(
      `${domain.split(".")[0]}-school`,
    );
    const institution = await db.institution.create({
      data: {
        name: inferredInstitutionName,
        slug: institutionSlug,
        email: normalizedEmail,
        country: "BD",
        timezone: "Asia/Dhaka",
        currency: "BDT",
      },
    });

    await db.institutionSettings.upsert({
      where: { institutionId: institution.id },
      update: {},
      create: {
        institutionId: institution.id,
        academicYear: "2026-2027",
        termsPerYear: 3,
        emailNotifs: true,
      },
    });

    dbUser = await db.user.create({
      data: {
        email: normalizedEmail,
        name: user.name?.trim() || localPart,
        image: user.image ?? null,
        role: "SUPER_ADMIN",
        emailVerified: new Date(),
        isActive: true,
        institutionId: institution.id,
      },
      include: { institution: { select: { name: true, slug: true } } },
    });
  } else {
    dbUser = await db.user.update({
      where: { id: dbUser.id },
      data: {
        name: user.name?.trim() || dbUser.name,
        image: user.image ?? dbUser.image,
        lastLoginAt: new Date(),
        isActive: true,
      },
      include: { institution: { select: { name: true, slug: true } } },
    });
  }

  return dbUser;
}

const providers: any[] = [
  Credentials({
    name: "Credentials",
    credentials: {
      institution: { label: "Institution", type: "text" },
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      const institutionInput = credentials?.institution;
      const email = credentials?.email;
      const password = credentials?.password;

      if (
        !email ||
        !password ||
        typeof email !== "string" ||
        typeof password !== "string"
      ) {
        return null;
      }

      const normalizedInstitution =
        typeof institutionInput === "string"
          ? institutionInput.trim().toLowerCase()
          : "";
      const normalizedEmail = email.trim().toLowerCase();
      let user = await db.user.findFirst({
        where: {
          email: { equals: normalizedEmail, mode: "insensitive" },
          ...(normalizedInstitution && {
            institution: {
              slug: { equals: normalizedInstitution, mode: "insensitive" },
            },
          }),
        },
        include: { institution: { select: { name: true, slug: true } } },
      });

      // Backward compatibility for accounts stored with mixed-case email.
      if (!user) {
        user = await db.user.findFirst({
          where: {
            email: { equals: normalizedEmail, mode: "insensitive" },
            ...(normalizedInstitution && {
              institution: {
                slug: { equals: normalizedInstitution, mode: "insensitive" },
              },
            }),
          },
          include: { institution: { select: { name: true, slug: true } } },
        });
      }

      if (user?.password && user.isActive && user.institution) {
        if (!user.institution.slug) return null;
        const isValid = await bcrypt.compare(password, user.password);
        if (isValid) {
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            role: user.role,
            institutionId: user.institutionId,
            institutionName: user.institution.name,
            institutionSlug: user.institution.slug,
          };
        }
      }

      if (normalizedInstitution && normalizedInstitution !== DEMO_INSTITUTION.slug) {
        return null;
      }

      user = await provisionDemoUserIfNeeded(normalizedEmail, password);
      if (!user?.password || !user.isActive) return null;

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
        institutionId: user.institutionId,
        institutionName: user.institution.name,
        institutionSlug: user.institution.slug,
      };
    },
  }),
];

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  );
}

const authConfig: any = {
  secret: AUTH_SECRETS.length > 1 ? AUTH_SECRETS : AUTH_SECRETS[0],
  session: { strategy: "jwt" },
  pages: { signIn: "/auth/login" },
  providers,
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google") return true;

      const email = user.email?.trim().toLowerCase();
      if (!email) return false;

      try {
        const dbUser = await upsertGoogleUserContext({
          email,
          name: user.name,
          image: user.image,
        });

        (user as any).id = dbUser.id;
        (user as any).role = dbUser.role;
        (user as any).institutionId = dbUser.institutionId;
        (user as any).institutionName = dbUser.institution.name;
        (user as any).institutionSlug = dbUser.institution.slug;
        return true;
      } catch (error) {
        console.error("[AUTH_GOOGLE_SIGNIN]", error);
        return false;
      }
    },
    async jwt({ token, user }) {
      if (user) {
        const typedUser = user as {
          role?: string;
          institutionId?: string;
          institutionName?: string;
          institutionSlug?: string;
        };

        (token as any).role = typedUser.role;
        (token as any).institutionId = typedUser.institutionId;
        (token as any).institutionName = typedUser.institutionName;
        (token as any).institutionSlug = typedUser.institutionSlug;
      }

      if (!(token as any).institutionId && token.email) {
        const dbUser = await db.user.findUnique({
          where: { email: token.email },
          include: { institution: { select: { name: true, slug: true } } },
        });

        if (dbUser) {
          (token as any).role = dbUser.role;
          (token as any).institutionId = dbUser.institutionId;
          (token as any).institutionName = dbUser.institution.name;
          (token as any).institutionSlug = dbUser.institution.slug;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.sub;
        (session.user as { role?: string }).role = (token as any)
          .role as string;
        (session.user as { institutionId?: string }).institutionId = (
          token as any
        ).institutionId as string;
        (session.user as { institutionName?: string }).institutionName = (
          token as any
        ).institutionName as string;
        (session.user as { institutionSlug?: string }).institutionSlug = (
          token as any
        ).institutionSlug as string;
      }
      return session;
    },
  },
};

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth(authConfig);
