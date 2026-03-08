import { AppLayout } from "@/components/layout/AppLayout";
import { User, Building, Bell, Shield, CreditCard, ChevronRight } from "lucide-react";

const SettingsPage = () => {
  return (
    <AppLayout>
      <div className="max-w-[600px] space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Settings</h1>
          <p className="mt-0.5 text-[13px] text-muted-foreground">Manage your account and preferences</p>
        </div>

        <div className="space-y-1">
          {[
            { icon: User, title: "Profile", desc: "Manage your personal information" },
            { icon: Building, title: "Company", desc: "Update company details and preferences" },
            { icon: Bell, title: "Notifications", desc: "Configure alert and notification preferences" },
            { icon: Shield, title: "Security", desc: "Two-factor authentication and password" },
            { icon: CreditCard, title: "Billing", desc: "Manage subscription and payment methods" },
          ].map((item) => (
            <div key={item.title} className="flex items-center gap-3.5 rounded-lg px-4 py-3.5 cursor-pointer hover:bg-secondary transition-colors group">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-secondary group-hover:bg-background transition-colors">
                <item.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-medium text-foreground">{item.title}</p>
                <p className="text-xxs text-muted-foreground">{item.desc}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default SettingsPage;
