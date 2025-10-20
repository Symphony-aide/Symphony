// @symphony/features - Main exports
// All features following the [Page, Feature, Component] pattern

// FileManagement Feature
export {
	FileManagementFeature,
	useFileManagement,
	useFileState,
	useFileOperations,
	FileCreateCommand,
	FileDeleteCommand,
	FileRenameCommand,
	FileContentUpdateCommand,
} from "./FileManagement";

// Settings Feature
export {
	SettingsFeature,
	useSettingsFeature,
	useSettings,
} from "./Settings";

// AutoSave Feature
export {
	AutoSaveFeature,
	useAutoSave,
} from "./AutoSave";

// FolderManagement Feature
export {
	FolderManagementFeature,
	useFolderManagement,
	useFolderState,
	useFolderOperations,
} from "./FolderManagement";

// FileTree Feature
export {
	FileTreeFeature,
	useFileTree,
	useTreeBuilder,
	useTreeFilter,
	useTreeSort,
	getFileStatus,
	getStatusBadge,
	getStatusColor,
} from "./FileTree";

// FileSearch Feature
export {
	FileSearchFeature,
	useFileSearch,
} from "./FileSearch";

// CommandHistory Feature
export {
	CommandHistoryFeature,
	useCommandHistory,
	useUndoRedo,
	useUndoRedoShortcuts,
	CommandStack,
} from "./CommandHistory";

// OutlineTree Feature
export {
	OutlineTreeFeature,
	useOutlineTree,
	useOutlineParser,
	useOutlineFilter,
	parseCode,
	SYMBOL_TYPES,
	SYMBOL_ICONS,
	SYMBOL_COLORS,
	getSymbolIcon,
	getSymbolColor,
	getSymbolDisplayName,
} from "./OutlineTree";

// CodeNavigation Feature
export {
	CodeNavigationFeature,
	useCodeNavigation,
} from "./CodeNavigation";

// SettingsValidation Feature
export {
	SettingsValidationFeature,
	useSettingsValidation,
	validateValue,
	createSchema,
	validators,
	commonSchemas,
} from "./SettingsValidation";

// StatusInfo Feature
export {
	StatusInfoFeature,
	useStatusInfo,
} from "./StatusInfo";

// TimeTracking Feature
export {
	TimeTrackingFeature,
	useTimeTracking,
} from "./TimeTracking";

// LanguageDetection Feature
export {
	LanguageDetectionFeature,
	useLanguageDetection,
} from "./LanguageDetection";

// SyntaxTokenization Feature
export {
	SyntaxTokenizationFeature,
	useSyntaxTokenization,
} from "./SyntaxTokenization";

// ThemeManagement Feature
export {
	ThemeManagementFeature,
	useThemeManagement,
} from "./ThemeManagement";

// TerminalSession Feature
export {
	TerminalSessionFeature,
	useTerminalSession,
} from "./TerminalSession";

// CommandExecution Feature
export {
	CommandExecutionFeature,
	useCommandExecution,
} from "./CommandExecution";

// InputHandling Feature
export {
	InputHandlingFeature,
	useInputHandling,
} from "./InputHandling";

// Shared utilities
export { storageService } from "./FileManagement/services/storageService";
