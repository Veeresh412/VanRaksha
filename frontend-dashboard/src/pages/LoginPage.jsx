import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { KeyRound, Leaf, Phone, ShieldCheck, UserRound, X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useAppLanguage } from '../hooks/useAppLanguage'

const profileOptions = [
  { value: 'admin', label: 'State Administrator' },
  { value: 'district_officer', label: 'District Officer' },
  { value: 'gram_sabha', label: 'Gram Sabha Officer' },
]

function LoginPage() {
  const navigate = useNavigate()
  const {
    requestOtp,
    verifyOtp,
    loginDemo,
    demoProfiles,
    isDemoLoginEnabled,
    isAuthenticated,
    isRequestingOtp,
    isVerifyingOtp,
    isLoggingInDemo,
  } = useAuth()
  const { t } = useAppLanguage()

  const [phone, setPhone] = useState('')
  const [profileRole, setProfileRole] = useState('admin')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState(1)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false)
  const [activeDemoProfileId, setActiveDemoProfileId] = useState(null)
  const [demoModalPosition, setDemoModalPosition] = useState({ top: 96, left: 16, width: 360, maxHeight: 420 })
  const demoButtonRef = useRef(null)

  const normalizedPhone = phone.trim()
  const normalizedOtp = otp.trim()
  const phoneDigits = normalizedPhone.replace(/\D/g, '')
  const otpDigits = normalizedOtp.replace(/\D/g, '')
  const isPhoneValid = phoneDigits.length >= 10
  const isOtpValid = otpDigits.length >= 4
  const isSubmitting = isRequestingOtp || isVerifyingOtp || isLoggingInDemo
  const isOtpStep = step === 2

  useEffect(() => {
    if (!isDemoModalOpen) return undefined

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsDemoModalOpen(false)
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => {
      window.removeEventListener('keydown', handleEscape)
    }
  }, [isDemoModalOpen])

  useEffect(() => {
    if (!isDemoModalOpen) return undefined

    const updateDemoModalPosition = () => {
      const buttonRect = demoButtonRef.current?.getBoundingClientRect()

      if (!buttonRect) return

      const width = Math.min(Math.max(window.innerWidth - 24, 280), 420)
      const top = Math.max(16, buttonRect.bottom + 10)
      const left = Math.min(
        window.innerWidth - width - 12,
        Math.max(12, buttonRect.right - width),
      )
      const maxHeight = Math.max(220, window.innerHeight - top - 16)

      setDemoModalPosition({ top, left, width, maxHeight })
    }

    updateDemoModalPosition()

    window.addEventListener('resize', updateDemoModalPosition)
    window.addEventListener('scroll', updateDemoModalPosition, true)

    return () => {
      window.removeEventListener('resize', updateDemoModalPosition)
      window.removeEventListener('scroll', updateDemoModalPosition, true)
    }
  }, [isDemoModalOpen])

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  const resetOtpFlow = () => {
    setStep(1)
    setOtp('')
    setMessage('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')

    if (!isOtpStep) {
      if (!isPhoneValid) {
        setError('Please enter a valid mobile number (at least 10 digits).')
        return
      }

      const response = await requestOtp({ phone: normalizedPhone, role: profileRole })

      if (!response.success) {
        setError(response.error)
        return
      }

      setStep(2)
      setOtp('')

      if (response.devOtp) {
        setMessage(`OTP sent. In seed mode, use ${response.devOtp}.`)
      } else {
        setMessage('OTP sent successfully. Enter it to sign in.')
      }

      return
    }

    if (!isOtpValid) {
      setError('Please enter the OTP sent to your mobile number.')
      return
    }

    const response = await verifyOtp({
      phone: normalizedPhone,
      role: profileRole,
      otp: normalizedOtp,
    })

    if (!response.success) {
      setError(response.error)
      return
    }

    navigate('/dashboard', { replace: true })
  }

  const handleDemoLogin = async (profileId) => {
    setError('')
    setMessage('')
    setIsDemoModalOpen(false)
    setActiveDemoProfileId(profileId)

    const response = await loginDemo(profileId)
    setActiveDemoProfileId(null)

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
              Sign in with your registered phone number and one-time password (OTP).
            </p>

            <div className="mt-8 space-y-3 text-sm text-[#def2e9]">
              <p>Supported account scopes:</p>
              <ul className="space-y-2 text-xs text-[#c7e7d8]">
                <li>• Gram Sabha account (jurisdiction scoped)</li>
                <li>• District officer account (district scoped)</li>
                <li>• State admin account (state-wide)</li>
              </ul>
            </div>
          </div>

          <div className="relative p-8">
            {isDemoLoginEnabled ? (
              <div className="absolute right-8 top-8 z-20">
                <button
                  ref={demoButtonRef}
                  type="button"
                  onClick={() => {
                    setIsDemoModalOpen((currentValue) => !currentValue)
                    if (error) setError('')
                  }}
                  disabled={isSubmitting}
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#6a9c8a] bg-[#195744] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#124c3a] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <ShieldCheck size={15} />
                  Demo Login
                </button>
              </div>
            ) : null}

            <h2 className="text-2xl font-semibold text-[#143126]">{t('login.title')}</h2>
            <p className="mt-1 text-sm text-[#66736c]">{t('login.subtitle')}</p>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-[#345245]">{t('login.profileType')}</span>
                <div className="relative">
                  <UserRound size={16} className="absolute left-3 top-3 text-[#6f7b74]" />
                  <select
                    value={profileRole}
                    onChange={(event) => {
                      setProfileRole(event.target.value)
                      if (error) setError('')
                      if (isOtpStep) resetOtpFlow()
                    }}
                    disabled={isOtpStep || isLoggingInDemo}
                    className="h-11 w-full appearance-none rounded-lg border border-[#d7e0d7] bg-white pl-9 pr-3 text-sm outline-none transition focus:border-[#80bb95]"
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
                <span className="mb-1 block text-sm font-medium text-[#345245]">{t('login.phoneNumber')}</span>
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-3 text-[#6f7b74]" />
                  <input
                    value={phone}
                    onChange={(event) => {
                      setPhone(event.target.value)
                      if (error) setError('')
                      if (isOtpStep) resetOtpFlow()
                    }}
                    placeholder="+91-98XXXXXXXX"
                    inputMode="tel"
                    autoComplete="tel"
                    disabled={isOtpStep || isLoggingInDemo}
                    className="h-11 w-full rounded-lg border border-[#d7e0d7] pl-9 pr-3 text-sm outline-none transition focus:border-[#80bb95]"
                    required
                  />
                </div>
                <p className="mt-1 text-xs text-[#71817a]">Use the registered number for the selected role.</p>
              </label>

              {isOtpStep ? (
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-[#345245]">{t('login.enterOtp')}</span>
                  <div className="relative">
                    <KeyRound size={16} className="absolute left-3 top-3 text-[#6f7b74]" />
                    <input
                      value={otp}
                      onChange={(event) => {
                        setOtp(event.target.value)
                        if (error) setError('')
                      }}
                      placeholder="Enter OTP"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      disabled={isLoggingInDemo}
                      className="h-11 w-full rounded-lg border border-[#d7e0d7] pl-9 pr-3 text-sm outline-none transition focus:border-[#80bb95]"
                      required
                    />
                  </div>
                  <p className="mt-1 text-xs text-[#71817a]">Enter the OTP received on your registered number.</p>
                </label>
              ) : null}

              {message ? (
                <p className="rounded-lg border border-[#b7e0c4] bg-[#ecfaf1] px-3 py-2 text-sm text-[#206443]">
                  {message}
                </p>
              ) : null}

              {error ? (
                <p className="rounded-lg border border-[#f4c3be] bg-[#fef0ee] px-3 py-2 text-sm text-[#bb4b42]">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting || !normalizedPhone || (isOtpStep && !normalizedOtp)}
                className="h-11 w-full rounded-lg bg-[#0e6943] text-sm font-semibold text-white transition hover:bg-[#0a5736] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isOtpStep
                  ? isVerifyingOtp
                    ? 'Verifying OTP...'
                    : t('login.verifyLogin')
                  : isLoggingInDemo
                    ? 'Signing in with demo account...'
                    : isRequestingOtp
                    ? 'Sending OTP...'
                    : t('login.sendOtp')}
              </button>

              {isOtpStep ? (
                <button
                  type="button"
                  onClick={resetOtpFlow}
                  disabled={isSubmitting}
                  className="h-10 w-full rounded-lg border border-[#cfd8d1] text-sm font-medium text-[#3f564a] transition hover:bg-[#f6f8f7] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {t('login.changeDetails')}
                </button>
              ) : null}

              {activeDemoProfileId ? (
                <p className="text-xs text-[#678279]">Signing in with selected demo account...</p>
              ) : null}
            </form>

            <p className="mt-4 text-xs text-[#7b8780]">
              Sign in flow uses `POST /auth/request-otp` and `POST /auth/verify-otp`.
            </p>
          </div>
        </div>
      </div>

      {isDemoModalOpen ? (
        <>
          <button
            type="button"
            aria-label="Close demo login"
            onClick={() => setIsDemoModalOpen(false)}
            className="fixed inset-0 z-[1200] bg-transparent"
          />

          <div
            style={{
              top: demoModalPosition.top,
              left: demoModalPosition.left,
              width: demoModalPosition.width,
              maxHeight: demoModalPosition.maxHeight,
            }}
            className="fixed z-[1210] overflow-y-auto rounded-2xl border border-[#e3e9e3] bg-white p-3 shadow-2xl animate-[vr-pop-in_220ms_cubic-bezier(.2,.9,.2,1)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="inline-flex rounded-md bg-[#fff5db] px-2 py-1 text-[11px] font-semibold tracking-[0.06em] text-[#8a5f13]">
                  DEMO ONLY
                </p>
                <h3 className="mt-2 text-lg font-semibold text-[#1f3128]">Choose a demo account</h3>
                <p className="mt-1 text-sm leading-snug text-[#64746d]">
                  For live presentations — skips credentials and OTP.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsDemoModalOpen(false)}
                className="rounded-md p-1 text-[#6c7872] transition hover:bg-[#f5f8f6]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-4 space-y-2">
              {demoProfiles.map((profile) => (
                <button
                  key={profile.id}
                  type="button"
                  onClick={() => handleDemoLogin(profile.id)}
                  disabled={isSubmitting}
                  className="w-full rounded-xl border border-[#ebefeb] bg-[#fbfcfb] px-3 py-2 text-left transition hover:border-[#c8d8cf] hover:bg-[#f4f8f5] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <p className="text-base font-semibold text-[#2a3f35]">{profile.label}</p>
                  <p className="mt-0.5 text-xs text-[#708078]">{profile.description}</p>
                </button>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}

export default LoginPage
