// Tiny store so the global mobile top bar can reflect Settings state
// (title + back action) without prop drilling.

type Listener = () => void;

interface State {
  active: boolean;
  title: string;
  showBack: boolean;
  goBack: (() => void) | null;
  searchQuery: string;
}

const state: State = {
  active: false,
  title: "Settings",
  showBack: false,
  goBack: null,
  searchQuery: "",
};

const listeners = new Set<Listener>();

export const settingsStore = {
  getState() {
    return { ...state };
  },
  setActive(active: boolean) {
    state.active = active;
    if (!active) {
      state.title = "Settings";
      state.showBack = false;
      state.goBack = null;
      state.searchQuery = "";
    }
    listeners.forEach(l => l());
  },
  setTopbar(title: string, showBack: boolean, goBack: (() => void) | null) {
    state.title = title;
    state.showBack = showBack;
    state.goBack = goBack;
    listeners.forEach(l => l());
  },
  setSearchQuery(q: string) {
    state.searchQuery = q;
    listeners.forEach(l => l());
  },
  subscribe(l: Listener) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};
