import { useBeforeUnload } from 'react-router-dom'
import { useNavigationGuardState } from '../state/navigationGuard'

export default function RouteStateGuard() {
  const { isDirty } = useNavigationGuardState()

  useBeforeUnload((event) => {
    if (!isDirty) return
    event.preventDefault()
    event.returnValue = ''
  })

  return null
}
