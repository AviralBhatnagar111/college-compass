import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/brand/Logo";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Reset password — LearnNowX" }] }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md p-7">
        <Logo light={false} />
        <h2 className="mt-6 text-lg font-semibold text-lnx-navy-800">Reset your password</h2>
        <p className="text-xs text-muted-foreground">
          {step === 1 && "Enter your registered email."}
          {step === 2 && "We've sent a 6-digit OTP."}
          {step === 3 && "Choose a new password."}
        </p>

        <div className="mt-5 space-y-3">
          {step === 1 && (
            <>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@bharatedu.in" />
              </div>
              <Button className="w-full" onClick={() => { if (!email) return toast.error("Enter your email"); setStep(2); toast.success("OTP sent"); }}>Send OTP</Button>
            </>
          )}
          {step === 2 && (
            <>
              <div className="space-y-1.5"><Label>OTP</Label><Input maxLength={6} placeholder="6-digit code" /></div>
              <Button className="w-full" onClick={() => setStep(3)}>Continue</Button>
            </>
          )}
          {step === 3 && (
            <>
              <div className="space-y-1.5"><Label>New password</Label><Input type="password" /></div>
              <div className="space-y-1.5"><Label>Confirm password</Label><Input type="password" /></div>
              <Button className="w-full" onClick={() => { toast.success("Password reset complete"); navigate({ to: "/login" }); }}>Reset password</Button>
            </>
          )}
          <Button variant="ghost" className="w-full" onClick={() => navigate({ to: "/login" })}>
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to sign in
          </Button>
        </div>
      </Card>
    </div>
  );
}
