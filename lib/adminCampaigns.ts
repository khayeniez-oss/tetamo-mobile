import {
  adminWhatsappFetch,
} from "./adminWhatsapp";

export const META_PROVIDER =
  "meta_cloud_api";

export type RecipientStatusFilter =
  | "all"
  | "pending"
  | "sent"
  | "failed"
  | "skipped";

export type VariableDefinition = {
  position?: number;
  key?: string;
  label?: string;
  example?: string;
};

export type MetaTemplate = {
  id: string;
  template_name: string;
  display_name: string;
  category: string;
  language_code: string;
  meta_status: string;
  quality_status: string;
  body_text: string | null;
  variable_count: number;
  variable_examples:
    | Record<string, unknown>
    | null;
  variable_definitions:
    | VariableDefinition[]
    | null;
  header_type: string | null;
  footer_text: string | null;
  website_button_text:
    | string
    | null;
  website_url: string | null;
  quick_reply_text:
    | string
    | null;
  buttons: unknown;
  is_active: boolean;
};

export type Campaign = {
  id: string;
  name: string;
  template_name: string;
  template_language: string;
  category: string;
  campaign_type: string;
  send_provider?: string | null;
  status: string;
  total_recipients: number;
  total_sent: number;
  total_failed: number;
  total_skipped: number;
  batch_size: number;
  started_at: string | null;
  completed_at: string | null;
  notes: string | null;
  raw_payload?:
    | Record<string, unknown>
    | null;
  created_at: string;
  updated_at: string;
};

export type Recipient = {
  id: string;
  campaign_id: string;
  phone_e164: string;
  customer_name: string | null;
  lead_type: string | null;
  source: string | null;
  variables:
    | Record<string, unknown>
    | null;
  status: string;
  meta_message_id: string | null;
  send_error?: unknown;
  error_type?: string | null;
  error_summary?: string | null;
  sent_at: string | null;
  failed_at: string | null;
  skipped_at: string | null;
  skip_reason: string | null;
  created_at: string;
};

export type RecipientCounts = {
  total: number;
  pending: number;
  sent: number;
  failed: number;
  skipped: number;
};

export const EMPTY_COUNTS: RecipientCounts = {
  total: 0,
  pending: 0,
  sent: 0,
  failed: 0,
  skipped: 0,
};

export const LEAD_TYPES = [
  {
    value: "unknown",
    label: "Unknown",
  },
  {
    value: "owner",
    label: "Owner",
  },
  {
    value: "agent",
    label: "Agent",
  },
  {
    value: "developer",
    label: "Developer",
  },
  {
    value: "buyer",
    label: "Buyer/Renter",
  },
];

export const RECIPIENT_FILTERS: {
  value: RecipientStatusFilter;
  label: string;
}[] = [
  {
    value: "all",
    label: "All",
  },
  {
    value: "pending",
    label: "Pending",
  },
  {
    value: "sent",
    label: "Sent",
  },
  {
    value: "failed",
    label: "Failed",
  },
  {
    value: "skipped",
    label: "Skipped",
  },
];

export function cleanCampaignText(
  value: unknown
) {
  return String(
    value || ""
  ).trim();
}

export function campaignPending(
  campaign:
    | Campaign
    | null
    | undefined
) {
  if (!campaign) {
    return 0;
  }

  return Math.max(
    Number(
      campaign.total_recipients ||
        0
    ) -
      Number(
        campaign.total_sent ||
          0
      ) -
      Number(
        campaign.total_failed ||
          0
      ) -
      Number(
        campaign.total_skipped ||
          0
      ),
    0
  );
}

export function formatCampaignDate(
  value?: string | null
) {
  if (!value) {
    return "-";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "-";
  }

  try {
    return new Intl.DateTimeFormat(
      "en-ID",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    ).format(date);
  } catch {
    return "-";
  }
}

export function templateDisplayName(
  template: MetaTemplate
) {
  return (
    cleanCampaignText(
      template.display_name
    ) ||
    template.template_name
  );
}

export function normalizeVariableDefinitions(
  template:
    | MetaTemplate
    | null
) {
  if (!template) {
    return [];
  }

  const count =
    Math.max(
      0,
      Number(
        template.variable_count ||
          0
      )
    );

  const definitions =
    Array.isArray(
      template.variable_definitions
    )
      ? template.variable_definitions
      : [];

  const result: Required<VariableDefinition>[] =
    [];

  for (
    let position = 1;
    position <= count;
    position += 1
  ) {
    const matching =
      definitions.find(
        (definition) =>
          Number(
            definition?.position
          ) === position
      );

    result.push({
      position,
      key:
        cleanCampaignText(
          matching?.key
        ) ||
        `variable_${position}`,
      label:
        cleanCampaignText(
          matching?.label
        ) ||
        `Variable {{${position}}}`,
      example:
        cleanCampaignText(
          matching?.example
        ) || "",
    });
  }

  return result;
}

export function safeCampaignJson(
  value: unknown
) {
  if (!value) {
    return "";
  }

  if (
    typeof value ===
    "string"
  ) {
    return value;
  }

  try {
    return JSON.stringify(
      value,
      null,
      2
    );
  } catch {
    return String(value);
  }
}

export function getRecipientErrorText(
  recipient: Recipient
) {
  const status =
    cleanCampaignText(
      recipient.status
    ).toLowerCase();

  if (
    recipient.error_summary
  ) {
    return recipient.error_summary;
  }

  if (
    status === "pending"
  ) {
    return "Not sent yet.";
  }

  if (
    status === "skipped"
  ) {
    return (
      recipient.skip_reason ||
      "Skipped."
    );
  }

  if (
    status === "failed"
  ) {
    return (
      safeCampaignJson(
        recipient.send_error
      ) ||
      "Failed to send."
    );
  }

  return "-";
}

export async function adminCampaignFetch(
  query = "",
  options: RequestInit = {}
) {
  return adminWhatsappFetch(
    `/api/admin/whatsapp/template-campaigns${query}`,
    options
  );
}
