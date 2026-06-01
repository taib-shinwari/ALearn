import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

type AuthMode = "choose" | "signin" | "signup";

const inputCls = cn(
  "w-full h-11 rounded-[40px] bg-background border-2 border-border text-foreground",
  "px-5 placeholder:text-foreground/50",
  "focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 focus:ring-offset-0",
);

function AuthInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(inputCls, props.className)} />;
}

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("choose");
  const { login, signup } = useApp();
  const navigate = useNavigate();

  const [siStep, setSiStep] = useState(0);
  const [siEmail, setSiEmail] = useState("");
  const [siPassword, setSiPassword] = useState("");
  const [siError, setSiError] = useState("");

  const [suStep, setSuStep] = useState(0);
  const [suFirstName, setSuFirstName] = useState("");
  const [suEmail, setSuEmail] = useState("");
  const [suPassword, setSuPassword] = useState("");
  const [suConfirm, setSuConfirm] = useState("");
  const [suAgree, setSuAgree] = useState(false);
  const [suError, setSuError] = useState("");

  if (mode === "choose") {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-3">
          <Button onClick={() => setMode("signin")} fullWidth>Sign In</Button>
          <Button onClick={() => setMode("signup")} fullWidth>Sign Up</Button>
        </div>
      </div>
    );
  }

  if (mode === "signin") {
    const steps = [
      <AuthInput key="email" value={siEmail} onChange={e => setSiEmail(e.target.value)} placeholder="Email" />,
      <AuthInput key="password" type="password" value={siPassword} onChange={e => setSiPassword(e.target.value)} placeholder="Password" />,
    ];

    const handleContinue = () => {
      if (siStep < steps.length - 1) {
        setSiStep(siStep + 1);
      } else {
        const ok = login(siEmail, siPassword);
        if (ok) navigate("/");
        else setSiError("Invalid credentials. Use a@mail.com / A");
      }
    };

    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-3">
          {steps[siStep]}
          {siError && <p className="text-sm text-destructive">{siError}</p>}
          <Button onClick={handleContinue} fullWidth>Continue</Button>
          <Button fullWidth onClick={() => { setMode("choose"); setSiStep(0); setSiError(""); }}>Back</Button>
        </div>
      </div>
    );
  }

  const suSteps = [
    <AuthInput key="fname" value={suFirstName} onChange={e => setSuFirstName(e.target.value)} placeholder="First Name" />,
    <AuthInput key="email" value={suEmail} onChange={e => setSuEmail(e.target.value)} placeholder="Email" />,
    <AuthInput key="password" type="password" value={suPassword} onChange={e => setSuPassword(e.target.value)} placeholder="Password" />,
    <AuthInput key="confirm" type="password" value={suConfirm} onChange={e => setSuConfirm(e.target.value)} placeholder="Confirm Password" />,
    <div key="terms" className="flex items-center gap-2 px-2">
      <Checkbox checked={suAgree} onCheckedChange={(v) => setSuAgree(!!v)} id="terms" />
      <label htmlFor="terms" className="text-sm">I agree to the Terms & Services</label>
    </div>,
  ];

  const handleSuContinue = () => {
    setSuError("");
    if (suStep === 3 && suPassword !== suConfirm) {
      setSuError("Passwords don't match");
      return;
    }
    if (suStep === 4 && !suAgree) {
      setSuError("You must agree to the Terms & Services");
      return;
    }
    if (suStep < suSteps.length - 1) {
      setSuStep(suStep + 1);
    } else {
      signup(suFirstName, suEmail, suPassword);
      navigate("/");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-3">
        {suSteps[suStep]}
        {suError && <p className="text-sm text-destructive">{suError}</p>}
        <Button onClick={handleSuContinue} fullWidth>Continue</Button>
        <Button fullWidth onClick={() => { setMode("choose"); setSuStep(0); setSuError(""); }}>Back</Button>
      </div>
    </div>
  );
}
