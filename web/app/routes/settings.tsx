import { useLoaderData, useFetcher } from "react-router";
import { useToast } from "@/lib/use-toast";
import type { Route } from "./+types/settings";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  CreditCard,
  Download,
  Trash2,
  RefreshCw,
  Shield,
  Globe,
  User,
  Zap,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet,
  Database,
  Loader2,
  X,
} from "lucide-react";
import { useState, Suspense, use, useEffect, useRef } from "react";
import { replace } from "react-router";
import type { Tables } from "@/lib/database.types";

type UserProfile = Tables<"user_profiles">;
type Subscription = Tables<"subscriptions"> & {
  subscription_plans: Tables<"subscription_plans"> | null;
};
type UsageData = {
  usage_type: string;
  usage_count: number;
};
type CurrencyData = {
  code: string;
  name: string;
  symbol: string;
};
type PlanLimit = Tables<"plan_limits">;

type SettingsData = {
  user: any;
  profilePromise: Promise<UserProfile | null>;
  subscriptionPromise: Promise<Subscription | null>;
  usagePromise: Promise<UsageData[]>;
  currenciesPromise: Promise<CurrencyData[]>;
  planLimitsPromise: Promise<PlanLimit[]>;
};

export async function loader({
  request,
}: Route.LoaderArgs): Promise<SettingsData> {
  const { requireAuth } = await import("@/lib/protected-route");
  const { user } = await requireAuth(request);
  const { createClient } = await import("@/lib/supabase.server");
  const { supabase } = createClient(request);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  // Return promises for streaming
  return {
    user,
    profilePromise: Promise.resolve(
      supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single()
        .then(({ data }) => data)
    ),
    subscriptionPromise: Promise.resolve(
      supabase
        .from("subscriptions")
        .select(
          `
          *,
          subscription_plans(
            id,
            name,
            description,
            price,
            currency,
            billing_interval
          )
        `
        )
        .eq("user_id", user.id)
        .eq("status", "active")
        .single()
        .then(({ data }) => data)
    ),
    usagePromise: Promise.resolve(
      supabase
        .from("usage_tracking")
        .select("usage_type, usage_count")
        .eq("user_id", user.id)
        .gte("period_start", startOfMonth.toISOString())
        .then(({ data }) => data || [])
    ),
    currenciesPromise: Promise.resolve(
      supabase
        .from("supported_currencies")
        .select("code, name, symbol")
        .eq("is_active", true)
        .order("display_order")
        .then(({ data }) => data || [])
    ),
    planLimitsPromise: Promise.resolve(
      supabase
        .from("plan_limits")
        .select("*")
        .then(({ data }) => data || [])
    ),
  };
}

