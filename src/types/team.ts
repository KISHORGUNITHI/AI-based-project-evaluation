export interface StudentProfileWithUser {
  id: string
  userId: string
  rollNumber: string
  department: string
  collegeName: string
  phonenumber?: string
  year: number
  cgpa?: string
  githubUrl?: string
  leetcode?: string
  portfolio?: string
  linkedin?: string
  user: {
    name: string
    email: string
  }
}

export interface TeamMember {
  id: string
  teamId: string
  studentId: string
  createdAt: string
  student?: StudentProfileWithUser
}

export interface Team {
  id: string
  name: string
  createdBy: string
  teamLeaderId: string
  members: TeamMember[]
  createdAt: string
  updatedAt: string
  projects?: { id: string; title: string; status?: string }[]
}
