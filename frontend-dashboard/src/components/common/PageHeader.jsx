function PageHeader({ title, subtitle, rightSlot }) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold text-[#153127]">{title}</h1>
        <p className="mt-1 text-sm text-[#66736c]">{subtitle}</p>
      </div>
      {rightSlot}
    </div>
  )
}

export default PageHeader
