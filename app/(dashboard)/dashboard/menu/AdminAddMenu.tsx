"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HiPlus } from "react-icons/hi2";
import { useMutation, useQuery } from "@urql/next";
import toast from "react-hot-toast";
import { gql } from "graphql-tag";

import { SupabaseImageUpload } from "@/lib/supabaseStorage";
import {
  AddMenuDocument,
  type AddMenuMutation,
  type AddMenuMutationVariables,
} from "@/graphql/generated";

import Modal from "@/app/components/Common/Modal";
import UploadImg from "../Components/UploadImg";

type DbCategory = {
  id: string;
  title: string;
  desc?: string | null;
  img?: string | null;
};

type GetCategoriesForMenuQuery = {
  getCategories: DbCategory[];
};

const GetCategoriesForMenuDocument = gql`
  query GetCategoriesForMenu {
    getCategories {
      id
      title
      desc
      img
    }
  }
`;

const AdminAddMenu = () => {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);

  const [title, setTitle] = useState("");
  const [categoryTitle, setCategoryTitle] = useState("");
  const [longDescr, setLongDescr] = useState("");
  const [shortDescr, setShortDescr] = useState("");
  const [price, setPrice] = useState<number>(0);

  // ✅ promo fields
  const [onPromo, setOnPromo] = useState(false);
  const [sellingPrice, setSellingPrice] = useState<string>("");

  const [prepType, setPrepType] = useState<string[]>([]);
  const [preparationInput, setPreparationInput] = useState("");

  const [image, setImage] = useState("");

  const closeModal = () => setIsOpen(false);
  const openModal = () => setIsOpen(true);

  const [{ data: catData, fetching: catFetching, error: catError }] =
    useQuery<GetCategoriesForMenuQuery>({
      query: GetCategoriesForMenuDocument,
      requestPolicy: "cache-and-network",
    });

  const categories = useMemo(() => {
    const list = catData?.getCategories ?? [];
    return list.slice().sort((a, b) => a.title.localeCompare(b.title));
  }, [catData]);

  const didInitCategory = useRef(false);
  useEffect(() => {
    if (didInitCategory.current) return;
    if (categories.length > 0) {
      setCategoryTitle(categories[0].title);
      didInitCategory.current = true;
    }
  }, [categories]);

  const clearForm = () => {
    setTitle("");
    setCategoryTitle(categories[0]?.title ?? "");
    setLongDescr("");
    setShortDescr("");
    setPrice(0);
    setOnPromo(false);
    setSellingPrice("");
    setPrepType([]);
    setPreparationInput("");
    setImage("");
  };

  const addPreparation = () => {
    const value = preparationInput.trim();
    if (!value) {
      toast.error("Please enter a preparation type", { duration: 2000 });
      return;
    }
    setPrepType((prev) => (prev.includes(value) ? prev : [...prev, value]));
    setPreparationInput("");
  };

  const removePreparation = (value: string) => {
    setPrepType((prev) => prev.filter((x) => x !== value));
  };

  const getMenuImageFile = async (file: File) => {
    const id = toast.loading("Uploading image...");
    try {
      const url = await SupabaseImageUpload(file);
      if (!url) throw new Error("Upload failed");
      setImage(url);
      toast.success("Image uploaded", { id, duration: 1200 });
    } catch {
      toast.error("Error uploading image", { id, duration: 2500 });
    }
  };

  const [, addMenu] = useMutation<AddMenuMutation, AddMenuMutationVariables>(
    AddMenuDocument
  );

  const handleAddMenu = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const cleanedTitle = title.trim();
    const cleanedCategory = categoryTitle.trim();
    const cleanedShort = shortDescr.trim();
    const cleanedLong = longDescr.trim();
    const cleanedPrep = prepType.map((p) => p.trim()).filter(Boolean);

    if (!image || !cleanedTitle || !cleanedCategory || !cleanedShort) {
      toast.error("Please fill in all required fields", { duration: 2500 });
      return;
    }

    if (!Number.isFinite(price) || price <= 0) {
      toast.error("Price must be greater than 0", { duration: 2500 });
      return;
    }

    if (cleanedPrep.length === 0) {
      toast.error("Please add at least one preparation type", { duration: 2500 });
      return;
    }

    // ✅ allow clearing sellingPrice (null), keep validation if provided
    const selling =
      sellingPrice.trim() === "" ? null : Number(sellingPrice.trim());

    if (selling !== null) {
      if (!Number.isFinite(selling) || selling <= 0) {
        toast.error("Selling price must be a valid number", { duration: 2500 });
        return;
      }
      if (selling >= price) {
        toast.error("Selling price must be lower than the regular price", {
          duration: 2500,
        });
        return;
      }
    }

    const toastId = toast.loading("Adding menu...");
    try {
      const res = await addMenu({
        image,
        title: cleanedTitle,
        category: cleanedCategory,
        longDescr: cleanedLong,
        shortDescr: cleanedShort,
        prepType: cleanedPrep,
        price,
        sellingPrice: selling, // ✅ null clears
        onPromo,              // ✅ NEW
      } as any); // <- remove "as any" after codegen updates

      if (res.data?.addMenu?.id) {
        toast.success("Menu Added Successfully", { id: toastId, duration: 1200 });
        clearForm();
        setTimeout(closeModal, 700);
        router.refresh();
      } else {
        toast.error("An error occurred", { id: toastId, duration: 2000 });
      }
    } catch {
      toast.error("An error occurred", { id: toastId, duration: 2000 });
    }
  };

  const noCategories = !catFetching && !catError && categories.length === 0;

  return (
    <>
      <button
        type="button"
        className="text-white inline-flex items-center whitespace-nowrap bg-green-600 hover:bg-green-700 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
        onClick={openModal}
      >
        <HiPlus className="mr-1 -ml-1 w-4 h-4" />
        Add Menu
      </button>

      <Modal isOpen={isOpen} title={title || "Add Menu"} closeModal={closeModal}>
        <form onSubmit={handleAddMenu}>
          {catError && (
            <div className="mb-3 text-sm text-red-600">
              Could not load categories. You can still try again by refreshing.
            </div>
          )}

          {noCategories && (
            <div className="mb-4 rounded-md border border-orange-200 bg-orange-50 p-3 text-sm text-orange-800">
              <div className="font-semibold mb-1">No categories found</div>
              <div className="mb-2">
                Create at least one category in Settings before adding menus.
              </div>
              <Link
                href="/dashboard/settings"
                className="underline underline-offset-2 text-orange-900"
              >
                Go to Settings
              </Link>
            </div>
          )}

          <div className="grid gap-4 mb-4 sm:grid-cols-2">
            <div>
              <label htmlFor="title" className="form-label">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                className="form-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={noCategories}
              />
            </div>

            <div>
              <label htmlFor="price" className="form-label">
                Price <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="price"
                className="form-input"
                placeholder="$"
                value={price}
                min={0}
                step={0.01}
                onChange={(e) => setPrice(e.target.valueAsNumber)}
                disabled={noCategories}
              />
            </div>

            {/* ✅ promo toggle */}
            <div className="flex items-center gap-3">
              <label className="form-label mb-0">On Promo</label>
              <input
                type="checkbox"
                className="w-5 h-5 accent-green-600 rounded"
                checked={onPromo}
                onChange={(e) => setOnPromo(e.target.checked)}
                disabled={noCategories}
              />
            </div>

            <div>
              <label htmlFor="sellingPrice" className="form-label">
                Selling Price (optional)
              </label>
              <input
                type="number"
                id="sellingPrice"
                className="form-input"
                placeholder="$"
                value={sellingPrice}
                min={0}
                step={0.01}
                onChange={(e) => setSellingPrice(e.target.value)}
                disabled={noCategories}
              />
            </div>

            <div>
              <label htmlFor="category" className="form-label">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                id="category"
                className="form-input"
                onChange={(e) => setCategoryTitle(e.target.value)}
                value={categoryTitle}
                disabled={noCategories || catFetching}
              >
                {catFetching && <option>Loading categories…</option>}
                {!catFetching &&
                  categories.map((cat) => (
                    <option key={cat.id} value={cat.title}>
                      {cat.title}
                    </option>
                  ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="longDescr" className="form-label">
                Long Description
              </label>
              <textarea
                id="longDescr"
                rows={2}
                className="form-input"
                placeholder="Long description here"
                value={longDescr}
                onChange={(e) => setLongDescr(e.target.value)}
                disabled={noCategories}
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="shortDescr" className="form-label">
                Short Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="shortDescr"
                rows={2}
                className="form-input"
                placeholder="Short description here"
                value={shortDescr}
                onChange={(e) => setShortDescr(e.target.value)}
                disabled={noCategories}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="form-label">
                Preparation Types <span className="text-red-500">*</span>
              </label>

              <div className="flex sm:col-span-2 gap-2">
                <input
                  type="text"
                  className="form-input"
                  value={preparationInput}
                  onChange={(e) => setPreparationInput(e.target.value)}
                  placeholder="Enter text"
                  disabled={noCategories}
                />
                <button
                  type="button"
                  className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700"
                  onClick={addPreparation}
                  disabled={noCategories}
                >
                  Add
                </button>
              </div>

              {prepType.length > 0 && (
                <ul className="list-none flex flex-wrap gap-2 mt-2">
                  {prepType.map((value) => (
                    <li key={value}>
                      <button
                        type="button"
                        onClick={() => removePreparation(value)}
                        className="bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5 rounded hover:bg-green-200"
                        title="Click to remove"
                      >
                        {value}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <UploadImg handleCallBack={getMenuImageFile} id="addAdminMenu" />

          <button
            type="submit"
            disabled={noCategories}
            className="text-white inline-flex items-center bg-green-600 hover:bg-green-700 font-medium rounded-lg text-sm px-5 py-2.5 text-center disabled:opacity-60"
          >
            <HiPlus className="mr-1 -ml-1 w-4 h-4" fill="currentColor" />
            Add Menu
          </button>
        </form>
      </Modal>
    </>
  );
};

export default AdminAddMenu;