import request from './request'
import { createId } from '../utils/annotationMath'
import {
  AnnotationTask,
  DatasetImportJob,
  ExportJob,
  TaskConfig,
  WorkflowSnapshot,
  WorkflowStep
} from '../types/workflow'

const STORE_KEY = 'annotation-workflow-store-v1'

type WorkflowStore = {
  tasks: AnnotationTask[]
  configs: TaskConfig[]
  imports: DatasetImportJob[]
  exports: ExportJob[]
}

function unwrapResponsePayload(src: any): any {
  if (!src) return src
  const body = src?.data ?? src
  if (body && typeof body === 'object' && 'data' in body && body.data) {
    return body.data
  }
  return body
}

function now() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ')
}

function readStore(): WorkflowStore {
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (!raw) return { tasks: [], configs: [], imports: [], exports: [] }
    return JSON.parse(raw) as WorkflowStore
  } catch {
    return { tasks: [], configs: [], imports: [], exports: [] }
  }
}

function writeStore(store: WorkflowStore) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(store))
  } catch {
    return
  }
}

function resolveStep(
  hasProject: boolean,
  tasks: AnnotationTask[],
  config?: TaskConfig,
  importJob?: DatasetImportJob,
  exportJob?: ExportJob
): WorkflowStep {
  if (!hasProject) return 'project_created'
  if (tasks.length === 0) return 'project_created'
  if (!config) return 'task_created'
  if (!importJob) return 'configured'
  if (importJob.status !== 'done') return 'dataset_imported'
  if (!exportJob) return 'annotating'
  return 'exported'
}

function buildSnapshot(projectId: string, store: WorkflowStore): WorkflowSnapshot {
  const tasks = store.tasks.filter((item) => item.projectId === projectId)
  const config = store.configs.find((item) => item.projectId === projectId)
  const importJobs = store.imports.filter((item) => item.projectId === projectId)
  const exportJobs = store.exports.filter((item) => item.projectId === projectId)
  const latestImport = importJobs[importJobs.length - 1]
  const latestExport = exportJobs[exportJobs.length - 1]
  const currentStep = resolveStep(true, tasks, config, latestImport, latestExport)
  const percentMap: Record<WorkflowStep, number> = {
    project_created: 20,
    task_created: 40,
    configured: 60,
    dataset_imported: 75,
    annotating: 90,
    exported: 100
  }
  return {
    projectId,
    currentStep,
    taskCount: tasks.length,
    latestTaskName: tasks[tasks.length - 1]?.taskName,
    latestImportStatus: latestImport?.status,
    latestExportStatus: latestExport?.status,
    completionPercent: percentMap[currentStep]
  }
}

export async function listProjectTasks(projectId: string): Promise<{ rows: AnnotationTask[]; isMock: boolean }> {
  try {
    const res = await request.get<any, any>(`/api/workflow/tasks`, { params: { projectId } })
    const body = unwrapResponsePayload(res)
    const rows = Array.isArray(body?.rows) ? body.rows : []
    return { rows, isMock: false }
  } catch {
    const store = readStore()
    return { rows: store.tasks.filter((item) => item.projectId === projectId), isMock: true }
  }
}

export async function createProjectTask(input: {
  projectId: string
  taskName: string
  assignee: string
  priority: AnnotationTask['priority']
}): Promise<{ task: AnnotationTask; isMock: boolean }> {
  try {
    const res = await request.post<any, any>('/api/workflow/tasks', input)
    const body = unwrapResponsePayload(res)
    return { task: body, isMock: false }
  } catch {
    const store = readStore()
    const task: AnnotationTask = {
      taskId: createId('task'),
      projectId: input.projectId,
      taskName: input.taskName,
      assignee: input.assignee,
      priority: input.priority,
      status: 'pending',
      createdAt: now(),
      updatedAt: now()
    }
    store.tasks.unshift(task)
    writeStore(store)
    return { task, isMock: true }
  }
}

export async function saveTaskConfig(input: TaskConfig): Promise<{ config: TaskConfig; isMock: boolean }> {
  try {
    const res = await request.post<any, any>('/api/workflow/config', input)
    const body = unwrapResponsePayload(res)
    return { config: body, isMock: false }
  } catch {
    const store = readStore()
    const idx = store.configs.findIndex((item) => item.projectId === input.projectId)
    if (idx >= 0) {
      store.configs.splice(idx, 1, input)
    } else {
      store.configs.push(input)
    }
    writeStore(store)
    return { config: input, isMock: true }
  }
}

export async function getTaskConfig(projectId: string): Promise<{ config?: TaskConfig; isMock: boolean }> {
  try {
    const res = await request.get<any, any>('/api/workflow/config', { params: { projectId } })
    const body = unwrapResponsePayload(res)
    return { config: body, isMock: false }
  } catch {
    const store = readStore()
    return { config: store.configs.find((item) => item.projectId === projectId), isMock: true }
  }
}

export async function importDataset(input: {
  projectId: string
  datasetName: string
  totalImages: number
}): Promise<{ job: DatasetImportJob; isMock: boolean }> {
  try {
    const res = await request.post<any, any>('/api/workflow/import', input)
    const body = unwrapResponsePayload(res)
    return { job: body, isMock: false }
  } catch {
    const store = readStore()
    const job: DatasetImportJob = {
      jobId: createId('import'),
      projectId: input.projectId,
      datasetName: input.datasetName,
      totalImages: input.totalImages,
      importedImages: input.totalImages,
      status: 'done',
      startedAt: now(),
      finishedAt: now()
    }
    store.imports.push(job)
    writeStore(store)
    return { job, isMock: true }
  }
}

export async function exportAnnotations(input: {
  projectId: string
  format: ExportJob['format']
}): Promise<{ job: ExportJob; isMock: boolean }> {
  try {
    const res = await request.post<any, any>('/api/workflow/export', input)
    const body = unwrapResponsePayload(res)
    return { job: body, isMock: false }
  } catch {
    const store = readStore()
    const job: ExportJob = {
      jobId: createId('export'),
      projectId: input.projectId,
      format: input.format,
      status: 'done',
      startedAt: now(),
      downloadUrl: `mock://export/${input.projectId}/${Date.now()}`
    }
    store.exports.push(job)
    writeStore(store)
    return { job, isMock: true }
  }
}

export async function getWorkflowSnapshot(projectId: string): Promise<{ snapshot: WorkflowSnapshot; isMock: boolean }> {
  try {
    const res = await request.get<any, any>('/api/workflow/snapshot', { params: { projectId } })
    const body = unwrapResponsePayload(res)
    return { snapshot: body, isMock: false }
  } catch {
    const store = readStore()
    return { snapshot: buildSnapshot(projectId, store), isMock: true }
  }
}
