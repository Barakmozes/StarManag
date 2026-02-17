# StarManag

## Overview

**StarManag** is a next-generation restaurant management system and food delivery platform. It provides a complete solution for restaurant owners, managers, and waiters to handle reservations, table management, menu, orders, payments, and food delivery, all with a modern UI and robust backend.

---

## Tech Stack

The app was built using the following technologies:

- **Next.js 14**: React framework for SSR, SSG, and fast development.
- **Apollo Server**: GraphQL server for flexible API endpoints.
- **Pothos**: Code-first GraphQL schema construction.
- **Urql**: GraphQL client for querying and mutations.
- **Prisma**: ORM for migrations and type-safe database access.
- **PostgreSQL**: Relational database for local development/testing.
- **Supabase**: Cloud-based database and storage for images/assets.
- **Next-Auth/Authjs**: Authentication and session management.
- **TypeScript**: Static type checking and reliability.
- **TailwindCSS**: Utility-first CSS framework for rapid styling.
- **Zustand **: for state management.
- **Payplus API**: Payment processing and checkout integration.
- **MapBox**: Geocoding and maps for location-based features.
- **Vercel**: Hosting and deployment platform for Next.js.

---

## Folder & File Structure

<details>
```
StarManag/
│
└── 📁app
        └── 📁(dashboard)
            └── 📁dashboard
                └── 📁Components
                    ├── DashHeader.tsx
                    ├── DashSideBar.tsx
                    ├── DashWrapper.tsx
                    ├── NotifyDropDown.tsx
                    ├── RenderRoutes.tsx
                    ├── routes.tsx
                    ├── SalesRevenueGraph.tsx
                    ├── SearchAndFilter.tsx
                    ├── TableWrapper.tsx
                    ├── TotalCards.tsx
                    ├── UploadImg.tsx
                └── 📁deliveries
                    ├── AssignDriver.tsx
                    ├── DeliveriesTable.tsx
                    ├── loading.tsx
                    ├── OrderDelivered.tsx
                    ├── page.tsx
                    ├── ViewDeliveryStatus.tsx
                └── 📁menu
                    ├── AdminAddMenu.tsx
                    ├── AdminDeleteMenu.tsx
                    ├── AdminEditMenu.tsx
                    ├── AdminFetchedMenus.tsx
                    ├── AdminMenuTable.tsx
                    ├── AdminPreviewMenu.tsx
                    ├── CategoryDropDown.tsx
                    ├── loading.tsx
                    ├── page.tsx
                    ├── PriceDropDown.tsx
                └── 📁notifications
                    ├── loading.tsx
                    ├── NotificationsList.tsx
                    ├── page.tsx
                └── 📁orders
                    ├── AdminFetchedOrders.tsx
                    ├── AdminOrderModal.tsx
                    ├── AdminOrderTable.tsx
                    ├── loading.tsx
                    ├── OrdersFilter.tsx
                    ├── page.tsx
                └── 📁settings
                    ├── AdminAddCategory.tsx
                    ├── AdminCategories.tsx
                    ├── AdminDeleteCategory.tsx
                    ├── AdminEditCategory.tsx
                    ├── loading.tsx
                    ├── OpeningHours.tsx
                    ├── page.tsx
                    ├── RestaurantDetails.tsx
                └── 📁users
                    ├── AdminUserTable.tsx
                    ├── EditRoleForm.tsx
                    ├── EditRoleModal.tsx
                    ├── loading.tsx
                    ├── page.tsx
                ├── layout.tsx
                ├── loading.tsx
                ├── page.tsx
        └── 📁(user)
            └── 📁user
                └── 📁favorites
                    ├── FavoriteCard.tsx
                    ├── FavoriteModal.tsx
                    ├── FavoritesSection.tsx
                    ├── loading.tsx
                    ├── page.tsx
                └── 📁help
                    ├── loading.tsx
                    ├── page.tsx
                    ├── RequestHelpForm.tsx
                └── 📁orders
                    ├── loading.tsx
                    ├── page.tsx
                    ├── UserDeliveredModal.tsx
                    ├── UserOnDeliveryModal.tsx
                    ├── UserOrders.tsx
                    ├── ViewUserOrderStatus.tsx
                ├── LanguageSelectModal.tsx
                ├── layout.tsx
                ├── loading.tsx
                ├── page.tsx
                ├── UserAddProfile.tsx
                ├── UserData.tsx
                ├── UserDetails.tsx
                ├── UserEditAccountModal.tsx
                ├── UserPrefs.tsx
        └── 📁api
            └── 📁auth
                └── 📁[...nextauth]
                    ├── route.ts
            └── 📁graphql
                ├── context.ts
                ├── route.ts
            └── 📁payplus
                └── 📁[total]
                    ├── route.ts
        └── 📁cart
            ├── CartList.tsx
            ├── CartSummary.tsx
            ├── CartTopSection.tsx
            ├── page.tsx
            ├── TableCartSummary.tsx
        └── 📁components
            └── 📁Common
                ├── AccountDropDown.tsx
                ├── AppMap.tsx
                ├── AuthModal.tsx
                ├── ClientLoaders.tsx
                ├── Container.tsx
                ├── DialogComponent.tsx
                ├── FavoritesBtn.tsx
                ├── Footer.tsx
                ├── FooterMobile.tsx
                ├── Header.tsx
                ├── LocationBtn.tsx
                ├── LocationSearchForm.tsx
                ├── LoginComponent.tsx
                ├── Modal.tsx
                ├── SideBar.tsx
                ├── TranslateToggle.tsx
            └── 📁Home
                ├── Categories.tsx
                ├── EntryFullscreenModal.tsx
                ├── fullScrenF11.jsx
                ├── HeroSection.tsx
                ├── loading.tsx
                ├── MenuCard.tsx
                ├── MenuModal.tsx
                ├── MenuSection.tsx
                ├── PromoCard.tsx
                ├── PromoHeading.tsx
                ├── Promos.tsx
                ├── RestaurantDetailsModal.tsx
            └── 📁Restaurant_interface
                └── 📁CRUD_Zone-CRUD_Table
                    ├── AddTableModal.tsx
                    ├── AddZoneForm.tsx
                    ├── AddZoneModal.tsx
                    ├── DeleteTableModal.tsx
                    ├── DeleteZoneModal.tsx
                    ├── EditTableModal.tsx
                    ├── EditZoneModal.tsx
                └── 📁Table_Settings
                    ├── specialRequests.tsx
                    ├── Start_an_order_Table.tsx
                    ├── TableReservations.tsx
                    ├── ToggleReservation.tsx
                ├── TableCard.tsx
                ├── TableModal.tsx
                ├── TablesSection.tsx
                ├── zone_restaurant.tsx
        └── 📁login
            ├── page.tsx
        └── 📁payment-failure
            ├── page.tsx
            ├── PaymentFailureComponent.tsx
        └── 📁payment-success
            ├── page.tsx
            ├── SuccessPaymentComponent.tsx
        ├── favicon.ico
        ├── globals.css
        ├── layout.tsx
        ├── loading.tsx
        ├── page.tsx
        ├── Providers.tsx
    └── 📁data
        ├── cart-data.ts
        ├── categories-data.ts
        ├── deliveries-data.ts
        ├── dummy.json
        ├── dummy1.json
        ├── menu-data.ts
        ├── notify-data.ts
        ├── order-data.ts
        ├── Table.ts
        ├── users-data.ts
    └── 📁graphql
        └── 📁files
            ├── area.graphql
            ├── favorite.graphql
            ├── menu.graphql
            ├── order.graphql
            ├── table.graphql
            ├── user.graphql
        └── 📁schema
            └── 📁Area
                ├── index.ts
                ├── mutations.ts
                ├── queries.ts
            └── 📁Category
                ├── index.ts
                ├── mutations.ts
                ├── queries.ts
            └── 📁Favorite
                ├── index.ts
                ├── mutations.ts
                ├── queries.ts
            └── 📁GridConfig
                ├── index.ts
                ├── mutations.ts
                ├── queries.ts
            └── 📁Menu
                ├── index.ts
                ├── mutations.ts
                ├── queries.ts
            └── 📁Notification
                ├── enum.ts
                ├── index.ts
                ├── mutations.ts
                ├── queries.ts
            └── 📁Order
                ├── enum.ts
                ├── index.ts
                ├── mutations.ts
                ├── queries.ts
            └── 📁Profile
                ├── index.ts
                ├── mutations.ts
                ├── queries.ts
            └── 📁Reservation
                ├── enum.ts
                ├── index.ts
                ├── mutations.ts
                ├── queries.ts
            └── 📁Restaurant
                ├── index.ts
                ├── mutations.ts
                ├── queries.ts
            └── 📁Table
                ├── index.ts
                ├── mutations.ts
                ├── queries.ts
            └── 📁TableUsage
                ├── index.ts
                ├── mutations.ts
                ├── queries.ts
            └── 📁User
                ├── enum.ts
                ├── index.ts
                ├── mutations.ts
                ├── queries.ts
            └── 📁Waitlist
                ├── enum.ts
                ├── index.ts
                ├── mutations.ts
                ├── queries.ts
            ├── index.ts
        ├── builder.ts
        ├── generated.ts
    └── 📁lib
        ├── AreaStore.ts
        ├── createOrderNumber.ts
        ├── prisma.ts
        ├── session.ts
        ├── store.ts
        ├── supabaseStorage.ts
    └── 📁prisma
        └── 📁migrations
            └── 📁20231027215300_setup
                ├── migration.sql
            └── 📁20231027223700_v1
                ├── migration.sql
            └── 📁20241202114449_v2enum_user
                ├── migration.sql
            └── 📁20241219131352_v3_teble_zone
                ├── migration.sql
            └── 📁20241222113457_v4_teble
                ├── migration.sql
            └── 📁20241222121816_v5teble
                ├── migration.sql
            └── 📁20241223112348_v_x1_teble
                ├── migration.sql
            └── 📁20241223141945_x1_1teble
                ├── migration.sql
            └── 📁20241226123108_vx_1_2_teble
                ├── migration.sql
            └── 📁20241230194403_v3
                ├── migration.sql
            └── 📁20250105100134_v4
                ├── migration.sql
            ├── migration_lock.toml
        ├── schema.prisma
    └── 📁public
        └── 📁img
            └── 📁categories
                ├── burger.png
            └── 📁food
                ├── burger.png
            └── 📁humans
                ├── h1.jpg
            └── 📁objects
         
    ├── .env
    ├── .eslintrc.json
    ├── .gitignore
    ├── codegen.yml
    ├── fullstack.png
    ├── globals.d.ts
    ├── middleware.ts
    ├── next-env.d.ts
    ├── next.config.js
    ├── package.json
    ├── postcss.config.js
    ├── README.md
    ├── tailwind.config.ts
    ├── text
    ├── tsconfig.json
    ├── types.ts
    └── yarn.lock
```
---

