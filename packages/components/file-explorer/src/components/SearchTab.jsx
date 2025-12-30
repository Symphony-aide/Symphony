// SearchTab.jsx
import React from "react";
import { Input, Button, Flex, Box, Text } from "ui";

const SearchTab = ({
	searchTerm,
	setSearchTerm,
	visibleFilesFlat,
	onSelectFile,
	setActiveTab,
}) => {
	return (
		<Flex direction="column" gap={3}>
			<Flex align="center" gap={2}>
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
			</Flex>
			<Flex direction="column" gap={1} className='mt-2'>
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
							<Box>
								<Text className='font-medium text-sm'>{file.name}</Text>
								<Text className='text-xs text-gray-400'>{file.path}</Text>
							</Box>
						</Button>
					))
				) : (
					<Text className='text-sm text-gray-400 p-2'>
						{searchTerm ? "No files found" : "Enter search term"}
					</Text>
				)}
			</Flex>
		</Flex>
	);
};

export default SearchTab;
