import * as Print from 'expo-print'
import * as Sharing from 'expo-sharing'
import { Alert } from 'react-native'
import { NAVY, GOLD } from '../constants/colors'

function formatDate(iso: string | null | undefined): string {
  if (!iso) return 'Never'
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

// ─── Shared HTML pieces ───────────────────────────────────────────────────────

const BASE_STYLES = `
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #1F2937; background: #fff; padding: 40px 36px; font-size: 14px; line-height: 1.5; }
    .header { background: ${NAVY}; color: #fff; padding: 28px 32px; border-radius: 14px; margin-bottom: 32px; }
    .header-top { display: flex; justify-content: space-between; align-items: flex-start; }
    .header-brand { font-size: 13px; letter-spacing: 1.5px; opacity: 0.65; margin-bottom: 6px; text-transform: uppercase; }
    .header-title { font-size: 26px; font-weight: 700; }
    .header-sub { font-size: 13px; opacity: 0.7; margin-top: 4px; }
    .badge { display: inline-block; padding: 3px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .badge-active { background: #D1FAE5; color: #059669; }
    .badge-inactive { background: #F3F4F6; color: #6B7280; }
    .section { margin-bottom: 28px; }
    .section-title { font-size: 11px; color: #9CA3AF; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; padding-bottom: 8px; border-bottom: 1px solid #E5E7EB; margin-bottom: 14px; }
    .info-row { display: flex; justify-content: space-between; align-items: center; padding: 9px 0; border-bottom: 1px solid #F3F4F6; }
    .info-label { color: #6B7280; }
    .info-value { font-weight: 600; text-align: right; }
    .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 4px; }
    .stat-card { background: #F9FAFB; border-radius: 10px; padding: 14px 10px; text-align: center; border: 1px solid #E5E7EB; }
    .stat-value { font-size: 22px; font-weight: 700; color: ${NAVY}; }
    .stat-label { font-size: 11px; color: #9CA3AF; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    thead th { background: ${NAVY}; color: #fff; padding: 10px 12px; text-align: left; font-size: 12px; font-weight: 600; }
    tbody tr:nth-child(even) { background: #F9FAFB; }
    tbody td { padding: 9px 12px; border-bottom: 1px solid #F3F4F6; }
    .status-done { color: #059669; font-weight: 600; }
    .status-progress { color: #D97706; font-weight: 600; }
    .chip { display: inline-block; background: #EFF6FF; color: ${NAVY}; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 500; margin: 3px 3px 3px 0; }
    .footer { margin-top: 40px; text-align: center; color: #9CA3AF; font-size: 11px; padding-top: 16px; border-top: 1px solid #E5E7EB; }
    .divider { height: 1px; background: #E5E7EB; margin: 20px 0; }
    .gold { color: #D97706; font-weight: 700; }
  </style>
`

async function sharePDF(html: string, filename: string) {
  try {
    const { uri } = await Print.printToFileAsync({ html, base64: false })
    const canShare = await Sharing.isAvailableAsync()
    if (canShare) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: filename,
        UTI: 'com.adobe.pdf',
      })
    } else {
      Alert.alert('PDF Generated', `Saved to: ${uri}`)
    }
  } catch (err) {
    console.error('[sharePDF]', err)
    Alert.alert('Error', 'Failed to generate PDF. Please try again.')
  }
}

// ─── Individual Student Report ────────────────────────────────────────────────

type StudentDetail = {
  displayName: string
  email: string
  countryName: string | null
  countryCode: string | null
  languageName: string | null
  languageFlag: string | null
  age: number | null
  gender: string | null
  xpTotal: number
  streakCount: number
  completionPct: number
  avgScore: number
  isActive: boolean
  createdAt: string
  lastActiveDate: string | null
  completedModules: number
  totalModules: number
  completedEntertainment: number
  totalEntertainment: number
  totalSongs: number
  badges: { name: string; description: string }[]
  moduleProgress: { moduleTitle: string; isCompleted: boolean }[]
}

