import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClientQuery,
} from "@mysten/dapp-kit";
import { bcs, fromHex, toHex } from "@mysten/bcs";
import { Transaction } from "@mysten/sui/transactions";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, Plus, Send, Loader, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { isValidSuiAddress } from "@mysten/sui/utils";
import { SuiObjectData } from "@mysten/sui/client";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

// Replace with your package ID and module name
const PACKAGE_ID =
  "0x46b2d91969993c9897869a0039e9a06fb6372a8434f35c910cabbe107d7efcaf";
const MODULE_NAME = "nft";

function getNFTFields(data: SuiObjectData | null | undefined) {
  if (!data || data?.content?.dataType !== "moveObject") {
    return null;
  }

  return data.content.fields as {
    name: string;
    description: string;
    url: string;
    creator: string;
  };
}

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const [error, setError] = React.useState<string | null>(null);
  const [mintFields, setMintFields] = React.useState({
    name: "",
    description: "",
    url: "",
  });
  const [transferAddress, setTransferAddress] = React.useState("");
  const [selectedNFT, setSelectedNFT] = React.useState<
    SuiObjectData | null | undefined
  >(null);
  const [isTransferValid, setIsTransferValid] = React.useState(false);
  const queryClient = useQueryClient();

  const currentAccount = useCurrentAccount();
  const {
    mutate: signAndExecute,
    status: txStatus,
    isPending: waitingForTxn,
  } = useSignAndExecuteTransaction();
  const {
    data,
    isPending,
    error: ownedObjectsError,
    refetch,
  } = useSuiClientQuery("getOwnedObjects", {
    owner: currentAccount?.address!,
    filter: {
      StructType: `${PACKAGE_ID}::${MODULE_NAME}::NFT`,
    },
    options: {
      showContent: true,
    },
  });

  // Mint new NFT
  const mintNFT = async () => {
    if (!currentAccount) return;

    const tx = new Transaction();

    tx.moveCall({
      target: `${PACKAGE_ID}::${MODULE_NAME}::mint`,
      arguments: [
        bcs.string().serialize(mintFields.name),
        bcs.string().serialize(mintFields.description),
        bcs.string().serialize(mintFields.url),
      ],
    });

    signAndExecute(
      {
        transaction: tx,
      },
      {
        onSuccess: async () => {
          queryClient.invalidateQueries();
          setMintFields({ name: "", description: "", url: "" });
        },
        onError(error) {
          setError("Failed to mint NFT: " + error.message);
        },
      }
    );
  };

  // Transfer NFT
  const transferNFT = async () => {
    if (!currentAccount || !selectedNFT || !transferAddress || !isTransferValid)
      return;

    const tx = new Transaction();

    const Address = bcs.bytes(32).transform({
      input: (val: string) => fromHex(val),
      output: (val) => toHex(val),
    });

    tx.moveCall({
      target: `${PACKAGE_ID}::${MODULE_NAME}::transfer`,
      arguments: [
        tx.object(selectedNFT.objectId),
        Address.serialize(transferAddress),
      ],
    });

    signAndExecute(
      {
        transaction: tx,
      },
      {
        onSuccess: async () => {
          queryClient.invalidateQueries();
          setSelectedNFT(null);
          setTransferAddress("");
          setIsTransferValid(false);
        },
        onError(error) {
          setError("Failed to transfer NFT: " + error.message);
        },
      }
    );
  };

  // Validate Sui address format
  React.useEffect(() => {
    setIsTransferValid(isValidSuiAddress(transferAddress));
  }, [transferAddress]);

  React.useEffect(() => {
    if (currentAccount?.address) {
      refetch();
    }
  }, [currentAccount?.address]);

  return (
    <main className="container mx-auto p-4 mb-8">
      {!currentAccount ? (
        <Card>
          <CardContent className="flex items-center justify-center p-6">
            <p className="text-gray-500">Connect your wallet to manage NFTs</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Mint NFT Form */}
          <Card>
            <CardHeader>
              <CardTitle>Mint New NFT</CardTitle>
              <CardDescription>
                Create a new NFT with custom metadata
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="NFT Name"
                value={mintFields.name}
                onChange={(e) =>
                  setMintFields({ ...mintFields, name: e.target.value })
                }
              />
              <Input
                placeholder="Description"
                value={mintFields.description}
                onChange={(e) =>
                  setMintFields({
                    ...mintFields,
                    description: e.target.value,
                  })
                }
              />
              <Input
                placeholder="URL"
                value={mintFields.url}
                onChange={(e) =>
                  setMintFields({ ...mintFields, url: e.target.value })
                }
              />
              {mintFields.url && (
                <div className="flex justify-center">
                  <img
                    src={mintFields.url || "/api/placeholder/200/200"}
                    alt={mintFields.name}
                    className="w-40 h-40 object-cover rounded-lg"
                  />
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button
                onClick={mintNFT}
                disabled={
                  waitingForTxn ||
                  isPending ||
                  !mintFields.name ||
                  !mintFields.description
                }
              >
                <Plus className="mr-2 h-4 w-4" />
                Mint NFT
              </Button>
            </CardFooter>
          </Card>

          {/* NFT Gallery */}
          <Card>
            <CardHeader>
              <CardTitle>Your NFTs</CardTitle>
              <CardDescription>
                View and manage your NFT collection
              </CardDescription>
            </CardHeader>
            <CardContent>
              {waitingForTxn || isPending ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-4">
                        <div className="w-full h-40 bg-gray-200 rounded-lg mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : data?.data?.length === 0 ? (
                <div className="text-center p-4">No NFTs found</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data?.data?.map((nft) => {
                    const data = getNFTFields(nft?.data);

                    return (
                      <Card
                        key={nft?.data?.objectId}
                        className={`cursor-pointer hover:shadow-lg transition-shadow ${
                          selectedNFT?.objectId === nft?.data?.objectId
                            ? "ring-2 ring-primary"
                            : ""
                        }`}
                        onClick={() => setSelectedNFT(nft?.data)}
                      >
                        <CardContent className="p-4">
                          <img
                            src={data?.url || "/api/placeholder/200/200"}
                            alt={data?.name}
                            className="w-full h-40 object-cover rounded-lg mb-2"
                          />
                          <h3 className="font-semibold">{data?.name}</h3>
                          <p className="text-sm text-gray-500">
                            {data?.description}
                          </p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button
                onClick={() => refetch()}
                disabled={waitingForTxn || isPending}
              >
                <Loader2
                  className={cn("mr-2 h-4 w-4", {
                    "animate-spin": isPending,
                  })}
                />
                Refresh
              </Button>
            </CardFooter>
          </Card>

          {/* Transfer NFT */}
          {selectedNFT && (
            <Card>
              <CardHeader>
                <CardTitle>Transfer NFT</CardTitle>
                <CardDescription>
                  Send {getNFTFields(selectedNFT)?.name} to another address
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Recipient Address"
                  value={transferAddress}
                  onChange={(e) => setTransferAddress(e.target.value)}
                />
                {!isTransferValid && (
                  <div className="text-red-500 text-sm">
                    Please enter a valid Sui address
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  onClick={transferNFT}
                  disabled={
                    waitingForTxn ||
                    isPending ||
                    !transferAddress ||
                    !isTransferValid
                  }
                >
                  <Send className="mr-2 h-4 w-4" />
                  Transfer NFT
                </Button>
              </CardFooter>
            </Card>
          )}

          {/* Error and Transaction Status Display */}
          {error ||
            (ownedObjectsError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  {error || ownedObjectsError.message}
                </AlertDescription>
              </Alert>
            ))}

          {txStatus === "pending" && (
            <Alert variant="default">
              <Loader className="mr-2 h-4 w-4 animate-spin" />
              <AlertDescription>Transaction in progress...</AlertDescription>
            </Alert>
          )}
          {/* {txStatus === "success" && (
          <Alert variant="default">
            <AlertDescription>Transaction successful!</AlertDescription>
          </Alert>
        )} */}
          {txStatus === "error" && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Transaction Error</AlertTitle>
              <AlertDescription>
                An error occurred during the transaction.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </main>
  );
}
