import { useEffect, useRef, useState, ReactNode } from "react";

interface ScrollNavbarProps {
  children: ReactNode;
}

export default function ScrollNavbar({ children }: ScrollNavbarProps) {
  const [visible, setVisible] = useState(true);
  const lastScroll = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const current = window.scrollY;
      setVisible(current < lastScroll.current || current < 10);
      lastScroll.current = current;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 transition-transform duration-300 px-4 py-3 flex items-center justify-between"
      style={{ transform: visible ? "translateY(0)" : "translateY(-100%)" }}
    >
      {children}
    </div>
  );
}
