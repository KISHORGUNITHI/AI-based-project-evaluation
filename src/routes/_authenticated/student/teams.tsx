import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { 
  Plus, Loader2, Users, Trash2, UserPlus, UserMinus, 
  Search, Crown, Globe, Phone, 
  Mail, Award, MapPin, X, GraduationCap 
} from 'lucide-react'
import { queryKeys } from '@/lib/queryKeys'
import { teamService } from '@/services/teamService'
import { studentService } from '@/services/studentService'
import { createTeamSchema } from '@/lib/validations/teamSchemas'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { EmptyState } from '@/components/shared/EmptyState'
import { SkeletonCard } from '@/components/shared/LoadingSkeleton'
import type { z } from 'zod'
import type { Team } from '@/types/team'

export const Route = createFileRoute('/_authenticated/student/teams')({ component: TeamsPage })

type CreateTeamForm = z.infer<typeof createTeamSchema>

interface DisplayProfile {
  name: string
  email?: string
  rollNumber: string
  department: string
  collegeName: string
  year: number
  cgpa?: string | number
  phonenumber?: string | number
  githubUrl?: string
  leetcode?: string
  portfolio?: string
  linkedin?: string
}

function TeamsPage() {
  const qc = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [addMemberIds, setAddMemberIds] = useState<Record<string, string>>({})
  const [addMemberSearching, setAddMemberSearching] = useState<Record<string, boolean>>({})
  const [activeMembersTeam, setActiveMembersTeam] = useState<string | null>(null)

  // Search State
  const [searchQuery, setSearchQuery] = useState('')
  const [searchedTeam, setSearchedTeam] = useState<any | null>(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState('')

  // Member Profile modal state
  const [selectedProfile, setSelectedProfile] = useState<DisplayProfile | null>(null)

  // Fetch teams with student and user details nested
  const { data: teamsData = [], isLoading, isError } = useQuery({
    queryKey: queryKeys.teams.my,
    queryFn: studentService.getMyTeams,
  })
  const teams = (teamsData as Team[]) || []

  const invalidate = () => qc.invalidateQueries({ queryKey: queryKeys.teams.my })

  const createMutation = useMutation({
    mutationFn: teamService.create,
    onSuccess: () => { invalidate(); setCreateOpen(false); toast.success('Team created!') },
    onError: (e: Error) => toast.error(e.message),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => teamService.delete(id),
    onSuccess: () => { invalidate(); setDeleteId(null); toast.success('Team deleted') },
    onError: (e: Error) => toast.error(e.message),
  })

  const addMemberMutation = useMutation({
    mutationFn: ({ teamId, studentId }: { teamId: string; studentId: string }) =>
      teamService.addMember(teamId, studentId),
    onSuccess: (_, variables) => { 
      invalidate(); 
      setAddMemberIds(prev => ({ ...prev, [variables.teamId]: '' })); 
      toast.success('Member added!') 
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const removeMemberMutation = useMutation({
    mutationFn: ({ teamId, studentId }: { teamId: string; studentId: string }) =>
      teamService.removeMember(teamId, studentId),
    onSuccess: () => { invalidate(); toast.success('Member removed') },
    onError: (e: Error) => toast.error(e.message),
  })



  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateTeamForm>({
    resolver: zodResolver(createTeamSchema),
  })

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    setSearchLoading(true)
    setSearchError('')
    setSearchedTeam(null)
    try {
      const team = await teamService.getByName(searchQuery.trim())
      setSearchedTeam(team)
    } catch (err: any) {
      setSearchError(err.response?.data?.message || 'Team not found')
    } finally {
      setSearchLoading(false)
    }
  }

  const handleRequestToJoin = (teamName: string) => {
    toast.success(`Request to join "${teamName}" has been submitted successfully!`)
  }

  const showProfile = (member: any) => {
    const student = member.student
    if (!student) {
      toast.error('Student profile details not available')
      return
    }
    setSelectedProfile({
      name: student.user?.name || `Student (${student.rollNumber || member.studentId})`,
      email: student.user?.email || '',
      rollNumber: student.rollNumber || '',
      department: student.department || '',
      collegeName: student.collegeName || '',
      year: student.year || 0,
      cgpa: student.cgpa || '',
      phonenumber: student.phonenumber ? String(student.phonenumber) : '',
      githubUrl: student.githubUrl || '',
      leetcode: student.leetcode || '',
      portfolio: student.portfolio || '',
      linkedin: student.linkedin || '',
    })
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-1">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-orange-600 via-pink-600 to-violet-600 bg-clip-text text-transparent">
            Teams
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Manage your teams, view profiles, and connect with teammates.</p>
        </div>
        <button onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-orange-500 to-pink-600 text-white text-sm font-semibold hover:opacity-95 shadow-lg hover:shadow-orange-500/20 active:scale-95 transition">
          <Plus size={16} /> New Team
        </button>
      </div>

      {/* ── Centered Search Bar ── */}
      <div className="flex flex-col items-center gap-3">
        <form onSubmit={handleSearch} className="flex gap-2 w-full max-w-xl">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search teams by name…"
              className="w-full pl-10 pr-4 py-3 text-sm border rounded-2xl bg-background text-foreground outline-none focus:ring-2 focus:ring-orange-400 shadow-sm transition"
            />
          </div>
          <button
            type="submit"
            disabled={searchLoading || !searchQuery.trim()}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-pink-600 text-white font-semibold text-sm transition disabled:opacity-50 flex items-center gap-2 shadow-sm"
          >
            {searchLoading ? <Loader2 size={15} className="animate-spin" /> : <><Search size={15} /> Search</>}
          </button>
        </form>

        {searchError && (
          <p className="text-xs text-red-500 font-medium bg-red-50 dark:bg-red-950/20 px-4 py-2 rounded-xl border border-red-100">
            ⚠️ {searchError}
          </p>
        )}
      </div>

      {/* ── Search Result ── */}
      {searchedTeam && (
        <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-4 max-w-xl mx-auto">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-bold text-base">{searchedTeam.name}</h4>
              <p className="text-xs text-muted-foreground">{searchedTeam.members?.length || 0} member{searchedTeam.members?.length !== 1 ? 's' : ''}</p>
            </div>
            <button
              onClick={() => handleRequestToJoin(searchedTeam.name)}
              className="text-xs bg-gradient-to-r from-orange-500 to-pink-600 text-white font-bold px-3 py-1.5 rounded-lg hover:opacity-90 transition shadow-sm"
            >
              Request to Join
            </button>
          </div>
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Members</p>
            {searchedTeam.members?.map((m: any) => {
              const isLeader = m.studentId === searchedTeam.teamLeaderId
              const student = m.student
              const initials = student?.rollNumber ? student.rollNumber.slice(-2).toUpperCase() : 'ST'
              return (
                <div key={m.id} onClick={() => showProfile(m)}
                  className="flex items-center gap-3 p-2.5 rounded-xl border bg-background hover:bg-muted/40 cursor-pointer transition">
                  <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-[10px] font-bold shrink-0">{initials}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-xs truncate">{student?.rollNumber ? `Student (${student.rollNumber})` : `ID: ${m.studentId}`}</span>
                      {isLeader && <Crown size={12} className="text-yellow-500 fill-yellow-500 shrink-0" />}
                    </div>
                    <p className="text-[9px] text-muted-foreground truncate">{student?.department || 'Unknown Dept'} • Year {student?.year || '?'}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── All Teams List ── */}
      <div className="space-y-3">
        <h3 className="font-bold text-base flex items-center gap-2">
          <Users size={16} className="text-pink-500" /> My Teams
          {teams.length > 0 && <span className="text-xs font-normal text-muted-foreground">({teams.length} team{teams.length !== 1 ? 's' : ''})</span>}
        </h3>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : isError ? (
          <p className="text-sm text-red-500 py-4 text-center">Failed to load teams.</p>
        ) : teams.length === 0 ? (
          <EmptyState title="No teams yet" description="Create a team to start collaborating and submit projects."
            action={{ label: 'Create Team', onClick: () => setCreateOpen(true) }} icon={<Users size={24} />} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map((team) => (
              <div key={team.id} className="rounded-2xl border bg-card p-5 space-y-4 hover:border-orange-200 transition flex flex-col justify-between shadow-sm">
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-base text-foreground tracking-tight">{team.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{team.members.length} member{team.members.length !== 1 ? 's' : ''}</p>
                    </div>
                    <button onClick={() => setDeleteId(team.id)} className="text-muted-foreground hover:text-destructive p-1 rounded-lg hover:bg-muted transition">
                      <Trash2 size={15} />
                    </button>
                  </div>
                  {team.projects && team.projects.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {team.projects.map((p: any) => (
                        <span key={p.id} className="text-[9px] bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full font-medium">📁 {p.title}</span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <button onClick={() => setActiveMembersTeam(activeMembersTeam === team.id ? null : team.id)}
                    className="text-xs bg-muted hover:bg-muted/80 text-foreground font-semibold px-3 py-1.5 rounded-lg transition w-full text-center">
                    {activeMembersTeam === team.id ? 'Hide Members' : 'Manage Members'}
                  </button>

                  {activeMembersTeam === team.id && (
                    <div className="space-y-2 pt-3 border-t border-dashed mt-3">
                      {team.members.map((m) => {
                        const isLeader = m.studentId === team.teamLeaderId
                        const student = m.student
                        const initials = student?.user?.name
                          ? student.user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
                          : 'ST'
                        return (
                          <div key={m.id} onClick={() => showProfile(m)}
                            className="flex items-center justify-between p-2.5 rounded-xl border bg-background hover:bg-muted/40 cursor-pointer transition gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">{initials}</div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-semibold text-xs text-foreground truncate">{student?.user?.name || `Student ID: ${m.studentId}`}</span>
                                  {isLeader && <Crown size={12} className="text-yellow-500 fill-yellow-500 shrink-0" />}
                                </div>
                                <p className="text-[9px] text-muted-foreground truncate">
                                  {student?.rollNumber ? `${student.rollNumber} • ` : ''}{student?.department ? `${student.department} • ` : ''}{student?.year ? `Year ${student.year}` : ''}
                                </p>
                              </div>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); removeMemberMutation.mutate({ teamId: team.id, studentId: m.studentId }) }}
                              className="text-muted-foreground hover:text-destructive p-1 rounded-lg hover:bg-muted transition shrink-0">
                              <UserMinus size={14} />
                            </button>
                          </div>
                        )
                      })}
                      <div className="flex gap-2 pt-1.5">
                        <input value={addMemberIds[team.id] || ''} onChange={e => setAddMemberIds(prev => ({ ...prev, [team.id]: e.target.value }))}
                          placeholder="Add by Roll Number"
                          className="flex-1 px-3 py-1.5 text-xs border rounded-lg bg-background text-foreground outline-none focus:ring-1 focus:ring-pink-500" />
                        <button onClick={async () => {
                          const rollNumber = addMemberIds[team.id]?.trim()
                          if (!rollNumber) return
                          setAddMemberSearching(prev => ({ ...prev, [team.id]: true }))
                          try {
                            const student = await studentService.search(rollNumber)
                            if (!student?.id) {
                              toast.error(`No student found with roll number: ${rollNumber}`)
                              return
                            }
                            addMemberMutation.mutate({ teamId: team.id, studentId: student.id })
                          } catch {
                            toast.error('Failed to find student')
                          } finally {
                            setAddMemberSearching(prev => ({ ...prev, [team.id]: false }))
                          }
                        }}
                          disabled={!addMemberIds[team.id] || addMemberMutation.isPending || addMemberSearching[team.id]}
                          className="p-1.5 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition disabled:opacity-50 shrink-0">
                          {addMemberSearching[team.id] ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Create Team Dialog ───────────────────────────────────────── */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setCreateOpen(false)} />
          <div className="relative z-10 bg-card border rounded-2xl p-6 w-full max-w-sm shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold mb-4">Create Team</h3>
            <form onSubmit={handleSubmit((d) => { createMutation.mutate({ name: d.name }); reset() })} className="space-y-4">
              <div>
                <input {...register('name')} placeholder="Team name"
                  className="w-full px-4 py-2.5 border rounded-xl bg-background text-foreground outline-none focus:ring-2 focus:ring-pink-500 text-sm" />
                {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setCreateOpen(false)}
                  className="px-4 py-2 rounded-xl border text-sm font-medium hover:bg-muted transition">Cancel</button>
                <button type="submit" disabled={createMutation.isPending}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-pink-600 text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-60 hover:opacity-95 transition">
                  {createMutation.isPending && <Loader2 size={14} className="animate-spin" />} Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Member Profile Dialog Modal ─────────────────────────────── */}
      {selectedProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedProfile(null)} />
          <div className="relative z-10 bg-card border rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-150 text-foreground">
            
            {/* Close Button */}
            <button 
              onClick={() => setSelectedProfile(null)} 
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition"
            >
              <X size={18} />
            </button>

            {/* Profile Header */}
            <div className="flex items-center gap-4 border-b pb-4 mb-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center text-white text-xl font-bold">
                {selectedProfile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-lg leading-tight truncate">{selectedProfile.name}</h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <GraduationCap size={13} className="text-pink-500" />
                  {selectedProfile.department || 'Unknown Department'}
                </p>
              </div>
            </div>

            {/* Profile Details List */}
            <div className="space-y-3.5">
              
              <div className="grid grid-cols-2 gap-3.5">
                <div className="bg-muted/40 p-3 rounded-xl border">
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">Roll Number</span>
                  <span className="text-sm font-medium">{selectedProfile.rollNumber || 'Not Provided'}</span>
                </div>
                <div className="bg-muted/40 p-3 rounded-xl border">
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">Year of Study</span>
                  <span className="text-sm font-medium">{selectedProfile.year ? `Year ${selectedProfile.year}` : 'Not Provided'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="bg-muted/40 p-3 rounded-xl border">
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block flex items-center gap-1">
                    <Award size={12} className="text-yellow-500" /> CGPA
                  </span>
                  <span className="text-sm font-medium">{selectedProfile.cgpa || 'N/A'}</span>
                </div>
                <div className="bg-muted/40 p-3 rounded-xl border">
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block flex items-center gap-1">
                    <MapPin size={12} className="text-red-500" /> College
                  </span>
                  <span className="text-sm font-medium truncate" title={selectedProfile.collegeName}>
                    {selectedProfile.collegeName || 'Not Provided'}
                  </span>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-2 border-t pt-3.5">
                {selectedProfile.email && (
                  <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                    <Mail size={14} className="text-orange-500" />
                    <span className="truncate">{selectedProfile.email}</span>
                  </div>
                )}
                {selectedProfile.phonenumber && (
                  <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                    <Phone size={14} className="text-green-500" />
                    <span>{selectedProfile.phonenumber}</span>
                  </div>
                )}
              </div>

              {/* Links Badge Row */}
              <div className="flex flex-wrap gap-2.5 border-t pt-3.5 mt-1 justify-center">
                {selectedProfile.githubUrl && (
                  <a href={selectedProfile.githubUrl} target="_blank" rel="noreferrer" 
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs border rounded-xl bg-background hover:bg-muted transition font-medium">
                    💻 GitHub
                  </a>
                )}
                {selectedProfile.linkedin && (
                  <a href={selectedProfile.linkedin} target="_blank" rel="noreferrer" 
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs border rounded-xl bg-background hover:bg-muted transition font-medium text-blue-600 dark:text-blue-400">
                    💼 LinkedIn
                  </a>
                )}
                {selectedProfile.leetcode && (
                  <a href={selectedProfile.leetcode} target="_blank" rel="noreferrer" 
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs border rounded-xl bg-background hover:bg-muted transition font-medium text-yellow-600 dark:text-yellow-400">
                    🏆 LeetCode
                  </a>
                )}
                {selectedProfile.portfolio && (
                  <a href={selectedProfile.portfolio} target="_blank" rel="noreferrer" 
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs border rounded-xl bg-background hover:bg-muted transition font-medium">
                    <Globe size={14} className="text-teal-500" /> Portfolio
                  </a>
                )}
                {!selectedProfile.githubUrl && !selectedProfile.linkedin && !selectedProfile.leetcode && !selectedProfile.portfolio && (
                  <p className="text-xs text-muted-foreground italic">No external profile links added.</p>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      <ConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}
        title="Delete Team" description="This will permanently delete the team and all its members."
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        isPending={deleteMutation.isPending} confirmLabel="Delete" variant="destructive" />
    </div>
  )
}
