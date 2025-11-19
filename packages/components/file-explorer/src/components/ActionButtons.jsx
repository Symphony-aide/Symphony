// ActionButtons.jsx
import React from "react";
import { Button } from "ui";
import { Input } from "ui";

const ActionButtons = ({
	onNewFile,
	onCreateFolder,
	onUploadFile,
}) => {
	const handleUploadInput = e => {
		const file = e.target.files?.[0];
		if (file && onUploadFile) onUploadFile(file);
		e.target.value = "";
	};

	return (
		<>
			<div className='flex items-center gap-2'>
				<Button
					onClick={onNewFile}
					variant="default"
					size="sm"
					className='bg-green-600 hover:bg-green-500 mb-2'
				>
					New File
				</Button>
				<Button
					onClick={() => onCreateFolder("")}
					variant="default"
					size="sm"
					className='bg-blue-600 hover:bg-blue-500 mb-2'
				>
					New Folder
				</Button>
			</div>
			<Button
				variant="secondary"
				size="sm"
				className='bg-gray-700 hover:bg-gray-600 relative overflow-hidden'
				asChild
			>
				<label className='cursor-pointer'>
					Upload File
					<Input
						type='file'
						onChange={handleUploadInput}
						accept='.js,.ts,.txt,.json,.jsx,.tsx,.md,.html,.css'
						className='absolute inset-0 opacity-0 cursor-pointer'
					/>
				</label>
			</Button>
		</>
	);
};

export default ActionButtons;
