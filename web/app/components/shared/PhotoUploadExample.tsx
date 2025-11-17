import { useState } from "react";
import { PhotoUpload } from "./PhotoUpload";
import { PhotoUploadAdvanced } from "./PhotoUploadAdvanced";
import { MultiPhotoUpload } from "./MultiPhotoUpload";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export function PhotoUploadExample() {
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);

  const handleUpload = (url: string) => {
    setUploadedUrls(prev => [...prev, url]);
    toast.success("Photo uploaded successfully!");
  };

  const handleMultiUpload = (urls: string[]) => {
    setUploadedUrls(prev => [...prev, ...urls]);
    toast.success(`${urls.length} photos uploaded successfully!`);
  };

  const handleError = (error: string) => {
    toast.error(error);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Photo Upload Components</h1>
        <p className="text-muted-foreground">
          Production-ready photo upload components with Supabase integration
        </p>
      </div>

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">Basic Upload</TabsTrigger>
          <TabsTrigger value="advanced">Advanced Upload</TabsTrigger>
          <TabsTrigger value="multi">Multi Upload</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Basic Photo Upload</CardTitle>
              <CardDescription>
                Simple drag & drop photo upload with preview
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PhotoUpload
                onUpload={handleUpload}
                onError={handleError}
                maxSize={5}
                bucket="clothing-images"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Photo Upload</CardTitle>
              <CardDescription>
                Enhanced upload with progress tracking and auto-upload option
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Manual Upload</h4>
                <PhotoUploadAdvanced
                  onUpload={handleUpload}
                  onError={handleError}
                  maxSize={5}
                  bucket="clothing-images"
                  showProgress={true}
                  autoUpload={false}
                />
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Auto Upload</h4>
                <PhotoUploadAdvanced
                  onUpload={handleUpload}
                  onError={handleError}
                  maxSize={5}
                  bucket="clothing-images"
                  showProgress={true}
                  autoUpload={true}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="multi" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Multi Photo Upload</CardTitle>
              <CardDescription>
                Upload multiple photos at once with batch processing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MultiPhotoUpload
                onUpload={handleMultiUpload}
                onError={handleError}
                maxFiles={5}
                maxSize={5}
                bucket="clothing-images"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Uploaded Photos Display */}
      {uploadedUrls.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Photos ({uploadedUrls.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {uploadedUrls.map((url, index) => (
                <div key={index} className="aspect-square rounded-lg overflow-hidden">
                  <img
                    src={url}
                    alt={`Uploaded ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}