export async function action({ request }: Route.ActionArgs) {
  const { requireAuth } = await import("@/lib/protected-route");
  const { user } = await requireAuth(request);
  const { createClient } = await import("@/lib/supabase.server");
  const { supabase } = createClient(request);

  const formData = await request.formData();
  const action = formData.get("action");

  if (action === "update_currency") {
    const currency = formData.get("currency") as string;

    const { error } = await supabase
      .from("user_profiles")
      .update({ preferred_currency: currency })
      .eq("user_id", user.id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, message: "Currency updated successfully" };
  }

  if (action === "clear_recommendations") {
    const { error } = await supabase
      .from("outfit_recommendations")
      .delete()
      .eq("user_id", user.id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, message: "Recommendation history cleared" };
  }

  if (action === "clear_interactions") {
    const { error } = await supabase
      .from("user_interactions")
      .delete()
      .eq("user_id", user.id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, message: "Interaction history cleared" };
  }

  if (action === "export_data") {
    const format = formData.get("format") as string;

    // Get total count first
    const { count } = await supabase
      .from("clothing_items")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .is("deleted_at", null);

    // Fetch all pages in parallel
    const pageSize = 1000;
    const totalPages = Math.ceil((count || 0) / pageSize);
    
    const pagePromises = Array.from({ length: totalPages }, (_, page) =>
      supabase
        .from("clothing_items")
        .select(
          `
          *,
          clothing_categories(name),
          clothing_subcategories(name)
        `
        )
        .eq("user_id", user.id)
        .is("deleted_at", null)
        .range(page * pageSize, (page + 1) * pageSize - 1)
    );

    const results = await Promise.all(pagePromises);
    const items = results.flatMap((result) => result.data || []);

    if (format === "csv") {
      // Fetch with relations, then convert to CSV
      const csvRows = [
        "Name,Category,Subcategory,Brand,Color,Cost,Times Worn,Purchase Date,Sustainability Score,Notes"
      ];

      items?.forEach((item: any) => {
        const row = [
          item.name || "",
          item.clothing_categories?.name || "",
          item.clothing_subcategories?.name || "",
          item.brand || "",
          item.color || "",
          item.cost || "",
          item.times_worn || "0",
          item.purchase_date || "",
          item.sustainability_score || "",
          item.notes || ""
        ].map(field => `"${String(field).replace(/"/g, '""')}"`); // Escape quotes
        csvRows.push(row.join(","));
      });

      return {
        success: true,
        exportData: csvRows.join("\n"),
        exportFormat: "csv",
        message: "Wardrobe inventory exported successfully",
      };
    } else {
      // JSON format - complete backup
      const [profileData, outfitsData, interactionsData] = await Promise.all([
        supabase
          .from("user_profiles")
          .select("*")
          .eq("user_id", user.id)
          .single(),
        supabase
          .from("outfit_recommendations")
          .select("*")
          .eq("user_id", user.id),
        supabase.from("user_interactions").select("*").eq("user_id", user.id),
      ]);

      const exportData = {
        exported_at: new Date().toISOString(),
        user: { id: user.id, email: user.email },
        profile: profileData.data,
        clothing_items: items || [],
        outfit_recommendations: outfitsData.data || [],
        user_interactions: interactionsData.data || [],
      };

      return {
        success: true,
        exportData,
        exportFormat: "json",
        message: "Complete backup exported successfully",
      };
    }
  }

  if (action === "delete_account") {
    const { error } = await supabase.rpc("initiate_account_deletion", {
      target_user_id: user.id,
      reason: "user_requested",
    });

    if (error) {
      return { success: false, error: error.message };
    }

    // Sign out user after deletion
    await supabase.auth.signOut();

    throw replace("/?toast=account_deleted");
  }

  return { error: "Invalid action" };
}

export default function SettingsPage() {
  const { user, ...promises } = useLoaderData<typeof loader>();
  const [activeTab, setActiveTab] = useState("account");
  const fetcher = useFetcher();

  return (
    <div className="px-4 py-6 sm:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-medium">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your account, preferences, and subscription
        </p>
      </div>

      {/* Global notifications */}
      {fetcher.data?.success && (
        <div className="mb-6 flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-md">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm">{fetcher.data.message}</span>
        </div>
      )}

      {fetcher.data?.error && (
        <div className="mb-6 flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-md">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">{fetcher.data.error}</span>
        </div>
      )}

      <SettingsContent
        user={user}
        promises={promises}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
    </div>
  );
}

function SettingsContent({
  user,
  promises,
  activeTab,
  setActiveTab,
}: {
  user: any;
  promises: Omit<SettingsData, "user">;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}) {
  const fetcher = useFetcher();

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <Suspense fallback={<TabsListSkeleton />}>
        <SettingsTabsList promises={promises} />
      </Suspense>

      <TabsContent value="account" className="mt-8">
        <Suspense fallback={<AccountSkeleton />}>
          <AccountTab user={user} profilePromise={promises.profilePromise} />
        </Suspense>
      </TabsContent>

      <TabsContent value="subscription" className="mt-8">
        <Suspense fallback={<SubscriptionSkeleton />}>
          <SubscriptionTab
            subscriptionPromise={promises.subscriptionPromise}
            usagePromise={promises.usagePromise}
            planLimitsPromise={promises.planLimitsPromise}
          />
        </Suspense>
      </TabsContent>

      <TabsContent value="preferences" className="mt-8">
        <Suspense fallback={<PreferencesSkeleton />}>
          <PreferencesTab
            profilePromise={promises.profilePromise}
            currenciesPromise={promises.currenciesPromise}
            fetcher={fetcher}
          />
        </Suspense>
      </TabsContent>

      <TabsContent value="privacy" className="mt-8">
        <PrivacyTab fetcher={fetcher} />
      </TabsContent>
    </Tabs>
  );
}

