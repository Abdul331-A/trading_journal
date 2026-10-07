import { createContext, useContext } from 'react';

interface Ctx { open: (tradeId?: string) => void }
const C = createContext<Ctx>({ open: () => undefined });

export const TradeModalProvider = C.Provider;
export const useTradeModal = () => useContext(C);
