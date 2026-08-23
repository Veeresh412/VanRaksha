import { useMemo, useState } from 'react'
import PageHeader from '../components/common/PageHeader'
import { useAppData } from '../contexts/AppDataContext'
import { useDashboardContext } from '../hooks/useDashboardContext'

function UsersRolesPage() {
  const { users, jurisdictionsById, jurisdictions, addOfficer, removeOfficer } = useAppData()
  const { session } = useDashboardContext()

  const [name, setName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [jurisdictionId, setJurisdictionId] = useState(jurisdictions[0]?.id ?? '')
  const [role, setRole] = useState('gram_sabha')

  const rows = useMemo(
    () =>
      users.map((user) => ({
        ...user,
        roleLabel:
          user.role === 'admin'
            ? 'State Administrator'
            : user.role === 'district_officer'
              ? 'District Officer'
              : 'Gram Sabha Account',
        accessLabel:
          user.role === 'admin'
            ? 'State-wide'
            : user.role === 'district_officer'
              ? `${user.district ?? 'District'} district`
              : jurisdictionsById[user.jurisdiction_id]?.gram_sabha ?? 'Assigned jurisdiction',
      })),
    [users, jurisdictionsById],
  )

  if (session.role !== 'admin') {
    return null
  }

  const handleAddOfficer = (event) => {
    event.preventDefault()

    addOfficer({
      name,
      phone_number: phoneNumber,
      jurisdiction_id: jurisdictionId,
      role,
    })

    setName('')
    setPhoneNumber('')
    setRole('gram_sabha')
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Users & Roles"
        subtitle="Administrative account directory and officer management controls"
      />

      <form
        className="vr-card grid gap-3 p-4 md:grid-cols-5"
        onSubmit={handleAddOfficer}
      >
        <label className="space-y-1 md:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-[#6f7b74]">
            Officer Name
          </span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            className="h-10 w-full rounded-lg border border-[#d6e0d6] px-3 text-sm outline-none focus:border-[#7bb891]"
            placeholder="Enter officer name"
          />
        </label>

        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-[#6f7b74]">
            Phone Number
          </span>
          <input
            value={phoneNumber}
            onChange={(event) => setPhoneNumber(event.target.value)}
            required
            className="h-10 w-full rounded-lg border border-[#d6e0d6] px-3 text-sm outline-none focus:border-[#7bb891]"
            placeholder="+91-98XXXXXXXX"
          />
        </label>

        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-[#6f7b74]">Role</span>
          <select
            value={role}
            onChange={(event) => setRole(event.target.value)}
            className="h-10 w-full rounded-lg border border-[#d6e0d6] px-3 text-sm outline-none focus:border-[#7bb891]"
          >
            <option value="gram_sabha">Gram Sabha</option>
            <option value="district_officer">District Officer</option>
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-[#6f7b74]">
            Jurisdiction
          </span>
          <select
            value={jurisdictionId}
            onChange={(event) => setJurisdictionId(event.target.value)}
            className="h-10 w-full rounded-lg border border-[#d6e0d6] px-3 text-sm outline-none focus:border-[#7bb891]"
          >
            {jurisdictions.map((jurisdiction) => (
              <option key={jurisdiction.id} value={jurisdiction.id}>
                {jurisdiction.gram_sabha}
              </option>
            ))}
          </select>
        </label>

        <button
          type="submit"
          className="md:col-span-5 h-10 rounded-lg bg-[#0f6a43] px-4 text-sm font-semibold text-white"
        >
          Add Officer
        </button>
      </form>

      <div className="vr-card overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[#dce5dc] bg-[#f7faf7] text-xs uppercase tracking-wide text-[#708078]">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Access Scope</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Account ID</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((user) => (
              <tr key={user.officer_id ?? user.user_id} className="border-b border-[#edf2ed] text-[#264437]">
                <td className="px-4 py-3 font-medium">{user.name}</td>
                <td className="px-4 py-3">{user.roleLabel}</td>
                <td className="px-4 py-3">{user.accessLabel}</td>
                <td className="px-4 py-3">{user.phone ?? '--'}</td>
                <td className="px-4 py-3">{user.user_id}</td>
                <td className="px-4 py-3">
                  {user.role === 'admin' ? (
                    <span className="text-xs text-[#809087]">Protected</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => removeOfficer(user.officer_id)}
                      className="rounded-md border border-[#e5b5b2] px-2.5 py-1 text-xs font-semibold text-[#b0463f] hover:bg-[#fdf0ef]"
                    >
                      Remove
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-[#6f7b74]">
        OTP codes are intentionally hidden. This table is for controlled officer management only.
      </p>
    </div>
  )
}

export default UsersRolesPage
