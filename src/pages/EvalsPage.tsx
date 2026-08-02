import React, { useState } from 'react';
import { EVAL_DATASET } from '../utils/evalDataset';
import { extractEventFromUrl } from '../lib/gemini';
import { EvalRunResult } from '../types';
import { Activity, Play, CheckCircle2, XCircle, Code2, RefreshCw } from 'lucide-react';

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

  const totalRuns = results.length;
  const successfulRuns = results.filter((r) => r.status === 'SUCCESS').length;
  const apiFailures = results.filter((r) => r.errorMessage).length;
  const totalLatency = results.reduce((acc, r) => acc + r.latencyMs, 0);
  const avgLatency = totalRuns > 0 ? Math.round(totalLatency / totalRuns) : 0;

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
    <div className="max-w-5xl mx-auto py-10 px-4 space-y-8 animate-fade-in text-gray-900">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-6 h-6 text-black" />
              <h1 className="text-2xl font-extrabold text-gray-900">Developer Evaluation Suite</h1>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Benchmark extraction accuracy, latency, and prompt versions against 10 sample event datasets.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-gray-700 bg-gray-100 px-3 py-1.5 rounded-md border border-gray-200">
              Prompt Version: <span className="text-black font-bold">{promptVersion}</span>
            </span>

            <button
              onClick={runEvaluation}
              disabled={isRunning}
              className="py-2 px-5 bg-black hover:bg-gray-800 text-white font-bold rounded-lg shadow-sm transition-all flex items-center gap-2 text-xs shrink-0"
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

        {/* Stats */}
        {results.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-[#f5f5f5] p-4 rounded-lg border border-gray-200 space-y-1">
              <span className="text-[11px] text-gray-500 uppercase font-bold">Field Accuracy</span>
              <div className="text-2xl font-black text-emerald-700 font-mono">{fieldAccuracy}%</div>
            </div>

            <div className="bg-[#f5f5f5] p-4 rounded-lg border border-gray-200 space-y-1">
              <span className="text-[11px] text-gray-500 uppercase font-bold">Average Latency</span>
              <div className="text-2xl font-black text-black font-mono">{avgLatency} ms</div>
            </div>

            <div className="bg-[#f5f5f5] p-4 rounded-lg border border-gray-200 space-y-1">
              <span className="text-[11px] text-gray-500 uppercase font-bold">Passed Runs</span>
              <div className="text-2xl font-black text-gray-900 font-mono">
                {successfulRuns} / {totalRuns}
              </div>
            </div>

            <div className="bg-[#f5f5f5] p-4 rounded-lg border border-gray-200 space-y-1">
              <span className="text-[11px] text-gray-500 uppercase font-bold">API Failures</span>
              <div className="text-2xl font-black text-amber-700 font-mono">{apiFailures}</div>
            </div>
          </div>
        )}
      </div>

      {/* Dataset Results */}
      {results.length > 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-gray-900">Evaluation Dataset Results (10 Items)</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 uppercase font-bold text-[10px]">
                  <th className="py-2.5 px-3">Test Item</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Latency</th>
                  <th className="py-2.5 px-3">Title Match</th>
                  <th className="py-2.5 px-3">Price Match</th>
                  <th className="py-2.5 px-3">Expected vs Extracted Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-mono text-gray-800">
                {results.map((res) => {
                  const expectedItem = EVAL_DATASET.find((d) => d.id === res.itemId);
                  return (
                    <tr key={res.itemId} className="hover:bg-gray-50">
                      <td className="py-3 px-3 font-sans font-semibold text-gray-900">{res.name}</td>
                      <td className="py-3 px-3">
                        {res.status === 'SUCCESS' ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" /> PASS
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-700 font-bold">
                            <XCircle className="w-3.5 h-3.5" /> FAIL
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-gray-500">{res.latencyMs} ms</td>
                      <td className="py-3 px-3">
                        {res.fieldMatches.title ? (
                          <span className="text-emerald-700">✓ Match</span>
                        ) : (
                          <span className="text-rose-700">✗ Mismatch</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        {res.fieldMatches.price ? (
                          <span className="text-emerald-700">✓ Match</span>
                        ) : (
                          <span className="text-rose-700">✗ Mismatch</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-gray-500">
                        <span className="text-gray-800">${expectedItem?.expected.price ?? 'Free'}</span> →{' '}
                        <span className="text-black font-bold">${res.extracted?.price ?? 'Free'}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-[#f5f5f5] border border-gray-200 rounded-xl p-12 text-center space-y-4 max-w-md mx-auto">
          <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 text-black flex items-center justify-center mx-auto shadow-xs">
            <Code2 className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-gray-900">Ready to Run Benchmark</h3>
            <p className="text-xs text-gray-500">
              Click 'Run Benchmark Suite' above to execute Gemini extraction across 10 sample event datasets.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
