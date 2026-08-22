import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { CheckCircle2, Leaf, LockKeyhole, Phone, UserRound } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const profileOptions = [
  { value: 'admin', label: 'State Administrator' },
  { value: 'district_officer', label: 'District Officer' },
  { value: 'gram_sabha', label: 'Gram Sabha Officer' },
]

function LoginPage() {
  const navigate = useNavigate()
  const {
    login,
    sendOtp,
    isAuthenticated,
    isRequestingOtp,
    isVerifyingOtp,
  } = useAuth()

  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [profileRole, setProfileRole] = useState('admin')
  const [error, setError] = useState('')
  const [otpRequested, setOtpRequested] = useState(false)

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  const handleRequestOtp = async (event) => {
    event.preventDefault()
    setError('')

    const response = await sendOtp({ phone, role: profileRole })

    if (!response.success) {
      setOtpRequested(false)
      setError(response.error)
      return
    }

    setOtpRequested(true)
  }

  const handleVerifyOtp = async (event) => {
    event.preventDefault()
    setError('')

    const response = await login({ phone, otp, role: profileRole })

    if (!response.success) {
      setError(response.error)
      return
    }

    navigate('/dashboard', { replace: true })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7f8f4] p-4">
      <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-[#dbe4db] bg-white shadow-panel">
        <div className="grid md:grid-cols-[1.1fr_1fr]">
          <div className="bg-gradient-to-b from-[#063c2a] to-[#0c593d] p-8 text-white">
            <div className="inline-flex items-center gap-3">
              <span className="rounded-xl bg-white/10 p-2">
                <Leaf size={22} />
              </span>
              <div>
                <h1 className="text-3xl font-semibold">VanRaksha</h1>
                <p className="text-sm text-[#bee0cf]">FRA Land Monitoring</p>
              </div>
            </div>

            <p className="mt-8 max-w-sm text-sm leading-relaxed text-[#d3ebe1]">
              Secure dashboard access for Gram Sabha, District, and State-level monitoring teams.
              This demo uses seed data and a mock OTP fallback for presentation flow.
            </p>

            <div className="mt-8 space-y-3 text-sm text-[#def2e9]">
              <p>Demo account types:</p>
              <ul className="space-y-2 text-xs text-[#c7e7d8]">
                <li>• Gram Sabha account (jurisdiction scoped)</li>
                <li>• District officer account (district scoped)</li>
                <li>• State admin account (state-wide)</li>
                <li>• Test OTP for demo: 123456</li>
              </ul>
            </div>
          </div>

          <div className="p-8">
            <h2 className="text-2xl font-semibold text-[#143126]">Dashboard Login</h2>
            <p className="mt-1 text-sm text-[#66736c]">OTP verification for authorized officers</p>

            <form
              className="mt-6 space-y-4"
              onSubmit={otpRequested ? handleVerifyOtp : handleRequestOtp}
            >
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-[#345245]">Profile Type</span>
                <div className="relative">
                  <UserRound size={16} className="absolute left-3 top-3 text-[#6f7b74]" />
                  <select
                    value={profileRole}
                    onChange={(event) => setProfileRole(event.target.value)}
                    disabled={otpRequested}
                    className="h-11 w-full appearance-none rounded-lg border border-[#d7e0d7] bg-white pl-9 pr-3 text-sm outline-none transition focus:border-[#80bb95] disabled:cursor-not-allowed disabled:bg-[#f4f8f4]"
                  >
                    {profileOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-[#345245]">Phone Number</span>
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-3 text-[#6f7b74]" />
                  <input
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="+91-98XXXXXXXX"
                    readOnly={otpRequested}
                    className="h-11 w-full rounded-lg border border-[#d7e0d7] pl-9 pr-3 text-sm outline-none transition focus:border-[#80bb95] read-only:cursor-not-allowed read-only:bg-[#f4f8f4]"
                    required
                  />
                </div>
              </label>

              {otpRequested ? (
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-[#345245]">OTP</span>
                  <div className="relative">
                    <LockKeyhole size={16} className="absolute left-3 top-3 text-[#6f7b74]" />
                    <input
                      value={otp}
                      onChange={(event) => setOtp(event.target.value)}
                      placeholder="Enter 6-digit OTP"
                      className="h-11 w-full rounded-lg border border-[#d7e0d7] pl-9 pr-3 text-sm outline-none transition focus:border-[#80bb95]"
                      required
                    />
                  </div>
                </label>
              ) : null}

              {otpRequested ? (
                <p className="inline-flex items-center gap-1 rounded-lg border border-[#cde7d8] bg-[#eff8f2] px-3 py-2 text-xs text-[#226044]">
                  <CheckCircle2 size={14} /> OTP requested. Enter code to continue.
                </p>
              ) : null}

              {error ? (
                <p className="rounded-lg border border-[#f4c3be] bg-[#fef0ee] px-3 py-2 text-sm text-[#bb4b42]">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={otpRequested ? isVerifyingOtp : isRequestingOtp}
                className="h-11 w-full rounded-lg bg-[#0e6943] text-sm font-semibold text-white transition hover:bg-[#0a5736] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {otpRequested
                  ? isVerifyingOtp
                    ? 'Verifying OTP...'
                    : 'Verify OTP & Sign In'
                  : isRequestingOtp
                    ? 'Requesting OTP...'
                    : 'Request OTP'}
              </button>

              {otpRequested ? (
                <button
                  type="button"
                  onClick={() => {
                    setOtpRequested(false)
                    setOtp('')
                    setError('')
                  }}
                  className="h-10 w-full rounded-lg border border-[#d7e0d7] bg-white text-sm font-medium text-[#2b4a3d] transition hover:bg-[#f5f9f5]"
                >
                  Change Phone Number
                </button>
              ) : null}
            </form>

            <p className="mt-4 text-xs text-[#7b8780]">
              OTP secrets remain hidden in dashboard views and are used only for this demo flow.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
