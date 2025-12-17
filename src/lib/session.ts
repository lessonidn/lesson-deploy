export function getSessionId() {
  let id = localStorage.getItem('quiz_session')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('quiz_session', id)
  }
  return id
}
