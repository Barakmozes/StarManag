# StarManag — Code Patterns Reference

Concrete examples pulled from the actual codebase. Follow these when extending the system.

---

## 1. GraphQL Domain Structure

### Domain Barrel (`index.ts`)

```typescript
// graphql/schema/<Domain>/index.ts
import './queries';
import './mutations';
```

### Prisma Object + Queries (`queries.ts`)

```typescript
import prisma from "@/lib/prisma";
import { GraphQLError } from "graphql";
import { builder } from "@/graphql/builder";

// Define Prisma object type
builder.prismaObject("ModelName", {
  fields: (t) => ({
    id: t.exposeString("id"),
    name: t.exposeString("name"),
    optional: t.exposeString("optional", { nullable: true }),
    count: t.exposeInt("count"),
    price: t.exposeFloat("price"),
    active: t.exposeBoolean("active"),
    tags: t.exposeStringList("tags"),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    jsonField: t.expose("jsonField", { type: "JSON", nullable: true }),
    relation: t.relation("relation"),
    optionalRelation: t.relation("optionalRelation", { nullable: true }),
    enumField: t.expose("status", { type: StatusEnum }),
  }),
});

// Single item query
builder.queryFields((t) => ({
  getItem: t.prismaField({
    type: "ModelName",
    args: { id: t.arg.string({ required: true }) },
    resolve: async (query, _parent, args, contextPromise) => {
      const context = await contextPromise;
      if (!context.user) throw new GraphQLError("You must be logged in");

      const item = await prisma.modelName.findFirst({
        ...query,
        where: { id: args.id },
      });
      if (!item) throw new GraphQLError("Item not found");
      return item;
    },
  }),

  // Paginated list (Relay cursor connection)
  getItems: t.prismaConnection({
    type: "ModelName",
    cursor: "id",
    defaultSize: 8,
    maxSize: 50,
    args: { search: t.arg.string() },
    resolve: async (query, _parent, args, contextPromise) => {
      const context = await contextPromise;
      return prisma.modelName.findMany({
        ...query,
        where: args.search
          ? { name: { contains: args.search, mode: "insensitive" } }
          : {},
        orderBy: { createdAt: "desc" },
      });
    },
  }),
}));
```

### Mutations with Auth (`mutations.ts`)

```typescript
import prisma from "@/lib/prisma";
import { GraphQLError } from "graphql";
import { builder } from "@/graphql/builder";

builder.mutationFields((t) => ({
  createItem: t.prismaField({
    type: "ModelName",
    args: {
      name: t.arg.string({ required: true }),
      price: t.arg.float({ required: true }),
      optionalNote: t.arg.string(),
    },
    resolve: async (query, _parent, args, contextPromise) => {
      const context = await contextPromise;

      // Role check — always do this for protected mutations
      if (context.user?.role !== "ADMIN") {
        throw new GraphQLError("You don't have permission to perform this action");
      }

      // Duplicate check pattern
      const existing = await prisma.modelName.findFirst({
        ...query,
        where: { name: args.name },
      });
      if (existing) throw new GraphQLError("Already exists");

      return prisma.modelName.create({
        ...query,
        data: {
          name: args.name,
          price: args.price,
          note: args.optionalNote ?? undefined,
        },
      });
    },
  }),

  updateItem: t.prismaField({
    type: "ModelName",
    args: {
      id: t.arg.string({ required: true }),
      name: t.arg.string({ required: true }),
    },
    resolve: async (_query, _parent, args, contextPromise) => {
      const context = await contextPromise;
      if (!context.user) throw new GraphQLError("You must be logged in");

      return prisma.modelName.update({
        where: { id: args.id },
        data: { name: args.name },
      });
    },
  }),
}));
```

### Registering a New Domain

Add import to `graphql/schema/index.ts`:

```typescript
import "./NewDomain";
```

The `builder.toSchema({})` call at the bottom picks it up automatically.

---

## 2. Input Types (for complex mutations)

```typescript
const UpdateManyTablesInput = builder.inputType("UpdateManyTablesInput", {
  fields: (t) => ({
    id: t.string({ required: true }),
    tableNumber: t.int({ required: true }),
    diners: t.int({ required: true }),
    reserved: t.boolean({ required: true }),
    areaId: t.string({ required: true }),
    position: t.field({ type: "JSON", required: true }),
    specialRequests: t.stringList({ required: true }),
  }),
});

// Usage in mutation
builder.mutationFields((t) => ({
  updateManyTables: t.field({
    type: ["Table"],
    args: {
      updates: t.arg({ type: [UpdateManyTablesInput], required: true }),
    },
    resolve: async (_parent, args, contextPromise) => {
      const context = await contextPromise;
      if (!["ADMIN", "MANAGER"].includes(context.user?.role ?? "")) {
        throw new GraphQLError("Not authorized");
      }
      // Batch update with Promise.all
      return Promise.all(
        args.updates.map((update) =>
          prisma.table.update({
            where: { id: update.id },
            data: { ...update },
          })
        )
      );
    },
  }),
}));
```

