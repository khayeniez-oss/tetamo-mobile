import { supabase } from "../lib/supabase";

export type TetamoAgent = {
  id: string;
  name: string;
  role: string;
  phone?: string;
  agency?: string;
  photoUrl?: string;
  initials: string;
  listings: number;

  instagramUrl?: string;
  facebookUrl?: string;
  tiktokUrl?: string;
  youtubeUrl?: string;
  linkedinUrl?: string;
  whatsappUrl?: string;
};

const FEATURED_AGENT_NAMES = [
  "Franky Wardana",
  "Ir. Gunawan",
  "Lidia M. Chandra",
  "Stefanus Ricky",
];

function safeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getInitials(name: string) {
  const parts = name.trim().split(" ").filter(Boolean);

  if (parts.length === 0) return "TA";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function normalizeWhatsappPhone(value?: string | null) {
  const digits = String(value || "").replace(/[^\d]/g, "");

  if (!digits) return "";
  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  if (digits.startsWith("8")) return `62${digits}`;

  return digits;
}

function normalizeSocialUrl(platform: string, value?: string | null) {
  const raw = safeString(value);

  if (!raw) return "";
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;

  const clean = raw.replace("@", "").replace(/^\/+/, "").trim();
  if (!clean) return "";

  if (platform === "instagram") return `https://instagram.com/${clean}`;
  if (platform === "facebook") return `https://facebook.com/${clean}`;
  if (platform === "tiktok") return `https://tiktok.com/@${clean}`;
  if (platform === "linkedin") return `https://linkedin.com/in/${clean}`;
  if (platform === "youtube") return `https://youtube.com/${clean}`;

  return "";
}

function normalizeAgent(row: Record<string, any>): TetamoAgent {
  const name = safeString(row.full_name) || "Tetamo Agent";
  const phone = safeString(row.phone);
  const whatsappPhone = normalizeWhatsappPhone(phone);

  return {
    id: String(row.id),
    name,
    role: safeString(row.role) || "agent",
    phone,
    agency: safeString(row.agency),
    photoUrl: safeString(row.photo_url),
    initials: getInitials(name),
    listings: 0,

    instagramUrl: normalizeSocialUrl("instagram", row.instagram_url),
    facebookUrl: normalizeSocialUrl("facebook", row.facebook_url),
    tiktokUrl: normalizeSocialUrl("tiktok", row.tiktok_url),
    youtubeUrl: normalizeSocialUrl("youtube", row.youtube_url),
    linkedinUrl: normalizeSocialUrl("linkedin", row.linkedin_url),
    whatsappUrl: whatsappPhone ? `https://wa.me/${whatsappPhone}` : "",
  };
}

export async function fetchFeaturedAgents() {
  const results: TetamoAgent[] = [];

  for (const name of FEATURED_AGENT_NAMES) {
    const searchName = name.replace("Ir. ", "");

    const { data, error } = await supabase
      .from("profiles")
      .select(
        `
        id,
        full_name,
        role,
        phone,
        agency,
        photo_url,
        instagram_url,
        facebook_url,
        tiktok_url,
        youtube_url,
        linkedin_url
      `
      )
      .ilike("full_name", `%${searchName}%`)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.log("Tetamo featured agent fetch error:", error.message);
      continue;
    }

    if (data) {
      results.push(normalizeAgent(data));
    }
  }

  return results;
}