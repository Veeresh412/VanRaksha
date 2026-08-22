import { X } from 'lucide-react'

function InsightModal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-[#0a1f16]/55 p-4 backdrop-blur-[1px] animate-[vr-fade-in_200ms_ease-out]">
      <div className="w-full max-w-5xl animate-[vr-pop-in_220ms_cubic-bezier(.2,.9,.2,1)] rounded-2xl border border-[#d5ded5] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#e0e8e0] px-5 py-3">
          <h3 className="text-lg font-semibold text-[#173127]">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-[#d7dfd7] p-2 text-[#44574f] transition hover:border-[#bfd2c0] hover:bg-[#f4f8f4]"
          >
            <X size={16} />
          </button>
        </div>

        <div className="max-h-[78vh] overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  )
}

export default InsightModal