---

## 3. Enum Definition Pattern

```typescript
// graphql/schema/<Domain>/enum.ts
import { builder } from "@/graphql/builder";

export const OrderStatusEnum = builder.enumType("OrderStatusEnum", {
  values: [
    "PREPARING", "UNASSIGNED", "COLLECTED", "DELIVERED",
    "PENDING", "READY", "SERVED", "COMPLETED", "CANCELLED",
  ] as const,
});
```

---

## 4. Builder Configuration Reference

```typescript
// graphql/builder.ts
import SchemaBuilder from "@pothos/core";
import PrismaPlugin from "@pothos/plugin-prisma";
import RelayPlugin from "@pothos/plugin-relay";
import { DateTimeResolver, JSONResolver } from "graphql-scalars";
import type PrismaTypes from "@pothos/plugin-prisma/generated";

export const builder = new SchemaBuilder<{
  PrismaTypes: PrismaTypes;
  Context: Awaited<ReturnType<typeof createContext>>;
  Scalars: {
    DateTime: { Input: Date; Output: Date };
    JSON: { Input: any; Output: any };
  };
}>({
  plugins: [PrismaPlugin, RelayPlugin],
  relayOptions: {},
  prisma: { client: prisma },
});

builder.queryType({});
builder.mutationType({});
builder.addScalarType("DateTime", DateTimeResolver, {});
builder.addScalarType("JSON", JSONResolver, {});
```

---

## 5. GraphQL Context

```typescript
// app/api/graphql/context.ts
export async function createContext({ req }: { req: NextRequest }) {
  if (!validateGraphApiKey(req)) {
    throw new Error("Unauthorized: No Access");
  }
  const session = await getServerSession(authOptions);
  return { prisma, user: session?.user };
}
```

In resolvers, **always** await context:

```typescript
const context = await contextPromise;
```

---

## 6. Server Component Page Pattern

```typescript
// app/(section)/page.tsx — ALWAYS a server component
import { getCurrentUser } from "@/lib/session";
import { User } from "@prisma/client";
import ClientSection from "./ClientSection";

export default async function Page() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return <div>Unauthorized</div>;
  }
  return <ClientSection user={user as User} />;
}
```

---

## 7. Client Component Pattern

```typescript
// ClientSection.tsx
"use client";

import { User } from "@prisma/client";
import { useQuery, useMutation } from "urql";
import { GetItemsDocument, AddItemDocument } from "@/graphql/generated";

interface Props {
  user: User;
}

export default function ClientSection({ user }: Props) {
  const [{ data, fetching }] = useQuery({ query: GetItemsDocument });
  const [, executeMutation] = useMutation(AddItemDocument);

  const handleAdd = async () => {
    const result = await executeMutation({ name: "New Item" });
    if (result.error) {
      toast.error(result.error.message);
    }
  };

  return (/* JSX */);
}
```

---

## 8. Zustand Store Patterns

### Global Store with Persist

```typescript
// lib/store.ts
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

export const useCartStore = create<CartType & CartActionTypes>()(
  devtools(
    persist(
      (set, get) => ({
        menus: [],
        tableId: undefined,
        tableNumber: undefined,

        addToCart(item) { /* normalize prices, then add/increment */ },
        resetCart() { set(INITIAL_STATE); },
        startOrderForTable(tableId, tableNumber) {
          set({ ...INITIAL_STATE, tableId, tableNumber });
        },
      }),
      {
        name: "You&i_cart",
        skipHydration: true,
        onRehydrateStorage: () => (state) => {
          state?.syncCartPrices?.();
        },
      }
    )
  )
);
```

### Restaurant Floor Store (with dirty-state merge)

