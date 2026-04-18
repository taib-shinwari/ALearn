import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { TitleBar } from "@/components/ui/title-bar";
import { useCourseLanguage } from "@/hooks/useCourseLanguage";

export default function SettingsPage() {
  const navigate = useNavigate();
  const { logout, user } = useApp();
  const { t } = useCourseLanguage();

  return (
    <div className="px-6 max-w-md mx-auto">
      <TitleBar className="mb-4 text-center font-semibold">
        {t("settings")}
      </TitleBar>

      <Container className="mb-6">
        <h3 className="font-medium text-sm mb-2">{t("profile")}</h3>
        <p className="text-sm">{user?.firstName}</p>
        <p className="text-sm opacity-70">{user?.email}</p>
      </Container>

      <Button variant="destructive" fullWidth onClick={() => { logout(); navigate("/"); }}>
        {t("signOut")}
      </Button>
    </div>
  );
}
