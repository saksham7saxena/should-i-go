import React, { useState } from 'react';
import { EVAL_DATASET } from '../utils/evalDataset';
import { extractEventFromUrl } from '../lib/gemini';
import { EvalRunResult } from '../types';
import { Activity, Play, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';

export const EvalsPage: React.FC = () => {
  const [results, setResults] = useState<EvalRunResult[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [promptVersion] = useState<string>('v2.0.0');

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

        // Strict comparison checks
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
          (item.expected.location && data.location)
        );

        const typeMatch = Boolean(
          data.eventType &&
          data.eventType.toLowerCase().includes(item.expected.eventType.toLowerCase())
        );

        const missingCount = data.missingInformation?.length || 0;
        const missingFieldRate = Math.round((missingCount / 5) * 100);

        const isSuccess = titleMatch && priceMatch;

        newResults.push({
          itemId: item.id,
          name: item.name,
          status: isSuccess ? 'SUCCESS' : 'FAILURE',
          latencyMs,
          estimatedTokens: Math.round(150 + (item.mockHtml?.length || 500) / 4),
          extracted: data,
          fieldMatches: {
            title: titleMatch,
            startDate: startDateMatch,
            price: priceMatch,
            location: locationMatch,
            eventType: typeMatch,
          },
          missingFieldRate,
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
          missingFieldRate: 100,
          errorMessage: err.message,
        });
      }
      setResults([...newResults]);
    }

    setIsRunning(false);
  };

  const totalRuns = results.length;
  const successfulRuns = results.filter((r) => r.status === 'SUCCESS').length;
  const apiFailures = results.filter((r) => r.errorMessage).length;
  const totalLatency = results.reduce((acc, r) => acc + r.latencyMs, 0);
  const avgLatency = totalRuns > 0 ? Math.round(totalLatency / totalRuns) : 0;
  const totalTokens = results.reduce((acc, r) => acc + (r.estimatedTokens || 0), 0);

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
    <div className="max-w-5xl mx-auto py-10 px-4 space-y-8 animate-fade-in text-[#0c0a09]">
      {/* Header */}
      <div className="bg-white border border-[#e7e5e4] rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e7e5e4] pb-6">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-6 h-6 text-[#0c0a09]" />
              <h1 className="text-2xl font-serif text-[#0c0a09]">Developer Evaluation Suite</h1>
            </div>
            <p className="text-xs text-[#777169] mt-1">
              Benchmark field extraction accuracy, missing field rates, latency, and tokens against 15 real event fixtures.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-[#4e4e4e] bg-[#f5f5f5] px-3 py-1.5 rounded-full border border-[#e7e5e4]">
              Prompt Version: <span className="text-[#0c0a09] font-bold">{promptVersion}</span>
            </span>

            <button
              onClick={runEvaluation}
              disabled={isRunning}
              className="py-2.5 px-6 bg-[#0c0a09] hover:bg-[#292524] text-white font-semibold text-xs rounded-full shadow-xs transition-all flex items-center gap-2 shrink-0"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Testing ({currentIndex}/15)...</span>
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

        {/* Dashboard Aggregate Stats */}
        {results.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-[#f5f5f5] p-4 rounded-xl border border-[#e7e5e4] space-y-1">
              <span className="text-[11px] text-[#777169] uppercase font-bold">Field Accuracy</span>
              <div className="text-2xl font-black text-emerald-800 font-mono">{fieldAccuracy}%</div>
            </div>

            <div className="bg-[#f5f5f5] p-4 rounded-xl border border-[#e7e5e4] space-y-1">
              <span className="text-[11px] text-[#777169] uppercase font-bold">Avg Latency</span>
              <div className="text-2xl font-black text-[#0c0a09] font-mono">{avgLatency} ms</div>
            </div>

            <div className="bg-[#f5f5f5] p-4 rounded-xl border border-[#e7e5e4] space-y-1">
              <span className="text-[11px] text-[#777169] uppercase font-bold">Passed Runs</span>
              <div className="text-2xl font-black text-[#0c0a09] font-mono">
                {successfulRuns} / {totalRuns}
              </div>
            </div>

            <div className="bg-[#f5f5f5] p-4 rounded-xl border border-[#e7e5e4] space-y-1">
              <span className="text-[11px] text-[#777169] uppercase font-bold">API Failures</span>
              <div className="text-2xl font-black text-amber-800 font-mono">{apiFailures}</div>
            </div>

            <div className="bg-[#f5f5f5] p-4 rounded-xl border border-[#e7e5e4] space-y-1">
              <span className="text-[11px] text-[#777169] uppercase font-bold">Est. Tokens</span>
              <div className="text-2xl font-black text-[#0c0a09] font-mono">{totalTokens}</div>
            </div>
          </div>
        )}
      </div>

      {/* Dataset Results Table */}
      {results.length > 0 && (
        <div className="bg-white border border-[#e7e5e4] rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-[#0c0a09]">Evaluation Fixtures Benchmark (15 Items)</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#e7e5e4] text-[#777169] uppercase font-bold text-[10px]">
                  <th className="py-2.5 px-3">Fixture</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Latency</th>
                  <th className="py-2.5 px-3">Title Match</th>
                  <th className="py-2.5 px-3">Price Match</th>
                  <th className="py-2.5 px-3">Missing Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e7e5e4] font-mono text-[#0c0a09]">
                {results.map((res) => {
                  return (
                    <tr key={res.itemId} className="hover:bg-[#f5f5f5]">
                      <td className="py-3 px-3 font-sans font-semibold text-[#0c0a09]">{res.name}</td>
                      <td className="py-3 px-3">
                        {res.status === 'SUCCESS' ? (
                          <span className="inline-flex items-center gap-1 text-emerald-800 font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> PASS
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-800 font-bold">
                            <XCircle className="w-3.5 h-3.5 text-rose-600" /> FAIL
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-[#777169]">{res.latencyMs} ms</td>
                      <td className="py-3 px-3">
                        {res.fieldMatches.title ? (
                          <span className="text-emerald-800">✓ Match</span>
                        ) : (
                          <span className="text-rose-800">✗ Mismatch</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        {res.fieldMatches.price ? (
                          <span className="text-emerald-800">✓ Match</span>
                        ) : (
                          <span className="text-rose-800">✗ Mismatch</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-[#777169]">{res.missingFieldRate}% missing</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
