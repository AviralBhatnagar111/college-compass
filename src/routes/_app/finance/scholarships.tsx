import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useFinanceStore } from "@/stores";
import { Award, IndianRupee, Plus } from "lucide-react";

export const Route = createFileRoute("/_app/finance/scholarships")({
  head: () => ({ meta: [{ title: "Scholarships — LearnNowX" }] }),
  component: ScholarshipsPage,
});

const INR = (n: number) => "₹" + n.toLocaleString("en-IN");

function ScholarshipsPage() {
  const list = useFinanceStore(s => s.scholarships);
  return (
    <div>
      <PageHeader title="Scholarships" subtitle="Schemes, applications, approvals and disbursals" action={<Button><Plus className="h-4 w-4 mr-2" />New Scheme</Button>} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.map(s => (
          <Card key={s.id} className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2"><Award className="h-4 w-4 text-lnx-teal-500" /><Badge variant="outline" className="text-[10px]">{s.scheme}</Badge></div>
                <h3 className="mt-2 font-semibold text-lnx-navy-800">{s.name}</h3>
                <p className="mt-1 text-lg font-bold tabular text-lnx-teal-500"><IndianRupee className="h-4 w-4 inline" />{s.amount.toLocaleString("en-IN")}</p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              <Row label="Applied" v={s.appliedCount} max={s.appliedCount} />
              <Row label="Approved" v={s.approvedCount} max={s.appliedCount} tone="bg-lnx-amber-500" />
              <Row label="Disbursed" v={s.disbursedCount} max={s.appliedCount} tone="bg-lnx-green-500" />
            </div>
            <Button variant="outline" size="sm" className="w-full mt-4">Manage Applicants</Button>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Row({ label, v, max, tone = "bg-lnx-teal-500" }: { label: string; v: number; max: number; tone?: string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1"><span className="text-muted-foreground">{label}</span><span className="font-semibold tabular">{v}</span></div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden"><div className={`h-full ${tone}`} style={{ width: `${(v/Math.max(1,max))*100}%` }} /></div>
    </div>
  );
}
