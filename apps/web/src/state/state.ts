import { atom } from "jotai";

import type { Client } from "../services/clients/client.types";

// Client state atom
export const clientState = atom<Client | null>(null);
