export default function Tabs({ tabs, activeTab, onChange, className = '' }) {
  return (
    <div className={`flex gap-1 rounded-xl bg-[#f1eee8] p-1 ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`
            relative rounded-lg px-4 py-2 text-body-sm font-medium
            transition-colors duration-200 cursor-pointer
            ${activeTab === tab.key
              ? 'bg-white text-[#2d2a26] shadow-sm'
              : 'text-[#6f6a61] hover:text-[#4a4640]'
            }
          `}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className={`ml-1.5 text-caption ${activeTab === tab.key ? 'text-[#8a847a]' : 'text-[#9a958a]'}`}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