function SettingsTabsList({
  promises,
}: {
  promises: Omit<SettingsData, "user">;
}) {
  const profile = use(promises.profilePromise);
  const subscription = use(promises.subscriptionPromise);

  return (
    <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto bg-muted/50 p-1 rounded-lg">
      <TabsTrigger
        value="account"
        className="flex-col gap-1.5 py-4 px-3 cursor-pointer data-[state=active]:bg-background data-[state=active]:shadow-sm"
      >
        <User className="w-5 h-5" />
        <div className="text-center">
          <div className="text-xs font-medium">Account</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">
            {profile?.onboarding_completed ? "Complete" : "Incomplete"}
          </div>
        </div>
      </TabsTrigger>
      <TabsTrigger
        value="subscription"
        className="flex-col gap-1.5 py-4 px-3 cursor-pointer data-[state=active]:bg-background data-[state=active]:shadow-sm"
      >
        <Zap className="w-5 h-5" />
        <div className="text-center">
          <div className="text-xs font-medium">Subscription</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">
            {subscription?.subscription_plans?.name || "Free"}
          </div>
        </div>
      </TabsTrigger>
      <TabsTrigger
        value="preferences"
        className="flex-col gap-1.5 py-4 px-3 cursor-pointer data-[state=active]:bg-background data-[state=active]:shadow-sm"
      >
        <Globe className="w-5 h-5" />
        <div className="text-center">
          <div className="text-xs font-medium">Preferences</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">
            {profile?.preferred_currency || "USD"}
          </div>
        </div>
      </TabsTrigger>
      <TabsTrigger
        value="privacy"
        className="flex-col gap-1.5 py-4 px-3 cursor-pointer data-[state=active]:bg-background data-[state=active]:shadow-sm"
      >
        <Shield className="w-5 h-5" />
        <div className="text-center">
          <div className="text-xs font-medium">Privacy</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">
            Data & Security
          </div>
        </div>
      </TabsTrigger>
    </TabsList>
  );
}

