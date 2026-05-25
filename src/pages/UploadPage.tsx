import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStatement } from "../hooks/useStatement";
import { createT } from "../i18n";
import UploadZone from "../components/upload/UploadZone";

function formatDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function UploadPage() {
  const {
    files,
    merged,
    removeFile,
    lang,
    setLang,
    darkMode,
    setDarkMode,
    loadDemo,
  } = useStatement();
  const t = createT(lang);
  const navigate = useNavigate();
  const [showHint, setShowHint] = useState(false);

  const validFiles = files.filter((f) => !f.error);

  function handleDemo() {
    loadDemo();
    navigate("/dashboard");
  }

  const bg = darkMode ? "bg-gray-950 text-white" : "bg-gray-50 text-gray-900";
  const cardBg = darkMode ? "bg-gray-800" : "bg-white border border-gray-200";
  const inputBorder = darkMode
    ? "border-gray-700 hover:border-gray-500"
    : "border-gray-300 hover:border-gray-400";
  const mutedText = darkMode ? "text-gray-400" : "text-gray-500";
  const hintBg = darkMode ? "bg-gray-800" : "bg-gray-100";
  const divider = darkMode ? "bg-gray-800" : "bg-gray-200";
  const btnSecondary = darkMode
    ? "text-gray-400 hover:text-white border-gray-700 hover:border-green-500/50"
    : "text-gray-500 hover:text-gray-900 border-gray-300 hover:border-green-500/50";

  return (
    <div
      className={`min-h-screen ${bg} flex flex-col items-center justify-center px-4 py-12`}
    >
      <div className="w-full max-w-xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">
            IBKR Modern Statements
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLang(lang === "en" ? "zh" : "en")}
              className={`text-sm px-3 py-1 rounded border transition-colors ${inputBorder} ${mutedText} hover:text-${darkMode ? "white" : "gray-900"}`}
            >
              {lang === "en" ? "中文" : "EN"}
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`w-8 h-8 flex items-center justify-center rounded border transition-colors ${inputBorder} ${mutedText}`}
              aria-label="Toggle dark mode"
            >
              {darkMode ? "☀️" : "🌙"}
            </button>
            <a
              href="https://github.com/Gnomeek/ibkr_modern_statements"
              target="_blank"
              rel="noopener noreferrer"
              className={`w-8 h-8 flex items-center justify-center rounded border transition-colors ${inputBorder} ${mutedText} hover:text-${darkMode ? "white" : "gray-900"}`}
              aria-label="View on GitHub"
            >
              <svg
                viewBox="0 0 16 16"
                width="16"
                height="16"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
              </svg>
            </a>
          </div>
        </div>

        <div
          className={`flex items-start gap-2 text-xs px-3 py-2 rounded-lg ${darkMode ? "bg-green-950/40 text-green-400 border border-green-900/50" : "bg-green-50 text-green-700 border border-green-200"}`}
        >
          {t("privacyNotice")}
        </div>

        <UploadZone />

        {files.length === 0 && (
          <div className="flex items-center gap-3">
            <div className={`flex-1 h-px ${divider}`} />
            <button
              onClick={handleDemo}
              className={`flex items-center gap-2 text-sm px-4 py-2 rounded-lg border transition-colors ${btnSecondary}`}
            >
              <span className="text-xs bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded font-mono">
                {t("demoLabel")}
              </span>
              {t("tryDemo")}
            </button>
            <div className={`flex-1 h-px ${divider}`} />
          </div>
        )}

        {files.length > 0 && (
          <ul className="space-y-2">
            {files.map((f) => (
              <li
                key={f.name}
                className={`flex items-center justify-between ${cardBg} rounded-lg px-4 py-3`}
              >
                <div>
                  <p className="text-sm font-medium">{f.name}</p>
                  {f.error ? (
                    <p className="text-xs text-red-400 mt-0.5">{f.error}</p>
                  ) : (
                    <p className={`text-xs ${mutedText} mt-0.5`}>
                      {formatDate(f.statement.periodStart)} ~{" "}
                      {formatDate(f.statement.periodEnd)}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => removeFile(f.name)}
                  className={`text-sm ml-4 transition-colors ${mutedText} hover:text-red-400`}
                >
                  {t("remove")}
                </button>
              </li>
            ))}
          </ul>
        )}

        {merged?.hasOverlap && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-4 py-2 text-yellow-400 text-sm">
            ⚠ {t("overlapDetected")}
          </div>
        )}

        {validFiles.length > 0 && (
          <button
            onClick={() => navigate("/dashboard")}
            className="w-full bg-green-500 hover:bg-green-400 text-black font-semibold py-3 rounded-xl transition-colors"
          >
            {t("analyze")} →
          </button>
        )}

        <div>
          <button
            onClick={() => setShowHint((v) => !v)}
            className={`text-sm transition-colors ${mutedText} hover:text-${darkMode ? "gray-300" : "gray-700"}`}
          >
            {showHint ? "▾" : "▸"} {t("howToExport")}
          </button>
          {showHint && (
            <div
              className={`mt-3 ${hintBg} rounded-lg p-4 text-sm ${mutedText} space-y-2`}
            >
              <p>1. {t("exportStep1")}</p>
              <p>2. {t("exportStep2")}</p>
              <p>3. {t("exportStep3")}</p>
              <p>4. {t("exportStep4")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
