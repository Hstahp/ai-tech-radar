import { useEffect, useState } from "react";
import { Activity, AlertTriangle, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { loadPipelineHealth, type HealthRun, type PipelineHealth } from "../features/status";

const STATUS_STYLES: Record<string, string> = {
  success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  partial: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
  failed: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30",
  running: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
        STATUS_STYLES[status] ?? STATUS_STYLES.running
      }`}
    >
      {status}
    </span>
  );
}

function RunSummary({ run }: { run: HealthRun }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-3">
        <p className="text-xs text-slate-500">Fetched</p>
        <p className="text-lg font-bold">{run.items_fetched}</p>
      </div>
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-3">
        <p className="text-xs text-slate-500">New</p>
        <p className="text-lg font-bold">{run.items_new}</p>
      </div>
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-3">
        <p className="text-xs text-slate-500">LLM requests</p>
        <p className="text-lg font-bold">{run.llm_requests}</p>
      </div>
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-3">
        <p className="text-xs text-slate-500">Finished</p>
        <p className="text-sm font-semibold">{run.finished_at ? run.finished_at.slice(0, 16).replace("T", " ") : "—"}</p>
      </div>
    </div>
  );
}

export function StatusPage() {
  const [health, setHealth] = useState<PipelineHealth | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    loadPipelineHealth()
      .then((data) => {
        if (isMounted) setHealth(data);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mb-4" />
        <p className="text-sm text-slate-400">Đang nạp trạng thái pipeline...</p>
      </div>
    );
  }

  if (!health) {
    return (
      <div className="mx-auto my-12 max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-8 text-center">
        <AlertTriangle className="mx-auto mb-3 h-9 w-9 text-amber-500" />
        <h1 className="text-lg font-bold">Chưa có dữ liệu trạng thái</h1>
        <p className="mt-2 text-sm text-slate-500">
          File <code className="font-mono">health.json</code> sẽ xuất hiện sau lần chạy pipeline tiếp theo.
        </p>
      </div>
    );
  }

  const latest = health.latest_run;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-indigo-500" />
            <h1 className="text-2xl font-extrabold tracking-tight">Trạng thái hệ thống</h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Sức khỏe pipeline {health.history_days} ngày gần nhất • cập nhật {health.generated_at.slice(0, 16).replace("T", " ")}
          </p>
        </div>
        {latest && <StatusBadge status={latest.status} />}
      </header>

      {latest ? (
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-semibold">
              {latest.status === "success" ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              )}
              Lần chạy gần nhất • {latest.started_at.slice(0, 16).replace("T", " ")}
            </div>
            <span className="text-xs font-mono text-slate-500">run #{latest.id}</span>
          </div>

          <RunSummary run={latest} />

          {latest.error && (
            <p className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400">
              {latest.error}
            </p>
          )}

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="py-2 pr-3">Nguồn</th>
                  <th className="py-2 pr-3">Fetched</th>
                  <th className="py-2">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {latest.sources.map((source) => (
                  <tr key={source.key} className="border-t border-slate-200 dark:border-slate-800">
                    <td className="py-2 pr-3 font-mono text-xs">{source.key}</td>
                    <td className="py-2 pr-3">{source.fetched}</td>
                    <td className="py-2">
                      {source.error ? (
                        <span className="text-xs text-rose-500">{source.error}</span>
                      ) : (
                        <span className="text-xs text-emerald-600 dark:text-emerald-400">OK</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <p className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 text-sm text-slate-500">
          Chưa có lần chạy nào được ghi nhận.
        </p>
      )}

      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-4 sm:p-5">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold">
          <Clock className="h-4 w-4 text-slate-400" /> Lịch sử chạy
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="py-2 pr-3">Ngày</th>
                <th className="py-2 pr-3">Trạng thái</th>
                <th className="py-2 pr-3">Fetched</th>
                <th className="py-2">LLM</th>
              </tr>
            </thead>
            <tbody>
              {health.runs.map((run) => (
                <tr key={run.id} className="border-t border-slate-200 dark:border-slate-800">
                  <td className="py-2 pr-3 font-mono text-xs">{run.started_at.slice(0, 10)}</td>
                  <td className="py-2 pr-3"><StatusBadge status={run.status} /></td>
                  <td className="py-2 pr-3">{run.items_fetched}</td>
                  <td className="py-2">{run.llm_requests}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-4 sm:p-5">
        <h2 className="mb-3 text-sm font-bold">Sử dụng LLM</h2>
        {health.llm_usage.length === 0 ? (
          <p className="text-sm text-slate-500">Chưa có dữ liệu sử dụng LLM.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="py-2 pr-3">Ngày</th>
                  <th className="py-2 pr-3">Provider / model</th>
                  <th className="py-2 pr-3">Requests</th>
                  <th className="py-2 pr-3">Tokens in/out</th>
                  <th className="py-2">Errors</th>
                </tr>
              </thead>
              <tbody>
                {health.llm_usage.map((usage) => (
                  <tr key={`${usage.usage_date}-${usage.provider}-${usage.model}`} className="border-t border-slate-200 dark:border-slate-800">
                    <td className="py-2 pr-3 font-mono text-xs">{usage.usage_date}</td>
                    <td className="py-2 pr-3 text-xs">{usage.provider} / {usage.model}</td>
                    <td className="py-2 pr-3">{usage.requests}</td>
                    <td className="py-2 pr-3 text-xs">{usage.tokens_in} / {usage.tokens_out}</td>
                    <td className="py-2">{usage.errors}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
