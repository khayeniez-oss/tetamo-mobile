import { supabase } from "./supabase";

export type SalesStage =
  | "new_inquiry"
  | "lead"
  | "agent_package"
  | "owner_package"
  | "developer_agency"
  | "follow_up"
  | "payment_started"
  | "payment_failed"
  | "closed_won"
  | "closed_lost";

export type FilterValue =
  | "all"
  | "needs_admin"
  | "needs_stage_review"
  | "active_ai"
  | "paused_ai"
  | "handled";

export type ChannelFilterValue =
  | "all_channels"
  | "meta_whatsapp"
  | "twilio_whatsapp"
  | "unknown_channel";

export type SalesStageFilterValue =
  | "all_stages"
  | SalesStage;

export type Conversation = {
  id: string;
  phone: string | null;
  phone_e164: string | null;
  profile_name: string | null;
  channel: string | null;
  status: string | null;
  ai_enabled: boolean | null;
  handover_to_admin: boolean | null;
  handover_reason: string | null;

  sales_stage: SalesStage | null;
  sales_stage_updated_at: string | null;
  sales_stage_updated_by: string | null;

  suggested_sales_stage: SalesStage | null;
  suggested_sales_stage_reason: string | null;
  suggested_sales_stage_confidence: number | null;
  suggested_sales_stage_at: string | null;

  last_inbound_at: string | null;

  window_expires_at: string | null;

  free_entry_point_expires_at: string | null;
  free_entry_point_source: string | null;

  ad_referral_source: string | null;
  ad_referral_payload: unknown | null;
  ad_referral_updated_at: string | null;

  last_message: string | null;
  last_message_direction: string | null;
  last_message_at: string | null;

  created_at: string | null;
  updated_at: string | null;
};

export type Message = {
  id: string;
  conversation_id: string;
  direction: string;
  from_number: string | null;
  to_number: string | null;
  phone: string | null;
  profile_name: string | null;
  message: string | null;
  source: string | null;
  ai_generated: boolean | null;
  admin_generated: boolean | null;
  media_count: number | null;
  created_at: string | null;
};

export type ConversationStats = {
  total: number;
  metaDirect: number;
  twilio: number;
  adWindowOpen: number;
  needsAdmin: number;
  activeAi: number;
  pausedAi: number;
  handled: number;
  needsStageReview: number;
  salesStages: Record<
    SalesStage,
    number
  >;
};

export type PaginationState = {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  from: number;
  to: number;
};

export const FILTERS: {
  value: FilterValue;
  label: string;
}[] = [
  {
    value: "all",
    label: "All",
  },
  {
    value: "needs_admin",
    label: "Needs Admin",
  },
  {
    value: "needs_stage_review",
    label: "Stage Review",
  },
  {
    value: "active_ai",
    label: "AI Active",
  },
  {
    value: "paused_ai",
    label: "AI Paused",
  },
  {
    value: "handled",
    label: "Handled",
  },
];

export const CHANNEL_FILTERS: {
  value: ChannelFilterValue;
  label: string;
}[] = [
  {
    value: "all_channels",
    label: "All Sources",
  },
  {
    value: "meta_whatsapp",
    label: "Meta Direct",
  },
  {
    value: "twilio_whatsapp",
    label: "Twilio",
  },
  {
    value: "unknown_channel",
    label: "Unknown",
  },
];

export const SALES_STAGE_FILTERS: {
  value: SalesStageFilterValue;
  label: string;
}[] = [
  {
    value: "all_stages",
    label: "All Stages",
  },
  {
    value: "new_inquiry",
    label: "New Inquiry",
  },
  {
    value: "lead",
    label: "Lead",
  },
  {
    value: "agent_package",
    label: "Agent Package",
  },
  {
    value: "owner_package",
    label: "Owner Package",
  },
  {
    value: "developer_agency",
    label: "Developer / Agency",
  },
  {
    value: "follow_up",
    label: "Follow-Up",
  },
  {
    value: "payment_started",
    label: "Payment Started",
  },
  {
    value: "payment_failed",
    label: "Payment Failed",
  },
  {
    value: "closed_won",
    label: "Closed Won",
  },
  {
    value: "closed_lost",
    label: "Closed Lost",
  },
];

export const SALES_STAGE_LABELS: Record<
  SalesStage,
  string
> = {
  new_inquiry: "New Inquiry",
  lead: "Lead",
  agent_package: "Agent Package",
  owner_package: "Owner Package",
  developer_agency:
    "Developer / Agency",
  follow_up: "Follow-Up",
  payment_started:
    "Payment Started",
  payment_failed:
    "Payment Failed",
  closed_won: "Closed Won",
  closed_lost: "Closed Lost",
};

export const EMPTY_STATS: ConversationStats = {
  total: 0,
  metaDirect: 0,
  twilio: 0,
  adWindowOpen: 0,
  needsAdmin: 0,
  activeAi: 0,
  pausedAi: 0,
  handled: 0,
  needsStageReview: 0,

  salesStages: {
    new_inquiry: 0,
    lead: 0,
    agent_package: 0,
    owner_package: 0,
    developer_agency: 0,
    follow_up: 0,
    payment_started: 0,
    payment_failed: 0,
    closed_won: 0,
    closed_lost: 0,
  },
};

export const EMPTY_PAGINATION: PaginationState = {
  page: 1,
  pageSize: 25,
  totalCount: 0,
  totalPages: 1,
  hasPreviousPage: false,
  hasNextPage: false,
  from: 0,
  to: 0,
};

export const MESSAGE_BATCH_SIZE = 30;