function AccountTab({
  user,
  profilePromise,
}: {
  user: any;
  profilePromise: Promise<UserProfile | null>;
}) {
  const profile = use(profilePromise);
  const fetcher = useFetcher();
  const toast = useToast();
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<string | null>(null);
  const processedExportRef = useRef<string | null>(null);

  // Handle data export download
  useEffect(() => {
    if (fetcher.data?.exportData && fetcher.data?.exportFormat !== processedExportRef.current) {
      const format = fetcher.data.exportFormat || "json";
      const dateStr = new Date().toISOString().split("T")[0];
      let dataStr: string;
      let mimeType: string;
      let extension: string;

      if (format === "csv") {
        dataStr = fetcher.data.exportData;
        mimeType = "text/csv";
        extension = "csv";
      } else {
        dataStr = JSON.stringify(fetcher.data.exportData, null, 2);
        mimeType = "application/json";
        extension = "json";
      }

      const dataBlob = new Blob([dataStr], { type: mimeType });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `idrobe-${format === "csv" ? "wardrobe" : "backup"}-${dateStr}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      processedExportRef.current = format;
      setExportingFormat(null);
      toast.success(`${format === "csv" ? "Wardrobe inventory" : "Complete backup"} exported successfully`);
    }
  }, [fetcher.data, toast]);

  return (
    <div className="space-y-8">
      <section>
        <header className="mb-6">
          <h2 className="text-sm font-medium">Account Information</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Your account details and profile
          </p>
        </header>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Email</Label>
              <p className="text-sm text-muted-foreground mt-1.5">
                {user.email}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">Member Since</Label>
              <p className="text-sm text-muted-foreground mt-1.5">
                {new Date(user.created_at).toLocaleDateString()}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">Display Name</Label>
              <p className="text-sm text-muted-foreground mt-1.5">
                {profile?.display_name || "Not set"}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">Profile Status</Label>
              <div className="mt-1.5">
                <Badge
                  variant={
                    profile?.onboarding_completed ? "default" : "secondary"
                  }
                >
                  {profile?.onboarding_completed ? "Complete" : "Incomplete"}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <header className="mb-6">
          <h2 className="text-sm font-medium">Account Actions</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Manage your account data
          </p>
        </header>
        <div className="flex flex-wrap gap-2">
          <AlertDialog 
            open={isExportDialogOpen} 
            onOpenChange={(open) => {
              setIsExportDialogOpen(open);
              if (!open) {
                setExportingFormat(null);
                processedExportRef.current = null;
              }
            }}
          >
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExportDialogOpen(false)}
                className="absolute right-4 top-4 h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
              <AlertDialogHeader>
                <AlertDialogTitle className="text-sm font-medium">
                  Export Your Data
                </AlertDialogTitle>
                <AlertDialogDescription className="text-xs text-muted-foreground">
                  Choose your preferred export format
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="space-y-3 py-4">
                <button
                  onClick={() => {
                    setExportingFormat("csv");
                    const formData = new FormData();
                    formData.append("action", "export_data");
                    formData.append("format", "csv");
                    fetcher.submit(formData, { method: "POST" });
                  }}
                  disabled={fetcher.state === "submitting"}
                  className="w-full p-4 border rounded-lg hover:bg-muted/50 hover:cursor-pointer transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-md bg-green-100 text-green-700">
                      {fetcher.state === "submitting" && exportingFormat === "csv" ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <FileSpreadsheet className="h-5 w-5" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium mb-1">
                        Wardrobe Inventory (CSV)
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {fetcher.state === "submitting" && exportingFormat === "csv"
                          ? "Preparing your export..."
                          : "Spreadsheet format with all clothing items and details. Opens in Excel or Google Sheets."}
                      </div>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setExportingFormat("json");
                    const formData = new FormData();
                    formData.append("action", "export_data");
                    formData.append("format", "json");
                    fetcher.submit(formData, { method: "POST" });
                  }}
                  disabled={fetcher.state === "submitting"}
                  className="w-full p-4 border rounded-lg hover:bg-muted/50 hover:cursor-pointer transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-md bg-blue-100 text-blue-700">
                      {fetcher.state === "submitting" && exportingFormat === "json" ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Database className="h-5 w-5" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium mb-1">
                        Complete Backup (JSON)
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {fetcher.state === "submitting" && exportingFormat === "json"
                          ? "Preparing your export..."
                          : "Full data export including profile, items, outfits, and interaction history."}
                      </div>
                    </div>
                  </div>
                </button>
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="text-sm font-medium">
                  Delete Account
                </AlertDialogTitle>
                <AlertDialogDescription className="text-xs text-muted-foreground">
                  Your account will be deactivated immediately and you'll have
                  30 days to recover it. After 30 days, all your data will be
                  permanently deleted and cannot be recovered.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <Button
                  variant="destructive"
                  onClick={() => {
                    const formData = new FormData();
                    formData.append("action", "delete_account");
                    fetcher.submit(formData, { method: "POST" });
                  }}
                  asChild
                >
                  <AlertDialogAction>Delete Account</AlertDialogAction>
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </section>
    </div>
  );
}

function SubscriptionTab({
  subscriptionPromise,
  usagePromise,
  planLimitsPromise,
}: {
  subscriptionPromise: Promise<Subscription | null>;
  usagePromise: Promise<UsageData[]>;
  planLimitsPromise: Promise<PlanLimit[]>;
}) {
  const subscription = use(subscriptionPromise);
  const usage = use(usagePromise);
  const planLimits = use(planLimitsPromise);

  const getUsageCount = (type: string) => {
    return usage.find((u) => u.usage_type === type)?.usage_count || 0;
  };

  const getUsageLimit = (type: string) => {
    const planId = subscription?.subscription_plans?.id;
    if (!planId) {
      // Free plan defaults
      const limits = { uploads: 10, recs: 3, tryons: 1 };
      return limits[type as keyof typeof limits] || 0;
    }

    const limit = planLimits.find(
      (l) => l.plan_id === planId && l.limit_type === type
    );
    return limit?.limit_value === -1 ? 999 : limit?.limit_value || 0;
  };

  return (
    <div className="space-y-8">
      <section>
        <header className="mb-6">
          <h2 className="text-sm font-medium">Current Plan</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Your subscription details and billing
          </p>
        </header>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Plan</Label>
              <div className="flex items-center gap-2 mt-1.5">
                <Badge variant="default">
                  {subscription?.subscription_plans?.name || "Free"}
                </Badge>
                {subscription?.status && (
                  <Badge variant="outline" className="capitalize">
                    {subscription.status}
                  </Badge>
                )}
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Billing</Label>
              <p className="text-sm text-muted-foreground mt-1.5">
                {subscription
                  ? `${subscription.subscription_plans?.currency}${subscription.subscription_plans?.price}/${subscription.subscription_plans?.billing_interval}`
                  : "Free plan"}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <header className="mb-6">
          <h2 className="text-sm font-medium">Usage This Month</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Track your current usage against plan limits
          </p>
        </header>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Monthly Uploads</span>
              <span>
                {getUsageCount("uploads")}/{getUsageLimit("uploads")}
              </span>
            </div>
            <Progress
              value={
                (getUsageCount("uploads") / getUsageLimit("uploads")) * 100
              }
            />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Recommendations</span>
              <span>
                {getUsageCount("recs")}/{getUsageLimit("recs")}
              </span>
            </div>
            <Progress
              value={(getUsageCount("recs") / getUsageLimit("recs")) * 100}
            />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Try-ons</span>
              <span>
                {getUsageCount("tryons")}/{getUsageLimit("tryons")}
              </span>
            </div>
            <Progress
              value={(getUsageCount("tryons") / getUsageLimit("tryons")) * 100}
            />
          </div>
        </div>
      </section>

      <section>
        <header className="mb-6">
          <h2 className="text-sm font-medium">Subscription Management</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Manage your subscription and billing
          </p>
        </header>
        <div className="flex flex-wrap gap-2">
          <Button size="sm">
            <CreditCard className="h-4 w-4 mr-2" />
            Manage Subscription
          </Button>
          <Button variant="outline" size="sm">
            View Payment History
          </Button>
        </div>
      </section>
    </div>
  );
}

function PreferencesTab({
  profilePromise,
  currenciesPromise,
  fetcher,
}: {
  profilePromise: Promise<UserProfile | null>;
  currenciesPromise: Promise<CurrencyData[]>;
  fetcher: any;
}) {
  const profile = use(profilePromise);
  const currencies = use(currenciesPromise);
  const [selectedCurrency, setSelectedCurrency] = useState(
    profile?.preferred_currency || "USD"
  );

  return (
    <div className="space-y-8">
      <section>
        <header className="mb-6">
          <h2 className="text-sm font-medium">Regional Preferences</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Customize your app experience
          </p>
        </header>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Preferred Currency</Label>
              <Select
                value={selectedCurrency}
                onValueChange={(value) => {
                  setSelectedCurrency(value);
                  const formData = new FormData();
                  formData.append("action", "update_currency");
                  formData.append("currency", value);
                  fetcher.submit(formData, { method: "POST" });
                }}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.symbol} {currency.name} ({currency.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium">Timezone</Label>
              <Select defaultValue={profile?.timezone || "UTC"}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="America/New_York">Eastern Time</SelectItem>
                  <SelectItem value="America/Chicago">Central Time</SelectItem>
                  <SelectItem value="America/Denver">Mountain Time</SelectItem>
                  <SelectItem value="America/Los_Angeles">
                    Pacific Time
                  </SelectItem>
                  <SelectItem value="Europe/London">London</SelectItem>
                  <SelectItem value="Europe/Paris">Paris</SelectItem>
                  <SelectItem value="Africa/Lagos">Lagos</SelectItem>
                  <SelectItem value="Africa/Cairo">Cairo</SelectItem>
                  <SelectItem value="Africa/Johannesburg">
                    Johannesburg
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>

      <section>
        <header className="mb-6">
          <h2 className="text-sm font-medium">Notifications</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Manage how you receive notifications
          </p>
        </header>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label
                htmlFor="daily-recommendations"
                className="text-sm font-medium"
              >
                Daily Recommendations
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Get daily outfit suggestions
              </p>
            </div>
            <Switch id="daily-recommendations" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="trend-alerts" className="text-sm font-medium">
                Trend Alerts
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Notifications about new fashion trends
              </p>
            </div>
            <Switch id="trend-alerts" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="wear-reminders" className="text-sm font-medium">
                Wear Reminders
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Reminders about underutilized items
              </p>
            </div>
            <Switch id="wear-reminders" />
          </div>
        </div>
      </section>
    </div>
  );
}

function PrivacyTab({ fetcher }: { fetcher: any }) {
  return (
    <div className="space-y-8">
      <section>
        <header className="mb-6">
          <h2 className="text-sm font-medium">Privacy Settings</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Control your data and privacy preferences
          </p>
        </header>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label
                htmlFor="public-collections"
                className="text-sm font-medium"
              >
                Public Collections
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Allow others to see your public outfit collections
              </p>
            </div>
            <Switch id="public-collections" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="analytics" className="text-sm font-medium">
                Usage Analytics
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Help improve the app by sharing anonymous usage data
              </p>
            </div>
            <Switch id="analytics" defaultChecked />
          </div>
        </div>
      </section>

      <section>
        <header className="mb-6">
          <h2 className="text-sm font-medium">Data Management</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Clear or reset your data
          </p>
        </header>
        <div className="flex flex-wrap gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Clear Recommendations
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Clear Recommendation History
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This will delete all your outfit recommendations. This action
                  cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    const formData = new FormData();
                    formData.append("action", "clear_recommendations");
                    fetcher.submit(formData, { method: "POST" });
                  }}
                >
                  Clear History
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset Interactions
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset Interaction History</AlertDialogTitle>
                <AlertDialogDescription>
                  This will clear all your likes, dislikes, and interaction
                  data. This may affect future recommendations.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    const formData = new FormData();
                    formData.append("action", "clear_interactions");
                    fetcher.submit(formData, { method: "POST" });
                  }}
                >
                  Reset Data
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </section>
    </div>
  );
}

// Skeleton components
function TabsListSkeleton() {
  return (
    <div className="grid w-full grid-cols-2 md:grid-cols-4 h-auto bg-muted/50 p-1 rounded-lg">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="flex-col gap-1.5 py-4 px-3 bg-muted animate-pulse rounded"
        >
          <div className="w-5 h-5 bg-muted-foreground/20 rounded mx-auto" />
          <div className="space-y-1">
            <div className="h-3 w-12 bg-muted-foreground/20 rounded mx-auto" />
            <div className="h-2 w-16 bg-muted-foreground/20 rounded mx-auto" />
          </div>
        </div>
      ))}
    </div>
  );
}

function AccountSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="h-4 w-32 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-20 bg-muted animate-pulse rounded" />
              <div className="h-4 w-32 bg-muted animate-pulse rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SubscriptionSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="h-4 w-32 bg-muted animate-pulse rounded" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between">
                <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                <div className="h-3 w-16 bg-muted animate-pulse rounded" />
              </div>
              <div className="h-2 w-full bg-muted animate-pulse rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PreferencesSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="h-4 w-32 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-20 bg-muted animate-pulse rounded" />
              <div className="h-10 w-full bg-muted animate-pulse rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
