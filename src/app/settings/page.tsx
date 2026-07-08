import { SettingsPanel } from "@/components/settings/SettingsPanel";

export const metadata = { title: "設定 | 會計學習網站" };

export default function SettingsPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <h1 className="mb-6 text-2xl font-semibold">設定</h1>
      <SettingsPanel />
    </main>
  );
}
