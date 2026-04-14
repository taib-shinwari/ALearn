import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const languages = [
  { code: "en", label: "English" },
  { code: "nl", label: "Nederlands" },
];

export default function LanguageSelectPage() {
  const { setInterfaceLanguage } = useApp();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const filtered = languages.filter(l =>
    l.label.toLowerCase().includes(search.toLowerCase())
  );

  const select = (code: string) => {
    setInterfaceLanguage(code);
    navigate("/concept-select");
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col gap-4 w-80">
        <h2 className="text-xl font-semibold text-center">Select Interface Language</h2>
        <Input placeholder="Search languages..." value={search} onChange={e => setSearch(e.target.value)} />
        <div className="flex flex-col gap-2">
          {filtered.map(l => (
            <Button key={l.code} variant="outline" onClick={() => select(l.code)} className="w-full">
              {l.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
