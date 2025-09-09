// SearchTab.jsx
import React from "react";

const SearchTab = ({
	searchTerm,
	setSearchTerm,
	visibleFilesFlat,
	onSelectFile,
	setActiveTab,
}) => {
	return (
		<div className='flex flex-col space-y-2'>
			<div className='flex items-center space-x-2'>
				<input
					type='text'
					value={searchTerm}
					onChange={e => setSearchTerm(e.target.value)}
					placeholder='Search files...'
					className='p-2 rounded text-black flex-grow'
				/>
				{searchTerm && (
					<button
						onClick={() => setSearchTerm("")}
						className='text-sm text-gray-400 hover:text-white px-2'
						title='Clear search'
					>
						✖️
					</button>
				)}
			</div>
			<div className='flex flex-col space-y-1 mt-2'>
				{visibleFilesFlat.length ? (
					visibleFilesFlat.map((file, index) => (
						<button
							key={`search-${file.name}-${index}`}
							onClick={() => {
								onSelectFile(file.name);
								setActiveTab("files");
								setSearchTerm("");
							}}
							className='px-2 py-1 rounded hover:bg-gray-700 text-left overflow-hidden text-ellipsis'
							title={file.name}
						>
							{file.name}
						</button>
					))
				) : (
					<p className='text-sm text-gray-400 p-2'>No matching files</p>
				)}
			</div>
		</div>
	);
};

export default SearchTab;
