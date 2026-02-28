"use client";

import { FormEvent, useMemo, useState } from "react";
import Image from "next/image";
import { HiOutlinePencil } from "react-icons/hi2";
import { useMutation, useQuery } from "@urql/next";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { gql } from "graphql-tag";

import {
  EditMenuDocument,
  type EditMenuMutation,
  type EditMenuMutationVariables,
} from "@/graphql/generated";
import { SupabaseImageDelete, SupabaseImageUpload } from "@/lib/supabaseStorage";
import Modal from "@/app/components/Common/Modal";
import UploadImg from "../Components/UploadImg";

type DbCategory = { id: string; title: string };
type GetCategoriesForMenuQuery = { getCategories: DbCategory[] };

const GetCategoriesForMenuDocument = gql`
  query GetCategoriesForMenu {
    getCategories {
      id
      title
    }
  }
`;

type MenuLike = {
  id: string;
  title: string;
  category: string;
  longDescr?: string | null;
  shortDescr: string;
  price: number;
  sellingPrice?: number | null;
  prepType: string[];
  image: string;
  onPromo?: boolean;
};

function extractSupabaseFilename(urlOrName: string): string | null {
  if (!urlOrName) return null;
  const clean = urlOrName.split("?")[0].split("#")[0];

  const idx = clean.lastIndexOf("/public/");
  if (idx !== -1) return clean.substring(idx + "/public/".length);

  const parts = clean.split("/");
  return parts[parts.length - 1] || null;
}

type Props = { menu: MenuLike };

