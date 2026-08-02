import React, { useState } from 'react';
import { EVAL_DATASET } from '../utils/evalDataset';
import { extractEventFromUrl } from '../lib/gemini';
import { EvalRunResult } from '../types';
import { Activity, Play, CheckCircle2, XCircle, Clock, Server, Code2, AlertCircle, RefreshCw } from 'lucide-react';

export const EvalsPage: React.FC = () => {
  const [results, setResults] = useState<EvalRunResult[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [promptVersion] = useState<string>('v1.0.0');

  const runEvaluation = async () => {
    setIsRunning(true);
    setResults([]);
    setCurrentIndex(0);

    const newResults: EvalRunResult[] = [];

    for (let i = 0; i < EVAL_DATASET.length; i++) {
      setCurrentIndex(i + 1);
      const item = EVAL_DATASET[i];
      const start = Date.now();

      try {
        const { data, latencyMs } = await extractEventFromUrl({
          url: item.url,
          mockHtml: item.mockHtml,
        });

        // Evaluate field matches against expected dataset
        const titleMatch = Boolean(
          data.title &&
          (data.title.toLowerCase().includes(item.expected.title.toLowerCase()) ||
            item.expected.title.toLowerCase().includes(data.title.toLowerCase()))
        );

        const startDateMatch = Boolean(
          (!item.expected.startDate && !data.startDate) ||
          (item.expected.startDate && data.startDate)
        );

        const priceMatch = Boolean(
          item.expected.price === data.price ||
          (item.expected.price !== null && data.price !== null && Math.abs(item.expected.price - data.price) <= 5)
        );

        const locationMatch = Boolean(
          (!item.expected.location && !data.location) ||
          (item.expected.location && data.location && data.location.toLowerCase().includes('san') || data.location?.toLowerCase().includes('new york') || data.location?.toLowerCase().includes('austin') || data.location?.toLowerCase().includes('palo alto') || data.location?.toLowerCase().includes('seattle') || data.location?.toLowerCase().includes('boulder') || data.location?.toLowerCase().includes('los angeles') || data.location?.toLowerCase().includes('chicago') || data.location?.toLowerCase().includes('san jose') || data.location?.toLowerCase().includes('online'))
        );

        const typeMatch = Boolean(
          data.eventType &&
          data.eventType.toLowerCase().includes(item.expected.eventType.toLowerCase())
        );

        const isSuccess = titleMatch && priceMatch;

        newResults.push({
          itemId: item.id,
          name: item.name,
          status: isSuccess ? 'SUCCESS' : 'FAILURE',
          latencyMs,
          extracted: data,
          fieldMatches: {
            title: titleMatch,
            startDate: startDateMatch,
            price: priceMatch,
            location: locationMatch,
            eventType: typeMatch,
          },
        });
      } catch (err: any) {
        newResults.push({
          itemId: item.id,
          name: item.name,
          status: 'FAILURE',
          latencyMs: Date.now() - start,
          extracted: null,
          fieldMatches: {
            title: false,
            startDate: false,
            price: false,
            location: false,
            eventType: false,
          },
          errorMessage: err.message,
        });
      }
      setResults([...newResults]);
    }

    setIsRunning(false);
  };

  // Compute aggregate stats
  const totalRuns = results.length;
  const successfulRuns = results.filter((r) => r.status === 'SUCCESS').length;
  const apiFailures = results.filter((r) => r.errorMessage).length;
  const totalLatency = results.reduce((acc, r) => acc + r.latencyMs, 0);
  const avgLatency = totalRuns > 0 ? Math.round(totalLatency / totalRuns) : 0;

  // Field extraction accuracy
  let totalFieldChecks = 0;
  let passedFieldChecks = 0;
  results.forEach((r) => {
    Object.values(r.fieldMatches).forEach((match) => {
      totalFieldChecks++;
      if (match) passedFieldChecks++;
    });
  });
  const fieldAccuracy = totalFieldChecks > 0 ? Math.round((passedFieldChecks / totalFieldChecks) * 100) : 0;

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-8 animate-fade-in">
      {/* Header & Benchmark Controls */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-6 h-6 text-sky-400" />
              <h1 className="text-2xl font-black text-white">Developer Evaluation System</h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Benchmark extraction accuracy, latency, and prompt versions against 10 test event datasets.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-slate-400 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
              Prompt Version: <span className="text-indigo-400 font-bold">{promptVersion}</span>
            </span>

            <button
              onClick={runEvaluation}
              disabled={isRunning}
              className="py-2.5 px-6 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg transition-all flex items-center gap-2 text-xs shrink-0"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Testing ({currentIndex}/10)...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Run Benchmark Suite</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Aggregate Stats Dashboard */}
        {results.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400 uppercase font-semibold">Field Accuracy</span>
              <div className="text-2xl font-black text-emerald-400 font-mono">{fieldAccuracy}%</div>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400 uppercase font-semibold">Average Latency</span>
              <div className="text-2xl font-black text-indigo-400 font-mono">{avgLatency} ms</div>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400 uppercase font-semibold">Passed Runs</span>
              <div className="text-2xl font-black text-sky-400 font-mono">
                {successfulRuns} / {totalRuns}
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400 uppercase font-semibold">API Failures</span>
              <div className="text-2xl font-black text-amber-400 font-mono">{apiFailures}</div>
            </div>
          </div>
        )}
      </div>

      {/* Test Dataset Comparison Table */}
      {results.length > 0 ? (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-slate-200">Evaluation Dataset Results (10 Items)</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase font-semibold text-[10px]">
                  <th className="py-3 px-3">Test Item</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Latency</th>
                  <th className="py-3 px-3">Title Match</th>
                  <th className="py-3 px-3">Price Match</th>
                  <th className="py-3 px-3">Location Match</th>
                  <th className="py-3 px-3">Expected vs Extracted Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                {results.map((res) => {
                  const expectedItem = EVAL_DATASET.find((d) => d.id === res.itemId);
                  return (
                    <tr key={res.itemId} className="hover:bg-slate-950/40">
                      <td className="py-3 px-3 font-sans font-semibold text-white">{res.name}</td>
                      <td className="py-3 px-3">
                        {res.status === 'SUCCESS' ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" /> PASS
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-400 font-bold">
                            <XCircle className="w-3.5 h-3.5" /> FAIL
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-400">{res.latencyMs} ms</td>
                      <td className="py-3 px-3">
                        {res.fieldMatches.title ? (
                          <span className="text-emerald-400">✓ Match</span>
                        ) : (
                          <span className="text-rose-400">✗ Mismatch</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        {res.fieldMatches.price ? (
                          <span className="text-emerald-400">✓ Match</span>
                        ) : (
                          <span className="text-rose-400">✗ Mismatch</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        {res.fieldMatches.location ? (
                          <span className="text-emerald-400">✓ Match</span>
                        ) : (
                          <span className="text-amber-400">~ Partial</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-400">
                        <span className="text-slate-300">${expectedItem?.expected.price ?? 'Free'}</span> →{' '}
                        <span className="text-indigo-400 font-bold">${res.extracted?.price ?? 'Free'}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-12 text-center space-y-4 max-w-md mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center mx-auto border border-sky-500/20">
            <Code2 className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">Ready to Run Benchmark</h3>
            <p className="text-xs text-slate-400">
              Click 'Run Benchmark Suite' above to execute Gemini extraction across 10 sample event datasets.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
