export type WorkflowStep = 'project_created' | 'task_created' | 'configured' | 'dataset_imported' | 'annotating' | 'exported'

export type TaskStatus = 'pending' | 'in_progress' | 'completed'

export type AnnotationTask = {
  taskId: string
  projectId: string
  taskName: string
  assignee: string
  priority: 'high' | 'medium' | 'low'
  status: TaskStatus
  createdAt: string
  updatedAt: string
}

export type TaskConfig = {
  projectId: string
  taskId?: string
  autosaveIntervalSec: number
  reviewRequired: boolean
  maxObjectsPerImage: number
  qualityThreshold: number
  allowSkip: boolean
}

export type DatasetImportJob = {
  jobId: string
  projectId: string
  datasetName: string
  totalImages: number
  importedImages: number
  status: 'processing' | 'done' | 'failed'
  startedAt: string
  finishedAt?: string
}

export type ExportJob = {
  jobId: string
  projectId: string
  format: 'COCO' | 'VOC' | 'YOLO'
  status: 'processing' | 'done' | 'failed'
  startedAt: string
  downloadUrl?: string
}

export type WorkflowSnapshot = {
  projectId: string
  currentStep: WorkflowStep
  taskCount: number
  latestTaskName?: string
  latestImportStatus?: DatasetImportJob['status']
  latestExportStatus?: ExportJob['status']
  completionPercent: number
}
