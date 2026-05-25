// src/pages/DashboardPage.tsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStatement } from '../hooks/useStatement'
import { createT } from '../i18n'
import SummaryCards from '../components/overview/SummaryCards'
import PortfolioPieChart from '../components/overview/PortfolioPieChart'
import PeriodInfo from '../components/overview/PeriodInfo'
import PositionsTable from '../components/positions/PositionsTable'
import TradesTable from '../components/trades/TradesTable'

// ---- 工具函数 ----
function formatDate(d: Date) {
  return d.toISOString().slice(0, 10)
}

type TabValue = 'overview' | 'positions' | 'trades'

// ---- 顶部栏 ----
interface TopBarProps {
  accountName: string
  period: string
  lang: 'en' | 'zh'
  darkMode: boolean
  onUploadMore: () => void
  onToggleLang: () => void
  onToggleDark: () => void
}

function TopBar({
  accountName,
  period,
  lang,
  darkMode,
  onUploadMore,
  onToggleLang,
  onToggleDark,
}: TopBarProps) {
  const borderColor = darkMode ? 'border-gray-800' : 'border-gray-200'
  const bg = darkMode ? 'bg-gray-950' : 'bg-white'
  const textPrimary = darkMode ? 'text-white' : 'text-gray-900'
  const textMuted = darkMode ? 'text-gray-400' : 'text-gray-500'
  const btnSecondary = darkMode
    ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
    : 'bg-gray-100 hover:bg-gray-200 text-gray-600'

  return (
    <header className={`sticky top-0 z-10 ${bg} border-b ${borderColor} px-4 py-3`}>
      <div className="max-w-7xl mx-auto flex items-center gap-4">
        {/* 账户信息 */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold truncate ${textPrimary}`}>{accountName}</p>
          <p className={`text-xs ${textMuted}`}>{period}</p>
        </div>

        {/* 操作按钮组 */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onUploadMore}
            className="px-3 py-1.5 text-xs font-medium rounded-md bg-green-500 hover:bg-green-400 text-white transition-colors cursor-pointer"
          >
            {lang === 'zh' ? '继续上传' : 'Upload More'}
          </button>

          <button
            onClick={onToggleLang}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${btnSecondary}`}
          >
            {lang === 'en' ? '中文' : 'EN'}
          </button>

          <button
            onClick={onToggleDark}
            className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors cursor-pointer ${btnSecondary}`}
            aria-label="Toggle dark mode"
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </div>
    </header>
  )
}

// ---- 主页面 ----
export default function DashboardPage() {
  const { merged, lang, setLang, darkMode, setDarkMode } = useStatement()
  const t = createT(lang)
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabValue>('overview')

  // 只在没有数据时（首次进入、非主动跳转）才重定向
  useEffect(() => {
    if (!merged) navigate('/', { replace: true })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!merged) return null

  const period = `${formatDate(merged.periodStart)} → ${formatDate(merged.periodEnd)}`
  const accountLabel = merged.accountName || merged.accountId

  // ---- 主题 token ----
  const bg = darkMode ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'
  const tabBorder = darkMode ? 'border-gray-800' : 'border-gray-200'
  const tabActive = darkMode
    ? 'text-white border-b-2 border-green-400'
    : 'text-gray-900 border-b-2 border-green-600'
  const tabInactive = darkMode
    ? 'text-gray-500 hover:text-gray-300'
    : 'text-gray-400 hover:text-gray-600'

  const tabs: { value: TabValue; label: string }[] = [
    { value: 'overview', label: t('overview') },
    { value: 'positions', label: t('positions') },
    { value: 'trades', label: t('trades') },
  ]

  return (
    <div className={`min-h-screen ${bg}`}>
      <TopBar
        accountName={accountLabel}
        period={period}
        lang={lang}
        darkMode={darkMode}
        onUploadMore={() => navigate('/')}
        onToggleLang={() => setLang(lang === 'en' ? 'zh' : 'en')}
        onToggleDark={() => setDarkMode(!darkMode)}
      />

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Tab 导航 */}
        <div className={`flex gap-1 mb-6 border-b ${tabBorder}`}>
          {tabs.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setActiveTab(value)}
              className={`px-4 py-2 text-sm font-medium transition-colors cursor-pointer
                ${activeTab === value ? tabActive : tabInactive}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Tab 内容面板 */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <SummaryCards />
            <PortfolioPieChart />
            <PeriodInfo />
          </div>
        )}
        {activeTab === 'positions' && <PositionsTable />}
        {activeTab === 'trades' && <TradesTable />}
      </main>
    </div>
  )
}
