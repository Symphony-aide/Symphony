import { BaseMessage } from "../../services/clients/client.types";

// Define a simplified StateData interface since the original is missing
export interface StateData {
  id: number;

  [key: string]: unknown;
}

export interface ShowPopup extends BaseMessage {
  popup_id: string;
  title: string;
  content: string;
}

export interface StateUpdated {
  state_data: StateData;
}
