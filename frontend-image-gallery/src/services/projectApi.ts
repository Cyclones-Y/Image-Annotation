import request from './request'

export interface ProjectItem {
  projectId: string
  projectCode: string
  projectName: string
  owner: string
  taskTotal: number
  completedCount: number
  status: '0' | '1'
  deadline?: string
  createTime?: string
  remark?: string
}

export interface ProjectQuery {
  pageNum: number
  pageSize: number
  projectName?: string
  projectCode?: string
  owner?: string
  status?: string
}

export interface ProjectPageResult {
  rows: ProjectItem[]
  total: number
}

function normalizeProject(item: any): ProjectItem {
  return {
    projectId: String(item.projectId ?? item.project_id ?? item.id ?? ''),
    projectCode: String(item.projectCode ?? item.project_code ?? ''),
    projectName: String(item.projectName ?? item.project_name ?? ''),
    owner: String(item.owner ?? item.owner_name ?? item.ownerName ?? ''),
    taskTotal: Number(item.taskTotal ?? item.task_total ?? 0),
    completedCount: Number(item.completedCount ?? item.completed_count ?? 0),
    status: String(item.status ?? '0') === '1' ? '1' : '0',
    deadline: item.deadline ?? item.endTime ?? item.end_time,
    createTime: item.createTime ?? item.create_time,
    remark: item.remark ?? ''
  }
}

export async function listProjects(query: ProjectQuery): Promise<ProjectPageResult> {
  const res = await request.get<any, any>('/system/project/list', { params: query })
  const rows = Array.isArray(res?.rows) ? res.rows.map(normalizeProject) : []
  return { rows, total: Number(res?.total ?? 0) }
}

export async function getProject(projectId: string) {
  const res = await request.get<any, any>(`/system/project/${projectId}`)
  return normalizeProject(res?.data ?? {})
}

export async function createProject(data: Omit<ProjectItem, 'projectId' | 'createTime'>) {
  return request.post('/system/project', data)
}

export async function updateProject(data: ProjectItem) {
  return request.put('/system/project', data)
}

export async function removeProject(projectId: string) {
  return request.delete(`/system/project/${projectId}`)
}

export function createMockProjects(): ProjectItem[] {
  return [
    {
      projectId: '1001',
      projectCode: 'IMG-ANNO-001',
      projectName: '自动驾驶目标检测',
      owner: '张工',
      taskTotal: 12000,
      completedCount: 8600,
      status: '0',
      deadline: '2026-04-10 18:00:00',
      createTime: '2026-03-10 09:30:00',
      remark: '车、人、交通标志'
    },
    {
      projectId: '1002',
      projectCode: 'IMG-ANNO-002',
      projectName: '医疗影像病灶分割',
      owner: '李工',
      taskTotal: 5000,
      completedCount: 1300,
      status: '0',
      deadline: '2026-05-01 20:00:00',
      createTime: '2026-03-11 11:20:00',
      remark: '双人复审'
    },
    {
      projectId: '1003',
      projectCode: 'IMG-ANNO-003',
      projectName: '电商商品属性标注',
      owner: '王工',
      taskTotal: 9000,
      completedCount: 9000,
      status: '1',
      deadline: '2026-03-01 23:59:59',
      createTime: '2026-02-01 08:00:00',
      remark: '已归档'
    }
  ]
}
