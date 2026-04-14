import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

type AuthMode = "choose" | "signin" | "signup";

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("choose");
  const { login, signup } = useApp();
  const navigate = useNavigate();

  // Sign In state
  const [siStep, setSiStep] = useState(0);
  const [siEmail, setSiEmail] = useState("");
  const [siPassword, setSiPassword] = useState("");
  const [siError, setSiError] = useState("");

  // Sign Up state
  const [suStep, setSuStep] = useState(0);
  const [suFirstName, setSuFirstName] = useState("");
  const [suEmail, setSuEmail] = useState("");
  const [suPassword, setSuPassword] = useState("");
  const [suConfirm, setSuConfirm] = useState("");
  const [suAgree, setSuAgree] = useState(false);
  const [suError, setSuError] = useState("");

  if (mode === "choose") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col gap-4 w-72">
          <Button onClick={() => setMode("signin")} className="w-full">Sign In</Button>
          <Button onClick={() => setMode("signup")} variant="outline" className="w-full">Sign Up</Button>
        </div>
      </div>
    );
  }

  if (mode === "signin") {
    const steps = [
      <div key="email" className="flex flex-col gap-3">
        <label className="text-sm font-medium">Email</label>
        <Input value={siEmail} onChange={e => setSiEmail(e.target.value)} placeholder="Email" />
      </div>,
      <div key="password" className="flex flex-col gap-3">
        <label className="text-sm font-medium">Password</label>
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
          <h2 className="text-xl font-semibold text-center">Sign In — Step {siStep + 1}/{steps.length}</h2>
          {steps[siStep]}
          {siError && <p className="text-sm text-destructive">{siError}</p>}
          <Button onClick={handleContinue}>Continue</Button>
          <Button variant="ghost" onClick={() => { setMode("choose"); setSiStep(0); setSiError(""); }}>Back</Button>
        </div>
      </div>
    );
  }

  // Sign Up
  const suSteps = [
    <div key="fname" className="flex flex-col gap-3">
      <label className="text-sm font-medium">First Name</label>
      <Input value={suFirstName} onChange={e => setSuFirstName(e.target.value)} placeholder="First Name" />
    </div>,
    <div key="email" className="flex flex-col gap-3">
      <label className="text-sm font-medium">Email</label>
      <Input value={suEmail} onChange={e => setSuEmail(e.target.value)} placeholder="Email" />
    </div>,
    <div key="password" className="flex flex-col gap-3">
      <label className="text-sm font-medium">Password</label>
      <Input type="password" value={suPassword} onChange={e => setSuPassword(e.target.value)} placeholder="Password" />
    </div>,
    <div key="confirm" className="flex flex-col gap-3">
      <label className="text-sm font-medium">Confirm Password</label>
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
        <h2 className="text-xl font-semibold text-center">Sign Up — Step {suStep + 1}/{suSteps.length}</h2>
        {suSteps[suStep]}
        {suError && <p className="text-sm text-destructive">{suError}</p>}
        <Button onClick={handleSuContinue}>Continue</Button>
        <Button variant="ghost" onClick={() => { setMode("choose"); setSuStep(0); setSuError(""); }}>Back</Button>
      </div>
    </div>
  );
}
