import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { ArrowLeft, Flame, Star } from "lucide-react";
import { useCourseLanguage } from "@/hooks/useCourseLanguage";

export default function SettingsPage() {
  const navigate = useNavigate();
  const { logout, user, streak, xp } = useApp();
  const { t } = useCourseLanguage();

  return (
    <div className="min-h-screen p-6 max-w-md mx-auto">
      <Button variant="ghost" onClick={() => navigate("/home")} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> {t("back")}
      </Button>
      <h1 className="text-2xl font-semibold mb-6">{t("settings")}</h1>

      {/* Profile */}
      <Container className="mb-4">
        <h3 className="font-medium text-sm mb-2">{t("profile")}</h3>
        <p className="text-sm">{user?.firstName}</p>
        <p className="text-sm text-muted-foreground">{user?.email}</p>
      </Container>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Container className="text-center">
          <Flame className="h-6 w-6 text-orange-500 mx-auto mb-1" />
          <p className="text-xl font-bold">{streak}</p>
          <p className="text-xs text-muted-foreground">{t("streak")}</p>
        </Container>
        <Container className="text-center">
          <Star className="h-6 w-6 text-yellow-500 mx-auto mb-1" />
          <p className="text-xl font-bold">{xp}</p>
          <p className="text-xs text-muted-foreground">{t("xp")}</p>
        </Container>
      </div>

      <Button variant="destructive" fullWidth onClick={() => { logout(); navigate("/"); }}>
        {t("signOut")}
      </Button>
    </div>
  );
}
