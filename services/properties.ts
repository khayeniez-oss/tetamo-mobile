import { supabase } from "../lib/supabase";

export type TetamoProperty = {
  id: string;
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

  image: string;
  images?: string[];
  videoUrl?: string | null;

  priceIdr: number;
  beds?: number;
  baths?: number;
  size?: number;
  landSize?: number;
  buildingSize?: number;

  badge: string;
  viewCount?: number;

  listingType?: string;
  rentalType?: string;
  saleType?: string;
  leaseYears?: number;
  leaseUntilYear?: number;
  leaseExtendable?: string;

  propertyType?: string;
  marketType?: string;
  furnishing?: string;
  certificate?: string;

  floors?: number;
  parking?: number;
  parkingOption?: string;
  electricity?: string;
  waterSource?: string;

  landUnit?: string;
  pricePerSqm?: number;
  pricePerAre?: number;
  pricePerHectare?: number;
  frontage?: number;
  depth?: number;
  dimensionText?: string;
  roadAccess?: string;
  ownershipType?: string;
  landType?: string;
  zoningType?: string;
  unitFloor?: number;
  towerBlock?: string;
  ceilingHeight?: number;

  facilities?: Record<string, boolean>;
  nearby?: Record<string, boolean>;

  contactUserId?: string;
  contactName?: string;
  contactPhone?: string;
  contactRole?: string;
  contactAgency?: string;
  contactPhotoUrl?: string;
  contactInstagramUrl?: string;
  contactFacebookUrl?: string;
  contactTiktokUrl?: string;
  contactYoutubeUrl?: string;
  contactLinkedinUrl?: string;
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

type ProfileRow = {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: string | null;
  agency: string | null;
  photo_url: string | null;
  instagram_url?: string | null;
  facebook_url?: string | null;
  tiktok_url?: string | null;
  youtube_url?: string | null;
  linkedin_url?: string | null;
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
  listing_type,
  rental_type,
  sale_type,
  lease_years,
  lease_until_year,
  lease_extendable,
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
  floors,
  floor,
  garage,
  parking_option,
  furnishing,
  electricity,
  water_type,
  water_source,
  certificate,
  ownership_type,
  land_type,
  zoning_type,
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
  facilities,
  nearby,
  cover_image_url,
  video_url,
  boost_active,
  boost_expires_at,
  spotlight_active,
  spotlight_expires_at,
  featured_expires_at,
  market_type,
  view_count,
  contact_user_id,
  contact_name,
  contact_phone,
  contact_role,
  contact_agency,
  contact_photo_url,
  created_at
`;

function safeString(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim();
}

function toNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
}

function normalizeKode(value: unknown): string {
  return safeString(value).toUpperCase().replace(/\s+/g, "");
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

function cleanVideoUrl(value: unknown): string {
  const url = safeString(value);

  if (!url) return "";

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  const cleanedPath = url
    .replace(/^\/+/, "")
    .replace(/^property-videos\//, "")
    .trim();

  if (!cleanedPath) return "";

  const { data } = supabase.storage
    .from("property-videos")
    .getPublicUrl(cleanedPath);

  return data.publicUrl || "";
}

function sortPropertyImages(images: PropertyImageRow[]) {
  return [...images].sort((a, b) => {
    const coverA = a.is_cover ? 1 : 0;
    const coverB = b.is_cover ? 1 : 0;

    if (coverA !== coverB) return coverB - coverA;

    const aOrder = Number(a.sort_order ?? 999);
    const bOrder = Number(b.sort_order ?? 999);

    if (aOrder !== bOrder) return aOrder - bOrder;

    const aCreated = new Date(a.created_at || 0).getTime();
    const bCreated = new Date(b.created_at || 0).getTime();

    return aCreated - bCreated;
  });
}

function getGalleryImages(property: PropertyRow, images: PropertyImageRow[]) {
  const urls: string[] = [];
  const coverImage = cleanImageUrl(property.cover_image_url);

  if (coverImage) {
    urls.push(coverImage);
  }

  for (const image of sortPropertyImages(images)) {
    const imageUrl = cleanImageUrl(image.image_url);

    if (imageUrl && !urls.includes(imageUrl)) {
      urls.push(imageUrl);
    }
  }

  if (urls.length === 0) {
    urls.push(FALLBACK_IMAGE);
  }

  return urls;
}

function groupImagesByPropertyId(images: PropertyImageRow[]) {
  const grouped: Record<string, PropertyImageRow[]> = {};

  for (const image of images) {
    const propertyId = String(image.property_id || "");

    if (!propertyId) continue;

    if (!grouped[propertyId]) {
      grouped[propertyId] = [];
    }

    grouped[propertyId].push(image);
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

function isPromotionActive(flag?: boolean | null, expiresAt?: string | null) {
  return Boolean(flag) && (!expiresAt || isFutureDate(expiresAt));
}

function getPropertyBadge(property: PropertyRow): string {
  if (isPromotionActive(property.spotlight_active, property.spotlight_expires_at)) {
    return "Spotlight";
  }

  if (isPromotionActive(property.boost_active, property.boost_expires_at)) {
    return "Boosted";
  }

  if (isFutureDate(property.featured_expires_at)) {
    return "Featured";
  }

  if (property.market_type === "new_project") {
    return "New Project";
  }

  if (
    property.verified_ok ||
    property.verification_status === "approved" ||
    property.verification_status === "verified"
  ) {
    return "Verified";
  }

  return "Verified";
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
  const price = Number(property.price || 0);

  if (!Number.isNaN(price) && price > 0) {
    return price;
  }

  return 0;
}

function normalizeWhatsappPhone(value?: string | null) {
  const digits = String(value || "").replace(/[^\d]/g, "");

  if (!digits) return "";

  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  if (digits.startsWith("8")) return `62${digits}`;

  return digits;
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

async function fetchProfilesForProperties(properties: PropertyRow[]) {
  const ids = Array.from(
    new Set(
      properties
        .flatMap((property) => [property.contact_user_id, property.user_id])
        .filter(Boolean)
        .map(String)
    )
  );

  if (ids.length === 0) {
    return new Map<string, ProfileRow>();
  }

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, full_name, phone, role, agency, photo_url, instagram_url, facebook_url, tiktok_url, youtube_url, linkedin_url"
    )
    .in("id", ids);

  if (error) {
    console.error("Tetamo mobile profiles fetch error:", error.message);
    return new Map<string, ProfileRow>();
  }

  return new Map((data || []).map((profile: ProfileRow) => [profile.id, profile]));
}

function normalizeProperty(
  property: PropertyRow,
  imagesByPropertyId: Record<string, PropertyImageRow[]>,
  profilesById: Map<string, ProfileRow>
): TetamoProperty {
  const propertyId = String(property.id);
  const galleryImages = getGalleryImages(
    property,
    imagesByPropertyId[propertyId] || []
  );

  const contactProfile = property.contact_user_id
    ? profilesById.get(String(property.contact_user_id))
    : undefined;

  const userProfile = property.user_id
    ? profilesById.get(String(property.user_id))
    : undefined;

  const posterProfile =
    contactProfile?.photo_url || contactProfile?.phone
      ? contactProfile
      : userProfile;

  const contactName =
    safeString(property.contact_name) ||
    safeString(contactProfile?.full_name) ||
    safeString(userProfile?.full_name);

  const contactPhone =
    normalizeWhatsappPhone(property.contact_phone) ||
    normalizeWhatsappPhone(contactProfile?.phone) ||
    normalizeWhatsappPhone(userProfile?.phone);

  const contactRole =
    safeString(property.contact_role) ||
    safeString(contactProfile?.role) ||
    safeString(userProfile?.role) ||
    safeString(property.source);

  const contactAgency =
    safeString(property.contact_agency) ||
    safeString(contactProfile?.agency) ||
    safeString(userProfile?.agency);

  const landSize = toNumber(property.land_size);
  const buildingSize = toNumber(property.building_size);

  return {
    id: propertyId,
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

    image: galleryImages[0] || FALLBACK_IMAGE,
    images: galleryImages,
    videoUrl: cleanVideoUrl(property.video_url) || null,

    priceIdr: getPrice(property),

    beds: toNumber(property.bedrooms) || 0,
    baths: toNumber(property.bathrooms) || 0,
    size: buildingSize || landSize || 0,
    landSize,
    buildingSize,

    badge: getPropertyBadge(property),
    viewCount: Number(property.view_count || 0),

    listingType: property.listing_type || undefined,
    rentalType: property.rental_type || undefined,
    saleType: property.sale_type || undefined,
    leaseYears: toNumber(property.lease_years),
    leaseUntilYear: toNumber(property.lease_until_year),
    leaseExtendable: property.lease_extendable || undefined,

    propertyType: property.property_type || undefined,
    marketType: property.market_type || undefined,
    furnishing: property.furnishing || undefined,
    certificate: property.certificate || undefined,

    floors: toNumber(property.floors || property.floor),
    parking: toNumber(property.garage),
    parkingOption: property.parking_option || undefined,
    electricity: property.electricity || undefined,
    waterSource: property.water_source || property.water_type || undefined,

    landUnit: property.land_unit || undefined,
    pricePerSqm: toNumber(property.price_per_sqm),
    pricePerAre: toNumber(property.price_per_are),
    pricePerHectare: toNumber(property.price_per_hectare),
    frontage: toNumber(property.frontage),
    depth: toNumber(property.depth),
    dimensionText: property.dimension_text || undefined,
    roadAccess: property.road_access || undefined,
    ownershipType: property.ownership_type || undefined,
    landType: property.land_type || undefined,
    zoningType: property.zoning_type || undefined,
    unitFloor: toNumber(property.unit_floor),
    towerBlock: property.tower_block || undefined,
    ceilingHeight: toNumber(property.ceiling_height),

    facilities: property.facilities || {},
    nearby: property.nearby || {},

    contactUserId: property.contact_user_id || property.user_id || undefined,
    contactName: contactName || undefined,
    contactPhone: contactPhone || undefined,
    contactRole: contactRole || undefined,
    contactAgency: contactAgency || undefined,
    contactPhotoUrl: property.contact_photo_url || posterProfile?.photo_url || undefined,
    contactInstagramUrl: posterProfile?.instagram_url || undefined,
    contactFacebookUrl: posterProfile?.facebook_url || undefined,
    contactTiktokUrl: posterProfile?.tiktok_url || undefined,
    contactYoutubeUrl: posterProfile?.youtube_url || undefined,
    contactLinkedinUrl: posterProfile?.linkedin_url || undefined,
  };
}

async function attachImagesProfilesAndNormalize(properties: PropertyRow[]) {
  const propertyIds = properties
    .map((property) => String(property.id))
    .filter(Boolean);

  const [images, profilesById] = await Promise.all([
    fetchPropertyImages(propertyIds),
    fetchProfilesForProperties(properties),
  ]);

  const imagesByPropertyId = groupImagesByPropertyId(images);

  return properties.map((property) =>
    normalizeProperty(property, imagesByPropertyId, profilesById)
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

  return attachImagesProfilesAndNormalize(data || []);
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

  const normalized = await attachImagesProfilesAndNormalize(data || []);

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

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

export async function fetchPropertyByPathKey(pathKey: string) {
  const key = safeString(pathKey);

  if (!key) return null;

  const attempts = [
    { column: "slug", value: key },
    ...(isUuid(key) ? [{ column: "id", value: key }] : []),
    { column: "kode", value: key },
  ];

  for (const attempt of attempts) {
    const { data, error } = await supabase
      .from("properties")
      .select(PROPERTY_SELECT)
      .eq(attempt.column, attempt.value)
      .maybeSingle();

    if (error) {
      console.error(
        `Tetamo mobile property detail fetch error by ${attempt.column}:`,
        error.message
      );
      continue;
    }

    if (data) {
      const normalized = await attachImagesProfilesAndNormalize([data]);
      return normalized[0] || null;
    }
  }

  return null;
}