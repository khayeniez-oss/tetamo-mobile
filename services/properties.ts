import { supabase } from "../lib/supabase";

export type TetamoProperty = {
  id: string;
  slug?: string;
  titleEn: string;
  titleId: string;
  descriptionEn?: string;
  descriptionId?: string;
  location: string;
  area?: string;
  image: string;
  priceIdr: number;
  beds?: number;
  baths?: number;
  size?: number;
  badge: string;
  viewCount?: number;
};

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?q=80&w=1400&auto=format&fit=crop";

function parseMaybeJson(value: unknown): unknown {
  if (typeof value !== "string") return value;

  const trimmed = value.trim();

  if (!trimmed) return null;

  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}

function extractImageFromUnknown(value: unknown): string | null {
  const parsed = parseMaybeJson(value);

  if (!parsed) return null;

  if (typeof parsed === "string") {
    return parsed.trim() || null;
  }

  if (Array.isArray(parsed)) {
    for (const item of parsed) {
      const extracted = extractImageFromUnknown(item);
      if (extracted) return extracted;
    }

    return null;
  }

  if (typeof parsed === "object") {
    const item = parsed as Record<string, unknown>;

    const possibleKeys = [
      "url",
      "publicUrl",
      "public_url",
      "signedUrl",
      "signed_url",
      "src",
      "uri",
      "path",
      "file_path",
      "storage_path",
      "image_path",
      "image",
      "image_url",
      "photo_url",
      "thumbnail_url",
      "cover_image",
      "cover_image_url",
    ];

    for (const key of possibleKeys) {
      const extracted = extractImageFromUnknown(item[key]);
      if (extracted) return extracted;
    }
  }

  return null;
}

