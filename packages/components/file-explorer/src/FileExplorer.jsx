// FileExplorer.jsx
import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { ChevronRight, ChevronDown, Folder as FolderIcon, FolderOpen, File as FileIcon } from "lucide-react";
import { getIconForFile } from "vscode-icons-js";

export default function FileExplorer({
	files,
	activeFileName,
	onSelectFile,
	onNewFile, // موجود بالفعل (لإنشاء في الـ root)
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
	onReorderFiles, // اختياري موجود عندك
	// ✅ اختياري جديد: لو بعته هنستخدمه لما تعمل "New File" من فولدر
	onNewFileInFolder,
}) {
	// ====== حالات عامة (زي عندك) ======
	const [activeTab, setActiveTab] = useState("files");
	const [searchTerm, setSearchTerm] = useState("");
	const [extFilter, setExtFilter] = useState("all");
	const [sizeFilter, setSizeFilter] = useState("all");
	const [statusFilter, setStatusFilter] = useState("all");
	const [sortBy, setSortBy] = useState("name");
	const [renamingPath, setRenamingPath] = useState(null);
	const [renameValue, setRenameValue] = useState("");

	// ⛳ قائمة كليك يمين
	const [contextMenu, setContextMenu] = useState(null); // {x,y,type:'file'|'folder', file?, folderPath?}
	const dragIndex = useRef(null);

	// ====== حالة الفولدرات (تعريف + expanded state) ======
	// بنحفظ قائمة الفولدرات اللي أنشأها المستخدم (paths) عشان تفضل موجودة حتى لو مفيش ملفات جوّاها
	const [userFolders, setUserFolders] = useState(() => {
		try {
			return JSON.parse(localStorage.getItem("explorer.userFolders")) || [];
		} catch {
			return [];
		}
	});

	useEffect(() => {
		localStorage.setItem("explorer.userFolders", JSON.stringify(userFolders));
	}, [userFolders]);

	// expanded map: { "src": true, "src/components": false, ...}
	const [expanded, setExpanded] = useState(() => {
		try {
			return JSON.parse(localStorage.getItem("explorer.expanded")) || {};
		} catch {
			return {};
		}
	});

	useEffect(() => {
		localStorage.setItem("explorer.expanded", JSON.stringify(expanded));
	}, [expanded]);

	const toggleExpand = path => {
		setExpanded(prev => ({ ...prev, [path]: !prev[path] }));
	};

	// ====== Helpers ======
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

	const matchSize = kb => {
		if (sizeFilter === "all") return true;
		if (sizeFilter === "tiny") return kb < 1;
		if (sizeFilter === "small") return kb >= 1 && kb <= 10;
		if (sizeFilter === "medium") return kb > 10 && kb <= 100;
		if (sizeFilter === "large") return kb > 100;
		return true;
	};

	// ====== بناء الشجرة من الملفات + الفولدرات ======
	// Node structure: { type: 'folder'|'file', name, path, children?: Map, fileRef?: file }
	const tree = useMemo(() => {
		const root = { type: "folder", name: "", path: "", children: new Map() };

		// helper لإنشاء فولدرات من path الجزئي
		const ensureFolder = folderPath => {
			const parts = folderPath.split("/").filter(Boolean);
			let curr = root;
			let acc = "";
			for (const p of parts) {
				acc = acc ? `${acc}/${p}` : p;
				if (!curr.children.has(p)) {
					curr.children.set(p, {
						type: "folder",
						name: p,
						path: acc,
						children: new Map(),
						// علامة إنه فولدر فارغ أنشأه المستخدم
						__userCreated: userFolders.includes(acc),
					});
				}
				curr = curr.children.get(p);
			}
			return curr;
		};

		// 1) أضف فولدرات المستخدم (حتى لو فاضية)
		for (const f of userFolders) {
			ensureFolder(f);
		}

		// 2) أضف الملفات حسب مسار الاسم (لو فيه "/")
		for (const file of Array.isArray(files) ? files : []) {
			const full = file.name;
			const parts = full.split("/"); // يدعم "src/App.jsx"
			const fileName = parts.pop();
			const folderPath = parts.join("/");
			const parent = folderPath ? ensureFolder(folderPath) : root;

			parent.children.set(fileName, {
				type: "file",
				name: fileName,
				path: folderPath ? `${folderPath}/${fileName}` : fileName,
				fileRef: file,
			});
		}

		return root;
	}, [files, userFolders]);

	// ====== فلترة الملفات داخل الشجرة ======
	const allExtensions = useMemo(() => {
		const set = new Set((Array.isArray(files) ? files : []).map(f => getExt(f?.name || "")));
		return ["all", ...Array.from(set).sort()];
	}, [files]);

	const allStatuses = useMemo(() => {
		const set = new Set((Array.isArray(files) ? files : []).map(f => getStatus(f)));
		return ["all", ...Array.from(set).sort()];
	}, [files, modifiedTabs, gitStatusMap]);

	const fileMatchesFilters = useCallback(
		fileNode => {
			const file = fileNode.fileRef;
			const name = file?.name || "";
			const extOk = extFilter === "all" || getExt(name) === extFilter;
			const sizeOk = matchSize(getSizeKB(file));
			const stat = getStatus(file);
			const statusOk = statusFilter === "all" || stat === statusFilter;
			const searchOk = !searchTerm || name.toLowerCase().includes(searchTerm.toLowerCase());
			return extOk && sizeOk && statusOk && searchOk;
		},
		[extFilter, statusFilter, searchTerm, files]
	);

	const sortChildren = useCallback(
		childrenMap => {
			const arr = Array.from(childrenMap.values());
			// folders first, files later; then by sortBy
			arr.sort((a, b) => {
				if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
				if (sortBy === "name") return a.name.localeCompare(b.name);
				if (sortBy === "size") {
					if (a.type === "folder" && b.type === "folder") return a.name.localeCompare(b.name);
					if (a.type === "folder") return -1;
					if (b.type === "folder") return 1;
					return getSizeKB(a.fileRef) - getSizeKB(b.fileRef);
				}
				if (sortBy === "status") {
					if (a.type === "folder" && b.type === "folder") return a.name.localeCompare(b.name);
					if (a.type === "folder") return -1;
					if (b.type === "folder") return 1;
					return getStatus(a.fileRef).localeCompare(getStatus(b.fileRef));
				}
				return 0;
			});
			return arr;
		},
		[sortBy, files]
	);

	const filterTree = useCallback(
		node => {
			if (node.type === "file") {
				return fileMatchesFilters(node) ? node : null;
			}
			// folder
			const newChildren = new Map();
			for (const child of node.children.values()) {
				const filtered = filterTree(child);
				if (filtered) {
					newChildren.set(filtered.name, filtered);
				}
			}
			if (newChildren.size === 0 && !userFolders.includes(node.path)) {
				// اخفي الفولدر لو فاضي ومش من اللي أنشأه المستخدم
				return null;
			}
			return { ...node, children: newChildren };
		},
		[fileMatchesFilters, userFolders]
	);

	const filteredTree = useMemo(
		() => filterTree(tree) || { type: "folder", name: "", path: "", children: new Map() },
		[tree, filterTree]
	);

	// ====== UI Helpers ======
	const statusBadge = status => {
		const base = "inline-block px-1.5 py-0.5 rounded text-[10px] ml-2";
		if (status === "modified") return <span className={`${base} bg-yellow-600/30 text-yellow-300`}>M</span>;
		if (status === "untracked") return <span className={`${base} bg-blue-600/30 text-blue-300`}>U</span>;
		if (status === "staged") return <span className={`${base} bg-green-600/30 text-green-300`}>S</span>;
		if (status === "committed") return <span className={`${base} bg-gray-600/30 text-gray-300`}>✓</span>;
		return <span className={`${base} bg-gray-600/30 text-gray-300`}>C</span>;
	};

	const fileIcon = name => {
		const iconPath = getIconForFile(name);

		if (iconPath) {
			return (
				<img
					src={`https://raw.githubusercontent.com/vscode-icons/vscode-icons/master/icons/${iconPath}`}
					alt={name}
					className='w-4 h-4 inline-block'
				/>
			);
		}

		// fallback لو مش لاقي أيقونة للملف
		return <FileIcon className='w-4 h-4 text-gray-400' />;
	};
	// ====== Context menu ======
	const openContextMenu = (e, payload) => {
		e.preventDefault();
		setContextMenu({
			x: e.clientX,
			y: e.clientY,
			...payload, // { type: 'file'|'folder', fileNode? , folderPath? }
		});
	};
	const closeContextMenu = () => setContextMenu(null);

	// ====== Folder ops (محليًا) ======
	const createFolder = (parentPath = "") => {
		const name = prompt("New folder name:");
		if (!name) return;
		const cleanParent = parentPath.replace(/\/$/, "");
		const full = cleanParent ? `${cleanParent}/${name}` : name;
		if (userFolders.includes(full)) return;
		setUserFolders(prev => Array.from(new Set([...prev, full])));
		// فتحه تلقائيًا
		setExpanded(prev => ({ ...prev, [cleanParent]: true, [full]: true }));
	};

	const renameFolder = (folderPath, newName) => {
		if (!newName || newName === folderPath.split("/").pop()) return;
		const parent = folderPath.includes("/") ? folderPath.slice(0, folderPath.lastIndexOf("/")) : "";
		const newPath = parent ? `${parent}/${newName}` : newName;

		// 1) حدّث ملفات تحت الفولدر (rename path prefix)
		const under = (Array.isArray(files) ? files : []).filter(
			f => f.name.startsWith(folderPath + "/") || f.name === folderPath
		);
		under.forEach(f => {
			const rest = f.name.slice(folderPath.length);
			const newFilePath = `${newPath}${rest}`;
			onRenameFile && onRenameFile(f.name, newFilePath);
		});

		// 2) حدّث userFolders (كل subpaths)
		setUserFolders(prev => {
			const next = prev.map(p =>
				p === folderPath || p.startsWith(folderPath + "/") ? p.replace(folderPath, newPath) : p
			);
			return Array.from(new Set(next));
		});

		// 3) حافظ على expanded
		setExpanded(prev => {
			const next = {};
			for (const [k, v] of Object.entries(prev)) {
				if (k === folderPath || k.startsWith(folderPath + "/")) next[k.replace(folderPath, newPath)] = v;
				else next[k] = v;
			}
			return next;
		});
	};

	const deleteFolder = folderPath => {
		if (!confirm(`Delete folder "${folderPath}" and all its files?`)) return;

		// امسح كل الملفات تحت الفولدر
		(Array.isArray(files) ? files : [])
			.filter(f => f.name === folderPath || f.name.startsWith(folderPath + "/"))
			.forEach(f => onDeleteFile && onDeleteFile(f.name));

		// شيل كل subfolders من userFolders
		setUserFolders(prev => prev.filter(p => !(p === folderPath || p.startsWith(folderPath + "/"))));

		// شيل حالة expand
		setExpanded(prev => {
			const next = { ...prev };
			Object.keys(next).forEach(k => {
				if (k === folderPath || k.startsWith(folderPath + "/")) delete next[k];
			});
			return next;
		});
	};

	// ====== Drag & drop: نقل ملف إلى فولدر ======
	const onFileDragStart = (e, filePath) => {
		e.dataTransfer.setData("text/plain", filePath);
		e.dataTransfer.effectAllowed = "move";
	};

	const onFolderDragOver = e => {
		e.preventDefault();
	};

	const onFolderDrop = (e, targetFolderPath) => {
		e.preventDefault();
		const draggedPath = e.dataTransfer.getData("text/plain");
		if (!draggedPath) return;
		const base = draggedPath.split("/").pop();
		const cleanTarget = targetFolderPath.replace(/\/$/, "");
		const newPath = cleanTarget ? `${cleanTarget}/${base}` : base;
		if (newPath === draggedPath) return;
		onRenameFile && onRenameFile(draggedPath, newPath);
		setExpanded(prev => ({ ...prev, [targetFolderPath]: true }));
	};

	// ====== Render node ======
	const renderNode = (node, depth = 0) => {
		if (!node) return null;

		if (node.type === "file") {
			const isActive = node.path === activeFileName;
			const stat = getStatus(node.fileRef);
			const sizeKB = getSizeKB(node.fileRef);

			const isRenaming = renamingPath === node.path; // ✅ هل الملف تحت إعادة تسمية؟

			return (
				<div
					key={node.path}
					className={`flex items-center justify-between px-2 py-1 rounded cursor-pointer ${isActive ? "bg-gray-700" : "hover:bg-gray-700"}`}
					style={{ paddingLeft: 8 + depth * 14 }}
					title={`${sizeKB} KB • ${stat}`}
					onClick={() => onSelectFile(node.path)}
					onContextMenu={e => openContextMenu(e, { type: "file", fileNode: node })}
					draggable
					onDragStart={e => onFileDragStart(e, node.path)}
				>
					<div className='flex items-center gap-2 overflow-hidden'>
						<span>{fileIcon(node.name)}</span>

						{/* ✅ هنا التغيير */}
						{isRenaming ? (
							<input
								autoFocus
								value={renameValue}
								onChange={e => setRenameValue(e.target.value)}
								onBlur={() => {
									if (renameValue && renameValue !== node.name) {
										const parent = node.path.includes("/")
											? node.path.slice(0, node.path.lastIndexOf("/"))
											: "";
										const newPath = parent ? `${parent}/${renameValue}` : renameValue;
										onRenameFile(node.path, newPath);
									}
									setRenamingPath(null);
								}}
								onKeyDown={e => {
									if (e.key === "Enter") {
										e.target.blur(); // يعمل trigger للـ onBlur
									} else if (e.key === "Escape") {
										setRenamingPath(null);
									}
								}}
								className='bg-gray-800 text-white px-1 rounded text-sm w-[120px]'
							/>
						) : (
							<span className='truncate'>{node.name}</span>
						)}

						{statusBadge(stat)}
					</div>

					<div className='flex items-center gap-1 text-xs'>
						<span className='text-[10px] text-gray-400 mr-1'>{sizeKB}KB</span>
						{stat !== "staged" && (
							<button
								onClick={e => {
									e.stopPropagation();
									onGitStage && onGitStage(node.path);
								}}
								title='Stage'
							>
								S
							</button>
						)}
						{stat === "staged" && (
							<button
								onClick={e => {
									e.stopPropagation();
									onGitCommit && onGitCommit(node.path);
								}}
								title='Commit'
							>
								✓
							</button>
						)}
					</div>
				</div>
			);
		}

		// folder
		const isOpen = !!expanded[node.path];
		const childrenArr = sortChildren(node.children);
		return (
			<div key={node.path || "__root__"}>
				{node.path !== "" && (
					<div
						className='flex items-center px-2 py-1 rounded cursor-pointer hover:bg-gray-700 select-none'
						style={{ paddingLeft: 4 + depth * 14 }}
						onClick={() => toggleExpand(node.path)}
						onContextMenu={e => openContextMenu(e, { type: "folder", folderPath: node.path })}
						onDragOver={onFolderDragOver}
						onDrop={e => onFolderDrop(e, node.path)}
					>
						{isOpen ? (
							<ChevronDown className='w-3.5 h-3.5 mr-1' />
						) : (
							<ChevronRight className='w-3.5 h-3.5 mr-1' />
						)}
						{isOpen ? (
							<FolderOpen className='w-3.5 h-3.5 mr-1' />
						) : (
							<FolderIcon className='w-3.5 h-3.5 mr-1' />
						)}
						{renamingPath === node.path ? (
							<input
								autoFocus
								value={renameValue}
								onChange={e => setRenameValue(e.target.value)}
								onBlur={() => {
									if (renameValue && renameValue !== node.name) {
										renameFolder(node.path, renameValue);
									}
									setRenamingPath(null);
								}}
								onKeyDown={e => {
									if (e.key === "Enter") {
										e.target.blur();
									} else if (e.key === "Escape") {
										setRenamingPath(null);
									}
								}}
								className='bg-gray-800 text-white px-1 rounded text-sm w-[120px]'
							/>
						) : (
							<span className='truncate'>{node.name || "root"}</span>
						)}
					</div>
				)}
				{isOpen || node.path === "" ? (
					<div>{childrenArr.map(child => renderNode(child, node.path === "" ? 0 : depth + 1))}</div>
				) : null}
			</div>
		);
	};

	// ====== Visible files (للتبويب Search كما هو عندك) ======
	const visibleFilesFlat = useMemo(() => {
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

	// ====== Drag reorder (قائمة مسطحة فقط) — نسيبها كما هي لو حبيت تستخدمها ======
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

	// ====== Upload fix: مرر الـ File نفسه بدلاً من الـ event ======
	const handleUploadInput = e => {
		const file = e.target.files?.[0];
		if (file && onUploadFile) onUploadFile(file);
		e.target.value = "";
	};

	return (
		<div className='bg-gray-800 text-white w-64 p-3 border-r border-gray-700 flex flex-col relative'>
			{/* Header */}
			<div className='flex items-center justify-between mb-4 relative'>
				<h2 className='text-xs tracking-widest text-gray-300'>EXPLORER</h2>
				<button onClick={() => onOpenSettings("shortcuts")} className='hover:text-gray-400' title='Settings'>
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

						{/* Tree */}
						<div className='flex flex-col space-y-1 mb-4'>
							{Array.from(filteredTree.children.values()).length === 0 ? (
								<p className='text-sm text-gray-400 p-2'>No files match current filters</p>
							) : (
								renderNode(filteredTree, 0)
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
				)}
			</div>

			{/* Actions */}
			{activeTab === "files" && (
				<>
					<div className='flex items-center gap-2'>
						<button
							onClick={onNewFile}
							className='bg-green-600 text-white px-2 py-1 rounded mb-2 hover:bg-green-500'
						>
							New File
						</button>
						<button
							onClick={() => createFolder("")}
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
			)}

			{/* Context menu */}
			{contextMenu && (
				<div
					onMouseLeave={closeContextMenu}
					style={{ left: contextMenu.x, top: contextMenu.y }}
					className='absolute z-50 bg-gray-900 border border-gray-700 rounded shadow p-2'
				>
					<div className='flex flex-col space-y-1 text-sm'>
						{contextMenu.type === "file" ? (
							<>
								<button
									onClick={() => {
										onSelectFile(contextMenu.fileNode.path);
										closeContextMenu();
									}}
									className='text-left px-2 py-1 hover:bg-gray-800 rounded'
								>
									Open
								</button>
								<button
									onClick={() => {
										setRenamingPath(contextMenu.fileNode.path);
										setRenameValue(contextMenu.fileNode.name);
										closeContextMenu();
									}}
									className='text-left px-2 py-1 hover:bg-gray-800 rounded'
								>
									Rename
								</button>
								<button
									onClick={() => {
										onDeleteFile(contextMenu.fileNode.path);
										closeContextMenu();
									}}
									className='text-left px-2 py-1 hover:bg-gray-800 rounded'
								>
									Delete
								</button>
								<div className='border-t border-gray-700 my-1' />
								<button
									onClick={() => {
										onDownloadFile(contextMenu.fileNode.path);
										closeContextMenu();
									}}
									className='text-left px-2 py-1 hover:bg-gray-800 rounded'
								>
									Download
								</button>
								<div className='border-t border-gray-700 my-1' />
								<button
									onClick={() => {
										if (onGitStage) onGitStage(contextMenu.fileNode.path);
										closeContextMenu();
									}}
									className='text-left px-2 py-1 hover:bg-gray-800 rounded'
								>
									Stage (Git)
								</button>
								<button
									onClick={() => {
										if (onGitCommit) onGitCommit(contextMenu.fileNode.path);
										closeContextMenu();
									}}
									className='text-left px-2 py-1 hover:bg-gray-800 rounded'
								>
									Commit (Git)
								</button>
								<button
									onClick={() => {
										if (onGitRevert) onGitRevert(contextMenu.fileNode.path);
										closeContextMenu();
									}}
									className='text-left px-2 py-1 hover:bg-gray-800 rounded'
								>
									Revert Git
								</button>
							</>
						) : (
							// Folder menu
							<>
								<button
									onClick={() => {
										if (onNewFileInFolder) {
											onNewFileInFolder(contextMenu.folderPath);
										} else {
											const base = prompt("New file name (e.g. index.js):", "untitled.txt");
											if (base) {
												const full = `${contextMenu.folderPath.replace(/\/$/, "")}/${base}`;
												alert(
													`Create a new file named:\n${full}\n\nTip: Use "New File" and type the full path.`
												);
											}
										}
										closeContextMenu();
									}}
									className='text-left px-2 py-1 hover:bg-gray-800 rounded'
								>
									New File
								</button>
								<button
									onClick={() => {
										createFolder(contextMenu.folderPath);
										closeContextMenu();
									}}
									className='text-left px-2 py-1 hover:bg-gray-800 rounded'
								>
									New Folder
								</button>
								<button
									onClick={() => {
										setRenamingPath(contextMenu.folderPath);
										setRenameValue(contextMenu.folderPath.split("/").pop());
										closeContextMenu();
									}}
									className='text-left px-2 py-1 hover:bg-gray-800 rounded'
								>
									Rename Folder
								</button>
								<button
									onClick={() => {
										deleteFolder(contextMenu.folderPath);
										closeContextMenu();
									}}
									className='text-left px-2 py-1 hover:bg-gray-800 rounded'
								>
									Delete Folder
								</button>
							</>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
