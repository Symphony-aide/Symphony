import { atom } from "recoil";
import type { Client } from "../services/clients/client.types";

// Client state atom
export const clientState = atom<Client | null>({
  key: "clientState",
  default: null,
}); 