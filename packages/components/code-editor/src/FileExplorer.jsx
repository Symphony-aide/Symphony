// FileExplorer.jsx
import React, { useState, useMemo, useRef } from "react";

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
	modifiedTabs = [],
	gitStatusMap = {},
	onGitStage,
	onGitCommit,
	onGitRevert,
	onReorderFiles,
}) {
	const [activeTab, setActiveTab] = useState("files");
	const [searchTerm, setSearchTerm] = useState("");
	const [extFilter, setExtFilter] = useState("all");
	const [sizeFilter, setSizeFilter] = useState("all");
	const [statusFilter, setStatusFilter] = useState("all");
	const [sortBy, setSortBy] = useState("name"); // name | size | status
	const [contextMenu, setContextMenu] = useState(null); // {x,y,file,index}

	const dragIndex = useRef(null);

	const getExt = name => {
		if (typeof name !== "string") return "no-ext";
		const i = name.lastIndexOf(".");
		return i === -1 ? "no-ext" : name.slice(i + 1).toLowerCase();
	};

	const getSizeKB = file => Math.ceil((file?.content?.length || 0) / 1024);

	const getStatus = file => {
		const fromGit = gitStatusMap[file.name];
		if (fromGit) return fromGit;
		if (modifiedTabs.includes(file.name)) return "modified";
		return "clean";
	};

	const allExtensions = useMemo(() => {
		const set = new Set((Array.isArray(files) ? files : []).map(f => getExt(f?.name || "")));
		return ["all", ...Array.from(set).sort()];
	}, [files]);

	const allStatuses = useMemo(() => {
		const set = new Set((Array.isArray(files) ? files : []).map(f => getStatus(f)));
		return ["all", ...Array.from(set).sort()];
	}, [files, modifiedTabs, gitStatusMap]);

	const matchSize = kb => {
		if (sizeFilter === "all") return true;
		if (sizeFilter === "tiny") return kb < 1;
		if (sizeFilter === "small") return kb >= 1 && kb <= 10;
		if (sizeFilter === "medium") return kb > 10 && kb <= 100;
		if (sizeFilter === "large") return kb > 100;
		return true;
	};

	const visibleFiles = useMemo(() => {
		if (!Array.isArray(files)) return [];
		let arr = files.filter(file => {
			const name = file?.name || "";
			const extOk = extFilter === "all" || getExt(name) === extFilter;
			const sizeOk = matchSize(getSizeKB(file));
			const stat = getStatus(file);
			const statusOk = statusFilter === "all" || stat === statusFilter;
			const searchOk = !searchTerm || name.toLowerCase().includes(searchTerm.toLowerCase());
			return extOk && sizeOk && statusOk && searchOk;
		});

		if (sortBy === "name") arr.sort((a, b) => (a.name > b.name ? 1 : -1));
		else if (sortBy === "size") arr.sort((a, b) => getSizeKB(a) - getSizeKB(b));
		else if (sortBy === "status") arr.sort((a, b) => (getStatus(a) > getStatus(b) ? 1 : -1));

		return arr;
	}, [files, extFilter, sizeFilter, statusFilter, sortBy, searchTerm, modifiedTabs, gitStatusMap]);

	const statusBadge = status => {
		const base = "inline-block px-1.5 py-0.5 rounded text-[10px] ml-2";
		if (status === "modified") return <span className={`${base} bg-yellow-600/30 text-yellow-300`}>M</span>;
		if (status === "untracked") return <span className={`${base} bg-blue-600/30 text-blue-300`}>U</span>;
		if (status === "staged") return <span className={`${base} bg-green-600/30 text-green-300`}>S</span>;
		if (status === "committed") return <span className={`${base} bg-gray-600/30 text-gray-300`}>✓</span>;
		return <span className={`${base} bg-gray-600/30 text-gray-300`}>C</span>;
	};

	// --- drag & drop handlers ---
	const handleDragStart = (e, idx) => {
		dragIndex.current = idx;
		e.dataTransfer.effectAllowed = "move";
	};
	const handleDragOver = e => {
		e.preventDefault();
	};
	const handleDrop = (e, toIndex) => {
		e.preventDefault();
		const fromIndex = dragIndex.current;
		if (fromIndex == null) return;
		if (typeof onReorderFiles === "function") onReorderFiles(fromIndex, toIndex);
		dragIndex.current = null;
	};

	// context menu
	const openContextMenu = (e, file, index) => {
		e.preventDefault();
		setContextMenu({
			x: e.clientX,
			y: e.clientY,
			file,
			index,
		});
	};
	const closeContextMenu = () => setContextMenu(null);

	return (
		<div className='bg-gray-800 text-white w-64 p-3 border-r border-gray-700 flex flex-col relative'>
			{/* Header */}
			<div className='flex items-center justify-between mb-4 relative'>
				<h2 className='text-lg font-bold'>Explorer</h2>
				<button onClick={() => onOpenSettings("shortcuts")} className='hover:text-gray-400'>
					⚙️
				</button>
			</div>

			{/* Tabs */}
			<div className='flex space-x-2 mb-3'>
				<button
					onClick={() => setActiveTab("files")}
					className={`flex-grow px-2 py-1 rounded ${activeTab === "files" ? "bg-gray-700" : "hover:bg-gray-700"}`}
				>
					Files
				</button>
				<button
					onClick={() => setActiveTab("search")}
					className={`flex-grow px-2 py-1 rounded ${activeTab === "search" ? "bg-gray-700" : "hover:bg-gray-700"}`}
				>
					Search
				</button>
			</div>

			{/* Content */}
			<div className='flex-grow overflow-y-auto'>
				{activeTab === "files" && (
					<>
						{/* Filters */}
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

						{/* Files list */}
						<div className='flex flex-col space-y-1 mb-4'>
							{visibleFiles.map((file, index) => {
								const isActive = file.name === activeFileName;
								const stat = getStatus(file);
								const sizeKB = getSizeKB(file);
								return (
									<div
										key={`${file.name}-${index}`}
										draggable
										onDragStart={e => handleDragStart(e, index)}
										onDragOver={handleDragOver}
										onDrop={e => handleDrop(e, index)}
										onContextMenu={e => openContextMenu(e, file, index)}
										className={`flex items-center justify-between px-2 py-1 rounded ${isActive ? "bg-gray-700" : "hover:bg-gray-700"}`}
										title={`${sizeKB} KB • ${stat}`}
									>
										<button
											onClick={() => onSelectFile(file.name)}
											className='text-left flex-grow overflow-hidden text-ellipsis flex items-center'
										>
											<span className='truncate'>{file.name}</span>
											{statusBadge(stat)}
										</button>

										<div className='flex items-center space-x-1 ml-2'>
											<span className='text-[10px] text-gray-400 mr-1'>{sizeKB}KB</span>

											{/* Git quick actions */}
											{stat !== "staged" && (
												<button
													onClick={() => onGitStage && onGitStage(file.name)}
													title='Stage'
												>
													S
												</button>
											)}
											{stat === "staged" && (
												<button
													onClick={() => onGitCommit && onGitCommit(file.name)}
													title='Commit'
												>
													✓
												</button>
											)}
											<button onClick={() => onDownloadFile(file.name)} title='Download'>
												⬇️
											</button>
											<button
												onClick={() => {
													const newName = prompt("Rename file:", file.name);
													if (newName && newName !== file.name) {
														onRenameFile(file.name, newName);
													}
												}}
												title='Rename'
											>
												✏️
											</button>
											<button onClick={() => onDeleteFile(file.name)} title='Delete'>
												🗑️
											</button>
										</div>
									</div>
								);
							})}
							{visibleFiles.length === 0 && (
								<p className='text-sm text-gray-400 p-2'>No files match current filters</p>
							)}
						</div>
					</>
				)}

				{activeTab === "search" && (
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
							{visibleFiles.length ? (
								visibleFiles.map((file, index) => (
									<button
										key={`search-${file.name}-${index}`}
										onClick={() => {
											onSelectFile(file.name);
											setActiveTab("files");
											setSearchTerm("");
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
						<input
							type='file'
							onChange={e => onUploadFile && onUploadFile(e)}
							accept='.js,.ts,.txt,.json'
							className='hidden'
						/>
					</label>
				</>
			)}

			{/* Context menu */}
			{contextMenu && (
				<div
					onMouseLeave={closeContextMenu}
					style={{ left: contextMenu.x, top: contextMenu.y }}
					className='absolute z-50 bg-gray-900 border border-gray-700 rounded shadow p-2'
				>
					<div className='flex flex-col space-y-1 text-sm'>
						<button
							onClick={() => {
								onSelectFile(contextMenu.file.name);
								closeContextMenu();
							}}
							className='text-left px-2 py-1 hover:bg-gray-800 rounded'
						>
							Open
						</button>
						<button
							onClick={() => {
								const newName = prompt("Rename file:", contextMenu.file.name);
								if (newName && newName !== contextMenu.file.name) {
									onRenameFile(contextMenu.file.name, newName);
								}
								closeContextMenu();
							}}
							className='text-left px-2 py-1 hover:bg-gray-800 rounded'
						>
							Rename
						</button>
						<button
							onClick={() => {
								onDeleteFile(contextMenu.file.name);
								closeContextMenu();
							}}
							className='text-left px-2 py-1 hover:bg-gray-800 rounded'
						>
							Delete
						</button>
						<div className='border-t border-gray-700 my-1' />
						<button
							onClick={() => {
								if (onGitStage) onGitStage(contextMenu.file.name);
								closeContextMenu();
							}}
							className='text-left px-2 py-1 hover:bg-gray-800 rounded'
						>
							Stage (Git)
						</button>
						<button
							onClick={() => {
								if (onGitCommit) onGitCommit(contextMenu.file.name);
								closeContextMenu();
							}}
							className='text-left px-2 py-1 hover:bg-gray-800 rounded'
						>
							Commit (Git)
						</button>
						<button
							onClick={() => {
								if (onGitRevert) onGitRevert(contextMenu.file.name);
								closeContextMenu();
							}}
							className='text-left px-2 py-1 hover:bg-gray-800 rounded'
						>
							Revert Git
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
