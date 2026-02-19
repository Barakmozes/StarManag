"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
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
    if (!prepType.includes(value)) {
      setPrepType((prev) => [...prev, value]);
    }
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
        sellingPrice: selling, 
        onPromo, 
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
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 text-white bg-green-600 hover:bg-green-700 font-medium rounded-xl shadow-sm transition-all focus:ring-2 focus:ring-offset-1 focus:ring-green-500 whitespace-nowrap"
        onClick={openModal}
      >
        <HiPlus className="w-5 h-5" />
        Add Menu
      </button>

      <Modal isOpen={isOpen} title={title || "Add New Menu Item"} closeModal={closeModal}>
        {/* Ensures inner scroll and fixes the double scrollbar bug visually */}
        <div className="w-full max-w-4xl sm:rounded-b-xl custom-scrollbar">
          <form onSubmit={handleAddMenu} className="p-4 sm:p-6 space-y-6">
            
            {catError && (
              <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
                Could not load categories. You can still try again by refreshing.
              </div>
            )}

            {noCategories && (
              <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 text-sm text-orange-800">
                <div className="font-semibold text-base mb-1">No categories found</div>
                <div className="mb-3">
                  Create at least one category in Settings before adding menus.
                </div>
                <Link
                  href="/dashboard/settings"
                  className="inline-flex items-center font-medium underline underline-offset-2 text-orange-900 hover:text-orange-700 transition-colors"
                >
                  Go to Settings
                </Link>
              </div>
            )}

            {/* Uploaded Image Preview Block */}
            {image && (
              <div className="w-full rounded-xl overflow-hidden shadow-sm border border-gray-100 bg-gray-50 flex items-center justify-center p-2">
                <Image
                  src={image}
                  alt={title || "Menu preview"}
                  width={720}
                  height={400}
                  className="h-40 sm:h-52 w-full object-cover rounded-lg"
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              
              <div className="space-y-1.5">
                <label htmlFor="title" className="text-sm font-medium text-gray-700">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  className="w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={noCategories}
                  placeholder="e.g., Spicy Chicken Burger"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="category" className="text-sm font-medium text-gray-700">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  id="category"
                  className="w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors bg-white disabled:bg-gray-100 disabled:text-gray-500"
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

              <div className="space-y-1.5">
                <label htmlFor="price" className="text-sm font-medium text-gray-700">
                  Price <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="price"
                  className="w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
                  placeholder="$0.00"
                  value={price || ""}
                  min={0}
                  step={0.01}
                  onChange={(e) => setPrice(e.target.valueAsNumber)}
                  disabled={noCategories}
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="sellingPrice" className="text-sm font-medium text-gray-700">
                  Selling Price <span className="text-gray-500 font-normal">(optional)</span>
                </label>
                <input
                  type="number"
                  id="sellingPrice"
                  className="w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
                  placeholder="Optional discount price"
                  value={sellingPrice}
                  min={0}
                  step={0.01}
                  onChange={(e) => setSellingPrice(e.target.value)}
                  disabled={noCategories}
                />
              </div>

              {/* Promo Checkbox full span styled */}
              <div className="flex items-center gap-3 sm:col-span-2 p-3 bg-gray-50/80 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  id="onPromo"
                  className="w-5 h-5 text-green-600 bg-white border-gray-300 rounded focus:ring-green-500 focus:ring-2 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  checked={onPromo}
                  onChange={(e) => setOnPromo(e.target.checked)}
                  disabled={noCategories}
                />
                <label 
                  htmlFor="onPromo" 
                  className={`text-sm font-medium text-gray-800 select-none ${noCategories ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                >
                  Highlight as Promotional Item
                </label>
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label htmlFor="shortDescr" className="text-sm font-medium text-gray-700">
                  Short Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="shortDescr"
                  rows={2}
                  className="w-full px-4 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors resize-none disabled:bg-gray-100 disabled:text-gray-500"
                  placeholder="Brief description for quick reading"
                  value={shortDescr}
                  onChange={(e) => setShortDescr(e.target.value)}
                  disabled={noCategories}
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label htmlFor="longDescr" className="text-sm font-medium text-gray-700">
                  Long Description
                </label>
                <textarea
                  id="longDescr"
                  rows={3}
                  className="w-full px-4 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors resize-none disabled:bg-gray-100 disabled:text-gray-500"
                  placeholder="Detailed description of the item"
                  value={longDescr}
                  onChange={(e) => setLongDescr(e.target.value)}
                  disabled={noCategories}
                />
              </div>

              <div className="sm:col-span-2 space-y-2.5">
                <label className="text-sm font-medium text-gray-700">
                  Preparation Types <span className="text-red-500">*</span>
                </label>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    className="flex-1 px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors disabled:bg-gray-100 disabled:text-gray-500"
                    value={preparationInput}
                    onChange={(e) => setPreparationInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addPreparation();
                      }
                    }}
                    placeholder="E.g., Medium Rare, Extra Spicy..."
                    disabled={noCategories}
                  />
                  <button
                    type="button"
                    className="w-full sm:w-auto px-6 py-2.5 text-white bg-green-600 rounded-lg hover:bg-green-700 font-medium transition-colors shadow-sm focus:ring-2 focus:ring-offset-1 focus:ring-green-500 disabled:opacity-60 disabled:cursor-not-allowed"
                    onClick={addPreparation}
                    disabled={noCategories}
                  >
                    Add
                  </button>
                </div>

                {prepType.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {prepType.map((value) => (
                      <span
                        key={value}
                        className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 border border-green-200 text-sm font-medium px-3 py-1.5 rounded-full"
                      >
                        {value}
                        <button
                          type="button"
                          onClick={() => removePreparation(value)}
                          className="hover:text-green-900 focus:outline-none transition-colors font-bold text-lg leading-none"
                          aria-label={`Remove ${value}`}
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Image upload section */}
            <div className="pt-3 border-t border-gray-100">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Image <span className="text-red-500">*</span>
              </label>
              <UploadImg handleCallBack={getMenuImageFile} id="addAdminMenuImg" />
            </div>

            {/* Action Buttons */}
            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={noCategories}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 text-white bg-green-600 hover:bg-green-700 font-semibold rounded-xl shadow-sm hover:shadow transition-all focus:ring-2 focus:ring-offset-2 focus:ring-green-600 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <HiPlus className="w-5 h-5" />
                Add Menu Item
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
};

export default AdminAddMenu;