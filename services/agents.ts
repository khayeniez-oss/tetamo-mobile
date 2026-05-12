import { supabase } from "../lib/supabase";

export type TetamoAgent = {
  id: string;
  name: string;
  role: string;
  agency?: string;
  phone?: string;
  photoUrl?: string;
  initials: string;
  rating: number;
  listings: number;
};

const FEATURED_AGENT_SEARCHES = [
  {
    keyword: "Franky",
    displayName: "Franky Wardana (BERD)",
    fallbackRole: "BERD",
  },
  {
    keyword: "Gunawan",
    displayName: "Ir. Gunawan",
    fallbackRole: "Featured Agent",
  },
  {
    keyword: "Lidia",
    displayName: "Lidia M. Chandra",
    fallbackRole: "Featured Agent",
  },
  {
    keyword: "Stefanus",
    displayName: "Stefanus Ricky",
    fallbackRole: "Featured Agent",
  },
];

function safeString(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim();
}

function getInitials(name: string) {
  const cleanedName = name.replace(/\bIr\.\s*/gi, "").replace(/\([^)]*\)/g, "");
  const parts = cleanedName
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) return "TA";

  const first = parts[0]?.[0] || "";
  const second = parts.length > 1 ? parts[1]?.[0] || "" : "";

  return `${first}${second || first}`.toUpperCase();
}

function cleanPhotoUrl(value: unknown): string {
  const photoUrl = safeString(value);

  if (!photoUrl) return "";

  if (photoUrl.startsWith("http://") || photoUrl.startsWith("https://")) {
    return photoUrl;
  }

  return photoUrl;
}

function fallbackAgent(
  fallback: (typeof FEATURED_AGENT_SEARCHES)[number],
  index: number
): TetamoAgent {
  return {
    id: fallback.keyword,
    name: fallback.displayName,
    role: fallback.fallbackRole,
    agency: fallback.fallbackRole,
    phone: "",
    photoUrl: "",
    initials: getInitials(fallback.displayName),
    rating: index <= 1 ? 4.9 : 4.8,
    listings: index === 0 ? 128 : index === 1 ? 96 : index === 2 ? 142 : 105,
  };
}

function normalizeAgent(
  row: any,
  fallback: (typeof FEATURED_AGENT_SEARCHES)[number],
  index: number
): TetamoAgent {
  const name = safeString(row?.full_name) || fallback.displayName;
  const agency = safeString(row?.agency);
  const role = agency || safeString(row?.role) || fallback.fallbackRole;

  return {
    id: safeString(row?.id) || fallback.keyword,
    name,
    role,
    agency,
    phone: safeString(row?.phone),
    photoUrl: cleanPhotoUrl(row?.photo_url),
    initials: getInitials(name),
    rating: index <= 1 ? 4.9 : 4.8,
    listings: index === 0 ? 128 : index === 1 ? 96 : index === 2 ? 142 : 105,
  };
}

export async function fetchFeaturedAgents() {
  const agents: TetamoAgent[] = [];

  for (let index = 0; index < FEATURED_AGENT_SEARCHES.length; index += 1) {
    const search = FEATURED_AGENT_SEARCHES[index];

    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, role, phone, agency, photo_url")
      .ilike("full_name", `%${search.keyword}%`)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error(
        `Tetamo mobile featured agent fetch error: ${search.keyword}`,
        error.message
      );
      agents.push(fallbackAgent(search, index));
      continue;
    }

    if (!data) {
      agents.push(fallbackAgent(search, index));
      continue;
    }

    agents.push(normalizeAgent(data, search, index));
  }

  return agents;
}