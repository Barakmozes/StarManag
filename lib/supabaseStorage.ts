import { createClient,type SupabaseClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

const supabase = createClient(url, key, {
  auth: {
    persistSession: false,
  },
});

let _browserClient: SupabaseClient | null = null;

function getSupabaseBrowserClient() {
  if (_browserClient) return _browserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  _browserClient = createClient(url, anonKey);
  return _browserClient;
}

export async function uploadPublicImage(params: {
  bucket: string;
  folder: string;
  file: File;
}): Promise<string> {
  const supabase = getSupabaseBrowserClient();
  const { bucket, folder, file } = params;

  const ext =
    (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "");
  const uuid =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const path = `${folder}/${uuid}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("Bucket_StarMang")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: true,
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  if (!data?.publicUrl) throw new Error("Supabase did not return a publicUrl.");

  return data.publicUrl;
}

export const SupabaseImageUpload = async (file: File) => {
  const filename = `${uuidv4()}-${file?.name}`;

  const { data, error } = await supabase.storage
    .from("Bucket_StarMang")
    .upload("public/" + filename, file as File);
  if (data) {
    console.log(data);
  } else if (error) {
    console.log(error);
  }

  const filepath = data?.path;
  const { data: clientUrl } = supabase.storage
    .from("Bucket_StarMang")
    .getPublicUrl(`${filepath}`);

  return clientUrl.publicUrl;
};

export const SupabaseImageDelete = async (file: string) => {
  const { data, error } = await supabase.storage
    .from("Bucket_StarMang")
    .remove([`public/${file}`]);

  console.log(data);
};