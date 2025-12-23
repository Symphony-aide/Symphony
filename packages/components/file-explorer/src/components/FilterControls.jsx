// FilterControls.jsx
import React from "react";
import { Flex, Box, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "ui";

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
		<Flex direction="column" gap={2} className='mb-3'>
			<Flex align="center" gap={2}>
				<Label className='text-xs text-gray-300 w-12'>Ext</Label>
				<Select value={extFilter} onValueChange={setExtFilter}>
					<SelectTrigger className='flex-1 p-1 rounded bg-gray-700 text-white text-sm'>
						<SelectValue placeholder="All" />
					</SelectTrigger>
					<SelectContent>
						{allExtensions.map(ext => (
							<SelectItem key={ext} value={ext}>
								{ext === "all" ? "All" : ext}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</Flex>

			<Flex align="center" gap={2}>
				<Label className='text-xs text-gray-300 w-12'>Size</Label>
				<Select value={sizeFilter} onValueChange={setSizeFilter}>
					<SelectTrigger className='flex-1 p-1 rounded bg-gray-700 text-white text-sm'>
						<SelectValue placeholder="All" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value='all'>All</SelectItem>
						<SelectItem value='tiny'>&lt; 1 KB</SelectItem>
						<SelectItem value='small'>1–10 KB</SelectItem>
						<SelectItem value='medium'>10–100 KB</SelectItem>
						<SelectItem value='large'>&gt; 100 KB</SelectItem>
					</SelectContent>
				</Select>
			</Flex>

			<Flex align="center" gap={2}>
				<Label className='text-xs text-gray-300 w-12'>Status</Label>
				<Select value={statusFilter} onValueChange={setStatusFilter}>
					<SelectTrigger className='flex-1 p-1 rounded bg-gray-700 text-white text-sm'>
						<SelectValue placeholder="All" />
					</SelectTrigger>
					<SelectContent>
						{allStatuses.map(s => (
							<SelectItem key={s} value={s}>
								{s === "all" ? "All" : s}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</Flex>

			<Flex align="center" gap={2}>
				<Label className='text-xs text-gray-300 w-12'>Sort</Label>
				<Select value={sortBy} onValueChange={setSortBy}>
					<SelectTrigger className='flex-1 p-1 rounded bg-gray-700 text-white text-sm'>
						<SelectValue placeholder="Name" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value='name'>Name</SelectItem>
						<SelectItem value='size'>Size</SelectItem>
						<SelectItem value='status'>Status</SelectItem>
					</SelectContent>
				</Select>
			</Flex>
		</Flex>
	);
};

export default FilterControls;
