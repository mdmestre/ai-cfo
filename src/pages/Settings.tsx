import { AppLayout } from "@/components/layout/AppLayout";
import { User, Building, Bell, Shield, CreditCard } from "lucide-react";

const SettingsPage = () => {
  return (
    <AppLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your account and preferences</p>
        </div>

        {[
          { icon: User, title: "Profile", desc: "Manage your personal information" },
          { icon: Building, title: "Company", desc: "Update company details and preferences" },
          { icon: Bell, title: "Notifications", desc: "Configure alert and notification preferences" },
          { icon: Shield, title: "Security", desc: "Two-factor authentication and password" },
          { icon: CreditCard, title: "Billing", desc: "Manage subscription and payment methods" },
        ].map((item) => (
          <div key={item.title} className="metric-card group cursor-pointer hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                <item.icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{item.title}</p>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  );
};

export default SettingsPage;
