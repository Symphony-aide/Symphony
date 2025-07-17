//FileExplorer.jsx
import React, { useState } from "react";

export default function FileExplorer({
	files,
	activeFileName,
	onSelectFile,
	onNewFile,
	onUploadFile,
	onDeleteFile,
	onRenameFile,
	onDownloadFile,
	onOpenSettings,
}) {
	const [activeTab, setActiveTab] = useState("files");
	const [searchTerm, setSearchTerm] = useState("");

	// فلترة الملفات بناءً على البحث
	const filteredFiles = files.filter(file => file.name.toLowerCase().includes(searchTerm.toLowerCase()));

	return (
		<div className='bg-gray-800 text-white w-64 p-3 border-r border-gray-700 flex flex-col'>
			{/* Header */}
			<div className='flex items-center justify-between mb-4'>
				<h2 className='text-lg font-bold'>Sidebar</h2>
				<button onClick={onOpenSettings} className='hover:text-gray-400'>
					⚙️
				</button>
			</div>

			{/* Tabs */}
			<div className='flex space-x-2 mb-3'>
				<button
					onClick={() => setActiveTab("files")}
					className={`flex-grow px-2 py-1 rounded ${
						activeTab === "files" ? "bg-gray-700" : "hover:bg-gray-700"
					}`}
				>
					Files
				</button>
				<button
					onClick={() => setActiveTab("search")}
					className={`flex-grow px-2 py-1 rounded ${
						activeTab === "search" ? "bg-gray-700" : "hover:bg-gray-700"
					}`}
				>
					Search
				</button>
			</div>

			{/* Content */}
			<div className='flex-grow overflow-y-auto'>
				{activeTab === "files" && (
					<div className='flex flex-col space-y-1 mb-4'>
						{files.map(file => (
							<div
								key={file.name}
								className={`flex items-center justify-between px-2 py-1 rounded ${
									file.name === activeFileName ? "bg-gray-700" : "hover:bg-gray-700"
								}`}
							>
								<button
									onClick={() => onSelectFile(file.name)}
									className='text-left flex-grow overflow-hidden text-ellipsis'
								>
									{file.name}
								</button>
								<div className='flex space-x-1 ml-2'>
									<button onClick={() => onDownloadFile(file.name)} title='Download'>
										⬇️
									</button>
									<button onClick={() => onRenameFile(file.name)} title='Rename'>
										✏️
									</button>
									<button onClick={() => onDeleteFile(file.name)} title='Delete'>
										🗑️
									</button>
								</div>
							</div>
						))}
					</div>
				)}

				{activeTab === "search" && (
					<div className='flex flex-col space-y-2'>
						<input
							type='text'
							value={searchTerm}
							onChange={e => setSearchTerm(e.target.value)}
							placeholder='Search files...'
							className='p-2 rounded text-black'
						/>
						<div className='flex flex-col space-y-1 mt-2'>
							{filteredFiles.length ? (
								filteredFiles.map(file => (
									<button
										key={file.name}
										onClick={() => {
											onSelectFile(file.name);
											setActiveTab("files"); // رجع لملفات بعد الاختيار
											setSearchTerm(""); // امسح البحث
										}}
										className='px-2 py-1 rounded hover:bg-gray-700 text-left overflow-hidden text-ellipsis'
									>
										{file.name}
									</button>
								))
							) : (
								<p className='text-sm text-gray-400 p-2'>No matching files</p>
							)}
						</div>
					</div>
				)}
			</div>

			{/* Actions */}
			{activeTab === "files" && (
				<>
					<button
						onClick={onNewFile}
						className='bg-green-600 text-white px-2 py-1 rounded mb-2 hover:bg-green-500'
					>
						New File
					</button>
					<label className='bg-gray-700 text-white px-2 py-1 rounded cursor-pointer text-center hover:bg-gray-600'>
						Upload File
						<input type='file' onChange={onUploadFile} accept='.js,.ts,.txt,.json' className='hidden' />
					</label>
				</>
			)}
		</div>
	);
}
