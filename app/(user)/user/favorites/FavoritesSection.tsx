"use client";

import { HiOutlineChevronLeft } from "react-icons/hi2";
import Link from "next/link";

import Container from "@/app/components/Common/Container";
import FavoriteModal from "./FavoriteModal";
import { Menu, User } from "@prisma/client";
import { useQuery } from "@urql/next";
import {
  GetMenuUserFavoritesDocument,
  GetMenuUserFavoritesQuery,
  GetMenuUserFavoritesQueryVariables,
  GetUserFavoritesDocument,
  GetUserFavoritesQuery,
  GetUserFavoritesQueryVariables,
} from "@/graphql/generated";
import Loading from "./loading";

type Props = {
  user: User;
};

const FavoritesSection = ({ user }: Props) => {
  const userEmail = user?.email as string;

  const [{ data, fetching: favIdsFetching }] = useQuery<
    GetUserFavoritesQuery,
    GetUserFavoritesQueryVariables
  >({ query: GetUserFavoritesDocument, variables: { userEmail } });

  const menuIds = data?.getUserFavorites.menu as string[];

  const [{ data: userFavorites, fetching }] = useQuery<
    GetMenuUserFavoritesQuery,
    GetMenuUserFavoritesQueryVariables
  >({ query: GetMenuUserFavoritesDocument, variables: { menuIds, userEmail } });

  const Favorites = userFavorites?.getMenuUserFavorites;
  const isLoading = favIdsFetching || fetching;

  return (
    <Container>
      <div className="mt-6 sm:mt-8 text-center px-1">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl leading-tight tracking-tight text-gray-600">
          My Favorites
        </h2>

        <div className="mt-3 flex justify-center">
          <Link
            href="/user"
            className="inline-flex w-full max-w-sm min-h-[44px] items-center justify-center bg-green-600 px-5 py-2.5 text-base sm:text-lg text-white border border-green-500 gap-2 rounded-full hover:text-green-700 hover:bg-green-200 transition"
            aria-label="Back to my profile"
          >
            <HiOutlineChevronLeft className="h-5 w-5" aria-hidden="true" />
            <span>Back to my Profile</span>
          </Link>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && !Favorites ? (
        <div className="mt-10">
          <Loading />
        </div>
      ) : null}

      {/* Empty state */}
      {!isLoading && Favorites?.length === 0 ? (
        <div className="mt-10 rounded-lg border border-gray-200 bg-white p-4 text-center text-sm text-gray-500">
          No favorites yet. Browse the menu and tap the heart to save items.
        </div>
      ) : null}

      <section className="my-10 sm:my-16 lg:my-24 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
        {Favorites?.map((favorite) => (
          <FavoriteModal
            key={favorite.id}
            favorite={favorite as Menu}
            user={user}
          />
        ))}
      </section>
    </Container>
  );
};

export default FavoritesSection;
