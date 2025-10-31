//! # Tauri Command Methods
//!
//! This module contains all the Tauri command methods that bridge the Symphony core
//! functionality with the desktop application frontend. These methods provide the
//! interface between the Tauri webview and the Symphony backend.

use sveditor_core::RPCResult;
use sveditor_core_api::filesystems::{DirItemInfo, FileInfo};
use sveditor_core_api::language_servers::LanguageServerBuilderInfo;
use sveditor_core_api::states::StateData;
use sveditor_core_api::terminal_shells::TerminalShellBuilderInfo;
use sveditor_core_api::{Errors, ManifestInfo};

use crate::TauriState;

/// Retrieves an editor state by its ID.
///
/// # Arguments
///
/// * `state_id` - The unique identifier of the editor state
/// * `token` - Authentication token for the request
/// * `tauri_state` - The Tauri application state containing the RPC client
///
/// # Returns
///
/// Returns the state data if found, or an error if the state doesn't exist or access is denied.
#[tauri::command(async)]
pub async fn get_state_by_id(
	state_id: u8,
	token: String,
	tauri_state: tauri::State<'_, TauriState>,
) -> RPCResult<Result<Option<StateData>, Errors>> {
	let res = tauri_state.client.get_state_by_id(state_id, token.clone());
	Ok(res.await.unwrap())
}

/// Lists the contents of a directory.
///
/// # Arguments
///
/// * `path` - The directory path to list
/// * `filesystem_name` - The name of the filesystem to use (e.g., "local")
/// * `state_id` - The ID of the editor state
/// * `token` - Authentication token for the request
/// * `tauri_state` - The Tauri application state containing the RPC client
///
/// # Returns
///
/// Returns a vector of directory items or an error if the operation fails.
#[tauri::command(async)]
pub async fn list_dir_by_path(
	path: String,
	filesystem_name: String,
	state_id: u8,
	token: String,
	tauri_state: tauri::State<'_, TauriState>,
) -> RPCResult<Result<Vec<DirItemInfo>, Errors>> {
	let res = tauri_state.client.list_dir_by_path(path, filesystem_name, state_id, token);
	Ok(res.await.unwrap())
}

/// Reads the contents of a file.
///
/// # Arguments
///
/// * `path` - The file path to read
/// * `filesystem_name` - The name of the filesystem to use (e.g., "local")
/// * `state_id` - The ID of the editor state
/// * `token` - Authentication token for the request
/// * `tauri_state` - The Tauri application state containing the RPC client
///
/// # Returns
///
/// Returns the file information and contents or an error if the operation fails.
#[tauri::command(async)]
pub async fn read_file_by_path(
	path: String,
	filesystem_name: String,
	state_id: u8,
	token: String,
	tauri_state: tauri::State<'_, TauriState>,
) -> RPCResult<Result<FileInfo, Errors>> {
	let res = tauri_state.client.read_file_by_path(path, filesystem_name, state_id, token);
	Ok(res.await.unwrap())
}

/// Writes content to a file.
///
/// # Arguments
///
/// * `path` - The file path to write to
/// * `content` - The content to write to the file
/// * `filesystem_name` - The name of the filesystem to use (e.g., "local")
/// * `state_id` - The ID of the editor state
/// * `token` - Authentication token for the request
/// * `tauri_state` - The Tauri application state containing the RPC client
///
/// # Returns
///
/// Returns `Ok(())` on success or an error if the operation fails.
#[tauri::command(async)]
pub async fn write_file_by_path(
	path: String,
	content: String,
	filesystem_name: String,
	state_id: u8,
	token: String,
	tauri_state: tauri::State<'_, TauriState>,
) -> RPCResult<Result<(), Errors>> {
	let res =
		tauri_state
			.client
			.write_file_by_path(path, content, filesystem_name, state_id, token);
	Ok(res.await.unwrap())
}

#[tauri::command(async)]
pub async fn set_state_by_id(
	state_id: u8,
	state_data: StateData,
	token: String,
	tauri_state: tauri::State<'_, TauriState>,
) -> RPCResult<Result<(), Errors>> {
	let res = tauri_state.client.set_state_by_id(state_id, state_data, token);
	Ok(res.await.unwrap())
}

