import React, { useState, useEffect } from "react";
import { Terminal, FileText, CheckCircle, AlertCircle, Code } from "lucide-react";

export default function StatusBar({ activeFileName, saved, terminalVisible, onToggleTerminal }) {
	const [time, setTime] = useState("");

	useEffect(() => {
		const updateTime = () => {
			const now = new Date();
			setTime(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
		};
		updateTime();
		const interval = setInterval(updateTime, 60000);
		return () => clearInterval(interval);
	}, []);

	// دالة لتحديد اللغة من الامتداد
	const getLanguage = fileName => {
		if (!fileName) return "Plain Text";
		const ext = fileName.split(".").pop();
		switch (ext) {
			case "js":
				return "JavaScript";
			case "jsx":
				return "React (JSX)";
			case "ts":
				return "TypeScript";
			case "tsx":
				return "React (TSX)";
			case "py":
				return "Python";
			case "java":
				return "Java";
			case "cpp":
				return "C++";
			case "c":
				return "C";
			case "html":
				return "HTML";
			case "css":
				return "CSS";
			case "json":
				return "JSON";
			case "md":
				return "Markdown";
			default:
				return "Plain Text";
		}
	};

	return (
		<div className='w-full h-6 bg-gray-900 text-gray-200 text-xs flex items-center justify-between px-3 border-t border-gray-700'>
			{/* Left side */}
			<div className='flex items-center space-x-4'>
				<div className='flex items-center space-x-1'>
					<FileText className='w-3 h-3' />
					<span>{activeFileName || "No File"}</span>
				</div>
				<div className='flex items-center space-x-1'>
					<Code className='w-3 h-3' />
					<span>{getLanguage(activeFileName)}</span>
				</div>
				<div className='flex items-center space-x-1'>
					{saved ? (
						<CheckCircle className='w-3 h-3 text-green-400' />
					) : (
						<AlertCircle className='w-3 h-3 text-yellow-400' />
					)}
					<span className={saved ? "text-green-400" : "text-yellow-400"}>{saved ? "Saved" : "Unsaved"}</span>
				</div>
			</div>

			{/* Right side */}
			<div className='flex items-center space-x-4'>
				<button onClick={onToggleTerminal} className='flex items-center space-x-1 hover:text-white'>
					<Terminal className='w-3 h-3' />
					<span>{terminalVisible ? "Hide Terminal" : "Show Terminal"}</span>
				</button>
				<span>{time}</span>
			</div>
		</div>
	);
}
