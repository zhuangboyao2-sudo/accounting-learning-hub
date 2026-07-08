import { NextResponse } from "next/server";
import { getAllMaterials } from "@/lib/content/materials";
import { SUBJECTS } from "@/types/content";

// 供 service worker 安裝時預快取用的網址清單，內容隨教材數量自動更新，
// 不需要在新增教材時手動維護 sw.js。
export function GET() {
  const appShell = [
    "/",
    "/materials",
    "/review",
    "/review/browse",
    "/today",
    "/tools",
    "/reference",
    "/quiz/practice",
    "/quiz/wrong-answers",
    "/settings",
  ];
  const subjectPages = SUBJECTS.flatMap(({ id }) => [`/materials/${id}`, `/quiz/practice/${id}`]);
  const materialPages = getAllMaterials().flatMap(({ subject, items }) =>
    items.map((item) => `/materials/${subject}/${item.id}`),
  );

  const urls = [...appShell, ...subjectPages, ...materialPages];
  return NextResponse.json({ urls });
}
