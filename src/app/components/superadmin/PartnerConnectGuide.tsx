import { useMemo, useState } from "react";
import { toast } from "sonner";
import { BookOpen, Check, Copy, Download, FileCode, Terminal } from "lucide-react";
import {
  buildPartnerIntegrationKit,
  downloadTextFile,
} from "../../../lib/superadmin/partnerIntegrationKit";
import { partnerApiBaseUrl } from "../../../lib/superadmin/partnerApi";
import { Button, cn } from "../ui/shared.tsx";
import { Card, CardContent } from "../ui/shared.tsx";
import { saPanel } from "./SuperAdminShell.tsx";

type SnippetId = "env" | "vercel" | "next" | "frontend" | "curl" | "markdown";

const SNIPPETS: { id: SnippetId; label: string; icon: typeof FileCode }[] = [
  { id: "env", label: ".env (server)", icon: Terminal },
  { id: "vercel", label: "Vercel API route", icon: FileCode },
  { id: "next", label: "Next.js route", icon: FileCode },
  { id: "frontend", label: "Get started button", icon: FileCode },
  { id: "curl", label: "curl test", icon: Terminal },
  { id: "markdown", label: "Full guide (.md)", icon: BookOpen },
];

export function PartnerConnectGuide({
  brandName,
  brandSlug,
  brandId,
  portalOrigin,
  apiKey,
}: {
  brandName: string;
  brandSlug: string;
  brandId: string;
  portalOrigin?: string | null;
  apiKey?: string;
}) {
  const [activeSnippet, setActiveSnippet] = useState<SnippetId>("env");
  const [copied, setCopied] = useState<SnippetId | null>(null);

  const kit = useMemo(
    () =>
      buildPartnerIntegrationKit({
        brandName,
        brandSlug,
        brandId,
        portalOrigin,
        apiKey,
      }),
    [brandName, brandSlug, brandId, portalOrigin, apiKey],
  );

  const snippetContent: Record<SnippetId, string> = {
    env: kit.envFile,
    vercel: kit.vercelApiRoute,
    next: kit.nextApiRoute,
    frontend: kit.frontendButton,
    curl: `${kit.curlHealth}\n\n${kit.curlEnroll}`,
    markdown: kit.markdown,
  };

  function copySnippet(id: SnippetId) {
    void navigator.clipboard.writeText(snippetContent[id]);
    setCopied(id);
    toast.success("Copied");
    setTimeout(() => setCopied(null), 2000);
  }

  function downloadKit() {
    downloadTextFile(`${brandSlug}-partner-connect.md`, kit.markdown);
    toast.success("Downloaded integration guide");
  }

  function downloadEnv() {
    downloadTextFile(`${brandSlug}.env.example`, kit.envFile);
    toast.success("Downloaded .env.example");
  }

  return (
    <div className="space-y-4">
      <Card className={cn(saPanel, "border-emerald-200/80 bg-gradient-to-br from-emerald-50/40 to-white")}>
        <CardContent className="space-y-4 p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Connect in 3 steps</h2>
              <p className="mt-1 max-w-2xl text-sm text-slate-600">
                Partner keeps their products UI. Copy these snippets into their repo — no white-label DNS required.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={downloadEnv}>
                <Download className="mr-2 h-4 w-4" /> .env.example
              </Button>
              <Button size="sm" className="bg-slate-900 text-white" onClick={downloadKit}>
                <Download className="mr-2 h-4 w-4" /> Download full guide
              </Button>
            </div>
          </div>

          <ol className="grid gap-3 sm:grid-cols-3">
            {kit.steps.map((step, i) => (
              <li
                key={step.title}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                  {i + 1}
                </span>
                <p className="mt-2 text-sm font-semibold text-slate-900">{step.title.replace(/^\d+\.\s*/, "")}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">{step.body}</p>
              </li>
            ))}
          </ol>

          <dl className="grid gap-2 rounded-xl border border-slate-200 bg-white p-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-slate-500">brand_slug</dt>
              <dd className="font-mono font-medium">{brandSlug}</dd>
            </div>
            <div>
              <dt className="text-slate-500">API base</dt>
              <dd className="break-all font-mono text-xs">{partnerApiBaseUrl()}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-slate-500">Live docs (no key)</dt>
              <dd>
                <a
                  href={`${partnerApiBaseUrl()}?action=docs`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-all font-mono text-xs text-emerald-700 underline"
                >
                  {partnerApiBaseUrl()}?action=docs
                </a>
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card className={saPanel}>
        <CardContent className="p-0">
          <div className="flex flex-wrap gap-1 border-b border-slate-200 p-2">
            {SNIPPETS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveSnippet(s.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  activeSnippet === s.id
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100",
                )}
              >
                <s.icon className="h-3.5 w-3.5" />
                {s.label}
              </button>
            ))}
          </div>
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              className="absolute right-3 top-3 z-10 h-8 bg-white/90"
              onClick={() => copySnippet(activeSnippet)}
            >
              {copied === activeSnippet ? (
                <Check className="mr-1 h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <Copy className="mr-1 h-3.5 w-3.5" />
              )}
              Copy
            </Button>
            <pre className="max-h-[420px] overflow-auto p-4 pr-24 text-xs leading-relaxed text-slate-800">
              {snippetContent[activeSnippet]}
            </pre>
          </div>
        </CardContent>
      </Card>

      {!apiKey && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Issue an API key above to include the real key in <strong>.env</strong> and curl examples. Until then,
          snippets use placeholders.
        </p>
      )}
    </div>
  );
}
