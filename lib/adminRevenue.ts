import { adminWhatsappFetch } from "./adminWhatsapp";

export type CurrencyTotals = Record<string, number>;

export type RevenueBucket = {
  sales: number;
  revenue: CurrencyTotals;
};

export type RevenueProduct = {
  key: string;
  label: string;
  sales: number;
  revenue: CurrencyTotals;
};

export type RevenueTrendItem = {
  key: string;
  label: string;
  sales: number;
  revenue: CurrencyTotals;
};

export type UnverifiedRevenueTransaction = {
  id: string;
  product: string;
  amount: number;
  currency: string;
  paidAt: string | null;
};

export type AdminRevenueResponse = {
  ok: boolean;
  reportingTimezone: string;
  generatedAt: string;

  summary: {
    today: RevenueBucket;
    month: RevenueBucket;
    total: RevenueBucket;
  };

  providers: {
    hitpay: RevenueBucket;
    stripe: RevenueBucket;
  };

  customerTypes: {
    owner: RevenueBucket;
    agent: RevenueBucket;
  };

  products: RevenueProduct[];
  trend: RevenueTrendItem[];

  unverifiedPaid: {
    sales: number;
    revenue: CurrencyTotals;
    transactions: UnverifiedRevenueTransaction[];
  };

  error?: string;
};

export async function fetchAdminRevenue() {
  const response = await adminWhatsappFetch(
    "/api/admin/revenue",
    {
      method: "GET",
    }
  );

  let payload: AdminRevenueResponse | null = null;

  try {
    payload =
      (await response.json()) as AdminRevenueResponse;
  } catch {
    payload = null;
  }

  if (!response.ok || !payload?.ok) {
    throw new Error(
      payload?.error ||
        `Failed to load revenue analytics (${response.status}).`
    );
  }

  return payload;
}
