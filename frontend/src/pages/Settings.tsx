import { useState } from 'react'
import toast from 'react-hot-toast'
import { policiesAPI } from '../services/api'
import type { SLAPolicy } from '../types'

export default function Settings() {
  const [teamName, setTeamName] = useState('Your Team Name')
  const [plan, setPlan] = useState<'free' | 'professional' | 'enterprise'>('professional')
  const [isSaving, setIsSaving] = useState(false)

  const [policy, setPolicy] = useState<SLAPolicy | null>(null)
  const [policyForm, setPolicyForm] = useState({
    p1ResponseTime: 4,
    p2ResponseTime: 8,
    p3ResponseTime: 24,
    p1ResolutionTime: 24,
    p2ResolutionTime: 48,
    p3ResolutionTime: 72,
    businessHoursOnly: true,
    startHour: 9,
    endHour: 17,
  })

  const [teamMembers] = useState([
    { userId: '1', name: 'John Doe', email: 'john@example.com', role: 'admin' as const },
    { userId: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'manager' as const },
    { userId: '3', name: 'Bob Wilson', email: 'bob@example.com', role: 'member' as const },
  ])

  const [newMemberEmail, setNewMemberEmail] = useState('')

  const handleTeamNameChange = async () => {
    try {
      setIsSaving(true)
      // TODO: Call API to update team name
      toast.success('Team name updated successfully')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update team name'
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSavePolicy = async () => {
    try {
      setIsSaving(true)
      // TODO: Call API to save policy
      toast.success('SLA Policy updated successfully')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save policy'
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddMember = async () => {
    try {
      if (!newMemberEmail) {
        toast.error('Please enter an email address')
        return
      }
      setIsSaving(true)
      // TODO: Call API to add team member
      setNewMemberEmail('')
      toast.success('Team member invited successfully')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add team member'
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleRemoveMember = async (userId: string) => {
    try {
      setIsSaving(true)
      // TODO: Call API to remove team member
      toast.success('Team member removed successfully')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove team member'
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Configure your team and SLA policies</p>
      </div>

      {/* Team Settings */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Team Settings</h2>

        <div>
          <label htmlFor="team-name" className="block text-sm font-medium text-gray-700 mb-2">
            Team Name
          </label>
          <div className="flex gap-2">
            <input
              id="team-name"
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="Enter team name"
              aria-label="Team name"
            />
            <button
              onClick={handleTeamNameChange}
              disabled={isSaving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 transition"
              aria-label="Save team name"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="plan" className="block text-sm font-medium text-gray-700 mb-2">
            Subscription Plan
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { value: 'free' as const, label: 'Free', features: ['Up to 10 tickets/month', 'Basic reports'] },
              { value: 'professional' as const, label: 'Professional', features: ['Up to 500 tickets/month', 'Advanced analytics', 'Custom SLA policies'] },
              { value: 'enterprise' as const, label: 'Enterprise', features: ['Unlimited tickets', 'Full customization', '24/7 support'] },
            ].map((planOption) => (
              <div
                key={planOption.value}
                className={`border-2 rounded-lg p-4 cursor-pointer transition ${
                  plan === planOption.value
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setPlan(planOption.value)}
                role="radio"
                aria-checked={plan === planOption.value}
                aria-label={`${planOption.label} plan`}
                tabIndex={0}
              >
                <h3 className="font-semibold text-gray-900 mb-2">{planOption.label}</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  {planOption.features.map((feature, i) => (
                    <li key={i}>✓ {feature}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SLA Policy Settings */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="text-xl font-bold text-gray-900">SLA Policies</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="p1-response" className="block text-sm font-medium text-gray-700 mb-2">
              P1 Response Time (hours)
            </label>
            <input
              id="p1-response"
              type="number"
              value={policyForm.p1ResponseTime}
              onChange={(e) =>
                setPolicyForm({ ...policyForm, p1ResponseTime: parseInt(e.target.value) })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              aria-label="P1 response time"
            />
          </div>

          <div>
            <label htmlFor="p1-resolution" className="block text-sm font-medium text-gray-700 mb-2">
              P1 Resolution Time (hours)
            </label>
            <input
              id="p1-resolution"
              type="number"
              value={policyForm.p1ResolutionTime}
              onChange={(e) =>
                setPolicyForm({ ...policyForm, p1ResolutionTime: parseInt(e.target.value) })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              aria-label="P1 resolution time"
            />
          </div>

          <div>
            <label htmlFor="p2-response" className="block text-sm font-medium text-gray-700 mb-2">
              P2 Response Time (hours)
            </label>
            <input
              id="p2-response"
              type="number"
              value={policyForm.p2ResponseTime}
              onChange={(e) =>
                setPolicyForm({ ...policyForm, p2ResponseTime: parseInt(e.target.value) })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              aria-label="P2 response time"
            />
          </div>

          <div>
            <label htmlFor="p2-resolution" className="block text-sm font-medium text-gray-700 mb-2">
              P2 Resolution Time (hours)
            </label>
            <input
              id="p2-resolution"
              type="number"
              value={policyForm.p2ResolutionTime}
              onChange={(e) =>
                setPolicyForm({ ...policyForm, p2ResolutionTime: parseInt(e.target.value) })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              aria-label="P2 resolution time"
            />
          </div>

          <div>
            <label htmlFor="p3-response" className="block text-sm font-medium text-gray-700 mb-2">
              P3 Response Time (hours)
            </label>
            <input
              id="p3-response"
              type="number"
              value={policyForm.p3ResponseTime}
              onChange={(e) =>
                setPolicyForm({ ...policyForm, p3ResponseTime: parseInt(e.target.value) })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              aria-label="P3 response time"
            />
          </div>

          <div>
            <label htmlFor="p3-resolution" className="block text-sm font-medium text-gray-700 mb-2">
              P3 Resolution Time (hours)
            </label>
            <input
              id="p3-resolution"
              type="number"
              value={policyForm.p3ResolutionTime}
              onChange={(e) =>
                setPolicyForm({ ...policyForm, p3ResolutionTime: parseInt(e.target.value) })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              aria-label="P3 resolution time"
            />
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={policyForm.businessHoursOnly}
              onChange={(e) =>
                setPolicyForm({ ...policyForm, businessHoursOnly: e.target.checked })
              }
              className="rounded border-gray-300"
              aria-label="Business hours only"
            />
            <span className="text-sm font-medium text-gray-700">
              Apply SLA only during business hours
            </span>
          </label>
        </div>

        {policyForm.businessHoursOnly && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="start-hour" className="block text-sm font-medium text-gray-700 mb-2">
                Business Hours Start
              </label>
              <input
                id="start-hour"
                type="number"
                min="0"
                max="23"
                value={policyForm.startHour}
                onChange={(e) =>
                  setPolicyForm({ ...policyForm, startHour: parseInt(e.target.value) })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                aria-label="Business hours start"
              />
            </div>

            <div>
              <label htmlFor="end-hour" className="block text-sm font-medium text-gray-700 mb-2">
                Business Hours End
              </label>
              <input
                id="end-hour"
                type="number"
                min="0"
                max="23"
                value={policyForm.endHour}
                onChange={(e) =>
                  setPolicyForm({ ...policyForm, endHour: parseInt(e.target.value) })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                aria-label="Business hours end"
              />
            </div>
          </div>
        )}

        <button
          onClick={handleSavePolicy}
          disabled={isSaving}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 transition"
          aria-label="Save SLA policy"
        >
          {isSaving ? 'Saving...' : 'Save Policy'}
        </button>
      </div>

      {/* Team Members */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Team Members</h2>

        <div className="space-y-3">
          {teamMembers.map((member) => (
            <div
              key={member.userId}
              className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
              <div>
                <p className="font-medium text-gray-900">{member.name}</p>
                <p className="text-sm text-gray-500">{member.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                  {member.role}
                </span>
                <button
                  onClick={() => handleRemoveMember(member.userId)}
                  disabled={isSaving || member.role === 'admin'}
                  className="px-3 py-1 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition"
                  aria-label={`Remove ${member.name}`}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Add Team Member</h3>
          <div className="flex gap-2">
            <input
              type="email"
              value={newMemberEmail}
              onChange={(e) => setNewMemberEmail(e.target.value)}
              placeholder="Enter email address"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              aria-label="New member email"
            />
            <button
              onClick={handleAddMember}
              disabled={isSaving}
              className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 transition"
              aria-label="Add team member"
            >
              {isSaving ? 'Adding...' : 'Invite'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
