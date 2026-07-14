import { useState } from "react";
import { useApp } from "@/Context/App";
import { useNavigate } from "react-router-dom";
import { Button } from "@/Component/UI/Button";
import { Checkbox } from "@/Component/UI/checkbox";
import { cn } from "@/Library/utils";

const inputCls = cn(
  "w-full h-11 rounded-[40px] bg-background border-2 border-border text-foreground",
  "px-5 placeholder:text-foreground/50",
  "focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 focus:ring-offset-0",
);

function AuthInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(inputCls, props.className)} />;
}

export default function AuthPage() {
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const { login, signup } = useApp();
  const navigate = useNavigate();

  // Sign in
  const [siEmail, setSiEmail] = useState("");
  const [siPassword, setSiPassword] = useState("");
  const [siError, setSiError] = useState("");

  // Sign up
  const [suEmail, setSuEmail] = useState("");
  const [suPassword, setSuPassword] = useState("");
  const [suConfirm, setSuConfirm] = useState("");
  const [suAgree, setSuAgree] = useState(false);
  const [suError, setSuError] = useState("");

  const handleSignIn = () => {
    setSiError("");
    const ok = login(siEmail, siPassword);
    if (ok) navigate("/");
    else setSiError("Invalid credentials. Use a@mail.com / A");
  };

  const handleSignUp = () => {
    setSuError("");
    if (!suEmail) return setSuError("Email is required");
    if (!suPassword) return setSuError("Password is required");
    if (suPassword !== suConfirm) return setSuError("Passwords don't match");
    if (!suAgree) return setSuError("You must agree to the Terms & Services");
    signup("", suEmail, suPassword);
    navigate("/");
  };

  return (
    <div className="flex items-start justify-center px-4">
      <div className="w-full max-w-sm space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <Button fullWidth active={tab === "signin"} onClick={() => setTab("signin")}>Sign In</Button>
          <Button fullWidth active={tab === "signup"} onClick={() => setTab("signup")}>Sign Up</Button>
        </div>

        {tab === "signin" ? (
          <div className="space-y-3">
            <AuthInput value={siEmail} onChange={e => setSiEmail(e.target.value)} placeholder="Email" />
            <AuthInput type="password" value={siPassword} onChange={e => setSiPassword(e.target.value)} placeholder="Password" />
            {siError && <p className="text-sm text-destructive">{siError}</p>}
            <Button onClick={handleSignIn} fullWidth>Continue</Button>
          </div>
        ) : (
          <div className="space-y-3">
            <AuthInput value={suEmail} onChange={e => setSuEmail(e.target.value)} placeholder="Email" />
            <AuthInput type="password" value={suPassword} onChange={e => setSuPassword(e.target.value)} placeholder="Password" />
            <AuthInput type="password" value={suConfirm} onChange={e => setSuConfirm(e.target.value)} placeholder="Confirm Password" />
            <div className="flex items-center gap-2 px-2">
              <Checkbox checked={suAgree} onCheckedChange={(v) => setSuAgree(!!v)} id="terms" />
              <label htmlFor="terms" className="text-sm">I agree to the Terms & Services</label>
            </div>
            {suError && <p className="text-sm text-destructive">{suError}</p>}
            <Button onClick={handleSignUp} fullWidth>Continue</Button>
          </div>
        )}
      </div>
    </div>
  );
}
