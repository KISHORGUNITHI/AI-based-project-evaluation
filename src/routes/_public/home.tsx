import { createFileRoute, Link } from '@tanstack/react-router'
import {
  GitBranch, FileText, CheckSquare, Clock, BarChart2, Zap, Users,
  MessageSquare, ChevronRight, Play, Star, Trophy, Code2, Shield,
} from 'lucide-react'

export const Route = createFileRoute('/_public/home')({
  component: HomePage,
})

function HomePage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-slate-100 px-8 lg:px-20 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center text-white font-extrabold text-sm shadow">AI</div>
            <span className="text-2xl font-bold text-slate-900">Eval<span className="text-orange-500">AI</span></span>
          </div>
          <div className="hidden md:flex items-center gap-10 text-base font-medium text-slate-600">
            <a href="#features"     className="hover:text-orange-500 transition">Features</a>
            <a href="#benefits"     className="hover:text-orange-500 transition">Benefits</a>
            <a href="#preview"      className="hover:text-orange-500 transition">Preview</a>
            <a href="#testimonials" className="hover:text-orange-500 transition">Testimonials</a>
            <a href="#contact"      className="hover:text-orange-500 transition">Contact</a>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-base font-semibold text-slate-700 hover:text-orange-500 transition px-4 py-2">
              Login
            </Link>
            <Link to="/signup" className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-pink-600 text-white text-base font-bold shadow hover:opacity-90 transition">
              Register
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="w-full min-h-[calc(100vh-65px)] px-8 lg:px-20 py-20 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center bg-gradient-to-br from-orange-50 via-white to-pink-50">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-orange-500 border border-orange-200 rounded-full px-3 py-1.5 bg-orange-50">
            <ChevronRight size={12} /> Introducing EvalAI 2.0
          </div>
          <h1 className="text-6xl xl:text-7xl font-extrabold leading-tight text-slate-900">
            AI-Powered<br />
            <span className="text-orange-500">Project Evaluation</span>
          </h1>
          <p className="text-xl text-slate-500 max-w-xl leading-relaxed">
            Evaluate repositories, reports, and presentations faster with intelligent automated assessment. Set up custom rubrics and receive objective reviews instantly.
          </p>
          <div className="flex items-center gap-4">
            <Link to="/signup" className="flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-orange-500 to-pink-600 text-white font-bold text-lg shadow-lg hover:opacity-90 transition">
              Get Started <ChevronRight size={18} />
            </Link>
            <button className="flex items-center gap-2 px-6 py-4 rounded-xl border border-slate-200 text-slate-700 font-semibold text-lg hover:bg-slate-50 transition">
              <Play size={16} className="fill-slate-700" /> Watch Demo
            </button>
          </div>
        </div>

        {/* Terminal / Score card mockup */}
        <div className="relative">
          <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-700">
            {/* Terminal header */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Code2 size={13} /> TypeScript Project detected
              </div>
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
            </div>
            <div className="px-4 py-2 bg-slate-800 text-xs text-green-400 font-mono border-b border-slate-700">
              &gt;_ evaluation_agent_v2.log
            </div>
            {/* Score card */}
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-semibold text-sm">repository: ecommerce-service</p>
                  <p className="text-slate-400 text-xs mt-0.5">Branch: main • Commit: a4f6d2b</p>
                </div>
                <span className="px-2 py-1 rounded-lg bg-green-500/20 text-green-400 text-xs font-bold">● Completed</span>
              </div>
              <div className="flex items-center gap-4 bg-slate-800 rounded-xl p-4">
                <div className="relative w-16 h-16 shrink-0">
                  <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1e293b" strokeWidth="3" />
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f97316" strokeWidth="3"
                      strokeDasharray="94 6" strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white font-extrabold text-lg">94</span>
                  </div>
                </div>
                <div>
                  <p className="text-slate-400 text-xs uppercase tracking-wider">Evaluation Score</p>
                  <p className="text-white font-bold text-base">Excellent Standard</p>
                  <p className="text-slate-400 text-xs mt-0.5">Meets 19/20 defined criteria in your grading rubric</p>
                </div>
              </div>
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">Analysis Logs</p>
                <div className="space-y-2">
                  {[
                    { icon: '✓', label: 'Code Coverage Standard',       detail: 'Total code coverage is 94.6% (meets target > 90%)', color: 'text-green-400' },
                    { icon: '✓', label: 'Documentation Coverage',        detail: 'API docs complete; README includes clear installation instructions', color: 'text-green-400' },
                    { icon: '△', label: 'Complexity and Refactoring',    detail: 'High cognitive complexity in controllerHandler in line 47', color: 'text-amber-400' },
                  ].map(item => (
                    <div key={item.label} className="flex items-start gap-2.5 text-xs">
                      <span className={`mt-0.5 font-bold ${item.color}`}>{item.icon}</span>
                      <div>
                        <p className="text-slate-300 font-medium">{item.label}</p>
                        <p className="text-slate-500 mt-0.5">{item.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <div className="border-y border-slate-100 bg-slate-50 py-12">
        <div className="w-full px-8 lg:px-20 grid grid-cols-3 gap-6 text-center">
          {[
            { value: '90%',   label: 'Time Saved' },
            { value: '100k+', label: 'Projects Evaluated' },
            { value: '0%',    label: 'Grading Variance' },
          ].map(s => (
            <div key={s.label}>
              <p className="text-5xl font-extrabold text-slate-900">{s.value}</p>
              <p className="text-base text-slate-500 mt-2">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Features / Capabilities ── */}
      <section id="features" className="py-28 w-full px-8 lg:px-20">
        <div className="text-center space-y-3 mb-16">
          <p className="text-xs font-bold tracking-widest text-orange-500 uppercase">Capabilities</p>
          <h2 className="text-5xl font-extrabold text-slate-900">Designed for Thorough Assessments</h2>
          <p className="text-slate-500 max-w-3xl mx-auto text-xl">EvalAI combines advanced static code analytics with contextual AI reviews to automate grading without sacrificing depth.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: GitBranch,   title: 'Repository Analysis',  desc: 'Analyze code quality, directory structures, dependencies, and commit history automatically from connected Git repositories.' },
            { icon: FileText,    title: 'Report Evaluation',    desc: 'Extract text and structured guidelines from PDF, Word, and text documents to verify alignment with instructions.' },
            { icon: CheckSquare, title: 'Rubric-Based Scoring', desc: 'Establish custom criteria. Set weights, requirements, and compliance standards to obtain fair, deterministic scores.' },
            { icon: Zap,         title: 'Instant Feedback',     desc: 'Receive detailed AI-generated feedback within seconds of submission, not days.' },
            { icon: Users,       title: 'Team Management',      desc: 'Organize students into teams, assign judges, and manage cohort-level evaluations effortlessly.' },
            { icon: Shield,      title: 'Secure & Private',     desc: 'All submissions are encrypted. Only assigned judges and admins can access project data.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="group p-6 rounded-2xl border border-slate-100 hover:border-orange-200 hover:shadow-md transition space-y-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center shadow">
                <Icon size={18} className="text-white" />
              </div>
              <h3 className="font-bold text-slate-900">{title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Benefits ── */}
      <section id="benefits" className="py-28 bg-slate-50">
        <div className="w-full px-8 lg:px-20 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <p className="text-xs font-bold tracking-widest text-orange-500 uppercase">Benefits</p>
            <h2 className="text-4xl font-extrabold text-slate-900">Standardize Assessments,<br />Amplify Results</h2>
            <p className="text-slate-500 text-lg leading-relaxed">Manual evaluation is slow, subjective, and difficult to scale. EvalAI brings enterprise-grade structure to reviews, helping you focus on the projects that matter most.</p>
            <div className="grid grid-cols-2 gap-6 pt-2">
              {[
                { icon: Clock,       title: 'Save Evaluation Time',  desc: 'Reduce evaluation cycles from weeks to minutes. Automating rubric checks and template validations cuts assessor overhead by up to 90%.' },
                { icon: BarChart2,   title: 'Consistent Scoring',    desc: 'Achieve uniform grading standards across hundreds of projects. All reviews run against objective rubrics, eliminating subjectivity.' },
                { icon: Zap,         title: 'Scalable Reviews',      desc: 'Handle dozens to thousands of submissions effortlessly. Concurrently process submissions for any cohort size.' },
                { icon: MessageSquare, title: 'Actionable Feedback', desc: 'Provide developers with traced, detailed feedback. Every review generates line-by-line analysis.' },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="space-y-2">
                  <Icon size={20} className="text-orange-500" />
                  <h4 className="font-bold text-slate-900 text-sm">{title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Process Comparison card */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900">Process Comparison</h3>
            <div className="rounded-2xl border border-slate-200 p-5 space-y-2 bg-white">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold tracking-widest text-slate-500 uppercase">Traditional Method</p>
                <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">Slow & Inconsistent</span>
              </div>
              {['Assessor time spent: 30–45 minutes per repository', 'Score drift: fatigue causes grading variance', 'Feedback: limited to basic summaries, lacks code context'].map(t => (
                <div key={t} className="flex items-start gap-2 text-sm text-slate-600">
                  <span className="text-red-400 mt-0.5">•</span>{t}
                </div>
              ))}
            </div>
            <div className="rounded-2xl border border-orange-200 p-5 space-y-2 bg-gradient-to-br from-orange-50 to-pink-50">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold tracking-widest text-orange-600 uppercase">With EvalAI</p>
                <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">≈ 10x Efficiency</span>
              </div>
              {['Automated scans: completed in under 45 seconds', '100% objective: checks run against structured JSON rubrics', 'Line-by-line tips: pinpoint code standards directly in-app'].map(t => (
                <div key={t} className="flex items-start gap-2 text-sm text-slate-700">
                  <span className="text-green-500 mt-0.5">✓</span>{t}
                </div>
              ))}
            </div>
            <div className="rounded-xl bg-gradient-to-r from-orange-500 to-pink-600 p-4 text-white flex items-center gap-4">
              <p className="text-3xl font-extrabold">45s</p>
              <p className="text-sm text-white/90">Average time needed to run full code quality, documentation, and formatting audits per submission.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Product Preview ── */}
      <section id="preview" className="py-28 w-full px-8 lg:px-20">
        <div className="text-center space-y-3 mb-16">
          <p className="text-xs font-bold tracking-widest text-orange-500 uppercase">Product Preview</p>
          <h2 className="text-4xl font-extrabold text-slate-900">See the Platform in Action</h2>
          <p className="text-slate-500 max-w-2xl mx-auto">An overview of the automated feedback loops, cohort leaderboards, and scoring diagnostics generated for every single project submission.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Score breakdown */}
          <div className="rounded-2xl border border-slate-200 p-6 space-y-4 hover:shadow-md transition">
            <div className="flex items-center gap-2">
              <BarChart2 size={16} className="text-orange-500" />
              <h3 className="font-bold text-slate-900">Evaluation Score Breakdown</h3>
            </div>
            <p className="text-sm text-slate-500">Scores are aggregated using relative rubric weights. Each category runs independent evaluation scripts.</p>
            <div className="space-y-3">
              {[
                { label: 'Security Auditing',   pct: 98, color: 'from-orange-500 to-pink-500' },
                { label: 'Code Architecture',   pct: 90, color: 'from-pink-500 to-purple-500' },
                { label: 'Documentation',       pct: 85, color: 'from-purple-500 to-indigo-500' },
              ].map(item => (
                <div key={item.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600 font-medium">{item.label}</span>
                    <span className="font-bold text-slate-800">{item.pct}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full bg-gradient-to-r ${item.color}`} style={{ width: `${item.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Leaderboard */}
          <div className="rounded-2xl border border-slate-200 p-6 space-y-4 hover:shadow-md transition">
            <div className="flex items-center gap-2">
              <Trophy size={16} className="text-orange-500" />
              <h3 className="font-bold text-slate-900">Project Ranking Cohort</h3>
            </div>
            <p className="text-sm text-slate-500">Cohort standing updated automatically as submissions roll in.</p>
            <div className="space-y-2">
              {[
                { rank: 1, name: 'payment-gateway-service', score: 98.2 },
                { rank: 2, name: 'auth-middleware-module',  score: 95.5 },
                { rank: 3, name: 'customer-analytics-api',  score: 94.0 },
              ].map(item => (
                <div key={item.rank} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${item.rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-amber-500' : item.rank === 2 ? 'bg-slate-400' : 'bg-orange-400'}`}>{item.rank}</span>
                    <span className="text-sm font-medium text-slate-700 truncate max-w-[160px]">{item.name}</span>
                  </div>
                  <span className="text-sm font-bold text-orange-500">{item.score}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" className="py-28 bg-slate-50">
        <div className="w-full px-8 lg:px-20">
          <div className="text-center space-y-3 mb-16">
            <p className="text-xs font-bold tracking-widest text-orange-500 uppercase">Testimonials</p>
            <h2 className="text-4xl font-extrabold text-slate-900">Trusted by Educators and Evaluators</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">Read how classrooms, hackathon committees, and enterprise R&D departments use EvalAI to bring speed and objectivity to grading.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                role: 'Faculty Reviewer',
                quote: '"EvalAI revolutionized our capstone grading. We went from assessing 30 projects over a stressful weekend to evaluating 150+ repositories in under an hour, providing completely consistent, objective feedback for every student."',
                name: 'Dr. Sarah Jenkins',
              },
              {
                role: 'Hackathon Judge',
                quote: '"Judging hackathons used to be a subjective mess of spreadsheets and rushed presentations. With EvalAI, we rank 80 team submissions instantly based on repository health and build compliance. The participants loved the transparency."',
                name: 'Alex Rivera',
              },
              {
                role: 'Innovation Evaluator',
                quote: '"We review hundreds of internal proof-of-concept submissions every year. EvalAI gives our engineering leadership a unified standard to verify safety, dependencies, and formatting before approving project budgets."',
                name: 'Marcus Chen',
              },
            ].map(t => (
              <div key={t.name} className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4 hover:shadow-md transition">
                <p className="text-xs font-bold text-orange-500 uppercase tracking-wider">{t.role}</p>
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={12} className="fill-orange-400 text-orange-400" />)}
                </div>
                <p className="text-sm text-slate-600 leading-relaxed italic">{t.quote}</p>
                <p className="text-sm font-bold text-slate-900">{t.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section id="contact" className="py-28">
        <div className="w-full px-8 lg:px-20 text-center space-y-8 max-w-4xl mx-auto">
          <h2 className="text-5xl font-extrabold text-slate-900">Ready to Transform Project Evaluation?</h2>
          <p className="text-xl text-slate-500">Join leading universities, hackathons, and enterprise teams using EvalAI to automate repository reviews and save weeks of manual effort.</p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link to="/signup" className="flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-pink-600 text-white font-bold shadow-xl hover:opacity-90 transition">
              Get Started Free <ChevronRight size={16} />
            </Link>
            <Link to="/login" className="px-7 py-3.5 rounded-xl text-slate-700 font-semibold hover:text-orange-500 transition">
              Log In to Platform
            </Link>
          </div>
          <p className="text-xs text-slate-400">No credit card required • Sandbox environment included</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-100 bg-white py-16 px-8 lg:px-20">
        <div className="w-full grid grid-cols-1 md:grid-cols-5 gap-12">
          {/* Brand */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center text-white font-bold text-xs">AI</div>
              <span className="font-bold text-slate-900">Eval<span className="text-orange-500">AI</span></span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">Bringing automated assessment, structural insights, and objective reviews to software repos and project reports.</p>
          </div>
          {/* Links */}
          {[
            { heading: 'Product',    links: ['Features', 'Benefits', 'Preview', 'Pricing Plan'] },
            { heading: 'Resources',  links: ['Documentation', 'Changelog', 'Platform Guides', 'Support Center'] },
            { heading: 'Company',    links: ['About Us', 'Blog Posts', 'Careers', 'Customer Stories'] },
            { heading: 'Contact',    links: ['Support Team', 'Enterprise Sales', 'Status Page', 'Security Audit'] },
          ].map(col => (
            <div key={col.heading} className="space-y-3">
              <p className="text-xs font-bold tracking-widest text-slate-500 uppercase">{col.heading}</p>
              <ul className="space-y-2">
                {col.links.map(l => <li key={l}><a href="#" className="text-sm text-slate-600 hover:text-orange-500 transition">{l}</a></li>)}
              </ul>
            </div>
          ))}
        </div>
        <div className="w-full mt-10 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-400">© 2026 EvalAI Inc. All rights reserved.</p>
          <div className="flex gap-4 text-xs text-slate-400">
            <a href="#" className="hover:text-orange-500 transition">Privacy Policy</a>
            <a href="#" className="hover:text-orange-500 transition">Terms of Service</a>
            <a href="#" className="hover:text-orange-500 transition">Cookie Settings</a>
          </div>
        </div>
      </footer>

    </div>
  )
}
