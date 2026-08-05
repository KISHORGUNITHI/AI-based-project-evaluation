import { Clock, Cpu, CheckCircle, UserCheck, Star } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface EvaluationSummaryCardProps {
  evaluations: {
    PENDING?: number
    AI_EVALUATING?: number
    AI_COMPLETED?: number
    JUDGE_EVALUATING?: number
    COMPLETED?: number
  }
  aiScore?: number
  judgeScore?: number
}

const statusConfig = [
  { key: 'PENDING', label: 'Pending', icon: Clock, color: 'text-slate-500', bg: 'bg-slate-100' },
  { key: 'AI_EVALUATING', label: 'AI Evaluating', icon: Cpu, color: 'text-purple-500', bg: 'bg-purple-100' },
  { key: 'AI_COMPLETED', label: 'AI Completed', icon: CheckCircle, color: 'text-indigo-500', bg: 'bg-indigo-100' },
  { key: 'JUDGE_EVALUATING', label: 'Judge Reviewing', icon: UserCheck, color: 'text-orange-500', bg: 'bg-orange-100' },
  { key: 'COMPLETED', label: 'Completed', icon: Star, color: 'text-green-500', bg: 'bg-green-100' },
] as const

export function EvaluationSummaryCard({ evaluations, aiScore, judgeScore }: EvaluationSummaryCardProps) {
  const total = Object.values(evaluations).reduce((sum, val) => sum + (val ?? 0), 0)
  const showChart = aiScore !== undefined && judgeScore !== undefined

  const chartData = showChart
    ? [
        { name: 'AI Score', value: aiScore, fill: '#f97316' },
        { name: 'Judge Score', value: judgeScore, fill: '#3b82f6' },
      ]
    : []

  return (
    <div className="rounded-xl overflow-hidden bg-gradient-to-br from-orange-50 via-white to-pink-50 border border-orange-100 shadow-sm">
      <div className="p-4">
        {/* Title */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-slate-700">Evaluation Status</h3>
          <div className="px-2 py-0.5 rounded-full bg-white/80 shadow-sm">
            <span className="text-xs font-bold text-slate-600">{total}</span>
          </div>
        </div>

        {/* Score Comparison Chart */}
        {showChart && (
          <div className="mb-3 p-2 rounded-lg bg-white/60 border border-orange-50">
            <p className="text-xs font-semibold text-slate-600 mb-1.5">Score Comparison</p>
            <ResponsiveContainer width="100%" height={80}>
              <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 5, bottom: 0, left: 50 }}>
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #fed7aa', 
                    borderRadius: '6px',
                    fontSize: '11px',
                    padding: '4px 8px'
                  }} 
                />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Status List */}
        <div className="space-y-1.5">
          {statusConfig.map(({ key, label, icon: Icon, color, bg }) => {
            const count = evaluations[key] ?? 0
            return (
              <div
                key={key}
                className="flex items-center justify-between p-2 rounded-lg bg-white/60 border border-orange-50 hover:bg-white/80 transition"
              >
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center ${bg}`}>
                    <Icon size={12} className={color} />
                  </div>
                  <span className="text-xs font-medium text-slate-700">{label}</span>
                </div>
                <span className="text-sm font-bold text-slate-800">{count}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
