import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Container } from "@/components/ui/container";
import { TitleBar } from "@/components/ui/title-bar";

type AuthMode = "choose" | "signin" | "signup";

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
        <Container className="w-full max-w-sm space-y-3">
          <div className="flex justify-center mb-2">
            <TitleBar className="font-semibold">Welcome</TitleBar>
          </div>
          <Button onClick={() => setMode("signin")} fullWidth>Sign In</Button>
          <Button onClick={() => setMode("signup")} fullWidth>Sign Up</Button>
        </Container>
      </div>
    );
  }

  if (mode === "signin") {
    const steps = [
      <div key="email" className="flex flex-col gap-3">
        <Input value={siEmail} onChange={e => setSiEmail(e.target.value)} placeholder="Email" />
      </div>,
      <div key="password" className="flex flex-col gap-3">
        <Input type="password" value={siPassword} onChange={e => setSiPassword(e.target.value)} placeholder="Password" />
      </div>,
    ];

    const handleContinue = () => {
      if (siStep < steps.length - 1) {
        setSiStep(siStep + 1);
      } else {
        const ok = login(siEmail, siPassword);
        if (ok) navigate("/language-select");
        else setSiError("Invalid credentials. Use a@mail.com / A");
      }
    };

    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col gap-4 w-80">
          <h2 className="text-xl font-semibold text-center">Sign In</h2>
          {steps[siStep]}
          {siError && <p className="text-sm text-destructive">{siError}</p>}
          <Button onClick={handleContinue} fullWidth>Continue</Button>
          <Button variant="ghost" fullWidth onClick={() => { setMode("choose"); setSiStep(0); setSiError(""); }}>Back</Button>
        </div>
      </div>
    );
  }

  const suSteps = [
    <div key="fname" className="flex flex-col gap-3">
      <Input value={suFirstName} onChange={e => setSuFirstName(e.target.value)} placeholder="First Name" />
    </div>,
    <div key="email" className="flex flex-col gap-3">
      <Input value={suEmail} onChange={e => setSuEmail(e.target.value)} placeholder="Email" />
    </div>,
    <div key="password" className="flex flex-col gap-3">
      <Input type="password" value={suPassword} onChange={e => setSuPassword(e.target.value)} placeholder="Password" />
    </div>,
    <div key="confirm" className="flex flex-col gap-3">
      <Input type="password" value={suConfirm} onChange={e => setSuConfirm(e.target.value)} placeholder="Confirm Password" />
    </div>,
    <div key="terms" className="flex items-center gap-2">
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
      navigate("/language-select");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col gap-4 w-80">
        <h2 className="text-xl font-semibold text-center">Sign Up</h2>
        {suSteps[suStep]}
        {suError && <p className="text-sm text-destructive">{suError}</p>}
        <Button onClick={handleSuContinue} fullWidth>Continue</Button>
        <Button variant="ghost" fullWidth onClick={() => { setMode("choose"); setSuStep(0); setSuError(""); }}>Back</Button>
      </div>
    </div>
  );
}
