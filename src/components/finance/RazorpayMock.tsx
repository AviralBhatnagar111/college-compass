import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CheckCircle2, CreditCard, Smartphone, Building2, Wallet, Loader2, Download } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  amount: number;
  orderId: string;
  description: string;
  onSuccess: (mode: string, txnId: string) => void;
}

type Phase = "form" | "processing" | "success";

export function RazorpayMock({ open, onOpenChange, amount, orderId, description, onSuccess }: Props) {
  const [phase, setPhase] = useState<Phase>("form");
  const [mode, setMode] = useState("UPI");
  const [upi, setUpi] = useState("yourname@upi");
  const [txnId, setTxnId] = useState("");

  const reset = () => { setPhase("form"); setTxnId(""); };

  const pay = () => {
    setPhase("processing");
    setTimeout(() => {
      const id = `pay_${Math.random().toString(36).slice(2, 12).toUpperCase()}`;
      setTxnId(id);
      setPhase("success");
      onSuccess(mode, id);
    }, 1800);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-md p-0 overflow-hidden bg-white">
        <div className="bg-[#0c2340] px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <div className="h-7 w-7 rounded bg-white flex items-center justify-center text-[#0c2340] font-bold text-xs">Rz</div>
            <span className="font-semibold tracking-wide text-sm">Razorpay</span>
          </div>
          <span className="text-[10px] text-white/60">SECURE TEST MODE</span>
        </div>

        {phase === "form" && (
          <div className="p-5 space-y-4">
            <DialogHeader>
              <DialogTitle className="text-lnx-navy-800">Bharat Institute of Engineering</DialogTitle>
            </DialogHeader>
            <div className="rounded-lg border bg-muted/40 p-3 text-xs space-y-1">
              <div className="flex justify-between"><span className="text-muted-foreground">Order ID</span><span className="font-mono">{orderId}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Description</span><span>{description}</span></div>
              <div className="flex justify-between font-semibold text-sm pt-1 border-t mt-2"><span>Amount</span><span>₹{amount.toLocaleString("en-IN")}</span></div>
            </div>

            <Tabs value={mode} onValueChange={setMode}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="UPI"><Smartphone className="h-3 w-3 mr-1" />UPI</TabsTrigger>
                <TabsTrigger value="Card"><CreditCard className="h-3 w-3 mr-1" />Cards</TabsTrigger>
                <TabsTrigger value="Netbanking"><Building2 className="h-3 w-3 mr-1" />NetB</TabsTrigger>
                <TabsTrigger value="Wallet"><Wallet className="h-3 w-3 mr-1" />Wallet</TabsTrigger>
              </TabsList>
              <TabsContent value="UPI" className="pt-3">
                <label className="text-xs text-muted-foreground">Enter UPI ID</label>
                <Input value={upi} onChange={e => setUpi(e.target.value)} className="mt-1" placeholder="name@bank" />
              </TabsContent>
              <TabsContent value="Card" className="pt-3 space-y-2">
                <Input placeholder="4242 4242 4242 4242" />
                <div className="grid grid-cols-2 gap-2"><Input placeholder="MM/YY" /><Input placeholder="CVV" /></div>
              </TabsContent>
              <TabsContent value="Netbanking" className="pt-3"><Input placeholder="Select bank" defaultValue="HDFC Bank" /></TabsContent>
              <TabsContent value="Wallet" className="pt-3"><Input placeholder="Wallet" defaultValue="Paytm" /></TabsContent>
            </Tabs>

            <Button onClick={pay} className="w-full bg-[#3395ff] hover:bg-[#1b7fef] text-white">Pay ₹{amount.toLocaleString("en-IN")}</Button>
            <p className="text-[10px] text-center text-muted-foreground">This is a simulated test payment. No real money will be charged.</p>
          </div>
        )}

        {phase === "processing" && (
          <div className="p-10 flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-[#3395ff]" />
            <p className="text-sm font-medium text-lnx-navy-800">Processing payment…</p>
            <p className="text-xs text-muted-foreground">Do not close this window.</p>
          </div>
        )}

        {phase === "success" && (
          <div className="p-6 space-y-4 text-center">
            <div className="mx-auto h-14 w-14 rounded-full bg-lnx-green-500/15 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-lnx-green-500" />
            </div>
            <div>
              <h3 className="font-semibold text-lnx-navy-800">Payment successful</h3>
              <p className="text-xs text-muted-foreground mt-1">₹{amount.toLocaleString("en-IN")} paid via {mode}</p>
            </div>
            <div className="rounded-lg border bg-muted/40 p-3 text-xs text-left space-y-1">
              <div className="flex justify-between"><span className="text-muted-foreground">Transaction ID</span><span className="font-mono">{txnId}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Order ID</span><span className="font-mono">{orderId}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Paid at</span><span>{new Date().toLocaleString("en-IN")}</span></div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => window.print()}><Download className="h-4 w-4 mr-1" />Receipt</Button>
              <Button className="flex-1" onClick={() => { reset(); onOpenChange(false); }}>Done</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
