export default function EmptyState({ icon = '📭', title = 'Belum ada data', description = '', action = null }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="text-5xl mb-4">{icon}</div>
            <h3 className="text-base font-semibold text-gray-700">{title}</h3>
            {description && <p className="text-sm text-gray-400 mt-1 max-w-xs">{description}</p>}
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}
