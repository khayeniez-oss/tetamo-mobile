import AsyncStorage from "@react-native-async-storage/async-storage";
import {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";

export type ListingSource = "owner" | "agent";
export type ListingMode = "create" | "edit";
export type OwnerPlanType = "basic" | "priority" | "featured";
export type AgentPackageType = "silver" | "gold" | "agent-pro";
export type PaymentGateway = "stripe" | "xendit" | "hitpay";

export type ListingDraft = {
  listingType?: "dijual" | "disewa" | "lelang" | "";
  rentalType?: "bulanan" | "tahunan" | "harian" | "";

  plan?: OwnerPlanType;
  agentPackageId?: AgentPackageType;

  mode?: ListingMode;
  source?: ListingSource;

  kode?: string;
  postedDate?: string;

  address?: string;
  province?: string;
  city?: string;
  housingName?: string;
  customHousing?: string;
  note?: string;

  propertyType?: string;
  marketType?: string;

  price?: string;
  lt?: string;
  lb?: string;
  bed?: string;
  bath?: string;
  maid?: string;
  furnishing?: string;
  garage?: string;
  floor?: string;

  listrik?: string;
  jenisAir?: string;

  sertifikat?: string;
  jenisTanah?: string;
  jenisZoning?: string;
  jenisKepemilikan?: string;

  title?: string;
  title_id?: string;
  titleId?: string;

  description?: string;
  description_id?: string;
  descriptionId?: string;

  verification?: {
    relationship?: string;
    representation?: string;
    status?: "pending_verification" | "approved" | "rejected";
  };

  payment?: {
    planId?: string;
    packageId?: string;
    amount?: number;
    currency?: "IDR";
    status?: "unpaid" | "pending" | "paid" | "failed";
    method?: PaymentGateway;
    paidAt?: string;
  };

  fasilitas?: Record<string, boolean>;
  nearby?: Record<string, boolean>;

  photos?: string[];
  coverIndex?: number;
  video?: string;

  mediaFolder?: string;
};

type ListingDraftContextValue = {
  mounted: boolean;
  loading: boolean;
  draft: ListingDraft;
  setDraft: React.Dispatch<React.SetStateAction<ListingDraft>>;
  clearDraft: () => Promise<void>;
};

const STORAGE_KEY = "tetamo_mobile_listing_draft_v1";

const ListingDraftContext = createContext<ListingDraftContextValue | null>(null);

export function getEmptyListingDraft(): ListingDraft {
  return {
    listingType: "",
    rentalType: "",

    plan: undefined,
    agentPackageId: undefined,

    mode: undefined,
    source: undefined,

    kode: undefined,
    postedDate: undefined,

    address: undefined,
    province: undefined,
    city: undefined,
    housingName: undefined,
    customHousing: undefined,
    note: undefined,

    propertyType: undefined,
    marketType: undefined,

    price: undefined,
    lt: undefined,
    lb: undefined,
    bed: undefined,
    bath: undefined,
    maid: undefined,
    furnishing: undefined,
    garage: undefined,
    floor: undefined,

    listrik: undefined,
    jenisAir: undefined,

    sertifikat: undefined,
    jenisTanah: undefined,
    jenisZoning: undefined,
    jenisKepemilikan: undefined,

    title: undefined,
    title_id: undefined,
    titleId: undefined,

    description: undefined,
    description_id: undefined,
    descriptionId: undefined,

    verification: undefined,
    payment: undefined,

    fasilitas: undefined,
    nearby: undefined,

    photos: undefined,
    coverIndex: undefined,
    video: undefined,

    mediaFolder: undefined,
  };
}

export function ListingDraftProvider({ children }: { children: ReactNode }) {
  const [mounted] = useState(true);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<ListingDraft>(getEmptyListingDraft());

  useEffect(() => {
    let active = true;

    async function restoreDraft() {
      try {
        const storedDraft = await AsyncStorage.getItem(STORAGE_KEY);

        if (!active) return;

        if (storedDraft) {
          const parsedDraft = JSON.parse(storedDraft) as ListingDraft;

          setDraft({
            ...getEmptyListingDraft(),
            ...parsedDraft,
          });
        }
      } catch (error) {
        console.log("Tetamo listing draft restore error:", error);
      } finally {
        if (active) setLoading(false);
      }
    }

    void restoreDraft();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (loading) return;

    async function saveDraft() {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
      } catch (error) {
        console.log("Tetamo listing draft save error:", error);
      }
    }

    void saveDraft();
  }, [draft, loading]);

  async function clearDraft() {
    try {
      const emptyDraft = getEmptyListingDraft();

      setDraft(emptyDraft);
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.log("Tetamo listing draft clear error:", error);
    }
  }

  const value = useMemo<ListingDraftContextValue>(
    () => ({
      mounted,
      loading,
      draft,
      setDraft,
      clearDraft,
    }),
    [mounted, loading, draft]
  );

  return (
    <ListingDraftContext.Provider value={value}>
      {children}
    </ListingDraftContext.Provider>
  );
}

export function useListingDraft() {
  const context = useContext(ListingDraftContext);

  if (!context) {
    throw new Error("useListingDraft must be used inside ListingDraftProvider.");
  }

  return context;
}