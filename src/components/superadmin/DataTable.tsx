'use client';

import { ReactNode } from 'react';
import { FaChevronLeft, FaChevronRight, FaSearch, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';

interface Column<T> {
    header: string;
    accessor: keyof T | ((item: T) => ReactNode);
    sortable?: boolean;
    className?: string;
}

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    loading?: boolean;
    pagination?: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        itemsPerPage: number;
        onPageChange: (page: number) => void;
    };
    sorting?: {
        sortBy: string;
        sortOrder: 'asc' | 'desc';
        onSort: (column: string) => void;
    };
    search?: {
        value: string;
        onChange: (value: string) => void;
        placeholder?: string;
    };
    actions?: (item: T) => ReactNode;
    onRowClick?: (item: T) => void;
    emptyMessage?: string;
}

export default function DataTable<T extends { id: number | string }>({
    columns,
    data,
    loading = false,
    pagination,
    sorting,
    search,
    actions,
    onRowClick,
    emptyMessage = 'No data found'
}: DataTableProps<T>) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header / Search */}
            {search && (
                <div className="p-4 border-b border-gray-100">
                    <div className="relative max-w-md">
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={search.value}
                            onChange={(e) => search.onChange(e.target.value)}
                            placeholder={search.placeholder || 'Search...'}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none text-sm"
                        />
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            {columns.map((column, index) => (
                                <th
                                    key={index}
                                    className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                                        } ${column.className || ''}`}
                                    onClick={() => column.sortable && sorting && typeof column.accessor === 'string' && sorting.onSort(column.accessor as string)}
                                >
                                    <div className="flex items-center gap-2">
                                        {column.header}
                                        {column.sortable && sorting && typeof column.accessor === 'string' && (
                                            <span className="text-gray-400">
                                                {sorting.sortBy === column.accessor ? (
                                                    sorting.sortOrder === 'asc' ? <FaSortUp /> : <FaSortDown />
                                                ) : (
                                                    <FaSort />
                                                )}
                                            </span>
                                        )}
                                    </div>
                                </th>
                            ))}
                            {actions && <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {loading ? (
                            // Loading Skeleton
                            [...Array(5)].map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    {columns.map((_, j) => (
                                        <td key={j} className="px-6 py-4 whitespace-nowrap">
                                            <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                                        </td>
                                    ))}
                                    {actions && (
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="h-4 bg-gray-100 rounded w-8 ml-auto"></div>
                                        </td>
                                    )}
                                </tr>
                            ))
                        ) : data.length > 0 ? (
                            data.map((item) => (
                                <tr
                                    key={item.id}
                                    className={`hover:bg-gray-50 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                                    onClick={() => onRowClick?.(item)}
                                >
                                    {columns.map((column, index) => (
                                        <td key={index} className={`px-6 py-4 whitespace-nowrap text-sm text-gray-700 ${column.className || ''}`}>
                                            {typeof column.accessor === 'function'
                                                ? column.accessor(item)
                                                : (item[column.accessor] as ReactNode)}
                                        </td>
                                    ))}
                                    {actions && (
                                        <td
                                            className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            {actions(item)}
                                        </td>
                                    )}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td
                                    colSpan={columns.length + (actions ? 1 : 0)}
                                    className="px-6 py-12 text-center text-gray-500"
                                >
                                    {emptyMessage}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                        Showing <span className="font-medium">{((pagination.currentPage - 1) * pagination.itemsPerPage) + 1}</span> to{' '}
                        <span className="font-medium">
                            {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)}
                        </span>{' '}
                        of <span className="font-medium">{pagination.totalItems}</span> results
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
                            disabled={pagination.currentPage === 1}
                            className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <FaChevronLeft className="text-gray-500" />
                        </button>
                        {[...Array(pagination.totalPages)].map((_, i) => {
                            const page = i + 1;
                            // Simple pagination logic: show first, last, current, and adjacent pages
                            if (
                                page === 1 ||
                                page === pagination.totalPages ||
                                (page >= pagination.currentPage - 1 && page <= pagination.currentPage + 1)
                            ) {
                                return (
                                    <button
                                        key={page}
                                        onClick={() => pagination.onPageChange(page)}
                                        className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium ${pagination.currentPage === page
                                            ? 'bg-orange-600 text-white'
                                            : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                                            }`}
                                    >
                                        {page}
                                    </button>
                                );
                            } else if (
                                (page === pagination.currentPage - 2 && page > 1) ||
                                (page === pagination.currentPage + 2 && page < pagination.totalPages)
                            ) {
                                return <span key={page} className="text-gray-400">...</span>;
                            }
                            return null;
                        })}
                        <button
                            onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
                            disabled={pagination.currentPage === pagination.totalPages}
                            className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <FaChevronRight className="text-gray-500" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
