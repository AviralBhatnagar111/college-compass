import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Logo } from "@/components/brand/Logo";
import { Avatar } from "@/components/common/Avatar";
import { useAuthStore, useUsersStore } from "@/stores";
import { useHydrated } from "@/hooks/use-hydrated";
import { DEMO_USER_IDS, INSTITUTION } from "@/data/seed";
import { ROLE_LABEL } from "@/lib/types";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — LearnNowX" },
      { name: "description", content: "Sign in to LearnNowX, the college operating system for India." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const hydrated = useHydrated();
  const navigate = useNavigate();
  const login = useAuthStore(s => s.login);
  const users = useUsersStore(s => s.users);
  const [email, setEmail] = useState("rajeshwari.krishnan@bharatedu.in");
  const [password, setPassword] = useState("demo");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");

  const tryLogin = (userId: string, label?: string) => {
    login(userId);
    toast.success(`Signed in as ${label ?? userId}`);
    navigate({ to: "/dashboard" });
  };

  const submitPassword = () => {
    const u = users.find(x => x.email.toLowerCase() === email.toLowerCase());
    if (!u) return toast.error("No account found with that email");
    tryLogin(u.id, `${u.firstName} ${u.lastName}`);
  };

  const sendOtp = () => {
    setOtpSent(true);
    toast.success("OTP sent — use any 6-digit code in demo");
  };

  const submitOtp = () => {
    if (otp.length !== 6) return toast.error("Enter the 6-digit OTP");
    const u = users.find(x => x.email.toLowerCase() === email.toLowerCase());
    if (!u) return toast.error("No account found");
    tryLogin(u.id, `${u.firstName} ${u.lastName}`);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: "radial-gradient(circle at 20% 20%, #01B6B9 0, transparent 40%), radial-gradient(circle at 80% 60%, #002F59 0, transparent 40%)",
      }} />
      <div className="relative mx-auto grid min-h-screen max-w-6xl grid-cols-1 items-center gap-10 px-6 py-10 lg:grid-cols-[1.1fr_1fr]">
        <div className="hidden lg:block">
          <Logo light={false} />
          <h1 className="mt-10 text-4xl font-semibold leading-tight tracking-tight text-lnx-navy-800">
            The college operating system for India.
          </h1>
          <p className="mt-4 max-w-md text-base text-muted-foreground">
            One place for academics, attendance, placement, finance and compliance — built for the modern Indian college.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-4">
            {[["1,247","Students"],["87","Faculty"],["6","Departments"]].map(([v,l]) => (
              <div key={l} className="rounded-lg border bg-card p-4">
                <div className="text-xl font-semibold text-lnx-navy-800 tabular">{v}</div>
                <div className="text-xs text-muted-foreground">{l}</div>
              </div>
            ))}
          </div>
          <p className="mt-8 text-xs text-muted-foreground">Demo institution: {INSTITUTION.name}, {INSTITUTION.city}</p>
        </div>

        <Card className="p-7">
          <div className="mb-6 flex items-center justify-between">
            <Logo light={false} />
            <Link to="/forgot-password" className="text-xs text-muted-foreground hover:text-lnx-navy-800">Forgot password</Link>
          </div>
          <h2 className="text-lg font-semibold text-lnx-navy-800">Sign in to LearnNowX</h2>
          <p className="text-xs text-muted-foreground">Use your institute email or pick a demo role below.</p>

          <Tabs defaultValue="password" className="mt-5">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="password">Password</TabsTrigger>
              <TabsTrigger value="otp">OTP</TabsTrigger>
            </TabsList>
            <TabsContent value="password" className="mt-4 space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@bharatedu.in" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <Button className="w-full" onClick={submitPassword}>Sign in <ArrowRight className="ml-1 h-4 w-4" /></Button>
            </TabsContent>
            <TabsContent value="otp" className="mt-4 space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="email-otp">Email</Label>
                <Input id="email-otp" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              {!otpSent ? (
                <Button className="w-full" onClick={sendOtp}>Send OTP</Button>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="otp">OTP</Label>
                    <Input id="otp" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="6-digit code" />
                  </div>
                  <Button className="w-full" onClick={submitOtp}>Verify & sign in</Button>
                </>
              )}
            </TabsContent>
          </Tabs>

          <div className="mt-7">
            <div className="mb-3 flex items-center gap-3 text-[11px] uppercase tracking-wider text-muted-foreground">
              <span className="h-px flex-1 bg-border" /> Try demo as <span className="h-px flex-1 bg-border" />
            </div>
            <div className="flex flex-wrap gap-2">
              {hydrated && DEMO_USER_IDS.map(id => {
                const u = users.find(x => x.id === id);
                if (!u) return null;
                return (
                  <button key={id} onClick={() => tryLogin(id, `${u.firstName} ${u.lastName}`)}
                    className="inline-flex items-center gap-2 rounded-full border bg-card px-2.5 py-1 text-xs font-medium text-lnx-navy-800 transition-colors hover:border-lnx-teal-500 hover:bg-accent">
                    <Avatar initials={u.initials} color={u.avatarColor} size="xs" />
                    <span className="hidden sm:inline">{u.firstName} {u.lastName}</span>
                    <span className="text-muted-foreground">· {ROLE_LABEL[u.role]}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <p className="mt-6 text-center text-[11px] text-muted-foreground">Built for the modern Indian college</p>
        </Card>
      </div>
    </div>
  );
}
