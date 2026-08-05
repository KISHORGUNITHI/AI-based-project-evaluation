import { api, API_BASE_URL } from '@/lib/api'
import type { Evaluation } from '@/types/evaluation'

export const evaluationService = {
  create: (data: { projectId: string; submissionId: string }) =>
    api.post<Evaluation>('/api/evaluation', data).then((r) => r.data),

  getById: (id: string) =>
    api.get<Evaluation>(`/api/evaluation/${id}`).then((r) => r.data),

  getByProject: (projectId: string) =>
    api
      .get<Evaluation[]>(`/api/evaluation/project/${projectId}`)
      .then((r) => r.data),

  getBySubmission: (submissionId: string) =>
    api
      .get<Evaluation>(`/api/evaluation/submission/${submissionId}`)
      .then((r) => r.data),

  assignJudge: (id: string, judgeId: string) =>
    api
      .patch<Evaluation>(`/api/evaluation/${id}/assign-judge`, { judgeId })
      .then((r) => r.data),

  setAiScore: (id: string, data: { aiScore: number; feedback?: string }) =>
    api
      .patch<Evaluation>(`/api/evaluation/${id}/ai-score`, data)
      .then((r) => r.data),

  setJudgeScore: (id: string, data: { judgeScore: number; feedback: string }) =>
    api
      .patch<Evaluation>(`/api/evaluation/${id}/judge-score`, data)
      .then((r) => r.data),

  finalize: (id: string) =>
    api
      .patch<Evaluation>(`/api/evaluation/${id}/finalize`)
      .then((r) => r.data),

  setRubric: (id: string, data: {
    rubricProblemStatement: number
    rubricSolutionDesign: number
    rubricImplementation: number
    rubricInnovation: number
    rubricDocumentation: number
  }) =>
    api
      .patch<Evaluation>(`/api/evaluation/${id}/set-rubric`, data)
      .then((r) => r.data),

  /**
   * Trigger AI evaluation via SSE stream.
   * Returns a Promise that resolves with the final evaluation when the stream ends.
   * Calls onProgress for each intermediate step event.
   */
  triggerAiEvaluation: (
    id: string,
    onProgress?: (event: { step: string; status: string; evaluation?: Evaluation; message?: string }) => void,
  ): Promise<Evaluation> => {
    return new Promise((resolve, reject) => {
      const token = localStorage.getItem('token') ?? sessionStorage.getItem('token') ?? ''

      // Use fetch with ReadableStream to support Authorization header
      const controller = new AbortController()

      fetch(`${API_BASE_URL}/api/evaluation/${id}/trigger-ai`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'text/event-stream',
        },
        signal: controller.signal,
      })
        .then(async (response) => {
          if (!response.ok) {
            const err = await response.json().catch(() => ({ message: 'Request failed' }))
            return reject(new Error(err.message ?? 'AI evaluation failed'))
          }

          const reader = response.body?.getReader()
          if (!reader) return reject(new Error('No response body'))

          const decoder = new TextDecoder()
          let buffer = ''

          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() ?? ''

            for (const line of lines) {
              if (!line.startsWith('data: ')) continue
              const raw = line.slice(6).trim()
              if (!raw) continue

              try {
                const event = JSON.parse(raw)
                onProgress?.(event)

                if (event.step === 'done' && event.evaluation) {
                  resolve(event.evaluation as Evaluation)
                }
                if (event.step === 'error') {
                  reject(new Error(event.message ?? 'AI evaluation failed'))
                }
              } catch {
                // ignore malformed SSE lines
              }
            }
          }
        })
        .catch(reject)
    })
  },
}
