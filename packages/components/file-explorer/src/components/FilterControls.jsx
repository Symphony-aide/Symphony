// FilterControls.jsx
import React from "react";

const FilterControls = ({
	extFilter,
	setExtFilter,
	sizeFilter,
	setSizeFilter,
	statusFilter,
	setStatusFilter,
	sortBy,
	setSortBy,
	allExtensions,
	allStatuses,
}) => {
	return (
		<div className='space-y-2 mb-3'>
			<div className='flex items-center space-x-2'>
				<label className='text-xs text-gray-300 w-12'>Ext</label>
				<select
					value={extFilter}
					onChange={e => setExtFilter(e.target.value)}
					className='flex-1 p-1 rounded bg-gray-700 text-white text-sm'
				>
					{allExtensions.map(ext => (
						<option key={ext} value={ext}>
							{ext === "all" ? "All" : ext}
						</option>
					))}
				</select>
			</div>

			<div className='flex items-center space-x-2'>
				<label className='text-xs text-gray-300 w-12'>Size</label>
				<select
					value={sizeFilter}
					onChange={e => setSizeFilter(e.target.value)}
					className='flex-1 p-1 rounded bg-gray-700 text-white text-sm'
				>
					<option value='all'>All</option>
					<option value='tiny'>&lt; 1 KB</option>
					<option value='small'>1–10 KB</option>
					<option value='medium'>10–100 KB</option>
					<option value='large'>&gt; 100 KB</option>
				</select>
			</div>

			<div className='flex items-center space-x-2'>
				<label className='text-xs text-gray-300 w-12'>Status</label>
				<select
					value={statusFilter}
					onChange={e => setStatusFilter(e.target.value)}
					className='flex-1 p-1 rounded bg-gray-700 text-white text-sm'
				>
					{allStatuses.map(s => (
						<option key={s} value={s}>
							{s === "all" ? "All" : s}
						</option>
					))}
				</select>
			</div>

			<div className='flex items-center space-x-2'>
				<label className='text-xs text-gray-300 w-12'>Sort</label>
				<select
					value={sortBy}
					onChange={e => setSortBy(e.target.value)}
					className='flex-1 p-1 rounded bg-gray-700 text-white text-sm'
				>
					<option value='name'>Name</option>
					<option value='size'>Size</option>
					<option value='status'>Status</option>
				</select>
			</div>
		</div>
	);
};

export default FilterControls;
