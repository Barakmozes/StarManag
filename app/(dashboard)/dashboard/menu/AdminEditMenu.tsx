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
  onPromo?: boolean; // ✅ make sure your menu object includes this
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

  // ✅ promo fields
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
    setPrepType((prev) => (prev.includes(value) ? prev : [...prev, value]));
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
        sellingPrice: selling, // ✅ null clears
        onPromo, // ✅ NEW
      }); // <- remove after codegen updates

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
        className="inline-flex items-center justify-center h-11 w-11 md:h-9 md:w-9 rounded-md hover:bg-slate-100 transition"
        aria-label={`Edit ${menu.title}`}
      >
        <HiOutlinePencil className="h-6 w-6 text-green-600" />
      </button>

      <Modal isOpen={isOpen} title={title} closeModal={closeModal}>
        {/* Mobile-safe modal wrapper */}
        <div className="w-[min(100vw-2rem,48rem)] max-w-3xl max-h-[90vh] overflow-y-auto overscroll-contain pb-[calc(env(safe-area-inset-bottom)+1rem)]">
          <form onSubmit={handleEditMenu} className="p-3 sm:p-4">
            <div className="grid gap-4 mb-4 sm:grid-cols-2">
              <div className="sm:col-span-2 border-gray-300">
                <Image
                  src={image}
                  alt={title}
                  width={720}
                  height={400}
                  className="h-32 sm:h-40 w-full object-cover rounded-md"
                />
              </div>

              <div>
                <label htmlFor="title" className="form-label">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  className="form-input min-h-[44px]"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="price" className="form-label">
                  Price <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="price"
                  className="form-input min-h-[44px]"
                  placeholder="$"
                  value={price}
                  min={0}
                  step={0.01}
                  onChange={(e) => setPrice(e.target.valueAsNumber)}
                />
              </div>

              {/* ✅ promo toggle */}
              <div className="flex items-center justify-between sm:justify-start gap-3">
                <label className="form-label mb-0">On Promo</label>
                <input
                  type="checkbox"
                  className="w-6 h-6 accent-green-600 rounded"
                  checked={onPromo}
                  onChange={(e) => setOnPromo(e.target.checked)}
                  aria-label="Toggle promo"
                />
              </div>

              <div>
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor="sellingPrice" className="form-label mb-0">
                    Selling Price (optional)
                  </label>

                  <button
                    type="button"
                    onClick={handleResetPromo}
                    className="text-xs text-gray-600 hover:text-gray-900 underline underline-offset-2 min-h-[44px] px-2 -mr-2"
                  >
                    Reset
                  </button>
                </div>

                <input
                  type="number"
                  id="sellingPrice"
                  className="form-input min-h-[44px]"
                  placeholder="$"
                  value={sellingPrice}
                  min={0}
                  step={0.01}
                  onChange={(e) => setSellingPrice(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="category" className="form-label">
                  Category <span className="text-red-500">*</span>
                </label>

                <select
                  id="category"
                  className="form-input min-h-[44px]"
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

              <div className="sm:col-span-2">
                <label htmlFor="longDescr" className="form-label">
                  Long Description
                </label>
                <textarea
                  id="longDescr"
                  rows={3}
                  className="form-input"
                  placeholder="Long description here"
                  value={longDescr}
                  onChange={(e) => setLongDescr(e.target.value)}
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="shortDescr" className="form-label">
                  Short Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="shortDescr"
                  rows={3}
                  className="form-input"
                  placeholder="Short description here"
                  value={shortDescr}
                  onChange={(e) => setShortDescr(e.target.value)}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="form-label">
                  Preparation Types <span className="text-red-500">*</span>
                </label>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <input
                    type="text"
                    className="form-input min-h-[44px] flex-1"
                    value={preparationInput}
                    onChange={(e) => setPreparationInput(e.target.value)}
                    placeholder="Enter text"
                  />
                  <button
                    type="button"
                    className="w-full sm:w-auto min-h-[44px] px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700"
                    onClick={addPreparation}
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
                          className="bg-green-100 text-green-700 text-xs font-medium px-3 py-1 rounded hover:bg-green-200"
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

            <UploadImg handleCallBack={replaceMenuImage} id="editAdminImg" />

            <button
              type="submit"
              className="w-full sm:w-auto min-h-[44px] text-white inline-flex items-center justify-center bg-green-600 hover:bg-green-700 font-medium rounded-lg text-sm px-5 py-2.5 text-center mt-4"
            >
              <HiOutlinePencil className="mr-1 -ml-1 w-4 h-4" fill="currentColor" />
              Edit Menu
            </button>
          </form>
        </div>
      </Modal>
    </>
  );
};

export default AdminEditMenu;
