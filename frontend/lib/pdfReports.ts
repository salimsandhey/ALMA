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
    * { box-sizing: border-box; margin: 0; padding: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #1F2937; background: #F8FAFC; font-size: 14px; line-height: 1.6; }

    /* ── Header ── */
    .header { background: #093373 !important; color: #ffffff !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    .header-inner { padding: 32px 40px 24px; }
    .header-gold-bar { height: 5px; background: #F6B80D !important; -webkit-print-color-adjust: exact !important; }
    .header-brand {
      font-size: 11px; letter-spacing: 2px; color: #F6B80D !important;
      text-transform: uppercase; margin-bottom: 10px; font-weight: 700;
    }
    .header-row { display: flex; justify-content: space-between; align-items: flex-start; }
    .header-title { font-size: 30px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff !important; }
    .header-sub { font-size: 13px; color: #93C5FD !important; margin-top: 6px; font-weight: 500; }
    .header-meta { text-align: right; }
    .header-meta-label { font-size: 11px; color: #F6B80D !important; margin-bottom: 4px; font-weight: 700; letter-spacing: 1px; }
    .header-meta-value { font-size: 26px; font-weight: 800; color: #ffffff !important; }

    /* ── Badges ── */
    .badge { display: inline-block; padding: 3px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: 0.3px; }
    .badge-active { background: #D1FAE5; color: #065F46; }
    .badge-inactive { background: #F3F4F6; color: #6B7280; }

    /* ── Page body ── */
    .body-wrap { padding: 32px 40px 48px; }

    /* ── Section ── */
    .section { margin-bottom: 32px; }
    .section-title {
      font-size: 10px; color: #093373; font-weight: 800;
      letter-spacing: 1.5px; text-transform: uppercase;
      padding-bottom: 8px; border-bottom: 2px solid #093373;
      margin-bottom: 16px;
    }

    /* ── Info rows ── */
    .info-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #EEF2F7; }
    .info-label { color: #1D4ED8; font-size: 13px; font-weight: 500; }
    .info-value { font-weight: 700; color: #111827; font-size: 13px; text-align: right; }

    /* ── Stat cards ── */
    .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 4px; }
    .stat-card {
      border-radius: 12px; padding: 18px 12px 14px; text-align: center;
      position: relative; overflow: hidden;
    }
    .stat-card-1 { background: #EFF6FF; border: 1.5px solid #BFDBFE; }
    .stat-card-2 { background: #F0FDF4; border: 1.5px solid #BBF7D0; }
    .stat-card-3 { background: #FFFBEB; border: 1.5px solid #FDE68A; }
    .stat-card-4 { background: #FDF4FF; border: 1.5px solid #E9D5FF; }
    .stat-value { font-size: 26px; font-weight: 800; color: ${NAVY}; line-height: 1; }
    .stat-label { font-size: 11px; color: #1E40AF; margin-top: 6px; font-weight: 700; letter-spacing: 0.3px; }

    /* ── Tables ── */
    table { width: 100%; border-collapse: collapse; font-size: 12.5px; border-radius: 10px; overflow: hidden; }
    thead th {
      background: #093373 !important; color: #ffffff !important; padding: 11px 14px;
      text-align: left; font-size: 11px; font-weight: 700;
      letter-spacing: 0.5px; text-transform: uppercase;
      -webkit-print-color-adjust: exact !important;
    }
    tbody tr { border-bottom: 1px solid #EEF2F7; }
    tbody tr:nth-child(even) { background: #F8FAFC; }
    tbody tr:hover { background: #EFF6FF; }
    tbody td { padding: 10px 14px; color: #1F2937; vertical-align: middle; }
    .status-done { color: #059669; font-weight: 700; }
    .status-progress { color: #D97706; font-weight: 700; }

    /* ── Progress bar ── */
    .progress-wrap { display: flex; align-items: center; gap: 10px; }
    .progress-track { flex: 1; height: 7px; background: #E5E7EB; border-radius: 4px; overflow: hidden; }
    .progress-fill { height: 100%; background-color: #093373; border-radius: 4px; }
    .progress-pct { font-weight: 700; color: ${NAVY}; min-width: 38px; font-size: 12px; }

    /* ── Chips ── */
    .chip { display: inline-block; background: #EFF6FF; color: ${NAVY}; padding: 4px 11px; border-radius: 12px; font-size: 12px; font-weight: 600; margin: 3px 3px 3px 0; border: 1px solid #BFDBFE; }

    /* ── XP / gold ── */
    .gold { color: #B45309; font-weight: 700; }

    /* ── Footer ── */
    .footer {
      margin-top: 48px; text-align: center; color: #093373;
      font-size: 11px; padding-top: 16px; border-top: 2px solid #F6B80D;
      font-weight: 600;
    }
    .footer strong { color: #093373; font-weight: 800; }
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
    <div class="header-inner">
      <div class="header-brand">ALMA Platform · Student Report</div>
      <div class="header-row">
        <div>
          <div class="header-title">${student.displayName}</div>
          <div class="header-sub">${student.email}</div>
        </div>
        <div style="display:flex; flex-direction:column; align-items:flex-end; gap:8px;">
          <span class="badge ${statusClass}">${statusLabel}</span>
          <span style="font-size:11px; color:#93C5FD; font-weight:500;">Since ${formatDate(student.createdAt)}</span>
        </div>
      </div>
    </div>
    <div class="header-gold-bar"></div>
  </div>

  <div class="body-wrap">
    <div class="section">
      <div class="section-title">Performance Overview</div>
      <div class="stat-grid">
        <div class="stat-card stat-card-1"><div class="stat-value">${(student.xpTotal ?? 0).toLocaleString()}</div><div class="stat-label">Total XP</div></div>
        <div class="stat-card stat-card-2"><div class="stat-value">${student.streakCount ?? 0}</div><div class="stat-label">Day Streak</div></div>
        <div class="stat-card stat-card-3"><div class="stat-value">${student.completionPct ?? 0}%</div><div class="stat-label">Completion</div></div>
        <div class="stat-card stat-card-4"><div class="stat-value">${student.avgScore ?? 0}</div><div class="stat-label">Avg Score</div></div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Profile</div>
      <div class="info-row"><span class="info-label">Country</span><span class="info-value">${student.countryName ?? '—'}</span></div>
      <div class="info-row"><span class="info-label">Native Language</span><span class="info-value">${student.languageFlag ?? ''} ${student.languageName ?? '—'}</span></div>
      ${student.age ? `<div class="info-row"><span class="info-label">Age</span><span class="info-value">${student.age}</span></div>` : ''}
      <div class="info-row"><span class="info-label">Last Active</span><span class="info-value">${formatDate(student.lastActiveDate)}</span></div>
    </div>

    <div class="section">
      <div class="section-title">Learning Stats</div>
      <div class="info-row"><span class="info-label">Modules Completed</span><span class="info-value">${student.completedModules} / ${student.totalModules}</span></div>
      <div class="info-row"><span class="info-label">Entertainment Completed</span><span class="info-value">${student.completedEntertainment} / ${student.totalEntertainment}</span></div>
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
      <strong>ALMA Platform</strong> · Student Report · Generated ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
    </div>
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
  const activeCount = data.students.filter(s => s.isActive).length

  const studentRows = data.students.map((s, i) => `
    <tr>
      <td style="color:#1D4ED8; font-size:11px; font-weight:700;">${i + 1}</td>
      <td><strong style="color:#111827;">${s.displayName}</strong></td>
      <td style="font-size:11.5px; color:#1D4ED8; font-weight:500;">${s.email}</td>
      <td style="font-size:12px; color:#111827; font-weight:600;">${s.countryName ?? '—'}</td>
      <td><span class="badge ${s.isActive ? 'badge-active' : 'badge-inactive'}">${s.isActive ? 'Active' : 'Inactive'}</span></td>
      <td class="gold">${(s.xpTotal ?? 0).toLocaleString()}</td>
      <td style="font-weight:700; color:#059669;">${s.streakCount ?? 0}d</td>
      <td style="font-weight:800; color:#093373;">${s.completionPct ?? 0}%</td>
      <td style="font-size:11.5px; color:#374151; font-weight:500;">${formatDate(s.lastActiveDate)}</td>
    </tr>
  `).join('')

  const moduleRows = data.moduleCompletionRates.map((m) => `
    <tr>
      <td style="font-weight:600; color:#1F2937;">${m.title}</td>
      <td style="width:55%;">
        <div class="progress-wrap">
          <div class="progress-track">
            <div class="progress-fill" style="width:${Math.min(m.completionPct, 100)}%;"></div>
          </div>
          <span class="progress-pct">${m.completionPct}%</span>
        </div>
      </td>
    </tr>
  `).join('')

  const generatedOn = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8">${BASE_STYLES}</head>
<body>
  <div class="header">
    <div class="header-inner">
      <div class="header-brand">ALMA Platform · Admin Report</div>
      <div class="header-row">
        <div>
          <div class="header-title">Master Report</div>
          <div class="header-sub">All Students · ${generatedOn}</div>
        </div>
        <div class="header-meta">
          <div class="header-meta-label">TOTAL STUDENTS</div>
          <div class="header-meta-value">${data.totalStudents}</div>
        </div>
      </div>
    </div>
    <div class="header-gold-bar"></div>
  </div>

  <div class="body-wrap">
    <div class="section">
      <div class="section-title">Platform Summary</div>
      <div class="stat-grid">
        <div class="stat-card stat-card-1">
          <div class="stat-value">${data.totalStudents}</div>
          <div class="stat-label">Total Students</div>
        </div>
        <div class="stat-card stat-card-2">
          <div class="stat-value">${data.activeToday}</div>
          <div class="stat-label">Active Today</div>
        </div>
        <div class="stat-card stat-card-3">
          <div class="stat-value">${data.avgCompletion}%</div>
          <div class="stat-label">Avg Completion</div>
        </div>
        <div class="stat-card stat-card-4">
          <div class="stat-value">${activeCount}</div>
          <div class="stat-label">Active Students</div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Module Completion Rates</div>
      <table>
        <thead>
          <tr><th style="width:45%;">Module</th><th>Completion Rate</th></tr>
        </thead>
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
      <strong>ALMA Platform</strong> · Master Report · ${data.totalStudents} students · ${generatedOn}
    </div>
  </div>
</body>
</html>`

  await sharePDF(html, 'ALMA_Master_Report.pdf')
}
