"use client";

import { FormEvent, useEffect, useState } from "react";
import { HiPencil } from "react-icons/hi2";
import { FaChevronRight } from "react-icons/fa";
import Modal from "@/app/components/Common/Modal";
import { User } from "@prisma/client";
import {
  EditProfileDocument,
  EditProfileMutation,
  EditProfileMutationVariables,
  Profile,
} from "@/graphql/generated";
import { useMutation } from "@urql/next";
import toast from "react-hot-toast";

type Props = {
  user: User;
  profile: Profile;
};

const UserEditAccountModal = ({ user, profile }: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [phone, setPhone] = useState(profile?.phone);
  // const [userName, setUserName] = useState("");

  const closeModal = () => setIsOpen(false);
  const OpenModal = () => setIsOpen(true);

  const email = user?.email as string;

  const [_, editProfile] = useMutation<
    EditProfileMutation,
    EditProfileMutationVariables
  >(EditProfileDocument);

  const editUserProfile = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const res = await editProfile({ email, phone });
    if (res.data?.editProfile) {
      toast.success("Profile Added Successfully", { duration: 2000 });
      setTimeout(closeModal, 3000);
    }
  };

  return (
    <>
      <button
        type="button"
        className="inline-flex w-full sm:w-auto min-h-[44px] items-center justify-between sm:justify-center gap-3 px-4 py-2.5 bg-green-600 text-white rounded-full"
        onClick={OpenModal}
      >
        <span>Edit Profile</span>
        <FaChevronRight className="shrink-0" />
      </button>

      <Modal isOpen={isOpen} title="Account Info" closeModal={closeModal}>
        {/* Mobile-safe modal body wrapper */}
        <div className="w-[min(100vw-2rem,28rem)] max-w-full max-h-[90vh] overflow-y-auto overscroll-contain pb-6">
          <form
            className="flex flex-col gap-6 sm:gap-8"
            onSubmit={editUserProfile}
          >
            <div>
              <h2 className="text-gray-700 font-semibold">Basic Info</h2>
            </div>

            <div className="flex flex-col gap-6 sm:gap-8">
              <div>
                <label htmlFor="phone" className="form-label">
                  Phone
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  className="form-input min-h-[44px]"
                  placeholder="Phone"
                  value={phone as string}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              {/* <div className="">
                <label htmlFor="email" className="form-label">
                  Name
                </label>
                <input
                  className="form-input"
                  placeholder="Name"
                  onChange={(e) => setUserName(e.target.value)}
                />
              </div> */}
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto min-h-[44px] text-white inline-flex items-center justify-center bg-green-600 hover:bg-green-700 focus:ring-4 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
            >
              <HiPencil className="mr-1 -ml-1 w-4 h-4" fill="currentColor" />
              Edit Profile
            </button>

            <div className="pb-[env(safe-area-inset-bottom)]" />
          </form>
        </div>
      </Modal>
    </>
  );
};

export default UserEditAccountModal;