const rawApiBase =
  process.env
    .EXPO_PUBLIC_TETAMO_API_BASE_URL ||
  process.env
    .EXPO_PUBLIC_TETAMO_SITE_URL ||
  "https://www.tetamo.com";

export const API_BASE_URL =
  rawApiBase.replace(
    /\/+$/,
    ""
  );

export async function getAdminAccessToken() {
  const {
    data: { session },
  } =
    await supabase.auth.getSession();

  return (
    session?.access_token || ""
  );
}

export async function adminWhatsappFetch(
  path: string,
  options: RequestInit = {}
) {
  const token =
    await getAdminAccessToken();

  if (!token) {
    throw new Error(
      "Please log in as admin first."
    );
  }

  const headers: Record<
    string,
    string
  > = {
    Authorization:
      `Bearer ${token}`,
  };

  if (options.body) {
    headers["Content-Type"] =
      "application/json";
  }

  if (
    options.headers &&
    typeof options.headers ===
      "object" &&
    !Array.isArray(
      options.headers
    )
  ) {
    Object.assign(
      headers,
      options.headers
    );
  }

  return fetch(
    `${API_BASE_URL}${path}`,
    {
      ...options,
      headers,
    }
  );
}

export function formatWhatsAppDate(
  value?: string | null
) {
  if (!value) return "-";

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "-";
  }

  return new Intl.DateTimeFormat(
    "en-ID",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(date);
}

export function formatInboxTime(
  value?: string | null
) {
  if (!value) return "";

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  const now =
    new Date();

  const sameDay =
    date.getFullYear() ===
      now.getFullYear() &&
    date.getMonth() ===
      now.getMonth() &&
    date.getDate() ===
      now.getDate();

  if (sameDay) {
    return new Intl.DateTimeFormat(
      "en-ID",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    ).format(date);
  }

  return new Intl.DateTimeFormat(
    "en-ID",
    {
      day: "2-digit",
      month: "short",
    }
  ).format(date);
}

export function shortText(
  value?: string | null,
  length = 85
) {
  const clean =
    String(value || "").trim();

  if (!clean) return "-";

  if (
    clean.length <= length
  ) {
    return clean;
  }

  return `${clean
    .slice(0, length)
    .trim()}...`;
}

export function normalizeChannel(
  value?: string | null
) {
  return String(value || "")
    .toLowerCase()
    .trim();
}

export function getChannelMeta(
  channel?: string | null
) {
  const clean =
    normalizeChannel(channel);

  if (
    clean.includes("meta")
  ) {
    return {
      key: "meta" as const,
      label: "Meta Direct",
    };
  }

  if (
    clean.includes("twilio")
  ) {
    return {
      key: "twilio" as const,
      label: "Twilio",
    };
  }

  return {
    key: "unknown" as const,
    label: "Unknown Source",
  };
}

export function isDateOpen(
  value?: string | null
) {
  if (!value) return false;

  const expiry =
    new Date(
      value
    ).getTime();

  if (
    !Number.isFinite(expiry)
  ) {
    return false;
  }

  return (
    expiry > Date.now()
  );
}

export function hasDate(
  value?: string | null
) {
  if (!value) return false;

  const expiry =
    new Date(
      value
    ).getTime();

  return Number.isFinite(
    expiry
  );
}

export function getReplyWindowLabel(
  value?: string | null
) {
  return isDateOpen(value)
    ? "24h Reply Open"
    : "24h Reply Closed";
}

export function getAdWindowLabel(
  value?: string | null
) {
  if (!hasDate(value)) {
    return "No Ad Window";
  }

  return isDateOpen(value)
    ? "72h Ad Open"
    : "72h Ad Closed";
}

export function getConversationName(
  conversation:
    | Conversation
    | null
    | undefined
) {
  return (
    conversation?.profile_name ||
    conversation?.phone_e164 ||
    conversation?.phone ||
    "WhatsApp Lead"
  );
}

export function getConversationPhone(
  conversation:
    | Conversation
    | null
    | undefined
) {
  return (
    conversation?.phone_e164 ||
    conversation?.phone ||
    "-"
  );
}

export function getMessageSourceLabel(
  message: Message,
  conversation?: Conversation | null
) {
  const source =
    String(
      message.source || ""
    )
      .toLowerCase()
      .trim();

  const channel =
    getChannelMeta(
      conversation?.channel
    );

  if (
    source === "meta"
  ) {
    return "Meta Inbound";
  }

  if (
    source ===
    "tetamo_mona_meta"
  ) {
    return "Mona via Meta";
  }

  if (
    source ===
    "admin_meta_direct"
  ) {
    return "Admin via Meta";
  }

  if (
    source.includes("meta")
  ) {
    return "Meta Direct";
  }

  if (
    source === "twilio"
  ) {
    return "Twilio Inbound";
  }

  if (
    source ===
    "tetamo_ai_twilio_api"
  ) {
    return "AI via Twilio";
  }

  if (
    source ===
    "admin_twilio_direct"
  ) {
    return "Admin via Twilio";
  }

  if (
    source.includes("twilio")
  ) {
    return "Twilio";
  }

  if (
    source.includes("handover")
  ) {
    return "Handover";
  }

  if (
    source.includes("admin")
  ) {
    return "Admin";
  }

  if (
    message.ai_generated
  ) {
    if (
      channel.key === "meta"
    ) {
      return "AI via Meta";
    }

    if (
      channel.key === "twilio"
    ) {
      return "AI via Twilio";
    }

    return "AI Reply";
  }

  if (
    message.admin_generated
  ) {
    return "Admin Reply";
  }

  return (
    source ||
    channel.label
  );
}
