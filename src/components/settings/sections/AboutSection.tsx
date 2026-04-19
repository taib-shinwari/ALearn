import { Container } from "@/components/ui/container";
import { useCourseLanguage } from "@/hooks/useCourseLanguage";

export function AboutSection() {
  const { t } = useCourseLanguage();
  return (
    <div className="space-y-3">
      <Container>
        <p className="text-xs opacity-70 mb-1">{t("appVersion")}</p>
        <p className="font-semibold">1.0.0</p>
      </Container>
      <Container>
        <p className="text-sm">{t("builtWith")}</p>
      </Container>
    </div>
  );
}
