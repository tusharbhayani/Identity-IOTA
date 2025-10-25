import { Container, Flex, Heading, Text } from "@radix-ui/themes";
import { OwnedObjects } from "./OwnedObjects";
import { useAccount } from "./hooks/useAccount";

export function WalletStatus() {
  const account = useAccount();

  return (
    <Container my="2">
      <Heading mb="2">Wallet Status</Heading>

      {account ? (
        <Flex direction="column">
          <Text>Wallet connected</Text>
          <Text>Address: {account.address}</Text>
        </Flex>
      ) : (
        <Text>Wallet not connected</Text>
      )}
      <OwnedObjects />
    </Container>
  );
}
