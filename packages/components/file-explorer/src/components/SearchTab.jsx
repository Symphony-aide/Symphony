// SearchTab.jsx
import React from "react";
import { Input } from "ui";
import { Button } from "ui";

const SearchTab = ({
	searchTerm,
	setSearchTerm,
	visibleFilesFlat,
	onSelectFile,
	setActiveTab,
}) => {
	return (
		<div className='space-y-3'>
			<div className='flex items-center space-x-2'>
				<Input
					type='text'
					value={searchTerm}
					onChange={e => setSearchTerm(e.target.value)}
					placeholder='Search files...'
					className='flex-grow'
				/>
				{searchTerm && (
					<Button
						onClick={() => setSearchTerm("")}
						variant="ghost"
						size="sm"
						className='text-gray-400 hover:text-white px-2'
						title='Clear search'
					>
						✖
					</Button>
				)}
			</div>
			<div className='flex flex-col space-y-1 mt-2'>
				{visibleFilesFlat.length ? (
					visibleFilesFlat.map((file, index) => (
						<Button
							key={`search-${file.name}-${index}`}
							onClick={() => {
								onSelectFile(file.name);
								setActiveTab("files");
							}}
							variant="ghost"
							className='justify-start p-2 h-auto text-left hover:bg-gray-700'
						>
							<div>
								<div className='font-medium text-sm'>{file.name}</div>
								<div className='text-xs text-gray-400'>{file.path}</div>
							</div>
						</Button>
					))
				) : (
					<p className='text-sm text-gray-400 p-2'>
						{searchTerm ? "No files found" : "Enter search term"}
					</p>
				)}
			</div>
		</div>
	);
};

export default SearchTab;
