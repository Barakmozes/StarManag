"use client";

import Image from "next/image";
import UserEditAccountModal from "./UserEditAccountModal";
import { User } from "@prisma/client";
import { useQuery } from "@urql/next";
import {
  GetProfileDocument,
  GetProfileQuery,
  GetProfileQueryVariables,
  Profile,
} from "@/graphql/generated";
import UserAddProfile from "./UserAddProfile";

type Props = {
  user: User;
};

const UserDetails = ({ user }: Props) => {
  const email = user?.email as string;

  const [{ data, fetching, error }] = useQuery<
    GetProfileQuery,
    GetProfileQueryVariables
  >({
    query: GetProfileDocument,
    variables: { email },
  });

  const profile = data?.getProfile as Profile;

  return (
    <div className="w-full px-4 sm:px-6">
      <div className="flex flex-col items-center justify-center max-w-md mx-auto">
        <Image
          src={user?.image!}
          alt="pro-img"
          width={96}
          height={96}
          className="mx-auto rounded-full object-cover"
        />

        <div className="w-full mt-4 text-center">
          <h1 className="text-xl my-4 font-semibold leading-tight tracking-tight text-gray-500 md:text-2xl break-words">
            {user?.name}
          </h1>

          <p className="text-gray-500 mb-4 text-sm sm:text-base break-all">
            {user?.email}
          </p>

          <div className="flex justify-center">
            {profile ? (
              <UserEditAccountModal user={user as User} profile={profile} />
            ) : (
              <UserAddProfile user={user as User} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetails;
