import { createFileRoute } from "@tanstack/react-router";
import { useState, FormEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Copy } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export const Route = createFileRoute("/upload")({
  component: Upload,
});

interface BlobUploadInfo {
  status: string;
  blobId: string;
  endEpoch: number;
  suiRefType: string;
  suiRef: string;
  suiBaseUrl: string;

  blobUrl?: string;
  suiUrl?: string;
  isImage?: boolean;
}

function Upload() {
  const [publisherUrl, setPublisherUrl] = useState(
    "https://publisher.walrus-testnet.walrus.space"
  );
  const [aggregatorUrl, setAggregatorUrl] = useState(
    "https://aggregator.walrus-testnet.walrus.space"
  );
  const [file, setFile] = useState<File | null>(null);
  const [epochs, setEpochs] = useState(1);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadInfo, setUploadInfo] = useState<BlobUploadInfo | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsUploading(true);

    try {
      const storageInfo = await storeBlob(file!, epochs, publisherUrl);
      displayUpload(storageInfo.info, storageInfo.media_type);

      setErrorMessage(null);
    } catch (error) {
      console.error(error);
      setErrorMessage(
        "An error occurred while uploading. Check the browser console and ensure that the aggregator and publisher URLs are correct."
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);

    toast({
      title: "Copied to clipboard",
      description: text,
      variant: "default",
    });
  };

  async function storeBlob(
    inputFile: File,
    numEpochs: number,
    basePublisherUrl: string
  ): Promise<{ info: BlobUploadInfo; media_type: string }> {
    const response = await fetch(
      `${basePublisherUrl}/v1/store?epochs=${numEpochs}`,
      {
        method: "PUT",
        body: inputFile,
      }
    );

    if (response.status === 200) {
      const info = await response.json();
      return { info: parseStorageInfo(info), media_type: inputFile.type };
    } else {
      throw new Error("Something went wrong when storing the blob!");
    }
  }

  function parseStorageInfo(storageInfo: any): BlobUploadInfo {
    if ("alreadyCertified" in storageInfo) {
      return {
        status: "Already certified",
        blobId: storageInfo.alreadyCertified.blobId,
        endEpoch: storageInfo.alreadyCertified.endEpoch,
        suiRefType: "Previous Sui Certified Event",
        suiRef: storageInfo.alreadyCertified.event.txDigest,
        suiBaseUrl: `https://suiscan.xyz/testnet/tx`,
      };
    } else if ("newlyCreated" in storageInfo) {
      return {
        status: "Newly created",
        blobId: storageInfo.newlyCreated.blobObject.blobId,
        endEpoch: storageInfo.newlyCreated.blobObject.storage.endEpoch,
        suiRefType: "Associated Sui Object",
        suiRef: storageInfo.newlyCreated.blobObject.id,
        suiBaseUrl: `https://suiscan.xyz/testnet/object`,
      };
    } else {
      throw Error("Unhandled successful response!");
    }
  }

  function displayUpload(storageInfo: BlobUploadInfo, mediaType: string) {
    const blobUrl = `${aggregatorUrl}/v1/${storageInfo.blobId}`;
    const suiUrl = `${storageInfo.suiBaseUrl}/${storageInfo.suiRef}`;
    const isImage = mediaType.startsWith("image");
    console.log("🚀 ~ displayUpload ~ mediaType:", mediaType);

    console.log("🚀 ~ displayUpload ~ :", {
      ...storageInfo,
      blobUrl,
      suiUrl,
      isImage,
    });

    setUploadInfo({
      ...storageInfo,
      blobUrl,
      suiUrl,
      isImage,
    });
  }

  return (
    <div className="container mx-auto p-4 mb-8">
      <Card>
        <CardHeader>
          <CardTitle>Walrus Uploader</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="mb-4">
                <Label htmlFor="email">Walrus Publisher URL</Label>
                <Input
                  id="publisher-url-input"
                  placeholder="Walrus Publisher URL"
                  value={publisherUrl}
                  onChange={(e) => setPublisherUrl(e.target.value)}
                  required
                />
              </div>
              <div className="mb-4">
                <Label htmlFor="email">Walrus Aggregator URL</Label>

                <Input
                  id="aggregator-url-input"
                  placeholder="Walrus Aggregator URL"
                  value={aggregatorUrl}
                  onChange={(e) => setAggregatorUrl(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <Label htmlFor="email">
                Blob to upload (Max 10 MiB size on the default publisher)
              </Label>

              <Input
                id="file-input"
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                required
              />
            </div>

            <div className="mb-4">
              <Label htmlFor="email">Epochs</Label>
              <Input
                id="epochs-input"
                type="number"
                min={1}
                value={epochs}
                onChange={(e) => setEpochs(Number(e.target.value))}
                required
              />
              <p className="text-sm text-muted">
                The number of Walrus epochs for which to store the blob.
              </p>
            </div>

            <Button type="submit" variant="default" disabled={isUploading}>
              {isUploading ? <Loader2 className={`mr-2 animate-spin`} /> : null}
              Upload
            </Button>
          </form>

          {errorMessage && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          {uploadInfo && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Uploaded Blob</CardTitle>
              </CardHeader>
              <CardContent>
                {uploadInfo.isImage ? (
                  <object
                    type={file?.type}
                    data={uploadInfo.blobUrl}
                    className="w-48 h-48 object-cover"
                  />
                ) : (
                  <p>Blob type: {file?.type}</p>
                )}
                <dl className="grid grid-cols-2 gap-2">
                  <dt>Status</dt>
                  <dd>{uploadInfo.status}</dd>
                  <dt>Blob ID</dt>
                  <dd>
                    <a
                      className="truncate"
                      href={uploadInfo.blobUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {uploadInfo.blobId}
                    </a>
                    <Button
                      variant="ghost"
                      className="ml-2"
                      onClick={() => handleCopy(uploadInfo.blobUrl!)}
                    >
                      <Copy
                        className={`h-4 w-4 ${
                          copiedText === uploadInfo.blobUrl
                            ? "text-green-500"
                            : ""
                        }`}
                      />
                    </Button>
                  </dd>
                  <dt>{uploadInfo.suiRefType}</dt>
                  <dd>
                    <a
                      className="truncate"
                      href={uploadInfo.suiUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {uploadInfo.suiRef}
                    </a>
                    <Button
                      variant="ghost"
                      className="ml-2"
                      onClick={() => handleCopy(uploadInfo.suiUrl!)}
                    >
                      <Copy
                        className={`h-4 w-4 ${
                          copiedText === uploadInfo.suiUrl
                            ? "text-green-500"
                            : ""
                        }`}
                      />
                    </Button>
                  </dd>
                  <dt>Stored until epoch</dt>
                  <dd>{uploadInfo.endEpoch}</dd>
                </dl>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
