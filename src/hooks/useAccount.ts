import { useState, useEffect } from "react";
import { initIdentity } from "../util";

export interface Account {
  isConnected: boolean;
  address: string | null;
}

export function useAccount(): Account {
  const [account, setAccount] = useState<Account>({
    isConnected: false,
    address: null,
  });

  useEffect(() => {
    let mounted = true;

    const checkConnection = async () => {
      try {
        await initIdentity();
        if (mounted) {
          setAccount({
            isConnected: true,
            address: "iota1...", // Placeholder until we implement actual DID
          });
        }
      } catch (error) {
        console.error("Failed to initialize identity:", error);
        if (mounted) {
          setAccount({
            isConnected: false,
            address: null,
          });
        }
      }
    };

    checkConnection();
    return () => {
      mounted = false;
    };
  }, []);

  return account;
}
