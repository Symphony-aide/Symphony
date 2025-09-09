// ActionButtons.jsx
import React from "react";

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
				<button
					onClick={onNewFile}
					className='bg-green-600 text-white px-2 py-1 rounded mb-2 hover:bg-green-500'
				>
					New File
				</button>
				<button
					onClick={() => onCreateFolder("")}
					className='bg-blue-600 text-white px-2 py-1 rounded mb-2 hover:bg-blue-500'
				>
					New Folder
				</button>
			</div>
			<label className='bg-gray-700 text-white px-2 py-1 rounded cursor-pointer text-center hover:bg-gray-600'>
				Upload File
				<input
					type='file'
					onChange={handleUploadInput}
					accept='.js,.ts,.txt,.json,.jsx,.tsx,.md,.html,.css'
					className='hidden'
				/>
			</label>
		</>
	);
};

export default ActionButtons;
