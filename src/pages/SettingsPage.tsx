import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function SettingsPage() {
  const navigate = useNavigate();
  const { logout } = useApp();

  return (
    <div className="min-h-screen p-6 max-w-md mx-auto">
      <Button variant="ghost" onClick={() => navigate("/home")} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back
      </Button>
      <h1 className="text-2xl font-semibold mb-6">Settings</h1>

      <div className="space-y-4">
        <Button variant="destructive" onClick={() => { logout(); navigate("/"); }}>
          Log Out
        </Button>
      </div>
    </div>
  );
}
