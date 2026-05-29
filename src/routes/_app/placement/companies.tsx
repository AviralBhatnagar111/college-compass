import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePlacementStore } from "@/stores";
import { Plus, Building2, Briefcase, Users } from "lucide-react";

export const Route = createFileRoute("/_app/placement/companies")({
  head: () => ({ meta: [{ title: "Companies — LearnNowX" }] }),
  component: CompaniesPage,
});

const tierStyle: Record<string,string> = {
  "Tier 1": "bg-lnx-teal-500/10 text-lnx-teal-500",
  "Tier 2": "bg-lnx-amber-500/10 text-lnx-amber-500",
  "Tier 3": "bg-muted text-muted-foreground",
};

function CompaniesPage() {
  const companies = usePlacementStore(s => s.companies);
  const drives = usePlacementStore(s => s.drives);
  const offers = usePlacementStore(s => s.offers);

  return (
    <div>
      <PageHeader title="Companies" subtitle={`${companies.length} partner companies`} action={<Button><Plus className="h-4 w-4 mr-2" />Add Company</Button>} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {companies.map(c => {
          const cDrives = drives.filter(d => d.companyId === c.id);
          const cOffers = offers.filter(o => o.companyId === c.id);
          return (
            <Card key={c.id} className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-lg bg-lnx-navy-800 text-white grid place-items-center font-bold">
                    {c.name.slice(0,2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lnx-navy-800">{c.name}</h3>
                    <p className="text-xs text-muted-foreground">{c.sector}</p>
                  </div>
                </div>
                <Badge variant="secondary" className={tierStyle[c.tier]}>{c.tier}</Badge>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-md bg-accent p-3"><Briefcase className="h-3 w-3 mb-1 text-lnx-teal-500" /><p className="font-semibold tabular text-lg">{cDrives.length}</p><p className="text-muted-foreground">Drives</p></div>
                <div className="rounded-md bg-accent p-3"><Users className="h-3 w-3 mb-1 text-lnx-amber-500" /><p className="font-semibold tabular text-lg">{cOffers.length}</p><p className="text-muted-foreground">Offers</p></div>
              </div>
              <Button variant="outline" size="sm" className="w-full mt-4"><Building2 className="h-3 w-3 mr-1" />View Profile</Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
