import {
  AddFavoriteDocument,
  AddFavoriteMutation,
  AddFavoriteMutationVariables,
  GetUserFavoritesDocument,
  GetUserFavoritesQuery,
  GetUserFavoritesQueryVariables,
  RemoveFavoriteDocument,
  RemoveFavoriteMutation,
  RemoveFavoriteMutationVariables,
} from "@/graphql/generated";
import { User } from "@prisma/client";
import { useMutation, useQuery } from "@urql/next";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";

type Props = {
  menuId: string;
  user: User;
};

const FavoritesBtn = ({ menuId, user }: Props) => {
  const router = useRouter();
  const userEmail = user?.email as string;

  const [{ data }] = useQuery<GetUserFavoritesQuery, GetUserFavoritesQueryVariables>({
    query: GetUserFavoritesDocument,
    variables: { userEmail },
  });

  const favIds = data?.getUserFavorites.menu;
  const isFav = Array.isArray(favIds) ? favIds.includes(menuId) : false;

  const [_add, addFav] = useMutation<AddFavoriteMutation, AddFavoriteMutationVariables>(
    AddFavoriteDocument
  );

  const [_remove, removeFav] = useMutation<RemoveFavoriteMutation, RemoveFavoriteMutationVariables>(
    RemoveFavoriteDocument
  );

  const handleAddFav = async () => {
    const res = await addFav({ userEmail, menuId });
    if (res.data?.addFavorite) {
      toast.success("Favorite Added Successfully", { duration: 2000 });
      router.refresh();
    } else {
      toast.error("An error occured", { duration: 2000 });
    }
  };

  const handleRemoveFav = async () => {
    const res = await removeFav({ userEmail, menuId });
    if (res.data?.removeFavorite) {
      toast.success("Favorite removed Successfully", { duration: 2000 });
      router.refresh();
    } else {
      toast.error("An error occured", { duration: 2000 });
    }
  };

  return (
    <button
      type="button"
      className="inline-flex h-11 w-11 items-center justify-center rounded-full transition hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
      aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
      aria-pressed={isFav}
      onClick={(e) => {
        e.stopPropagation();
        if (isFav) handleRemoveFav();
        else handleAddFav();
      }}
    >
      {isFav ? (
        <AiFillHeart size={28} className="fill-green-700" aria-hidden="true" />
      ) : (
        <AiOutlineHeart size={30} className="text-green-700" aria-hidden="true" />
      )}
    </button>
  );
};

export default FavoritesBtn;