#[tauri::command(async)]
pub async fn get_ext_info_by_id(
	extension_id: String,
	state_id: u8,
	token: String,
	tauri_state: tauri::State<'_, TauriState>,
) -> RPCResult<Result<ManifestInfo, Errors>> {
	let res = tauri_state.client.get_ext_info_by_id(extension_id, state_id, token);
	Ok(res.await.unwrap())
}

#[tauri::command(async)]
pub async fn get_ext_list(
	state_id: u8,
	token: String,
	tauri_state: tauri::State<'_, TauriState>,
) -> RPCResult<Result<Vec<String>, Errors>> {
	let res = tauri_state.client.get_ext_list(state_id, token);
	Ok(res.await.unwrap())
}

#[tauri::command(async)]
pub async fn get_all_language_server_builders(
	state_id: u8,
	token: String,
	tauri_state: tauri::State<'_, TauriState>,
) -> RPCResult<Result<Vec<LanguageServerBuilderInfo>, Errors>> {
	let res = tauri_state.client.get_all_language_server_builders(state_id, token);
	Ok(res.await.unwrap())
}

#[tauri::command(async)]
pub async fn write_to_terminal_shell(
	state_id: u8,
	token: String,
	tauri_state: tauri::State<'_, TauriState>,
	terminal_shell_id: String,
	data: String,
) -> RPCResult<Result<(), Errors>> {
	let res = tauri_state
		.client
		.write_to_terminal_shell(state_id, token, terminal_shell_id, data);
	Ok(res.await.unwrap())
}

/// Creates a new terminal shell instance.
///
/// # Arguments
///
/// * `state_id` - The ID of the editor state
/// * `token` - Authentication token for the request
/// * `tauri_state` - The Tauri application state containing the RPC client
/// * `terminal_shell_builder_id` - The ID of the terminal shell builder to use
/// * `terminal_shell_id` - The unique ID for the new terminal shell instance
///
/// # Returns
///
/// Returns `Ok(())` on success or an error if the operation fails.
#[tauri::command(async)]
pub async fn create_terminal_shell(
	state_id: u8,
	token: String,
	tauri_state: tauri::State<'_, TauriState>,
	terminal_shell_builder_id: String,
	terminal_shell_id: String,
) -> RPCResult<Result<(), Errors>> {
	let res = tauri_state.client.create_terminal_shell(
		state_id,
		token,
		terminal_shell_builder_id,
		terminal_shell_id,
	);
	Ok(res.await.unwrap())
}

#[tauri::command(async)]
pub async fn close_terminal_shell(
	state_id: u8,
	token: String,
	tauri_state: tauri::State<'_, TauriState>,
	terminal_shell_id: String,
) -> RPCResult<Result<(), Errors>> {
	let res = tauri_state.client.close_terminal_shell(state_id, token, terminal_shell_id);
	Ok(res.await.unwrap())
}

#[tauri::command(async)]
pub async fn get_terminal_shell_builders(
	state_id: u8,
	token: String,
	tauri_state: tauri::State<'_, TauriState>,
) -> RPCResult<Result<Vec<TerminalShellBuilderInfo>, Errors>> {
	let res = tauri_state.client.get_terminal_shell_builders(state_id, token);
	Ok(res.await.unwrap())
}

#[tauri::command(async)]
pub async fn resize_terminal_shell(
	state_id: u8,
	token: String,
	tauri_state: tauri::State<'_, TauriState>,
	terminal_shell_id: String,
	cols: i32,
	rows: i32,
) -> RPCResult<Result<(), Errors>> {
	let res =
		tauri_state
			.client
			.resize_terminal_shell(state_id, token, terminal_shell_id, cols, rows);
	Ok(res.await.unwrap())
}

#[tauri::command(async)]
pub async fn create_language_server(
	state_id: u8,
	token: String,
	tauri_state: tauri::State<'_, TauriState>,
	language_server_builder_id: String,
) -> RPCResult<Result<(), Errors>> {
	let res =
		tauri_state
			.client
			.create_language_server(state_id, token, language_server_builder_id);
	Ok(res.await.unwrap())
}

#[tauri::command(async)]
pub async fn write_to_language_server(
	state_id: u8,
	token: String,
	tauri_state: tauri::State<'_, TauriState>,
	language_server_id: String,
	data: String,
) -> RPCResult<Result<(), Errors>> {
	let res =
		tauri_state
			.client
			.write_to_language_server(state_id, token, language_server_id, data);
	Ok(res.await.unwrap())
}
