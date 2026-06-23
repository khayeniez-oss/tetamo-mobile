import { supabase } from "../lib/supabase";

export type TetamoProperty = {
  id: string;
  userId?: string;
  source?: string;
  kode?: string;
  slug?: string;

  titleEn: string;
  titleId: string;
  descriptionEn?: string;
  descriptionId?: string;

  location: string;
  country?: string;
  province?: string;
  city?: string;
  area?: string;
  address?: string;
  housingName?: string;

  image: string;
  images: string[];
  videoUrl?: string;

  priceIdr: number;

  beds?: number;
  baths?: number;
  size?: number;

  landSize?: number;
  buildingSize?: number;
  landUnit?: string;

  badge: string;

  viewCount?: number;
  likeCount?: number;
  saveCount?: number;
  ratingCount?: number;
  ratingAverage?: number;
  shareCount?: number;

  listingType?: string;
  rentalType?: string;
  saleType?: string;
  propertyType?: string;
  marketType?: string;

  furnishing?: string;
  certificate?: string;
  ownershipType?: string;
  landType?: string;
  zoningType?: string;
  electricity?: string;
  waterSource?: string;
  waterType?: string;
  floors?: number;
  floor?: number;
  parking?: number;
  parkingOption?: string;
  roadAccess?: string;
  dimensionText?: string;

  pricePerSqm?: number;
  pricePerAre?: number;
  pricePerHectare?: number;
  frontage?: number;
  depth?: number;
  unitFloor?: string;
  towerBlock?: string;
  ceilingHeight?: number;

  leaseYears?: number;
  leaseUntilYear?: number;
  leaseExtendable?: boolean;

  contactUserId?: string;
  contactName?: string;
  contactPhone?: string;
  contactRole?: string;
  contactAgency?: string;
  contactPhotoUrl?: string;

  createdAt?: string;
  updatedAt?: string;
};

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?q=80&w=1400&auto=format&fit=crop";

type PropertyRow = Record<string, any>;

type PropertyImageRow = {
  id: string;
  property_id: string;
  image_url: string | null;
  sort_order: number | null;
  is_cover: boolean | null;
  created_at: string | null;
};

type PropertyEngagementRow = {
  property_id: string;
  save_count: number | null;
  like_count: number | null;
  rating_count: number | null;
  avg_rating: number | null;
  share_count: number | null;
};

const PROPERTY_SELECT = `
  id,
  user_id,
  source,
  slug,
  kode,
  status,
  verified_ok,
  verification_status,
  is_paused,
  transaction_status,
  listing_type,
  rental_type,
  sale_type,
  property_type,
  title,
  title_id,
  description,
  description_en,
  description_id,
  price,
  country,
  province,
  city,
  area,
  address,
  housing_name,
  land_size,
  building_size,
  bedrooms,
  bathrooms,
  maid_room,
  garage,
  parking_option,
  floor,
  floors,
  furnishing,
  electricity,
  water_type,
  water_source,
  certificate,
  ownership_type,
  land_type,
  zoning_type,
  cover_image_url,
  video_url,
  boost_active,
  boost_expires_at,
  spotlight_active,
  spotlight_expires_at,
  featured_expires_at,
  listing_expires_at,
  market_type,
  view_count,
  land_unit,
  price_per_sqm,
  price_per_are,
  price_per_hectare,
  frontage,
  depth,
  dimension_text,
  road_access,
  unit_floor,
  tower_block,
  ceiling_height,
  lease_years,
  lease_until_year,
  lease_extendable,
  contact_user_id,
  contact_name,
  contact_phone,
  contact_role,
  contact_agency,
  contact_photo_url,
  created_at,
  updated_at
`;

function safeString(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim();
}

function safeNumber(value: unknown): number {
  const next = Number(value || 0);
  return Number.isFinite(next) ? next : 0;
}

function safeBoolean(value: unknown): boolean {
  return value === true || value === "true" || value === 1 || value === "1";
}

