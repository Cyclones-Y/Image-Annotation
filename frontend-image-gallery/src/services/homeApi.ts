import request from './request'

export type OverviewMetrics = {
  totalProjects: number
  activeProjects: number
  delayedProjects: number
  completedProjects: number
}

export type TaskMetrics = {
  pendingAnnotate: number
  annotating: number
  pendingReview: number
  reviewed: number
  todayDone: number
}

export type WorkbenchTask = {
  id: string
  title: string
  priority: 'high' | 'medium' | 'low'
  dueAt?: string
}

export type ActivityItem = {
  id: string
  time: string
  action: string
  target: string
}

export type ProjectProgress = {
  projectId: string
  projectName: string
  progress: number
}

export type HomeDashboardData = {
  overview: OverviewMetrics
  tasks: TaskMetrics
  workbenchTasks: WorkbenchTask[]
  activities: ActivityItem[]
  projectProgressTop: ProjectProgress[]
  onlineUsers: number
  queueBacklog: number
  apiSuccessRate: number
  avgResponseMs: number
}

const HOME_CACHE_KEY = 'home-dashboard-cache-v1'
const HOME_CACHE_TTL = 30 * 1000

function readCache(): HomeDashboardData | null {
  try {
    const raw = sessionStorage.getItem(HOME_CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { timestamp: number; data: HomeDashboardData }
    if (Date.now() - parsed.timestamp > HOME_CACHE_TTL) return null
    return parsed.data
  } catch {
    return null
  }
}

function writeCache(data: HomeDashboardData) {
  try {
    sessionStorage.setItem(HOME_CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data }))
  } catch {
    return
  }
}

function createMockHomeData(): HomeDashboardData {
  return {
    overview: {
      totalProjects: 18,
      activeProjects: 9,
      delayedProjects: 2,
      completedProjects: 7
    },
    tasks: {
      pendingAnnotate: 1240,
      annotating: 318,
      pendingReview: 167,
      reviewed: 4521,
      todayDone: 296
    },
    workbenchTasks: [
      { id: 'w1', title: '自动驾驶目标框复核（A批）', priority: 'high', dueAt: '18:00' },
      { id: 'w2', title: '病灶分割边界一致性检查', priority: 'medium', dueAt: '20:00' },
      { id: 'w3', title: '电商属性标签补录', priority: 'low', dueAt: '明日 10:00' }
    ],
    activities: [
      { id: 'a1', time: '09:30', action: '提交标注', target: 'IMG-ANNO-001 / image_1289' },
      { id: 'a2', time: '09:26', action: '审核通过', target: 'IMG-ANNO-002 / task_552' },
      { id: 'a3', time: '09:20', action: '领取任务', target: 'IMG-ANNO-003 / batch_17' },
      { id: 'a4', time: '09:12', action: '导出结果', target: 'IMG-ANNO-001 / COCO' }
    ],
    projectProgressTop: [
      { projectId: '1001', projectName: '自动驾驶目标检测', progress: 72 },
      { projectId: '1002', projectName: '医疗影像病灶分割', progress: 26 },
      { projectId: '1003', projectName: '电商商品属性标注', progress: 100 }
    ],
    onlineUsers: 37,
    queueBacklog: 42,
    apiSuccessRate: 99.3,
    avgResponseMs: 128
  }
}

function normalizeData(src: any): HomeDashboardData {
  return {
    overview: {
      totalProjects: Number(src?.overview?.totalProjects ?? 0),
      activeProjects: Number(src?.overview?.activeProjects ?? 0),
      delayedProjects: Number(src?.overview?.delayedProjects ?? 0),
      completedProjects: Number(src?.overview?.completedProjects ?? 0)
    },
    tasks: {
      pendingAnnotate: Number(src?.tasks?.pendingAnnotate ?? 0),
      annotating: Number(src?.tasks?.annotating ?? 0),
      pendingReview: Number(src?.tasks?.pendingReview ?? 0),
      reviewed: Number(src?.tasks?.reviewed ?? 0),
      todayDone: Number(src?.tasks?.todayDone ?? 0)
    },
    workbenchTasks: Array.isArray(src?.workbenchTasks) ? src.workbenchTasks : [],
    activities: Array.isArray(src?.activities) ? src.activities : [],
    projectProgressTop: Array.isArray(src?.projectProgressTop) ? src.projectProgressTop : [],
    onlineUsers: Number(src?.onlineUsers ?? 0),
    queueBacklog: Number(src?.queueBacklog ?? 0),
    apiSuccessRate: Number(src?.apiSuccessRate ?? 0),
    avgResponseMs: Number(src?.avgResponseMs ?? 0)
  }
}

function unwrapResponsePayload(src: any): any {
  if (!src) return src
  const body = src?.data ?? src
  if (body && typeof body === 'object' && 'data' in body && body.data) {
    return body.data
  }
  return body
}

export async function fetchHomeDashboard(useCache = true): Promise<{ data: HomeDashboardData; isMock: boolean }> {
  if (useCache) {
    const cached = readCache()
    if (cached) {
      return { data: cached, isMock: false }
    }
  }

  try {
    const res = await request.get<any, any>('/api/home/overview')
    const body = unwrapResponsePayload(res)
    const data = normalizeData(body)
    writeCache(data)
    return { data, isMock: false }
  } catch {
    const mockData = createMockHomeData()
    return { data: mockData, isMock: true }
  }
}

export async function fetchHomeRealtime(): Promise<Pick<HomeDashboardData, 'onlineUsers' | 'queueBacklog' | 'apiSuccessRate' | 'avgResponseMs'> | null> {
  try {
    const res = await request.get<any, any>('/api/home/system')
    const body = unwrapResponsePayload(res)
    return {
      onlineUsers: Number(body?.onlineUsers ?? 0),
      queueBacklog: Number(body?.queueBacklog ?? 0),
      apiSuccessRate: Number(body?.apiSuccessRate ?? 0),
      avgResponseMs: Number(body?.avgResponseMs ?? 0)
    }
  } catch {
    return null
  }
}
