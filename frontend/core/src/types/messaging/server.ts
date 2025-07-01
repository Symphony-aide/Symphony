import { BaseMessage } from "../../services/clients/client.types";

// Define a simplified StateData interface since the original is missing
export interface StateData {
  id: number;
  [key: string]: any;
}

export interface MessageFromExtension extends BaseMessage {
  state_id: number;
  extension_id: string;
  message: string;
}

export interface ShowPopup extends BaseMessage {
  popup_id: string;
  title: string;
  content: string;
}

export interface ShowStatusBarItem extends BaseMessage {
  id: string;
  label: string;
}

export interface HideStatusBarItem extends BaseMessage {
  id: string;
}

export interface StateUpdated {
  state_data: StateData;
}

export interface TerminalShellUpdated extends BaseMessage {
  terminal_shell_id: string;
  data: Uint8Array;
}

export interface RegisterCommand extends BaseMessage {
  name: string;
  id: string;
}

export interface UnloadedLanguageServer extends BaseMessage {
  id: string;
}