function normalizeKode(value: unknown): string {
  return safeString(value).toUpperCase().replace(/\s+/g, "").replace(/-/g, "");
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function buildKodeVariants(codes: string[]) {
  const variants = new Set<string>();

  for (const code of codes) {
    const raw = safeString(code);
    if (!raw) continue;

    const upper = raw.toUpperCase();

    variants.add(raw);
    variants.add(upper);
    variants.add(raw.replace(/\s*-\s*/g, " - "));
    variants.add(upper.replace(/\s*-\s*/g, " - "));
    variants.add(raw.replace(/\s*-\s*/g, "-"));
    variants.add(upper.replace(/\s*-\s*/g, "-"));
    variants.add(raw.replace(/-/g, " - "));
    variants.add(upper.replace(/-/g, " - "));

    const compactDash = raw.replace(/\s*-\s*/g, "-");
    variants.add(compactDash);
    variants.add(compactDash.toUpperCase());

    const spacedDash = compactDash.replace(/-/g, " - ");
    variants.add(spacedDash);
    variants.add(spacedDash.toUpperCase());
  }

  return Array.from(variants);
}

function cleanImageUrl(value: unknown): string {
  const url = safeString(value);

  if (!url) return "";

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  const cleanedPath = url
    .replace(/^\/+/, "")
    .replace(/^property-images\//, "")
    .trim();

  if (!cleanedPath) return "";

  const { data } = supabase.storage
    .from("property-images")
    .getPublicUrl(cleanedPath);

  return data.publicUrl || "";
}

function sortImages(images: PropertyImageRow[]) {
  return [...images].sort((a, b) => {
    if (a.is_cover && !b.is_cover) return -1;
    if (!a.is_cover && b.is_cover) return 1;

    const aOrder = Number(a.sort_order ?? 999);
    const bOrder = Number(b.sort_order ?? 999);

    if (aOrder !== bOrder) return aOrder - bOrder;

    const aCreated = new Date(a.created_at || 0).getTime();
    const bCreated = new Date(b.created_at || 0).getTime();

    return aCreated - bCreated;
  });
}

function getImageUrlsFromRows(images: PropertyImageRow[]) {
  return sortImages(images)
    .map((image) => cleanImageUrl(image.image_url))
    .filter(Boolean);
}

function groupImagesByPropertyId(images: PropertyImageRow[]) {
  const grouped: Record<string, PropertyImageRow[]> = {};

  for (const image of images) {
    const propertyId = String(image.property_id || "");
    if (!propertyId) continue;

    if (!grouped[propertyId]) grouped[propertyId] = [];
    grouped[propertyId].push(image);
  }

  return grouped;
}

function groupEngagementByPropertyId(rows: PropertyEngagementRow[]) {
  const grouped: Record<string, PropertyEngagementRow> = {};

  for (const row of rows) {
    const propertyId = String(row.property_id || "");
    if (!propertyId) continue;

    grouped[propertyId] = row;
  }

  return grouped;
}

function isFutureDate(value: unknown) {
  const dateString = safeString(value);
  if (!dateString) return false;

  const time = new Date(dateString).getTime();
  if (Number.isNaN(time)) return false;

  return time > Date.now();
}

function normalizeTransactionStatus(value: unknown) {
  const status = safeString(value).toLowerCase();

  if (status === "sold") return "sold";
  if (status === "rented") return "rented";

  return "available";
}

function isPublicProperty(property: PropertyRow) {
  const status = safeString(property.status).toLowerCase();
  const verificationStatus = safeString(property.verification_status).toLowerCase();

  if (status === "rejected") return false;
  if (status === "pending_payment") return false;
  if (verificationStatus === "pending_payment") return false;
  if (safeBoolean(property.is_paused)) return false;

  if (normalizeTransactionStatus(property.transaction_status) !== "available") {
    return false;
  }

  if (property.listing_expires_at && !isFutureDate(property.listing_expires_at)) {
    return false;
  }

  return true;
}

function getPropertyBadge(property: PropertyRow): string {
  if (property.spotlight_active) return "Spotlight";
  if (property.boost_active) return "Boosted";
  if (isFutureDate(property.featured_expires_at)) return "Featured";
  if (property.market_type === "new_project") return "New Project";

  const verificationStatus = safeString(property.verification_status).toLowerCase();

  if (
    property.verified_ok === true ||
    verificationStatus === "verified" ||
    verificationStatus === "approved"
  ) {
    return "Verified";
  }

  if (
    verificationStatus === "pending_verification" ||
    verificationStatus === "pending_approval"
  ) {
    return "Pending Verification";
  }

  return "Pending Verification";
}

function getLocation(property: PropertyRow): string {
  const parts = [
    property.area,
    property.city,
    property.province,
    property.country,
  ].filter(Boolean);

  if (parts.length > 0) {
    return Array.from(new Set(parts.map(String))).join(", ");
  }

  return property.address || "Indonesia";
}

function getPrice(property: PropertyRow): number {
  const price = safeNumber(property.price);
  return price > 0 ? price : 0;
}

function normalizeProperty(
  property: PropertyRow,
  imagesByPropertyId: Record<string, PropertyImageRow[]>,
  engagementByPropertyId: Record<string, PropertyEngagementRow>,
): TetamoProperty {
  const propertyId = String(property.id);

  const coverImage = cleanImageUrl(property.cover_image_url);
  const imageUrls = getImageUrlsFromRows(imagesByPropertyId[propertyId] || []);

  const finalImages = coverImage
    ? [coverImage, ...imageUrls.filter((url) => url !== coverImage)]
    : imageUrls;

  const finalImage = finalImages[0] || FALLBACK_IMAGE;
  const engagement = engagementByPropertyId[propertyId];

  return {
    id: propertyId,
    userId: property.user_id || undefined,
    source: property.source || undefined,
    kode: property.kode || undefined,
    slug: property.slug || property.kode || undefined,

    titleEn:
      property.title ||
      property.title_en ||
      property.name ||
      "Tetamo Property Listing",

    titleId:
      property.title_id ||
      property.title ||
      property.name ||
      "Listing Properti Tetamo",

    descriptionEn: property.description_en || property.description || "",

    descriptionId:
      property.description_id ||
      property.description ||
      property.description_en ||
      "",

    location: getLocation(property),
    country: property.country || undefined,
    province: property.province || undefined,
    city: property.city || undefined,
    area:
      property.area ||
      property.city ||
      property.province ||
      property.country ||
      "Indonesia",
    address: property.address || undefined,
    housingName: property.housing_name || undefined,

    image: finalImage,
    images: finalImages.length > 0 ? finalImages : [FALLBACK_IMAGE],
    videoUrl: property.video_url || undefined,

    priceIdr: getPrice(property),

    beds: safeNumber(property.bedrooms),
    baths: safeNumber(property.bathrooms),
    size: safeNumber(property.building_size || property.land_size),

    landSize: safeNumber(property.land_size),
    buildingSize: safeNumber(property.building_size),
    landUnit: property.land_unit || undefined,

    badge: getPropertyBadge(property),

    viewCount: safeNumber(property.view_count),

    likeCount: safeNumber(engagement?.like_count),
    saveCount: safeNumber(engagement?.save_count),
    ratingCount: safeNumber(engagement?.rating_count),
    ratingAverage: Number(safeNumber(engagement?.avg_rating).toFixed(1)),
    shareCount: safeNumber(engagement?.share_count),

    listingType: property.listing_type || undefined,
    rentalType: property.rental_type || undefined,
    saleType: property.sale_type || undefined,
    propertyType: property.property_type || undefined,
    marketType: property.market_type || undefined,

    furnishing: property.furnishing || undefined,
    certificate: property.certificate || undefined,
    ownershipType: property.ownership_type || undefined,
    landType: property.land_type || undefined,
    zoningType: property.zoning_type || undefined,
    electricity: property.electricity || undefined,
    waterSource: property.water_source || property.water_type || undefined,
    waterType: property.water_type || undefined,
    floors: safeNumber(property.floors),
    floor: safeNumber(property.floor),
    parking: safeNumber(property.garage),
    parkingOption: property.parking_option || undefined,
    roadAccess: property.road_access || undefined,
    dimensionText: property.dimension_text || undefined,

    pricePerSqm: safeNumber(property.price_per_sqm),
    pricePerAre: safeNumber(property.price_per_are),
    pricePerHectare: safeNumber(property.price_per_hectare),
    frontage: safeNumber(property.frontage),
    depth: safeNumber(property.depth),
    unitFloor: property.unit_floor || undefined,
    towerBlock: property.tower_block || undefined,
    ceilingHeight: safeNumber(property.ceiling_height),

    leaseYears: safeNumber(property.lease_years),
    leaseUntilYear: safeNumber(property.lease_until_year),
    leaseExtendable: safeBoolean(property.lease_extendable),

    contactUserId: property.contact_user_id || undefined,
    contactName: property.contact_name || undefined,
    contactPhone: property.contact_phone || undefined,
    contactRole: property.contact_role || undefined,
    contactAgency: property.contact_agency || undefined,
    contactPhotoUrl: property.contact_photo_url || undefined,

    createdAt: property.created_at || undefined,
    updatedAt: property.updated_at || undefined,
  };
}

async function fetchPropertyImages(propertyIds: string[]) {
  if (propertyIds.length === 0) return [];

  const { data, error } = await supabase
    .from("property_images")
    .select("id, property_id, image_url, sort_order, is_cover, created_at")
    .in("property_id", propertyIds);

  if (error) {
    console.error("Tetamo mobile property_images fetch error:", error.message);
    return [];
  }

  return (data || []) as PropertyImageRow[];
}

async function fetchPropertyEngagement(propertyIds: string[]) {
  if (propertyIds.length === 0) return [];

  const { data, error } = await supabase
    .from("property_engagement_summary")
    .select(
      "property_id, save_count, like_count, rating_count, avg_rating, share_count",
    )
    .in("property_id", propertyIds);

  if (error) {
    console.error(
      "Tetamo mobile property_engagement_summary fetch error:",
      error.message,
    );
    return [];
  }

  return (data || []) as PropertyEngagementRow[];
}

async function attachImagesEngagementAndNormalize(properties: PropertyRow[]) {
  const publicProperties = properties.filter(isPublicProperty);

  const propertyIds = publicProperties
    .map((property) => String(property.id))
    .filter(Boolean);

  const [images, engagement] = await Promise.all([
    fetchPropertyImages(propertyIds),
    fetchPropertyEngagement(propertyIds),
  ]);

  const imagesByPropertyId = groupImagesByPropertyId(images);
  const engagementByPropertyId = groupEngagementByPropertyId(engagement);

  return publicProperties.map((property) =>
    normalizeProperty(property, imagesByPropertyId, engagementByPropertyId),
  );
}

export async function fetchHomepageProperties(limit = 12) {
  const { data, error } = await supabase
    .from("properties")
    .select(PROPERTY_SELECT)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Tetamo mobile properties fetch error:", error.message);
    throw error;
  }

  return attachImagesEngagementAndNormalize(data || []);
}

export async function fetchPropertiesByCodes(codes: string[]) {
  if (codes.length === 0) return [];

  const variants = buildKodeVariants(codes);

  const { data, error } = await supabase
    .from("properties")
    .select(PROPERTY_SELECT)
    .in("kode", variants);

  if (error) {
    console.error("Tetamo mobile kode fetch error:", error.message);
    throw error;
  }

  const normalized = await attachImagesEngagementAndNormalize(data || []);

  const orderMap = new Map<string, number>();

  codes.forEach((code, index) => {
    orderMap.set(normalizeKode(code), index);
  });

  return normalized.sort((a, b) => {
    const aOrder = orderMap.get(normalizeKode(a.kode)) ?? 999;
    const bOrder = orderMap.get(normalizeKode(b.kode)) ?? 999;

    return aOrder - bOrder;
  });
}

export async function fetchPropertyByPathKey(pathKey: string) {
  const key = safeString(decodeURIComponent(pathKey || ""));

  if (!key) return null;

  const tryQueries: Promise<{ data: PropertyRow | null; error: any }>[] = [];

  tryQueries.push(
    supabase
      .from("properties")
      .select(PROPERTY_SELECT)
      .eq("slug", key)
      .maybeSingle() as any,
  );

  if (isUuid(key)) {
    tryQueries.push(
      supabase
        .from("properties")
        .select(PROPERTY_SELECT)
        .eq("id", key)
        .maybeSingle() as any,
    );
  }

  const kodeVariants = buildKodeVariants([key]);

  if (kodeVariants.length > 0) {
    tryQueries.push(
      supabase
        .from("properties")
        .select(PROPERTY_SELECT)
        .in("kode", kodeVariants)
        .limit(1)
        .maybeSingle() as any,
    );
  }

  for (const query of tryQueries) {
    const { data, error } = await query;

    if (error) {
      console.error(
        "Tetamo mobile property detail fetch error:",
        error.message,
      );
      continue;
    }

    if (data && isPublicProperty(data)) {
      const normalized = await attachImagesEngagementAndNormalize([data]);
      return normalized[0] || null;
    }
  }

  return null;
}