function cleanStoragePath(path: string): string {
  return path
    .replace(/^\/+/, "")
    .replace(/^public\//, "")
    .replace(/^storage\/v1\/object\/public\/property-images\//, "")
    .replace(/^property-images\//, "")
    .trim();
}

function makeImageUrl(value: unknown): string {
  const rawImage = extractImageFromUnknown(value);

  if (!rawImage) return FALLBACK_IMAGE;

  if (rawImage.startsWith("http://") || rawImage.startsWith("https://")) {
    return encodeURI(rawImage);
  }

  const cleanedPath = cleanStoragePath(rawImage);

  if (!cleanedPath) return FALLBACK_IMAGE;

  const { data } = supabase.storage
    .from("property-images")
    .getPublicUrl(cleanedPath);

  return encodeURI(data.publicUrl || FALLBACK_IMAGE);
}

function sortPropertyImages(images: any[] | null | undefined) {
  return [...(images || [])].sort((a, b) => {
    const aCover = Boolean(
      a?.is_cover || a?.cover || a?.is_primary || a?.is_featured
    );
    const bCover = Boolean(
      b?.is_cover || b?.cover || b?.is_primary || b?.is_featured
    );

    if (aCover && !bCover) return -1;
    if (!aCover && bCover) return 1;

    const aOrder = Number(
      a?.sort_order ?? a?.order_index ?? a?.position ?? a?.display_order ?? 999
    );
    const bOrder = Number(
      b?.sort_order ?? b?.order_index ?? b?.position ?? b?.display_order ?? 999
    );

    if (aOrder !== bOrder) return aOrder - bOrder;

    const aCreated = new Date(a?.created_at || 0).getTime();
    const bCreated = new Date(b?.created_at || 0).getTime();

    return aCreated - bCreated;
  });
}

function getFirstAvailableImage(property: Record<string, any>): string {
  const relatedImages = sortPropertyImages(property.property_images);

  for (const imageRow of relatedImages) {
    const imageUrl = makeImageUrl(imageRow);

    if (imageUrl && imageUrl !== FALLBACK_IMAGE) {
      return imageUrl;
    }
  }

  const possibleImageFields = [
    property.cover_image_url,
    property.cover_image,
    property.main_image,
    property.thumbnail_url,
    property.image_url,
    property.featured_image,
    property.photo_url,
    property.images,
    property.image_urls,
    property.photos,
    property.media,
    property.gallery,
    property.listing_images,
  ];

  for (const field of possibleImageFields) {
    const imageUrl = makeImageUrl(field);

    if (imageUrl && imageUrl !== FALLBACK_IMAGE) {
      return imageUrl;
    }
  }

  return FALLBACK_IMAGE;
}

function getPropertyBadge(property: Record<string, any>): string {
  if (property.spotlight_active || property.is_spotlight || property.spotlight) {
    return "Spotlight";
  }

  if (property.boost_active || property.is_boosted || property.boosted) {
    return "Boosted";
  }

  if (property.featured || property.is_featured || property.featured_listing) {
    return "Featured";
  }

  if (property.is_new_project || property.project_id || property.developer_id) {
    return "New Project";
  }

  if (property.verified_listing || property.is_verified || property.verified) {
    return "Verified";
  }

  return "Verified";
}

function getLocation(property: Record<string, any>): string {
  const locationParts = [
    property.area,
    property.district,
    property.subdistrict,
    property.city,
    property.regency,
    property.province,
  ].filter(Boolean);

  if (locationParts.length > 0) {
    return Array.from(new Set(locationParts.map(String))).join(", ");
  }

  return (
    property.location ||
    property.address ||
    property.full_address ||
    property.display_location ||
    "Indonesia"
  );
}

function getPrice(property: Record<string, any>): number {
  const candidates = [
    property.price_idr,
    property.price,
    property.sale_price,
    property.rent_price,
    property.monthly_price,
    property.yearly_price,
    property.daily_price,
    property.amount,
  ];

  for (const candidate of candidates) {
    const numeric = Number(candidate);

    if (!Number.isNaN(numeric) && numeric > 0) {
      return numeric;
    }
  }

  return 0;
}

function getPropertyImageGroupKey(imageRow: Record<string, any>) {
  return String(
    imageRow.property_id ||
      imageRow.propertyId ||
      imageRow.property ||
      imageRow.listing_id ||
      imageRow.listingId ||
      ""
  );
}

function groupImagesByPropertyId(images: Record<string, any>[]) {
  const grouped: Record<string, Record<string, any>[]> = {};

  for (const image of images) {
    const key = getPropertyImageGroupKey(image);

    if (!key) continue;

    if (!grouped[key]) {
      grouped[key] = [];
    }

    grouped[key].push(image);
  }

  return grouped;
}

function normalizeProperty(property: Record<string, any>): TetamoProperty {
  return {
    id: String(property.id),
    slug: property.slug || property.kode || undefined,

    titleEn:
      property.title ||
      property.title_en ||
      property.name ||
      "Tetamo Property Listing",

    titleId:
      property.title_id ||
      property.title_indonesian ||
      property.title ||
      property.name ||
      "Listing Properti Tetamo",

    descriptionEn:
      property.description ||
      property.description_en ||
      property.short_description ||
      "",

    descriptionId:
      property.description_id ||
      property.description_indonesian ||
      property.description ||
      property.short_description ||
      "",

    location: getLocation(property),

    area:
      property.area ||
      property.district ||
      property.city ||
      property.regency ||
      property.province ||
      property.location ||
      "Indonesia",

    image: getFirstAvailableImage(property),

    priceIdr: getPrice(property),

    beds: Number(property.bedrooms || property.beds || property.bedroom || 0),

    baths: Number(
      property.bathrooms || property.baths || property.bathroom || 0
    ),

    size: Number(
      property.building_size ||
        property.land_size ||
        property.size ||
        property.area_size ||
        property.luas_bangunan ||
        property.luas_tanah ||
        0
    ),

    badge: getPropertyBadge(property),

    viewCount: Number(property.view_count || property.views || 0),
  };
}

async function fetchPropertiesOnly(limit: number) {
  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Tetamo mobile properties fetch error:", error.message);
    throw error;
  }

  return data || [];
}

async function fetchPropertyImages(propertyIds: string[]) {
  if (propertyIds.length === 0) return [];

  const { data, error } = await supabase
    .from("property_images")
    .select("*")
    .in("property_id", propertyIds);

  if (error) {
    console.error("Tetamo mobile property_images fetch error:", error.message);
    return [];
  }

  return data || [];
}

export async function fetchHomepageProperties(limit = 12) {
  const properties = await fetchPropertiesOnly(limit);
  const propertyIds = properties.map((property) => String(property.id));

  const images = await fetchPropertyImages(propertyIds);
  const imagesByPropertyId = groupImagesByPropertyId(images);

  const propertiesWithImages = properties.map((property) => ({
    ...property,
    property_images: imagesByPropertyId[String(property.id)] || [],
  }));

  return propertiesWithImages.map((property) => normalizeProperty(property));
}