export default function Tabs({ tabs, activeTab, onChange, className = '' }) {
  return (
    <div className={`flex border-b border-gray-200 ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`
            relative px-4 py-3 text-body-sm font-medium
            transition-colors duration-200 cursor-pointer
            ${activeTab === tab.key
              ? 'text-primary-500'
              : 'text-gray-500 hover:text-gray-700'
            }
          `}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className="ml-1.5 text-caption text-gray-400">
              {tab.count}
            </span>
          )}
          {activeTab === tab.key && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500 rounded-full" />
          )}
        </button>
      ))}
    </div>
  )
}