## Key Features

- **Zone & Table Management**: Add/edit/delete zones, drag & drop tables, scale/zoom floor plans, persistent state.
- **Reservations**: Integrated table reservation system, error feedback.
- **Menu Management**: Dynamic menu rendering, categories, promotions.
- **Order Management**: Cart, favorites, dashboard filters, order status.
- **Payment**: Secure checkout with Payplus API.
- **Mapping**: Location and geocoding with MapBox.
- **Authentication**: Role-based access (Manager, Waiter, User) with Next-Auth/Authjs.
- **Responsive Design**: Mobile-friendly, adaptive layouts.
- **Cloud Storage**: Images/assets managed via Supabase.
- **Deployment**: Hosted on Vercel for scalability and reliability.

---

## Getting Started

### 1. Install Yarn Packages

```bash
yarn install
```

### 2. Setup the `.env` file

- See the `.env.example` file for required environment variables.
- Configure database URLs, GraphQL endpoints, Payplus keys, MapBox tokens, Supabase credentials, etc.

### 3. Setup Prisma

```bash
yarn prisma generate
yarn prisma migrate dev
```

### 4. Start the App

```bash
yarn dev
```

---

## Contributing

Contributions are welcome!  
Please open issues or submit pull requests for bugs, features, or improvements.

---

## License

[MIT](LICENSE)

---

## Contact & Support

For help and support, use the [Contact Us](https://github.com/Barakmozes/StarManag/issues) page or visit the in-app Help Center.
