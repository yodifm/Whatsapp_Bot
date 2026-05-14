export function Skeleton({ className = '' }) {
    return (
        <div
            className={`bg-gray-200 rounded animate-pulse ${className}`}
            style={{
                background: 'linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s infinite linear',
            }}
        />
    );
}

export function SkeletonRow({ cols = 6 }) {
    const widths = ['w-32', 'w-24', 'w-20', 'w-28', 'w-16', 'w-24', 'w-20', 'w-12'];
    return (
        <tr className="border-b border-gray-50">
            {Array.from({ length: cols }).map((_, i) => (
                <td key={i} className="px-4 py-3">
                    <Skeleton className={`h-3 ${widths[i % widths.length]} rounded-full`} />
                </td>
            ))}
        </tr>
    );
}

export function SkeletonCard({ lines = 3 }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
            <Skeleton className="h-4 w-1/2 rounded-full" />
            {Array.from({ length: lines - 1 }).map((_, i) => (
                <Skeleton key={i} className={`h-3 ${i % 2 === 0 ? 'w-3/4' : 'w-1/2'} rounded-full`} />
            ))}
        </div>
    );
}

export function TableSkeleton({ rows = 5, cols = 6 }) {
    return (
        <tbody>
            {Array.from({ length: rows }).map((_, i) => (
                <SkeletonRow key={i} cols={cols} />
            ))}
        </tbody>
    );
}