const AdminEditMenu = ({ menu }: Props) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const [title, setTitle] = useState(menu.title);
  const [categoryTitle, setCategoryTitle] = useState(menu.category);
  const [longDescr, setLongDescr] = useState(menu.longDescr ?? "");
  const [shortDescr, setShortDescr] = useState(menu.shortDescr);
  const [price, setPrice] = useState(menu.price);

  const [onPromo, setOnPromo] = useState(!!menu.onPromo);
  const [sellingPrice, setSellingPrice] = useState<string>(
    typeof menu.sellingPrice === "number" ? String(menu.sellingPrice) : ""
  );

  const [prepType, setPrepType] = useState<string[]>(menu.prepType ?? []);
  const [preparationInput, setPreparationInput] = useState("");
  const [image, setImage] = useState(menu.image);

  const closeModal = () => setIsOpen(false);
  const openModal = () => setIsOpen(true);

  const [{ data: catData, fetching: catFetching }] =
    useQuery<GetCategoriesForMenuQuery>({
      query: GetCategoriesForMenuDocument,
      requestPolicy: "cache-and-network",
    });

  const categories = useMemo(() => {
    const list = catData?.getCategories ?? [];
    return list.slice().sort((a, b) => a.title.localeCompare(b.title));
  }, [catData]);

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

  const replaceMenuImage = async (file: File) => {
    const toastId = toast.loading("Uploading image...");
    const old = image;

    try {
      const newUrl = await SupabaseImageUpload(file);
      if (!newUrl) throw new Error("Upload failed");

      const filename = extractSupabaseFilename(old);
      if (filename) await SupabaseImageDelete(filename);

      setImage(newUrl);
      toast.success("Image updated", { id: toastId, duration: 1200 });
    } catch {
      toast.error("Error uploading image", { id: toastId, duration: 2500 });
    }
  };

  const [, editMenu] = useMutation<EditMenuMutation, EditMenuMutationVariables>(
    EditMenuDocument
  );

  const handleEditMenu = async (e: FormEvent<HTMLFormElement>) => {
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

    const normalized = sellingPrice.trim().replace(",", ".");
    const selling = normalized === "" ? null : Number(normalized);

    if (selling !== null) {
      if (!Number.isFinite(selling) || selling <= 0) {
        toast.error("Selling price must be a valid number", { duration: 2500 });
        return;
      }
      if (!Number.isFinite(price) || price <= 0) {
        toast.error("Price must be greater than 0", { duration: 2500 });
        return;
      }
      if (selling >= price) {
        toast.error("Selling price must be lower than the regular price", {
          duration: 2500,
        });
        return;
      }
    }

    const toastId = toast.loading("Saving changes...");
    try {
      const res = await editMenu({
        editMenuId: menu.id,
        image,
        title: cleanedTitle,
        category: cleanedCategory,
        longDescr: cleanedLong,
        shortDescr: cleanedShort,
        prepType: cleanedPrep,
        price,
        sellingPrice: selling, 
        onPromo, 
      });

      if (res.data?.editMenu?.id) {
        toast.success("Menu Edited Successfully", { id: toastId, duration: 1200 });
        setTimeout(closeModal, 700);
        router.refresh();
      } else {
        toast.error("An error occurred", { id: toastId, duration: 2000 });
      }
    } catch {
      toast.error("An error occurred", { id: toastId, duration: 2000 });
    }
  };

  const handleResetPromo = () => {
    setSellingPrice("");
  };

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="inline-flex items-center justify-center h-10 w-10 sm:h-9 sm:w-9 rounded-md hover:bg-slate-100 transition-colors"
        aria-label={`Edit ${menu.title}`}
      >
        <HiOutlinePencil className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
      </button>

      <Modal isOpen={isOpen} title={`Edit Menu: ${menu.title}`} closeModal={closeModal}>
        {/* Ensures inner scroll and fixes the double scrollbar bug visually */}
        <div className="w-full max-w-4xl  sm:rounded-b-xl custom-scrollbar">
          <form onSubmit={handleEditMenu} className="p-4 sm:p-6 space-y-6">
            
            {/* Image Preview Block */}
            <div className="w-full rounded-xl overflow-hidden shadow-sm border border-gray-100 bg-gray-50 flex items-center justify-center p-2">
              <Image
                src={image}
                alt={title}
                width={720}
                height={400}
                className="h-40 sm:h-52 w-full object-cover rounded-lg"
              />
            </div>

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
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="category" className="text-sm font-medium text-gray-700">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  id="category"
                  className="w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors bg-white"
                  onChange={(e) => setCategoryTitle(e.target.value)}
                  value={categoryTitle}
                  disabled={catFetching}
                >
                  {!catFetching &&
                    categoryTitle &&
                    !categories.some((c) => c.title === categoryTitle) && (
                      <option value={categoryTitle}>{categoryTitle} (current)</option>
                    )}
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
                  placeholder="$"
                  value={price}
                  min={0}
                  step={0.01}
                  onChange={(e) => setPrice(e.target.valueAsNumber)}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="sellingPrice" className="text-sm font-medium text-gray-700">
                    Selling Price
                  </label>
                  <button
                    type="button"
                    onClick={handleResetPromo}
                    className="text-xs text-green-600 hover:text-green-800 font-medium transition-colors"
                  >
                    Reset
                  </button>
                </div>
                <input
                  type="number"
                  id="sellingPrice"
                  className="w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
                  placeholder="Optional"
                  value={sellingPrice}
                  min={0}
                  step={0.01}
                  onChange={(e) => setSellingPrice(e.target.value)}
                />
              </div>

              {/* Promo Checkbox full span styled */}
              <div className="flex items-center gap-3 sm:col-span-2 p-3 bg-gray-50/80 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  id="onPromo"
                  className="w-5 h-5 text-green-600 bg-white border-gray-300 rounded focus:ring-green-500 focus:ring-2 cursor-pointer transition-all"
                  checked={onPromo}
                  onChange={(e) => setOnPromo(e.target.checked)}
                />
                <label htmlFor="onPromo" className="text-sm font-medium text-gray-800 cursor-pointer select-none">
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
                  className="w-full px-4 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors resize-none"
                  placeholder="Brief description for quick reading"
                  value={shortDescr}
                  onChange={(e) => setShortDescr(e.target.value)}
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label htmlFor="longDescr" className="text-sm font-medium text-gray-700">
                  Long Description
                </label>
                <textarea
                  id="longDescr"
                  rows={3}
                  className="w-full px-4 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors resize-none"
                  placeholder="Detailed description of the item"
                  value={longDescr}
                  onChange={(e) => setLongDescr(e.target.value)}
                />
              </div>

              <div className="sm:col-span-2 space-y-2.5">
                <label className="text-sm font-medium text-gray-700">
                  Preparation Types <span className="text-red-500">*</span>
                </label>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    className="flex-1 px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
                    value={preparationInput}
                    onChange={(e) => setPreparationInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addPreparation();
                      }
                    }}
                    placeholder="E.g., Medium Rare, Extra Spicy..."
                  />
                  <button
                    type="button"
                    className="w-full sm:w-auto px-6 py-2.5 text-white bg-green-600 rounded-lg hover:bg-green-700 font-medium transition-colors shadow-sm focus:ring-2 focus:ring-offset-1 focus:ring-green-500"
                    onClick={addPreparation}
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Update Image</label>
              <UploadImg handleCallBack={replaceMenuImage} id={`editImg-${menu.id}`} />
            </div>

            {/* Action Buttons */}
            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 text-white bg-green-600 hover:bg-green-700 font-semibold rounded-xl shadow-sm hover:shadow transition-all focus:ring-2 focus:ring-offset-2 focus:ring-green-600"
              >
                <HiOutlinePencil className="w-5 h-5" />
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
};

export default AdminEditMenu;