import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function SettingsPage() {
  const navigate = useNavigate();
  const { interfaceLanguage, setInterfaceLanguage, logout } = useApp();

  return (
    <div className="min-h-screen p-6 max-w-md mx-auto">
      <Button variant="ghost" onClick={() => navigate("/home")} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back
      </Button>
      <h1 className="text-2xl font-semibold mb-6">Settings</h1>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">Interface Language</label>
          <div className="flex gap-2 mt-2">
            <Button
              variant={interfaceLanguage === "en" ? "default" : "outline"}
              onClick={() => setInterfaceLanguage("en")}
            >English</Button>
            <Button
              variant={interfaceLanguage === "nl" ? "default" : "outline"}
              onClick={() => setInterfaceLanguage("nl")}
            >Nederlands</Button>
          </div>
        </div>

        <Button variant="destructive" onClick={() => { logout(); navigate("/"); }}>
          Log Out
        </Button>
      </div>
    </div>
  );
}