```typescript
// lib/AreaStore.ts
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

export const useRestaurantStore = create<AreaStore>()(
  persist(
    devtools((set, get) => ({
      selectedArea: null,
      areas: [],
      scale: 1,
      tables: [],

      setAreas: (fetchedAreas) => set({ areas: fetchedAreas }),
      setSelectedArea: (areaIdOrName) => { /* find and set */ },

      // CRITICAL: merge preserves dirty local positions
      setTables: (fetched) => set((state) => {
        const merged = fetched.map((serverTable) => {
          const local = state.tables.find((t) => t.id === serverTable.id);
          if (local?.dirty) {
            return { ...serverTable, position: local.position, areaId: local.areaId, dirty: true };
          }
          return { ...serverTable, dirty: false };
        });
        return { tables: merged };
      }),

      moveTable: (tableId, newAreaId, newPosition) => {
        set((state) => ({
          tables: state.tables.map((t) =>
            t.id === tableId ? { ...t, areaId: newAreaId, position: newPosition, dirty: true } : t
          ),
        }));
      },

      markTablesClean: (tableIds) => { /* reset dirty flags */ },
    })),
    { name: "restaurant-areas", skipHydration: true }
  )
);
```

Key conventions:
- Always wrap with `devtools` + `persist`
- Use `skipHydration: true` to avoid SSR/CSR mismatch
- Types from `@/graphql/generated` or `@/types`

---

## 9. .graphql Document Pattern

```graphql
# graphql/files/menu.graphql

query GetMenus($first: Int, $after: String) {
  getMenus(first: $first, after: $after) {
    edges {
      cursor
      node {
        id
        title
        price
        sellingPrice
        image
        category
        onPromo
        prepType
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}

mutation AddMenu(
  $title: String!
  $shortDescr: String!
  $longDescr: String!
  $price: Float!
  $image: String!
  $category: String!
  $prepType: [String!]!
) {
  addMenu(
    title: $title
    shortDescr: $shortDescr
    longDescr: $longDescr
    price: $price
    image: $image
    category: $category
    prepType: $prepType
  ) {
    id
    title
  }
}
```

After writing/modifying `.graphql` files, run `yarn codegen` (dev server must be running).

---

## 10. Modal Pattern (Headless UI)

```typescript
"use client";

import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";

interface ModalProps {
  isVisible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export default function Modal({ isVisible, onClose, children }: ModalProps) {
  return (
    <Transition appear show={isVisible} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                {children}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
```

---

## 11. Image Upload Pattern

```typescript
import { uploadPublicImage, SupabaseImageDelete } from "@/lib/supabaseStorage";

// Upload
const imageUrl = await uploadPublicImage(file, "menu-images");

// Delete old image before replacing
if (existingImageUrl) {
  await SupabaseImageDelete(existingImageUrl);
}
```

Use existing `UploadImg.tsx` component for drag-and-drop UI with preview and validation.

---

## 12. Toast Notification Pattern

```typescript
import toast from "react-hot-toast";

// Success
toast.success("Item added successfully");

// Error
toast.error("Failed to save changes");

// Promise-based (for async operations)
toast.promise(saveOperation(), {
  loading: "Saving...",
  success: "Saved!",
  error: "Could not save",
});
```

---

## 13. File Structure Quick Reference

```
graphql/
  builder.ts              # Pothos builder config
  generated.ts            # Auto-generated types (yarn codegen)
  schema/
    index.ts              # Registers all domains → builder.toSchema({})
    <Domain>/
      index.ts            # Imports queries + mutations
      queries.ts          # prismaObject + queryFields
      mutations.ts        # mutationFields
      enum.ts             # Enums (optional)
  files/
    *.graphql             # Client operation documents

lib/
  prisma.ts               # Prisma client singleton
  session.ts              # getCurrentUser()
  store.ts                # Zustand: cart, sidebar, login modal
  AreaStore.ts            # Zustand: restaurant floor state
  supabaseStorage.ts      # Supabase image upload/delete
  menuCategory.ts         # Menu filter store

app/
  api/graphql/
    route.ts              # Apollo Server handler
    context.ts            # GraphQL context (user + API key)
  components/
    Common/               # Shared (Header, Footer, Sidebar, AuthModal)
    Home/                 # Homepage (Hero, Menu, Promos, Categories)
    Restaurant_interface/ # Floor management (tables, zones, CRUD)
  (dashboard)/dashboard/  # Admin panel
  (user)/user/            # User-facing pages

prisma/schema.prisma      # Source of truth for all data models
```

---

## 14. Existing GraphQL Domains

Area, Category, Dashboard, Delivery, Favorite, GridConfig, Menu, Notification, Order, Profile, Reservation, Restaurant, Table, TableUsage, User, Waitlist.

Each follows the `index.ts` / `queries.ts` / `mutations.ts` pattern described above.
