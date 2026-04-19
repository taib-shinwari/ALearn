import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { useCourseLanguage } from "@/hooks/useCourseLanguage";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { TitleBar } from "@/components/ui/title-bar";
import { LogOut, Trash2 } from "lucide-react";

interface Props {
  activeSubcategory: string;
}

/** Profile section. Shows different content depending on the selected subcategory. */
export function ProfileSection({ activeSubcategory }: Props) {
  const { user, logout } = useApp();
  const { t } = useCourseLanguage();
  const navigate = useNavigate();

  const handleSignOut = () => {
    logout();
    navigate("/");
  };

  const handleDelete = () => {
    if (confirm(t("deleteAccountConfirm"))) {
      logout();
      try { localStorage.clear(); } catch { /* no-op */ }
      navigate("/");
    }
  };

  if (activeSubcategory === "signout") {
    return (
      <Button variant="destructive" fullWidth onClick={handleSignOut}>
        <LogOut className="h-4 w-4 mr-2" /> {t("signOut")}
      </Button>
    );
  }

  if (activeSubcategory === "delete") {
    return (
      <div className="space-y-3">
        <p className="text-sm">{t("deleteAccountConfirm")}</p>
        <Button variant="destructive" fullWidth onClick={handleDelete}>
          <Trash2 className="h-4 w-4 mr-2" /> {t("deleteAccount")}
        </Button>
      </div>
    );
  }

  // Default: account / profile
  const initials = (user?.firstName || "?").slice(0, 2).toUpperCase();
  return (
    <div className="space-y-4">
      <Container>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-black text-white flex items-center justify-center font-semibold">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="font-semibold truncate">{user?.firstName}</p>
            <p className="text-sm opacity-70 truncate">{user?.email}</p>
          </div>
        </div>
      </Container>
      <TitleBar>{t("profile")}</TitleBar>
    </div>
  );
}
