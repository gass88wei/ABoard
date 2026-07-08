import { createSignal, onMount, onCleanup } from "solid-js";
import { listen } from "@tauri-apps/api/event";

export default function RecordingIndicator() {
  const [active, setActive] = createSignal(false);
  const [elapsed, setElapsed] = createSignal("00:00");

  let startTime = 0;
  let timer: number | undefined;

  const updateElapsed = () => {
    const secs = Math.floor((Date.now() - startTime) / 1000);
    const m = String(Math.floor(secs / 60)).padStart(2, "0");
    const s = String(secs % 60).padStart(2, "0");
    setElapsed(`${m}:${s}`);
  };

  onMount(async () => {
    const unlisten = await listen<{ active: boolean }>("recording-status", (e) => {
      if (e.payload.active) {
        startTime = Date.now();
        setElapsed("00:00");
        setActive(true);
        timer = setInterval(updateElapsed, 1000);
      } else {
        setActive(false);
        if (timer) { clearInterval(timer); timer = undefined; }
      }
    });
    onCleanup(() => {
      unlisten();
      if (timer) clearInterval(timer);
    });
  });

  return (
    <div
      class={`fixed top-2 right-2 z-[9999] flex items-center gap-1.5 px-2.5 py-1 rounded-full shadow-lg transition-opacity duration-300 ${
        active() ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      style={{ background: "rgba(220,38,38,0.9)", color: "white", "font-size": "12px" }}
    >
      <span class="w-2 h-2 rounded-full bg-white animate-pulse" />
      <span class="font-semibold tracking-wide">REC</span>
      <span>{elapsed()}</span>
    </div>
  );
}
