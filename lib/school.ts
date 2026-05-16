import { headers } from 'next/headers'

export function getSchoolId(): string | null {
  const headersList = headers()
  return headersList.get('x-school-id') || null
}