export async function generateStudentPDF(student: StudentDetail) {
  const statusClass = student.isActive ? 'badge-active' : 'badge-inactive'
  const statusLabel = student.isActive ? 'Active' : 'Inactive'

  const moduleRows = student.moduleProgress.map((mp) => `
    <tr>
      <td>${mp.moduleTitle}</td>
      <td class="${mp.isCompleted ? 'status-done' : 'status-progress'}">
        ${mp.isCompleted ? '✓ Completed' : '○ In Progress'}
      </td>
    </tr>
  `).join('')

  const badgeChips = student.badges.length > 0
    ? student.badges.map((b) => `<span class="chip">🏅 ${b.name}</span>`).join('')
    : '<span style="color:#9CA3AF">No badges earned yet.</span>'

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8">${BASE_STYLES}</head>
<body>
  <div class="header">
    <div class="header-brand">ALMA Platform</div>
    <div class="header-top">
      <div>
        <div class="header-title">${student.displayName}</div>
        <div class="header-sub">${student.email}</div>
      </div>
      <span class="badge ${statusClass}">${statusLabel}</span>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Contact Information</div>
    <div class="info-row"><span class="info-label">Country</span><span class="info-value">${student.countryName ?? '—'}</span></div>
    <div class="info-row"><span class="info-label">Native Language</span><span class="info-value">${student.languageFlag ?? ''} ${student.languageName ?? '—'}</span></div>
    ${student.age ? `<div class="info-row"><span class="info-label">Age</span><span class="info-value">${student.age}</span></div>` : ''}
    <div class="info-row"><span class="info-label">Member Since</span><span class="info-value">${formatDate(student.createdAt)}</span></div>
    <div class="info-row"><span class="info-label">Last Active</span><span class="info-value">${formatDate(student.lastActiveDate)}</span></div>
  </div>

  <div class="section">
    <div class="section-title">Performance Overview</div>
    <div class="stat-grid">
      <div class="stat-card"><div class="stat-value">${(student.xpTotal ?? 0).toLocaleString()}</div><div class="stat-label">Total XP</div></div>
      <div class="stat-card"><div class="stat-value">${student.streakCount ?? 0}</div><div class="stat-label">Day Streak</div></div>
      <div class="stat-card"><div class="stat-value">${student.completionPct ?? 0}%</div><div class="stat-label">Completion</div></div>
      <div class="stat-card"><div class="stat-value">${student.avgScore ?? 0}</div><div class="stat-label">Avg Score</div></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Learning Stats</div>
    <div class="info-row"><span class="info-label">Modules Completed</span><span class="info-value">${student.completedModules} of ${student.totalModules}</span></div>
    <div class="info-row"><span class="info-label">Entertainment Completed</span><span class="info-value">${student.completedEntertainment} of ${student.totalEntertainment}</span></div>
    <div class="info-row"><span class="info-label">Songs Available</span><span class="info-value">${student.totalSongs}</span></div>
  </div>

  ${student.moduleProgress.length > 0 ? `
  <div class="section">
    <div class="section-title">Module Progress</div>
    <table>
      <thead><tr><th>Module</th><th>Status</th></tr></thead>
      <tbody>${moduleRows}</tbody>
    </table>
  </div>` : ''}

  <div class="section">
    <div class="section-title">Badges Earned (${student.badges.length})</div>
    <div style="padding: 8px 0;">${badgeChips}</div>
  </div>

  <div class="footer">
    ALMA Platform · Student Report · Generated ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
  </div>
</body>
</html>`

  await sharePDF(html, `${student.displayName.replace(/\s+/g, '_')}_Report.pdf`)
}

// ─── Master Report (all students) ────────────────────────────────────────────

type MasterStudentRow = {
  displayName: string
  email: string
  countryName: string | null
  isActive: boolean
  xpTotal: number
  streakCount: number
  completionPct: number
  lastActiveDate: string | null
  createdAt: string
}

type MasterReportData = {
  totalStudents: number
  activeToday: number
  avgCompletion: number
  moduleCompletionRates: { title: string; completionPct: number }[]
  students: MasterStudentRow[]
}

export async function generateMasterPDF(data: MasterReportData) {
  const studentRows = data.students.map((s, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><strong>${s.displayName}</strong></td>
      <td style="font-size:12px; color:#6B7280">${s.email}</td>
      <td>${s.countryName ?? '—'}</td>
      <td><span class="badge ${s.isActive ? 'badge-active' : 'badge-inactive'}">${s.isActive ? 'Active' : 'Inactive'}</span></td>
      <td class="gold">${(s.xpTotal ?? 0).toLocaleString()}</td>
      <td>${s.streakCount ?? 0}d</td>
      <td>${s.completionPct ?? 0}%</td>
      <td style="font-size:12px; color:#6B7280">${formatDate(s.lastActiveDate)}</td>
    </tr>
  `).join('')

  const moduleRows = data.moduleCompletionRates.map((m) => `
    <tr>
      <td>${m.title}</td>
      <td>
        <div style="display:flex; align-items:center; gap:8px;">
          <div style="flex:1; height:6px; background:#E5E7EB; border-radius:3px; overflow:hidden;">
            <div style="width:${Math.min(m.completionPct, 100)}%; height:100%; background:${NAVY}; border-radius:3px;"></div>
          </div>
          <span style="font-weight:600; min-width:36px;">${m.completionPct}%</span>
        </div>
      </td>
    </tr>
  `).join('')

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8">${BASE_STYLES}</head>
<body>
  <div class="header">
    <div class="header-brand">ALMA Platform</div>
    <div class="header-title">Master Report</div>
    <div class="header-sub">All Students · Generated ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
  </div>

  <div class="section">
    <div class="section-title">Platform Summary</div>
    <div class="stat-grid">
      <div class="stat-card"><div class="stat-value">${data.totalStudents}</div><div class="stat-label">Total Students</div></div>
      <div class="stat-card"><div class="stat-value">${data.activeToday}</div><div class="stat-label">Active Today</div></div>
      <div class="stat-card"><div class="stat-value">${data.avgCompletion}%</div><div class="stat-label">Avg Completion</div></div>
      <div class="stat-card"><div class="stat-value">${data.students.filter(s => s.isActive).length}</div><div class="stat-label">Active Students</div></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Module Completion Rates</div>
    <table>
      <thead><tr><th>Module</th><th>Completion Rate</th></tr></thead>
      <tbody>${moduleRows}</tbody>
    </table>
  </div>

  <div class="section">
    <div class="section-title">All Students (${data.students.length})</div>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Name</th>
          <th>Email</th>
          <th>Country</th>
          <th>Status</th>
          <th>XP</th>
          <th>Streak</th>
          <th>Done</th>
          <th>Last Active</th>
        </tr>
      </thead>
      <tbody>${studentRows}</tbody>
    </table>
  </div>

  <div class="footer">
    ALMA Platform · Master Report · ${data.totalStudents} students
  </div>
</body>
</html>`

  await sharePDF(html, 'ALMA_Master_Report.pdf')
}
