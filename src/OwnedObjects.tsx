import { Flex, Heading, Text } from "@radix-ui/themes";
import { useAccount } from "./hooks/useAccount";
import { useState, useEffect } from "react";

interface OwnedObject {
  objectId: string;
  type: string;
}

interface OwnedObjectsData {
  data: OwnedObject[];
}

export function OwnedObjects() {
  const account = useAccount();
  const [data, setData] = useState<OwnedObjectsData | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchObjects = async () => {
      if (account?.isConnected && account?.address) {
        setIsPending(true);
        try {
          // TODO: Implement actual object fetching using IOTA SDK
          // For now, just simulate some data
          await new Promise(resolve => setTimeout(resolve, 1000));
          if (mounted) {
            setData({
              data: [
                { objectId: '1', type: 'DID Document' },
                { objectId: '2', type: 'Verifiable Credential' }
              ]
            });
          }
        } catch (err) {
          if (mounted) {
            setError(err instanceof Error ? err : new Error('Failed to fetch objects'));
          }
        } finally {
          if (mounted) {
            setIsPending(false);
          }
        }
      }
    };

    fetchObjects();
    return () => {
      mounted = false;
    };
  }, [account]);

  useEffect(() => {
    if (account?.isConnected && account?.address) {
      setIsPending(true);
      // TODO: Implement actual object fetching using IOTA SDK
      // For now, just simulate a delay
      setTimeout(() => {
        setData({ data: [] });
        setIsPending(false);
      }, 1000);
    }
  }, [account]);

  if (!account) {
    return;
  }

  if (error) {
    return <Flex>Error: {error.message}</Flex>;
  }

  if (isPending || !data) {
    return <Flex>Loading...</Flex>;
  }

  return (
    <Flex direction="column" my="2">
      {data.data.length === 0 ? (
        <Text>No objects owned by the connected wallet</Text>
      ) : (
        <Heading size="4">Objects owned by the connected wallet</Heading>
      )}
      {data.data.map((object) => (
        <Flex key={object.objectId} direction="column" gap="1">
          <Text>Object ID: {object.objectId}</Text>
          <Text>Type: {object.type}</Text>
        </Flex>
      ))}
    </Flex>
  );
}
