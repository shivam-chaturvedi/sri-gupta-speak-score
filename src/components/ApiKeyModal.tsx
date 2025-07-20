import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Zap } from "lucide-react";

interface ApiKeyModalProps {
  isOpen: boolean;
  onApiKeySet: (apiKey: string) => void;
  onClose: () => void;
}

export const ApiKeyModal = ({ isOpen, onApiKeySet, onClose }: ApiKeyModalProps) => {
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!apiKey.trim()) {
      setError("Please enter your API key");
      return;
    }
    
    if (!apiKey.startsWith("sk-")) {
      setError("Invalid API key format. OpenAI API keys start with 'sk-'");
      return;
    }

    onApiKeySet(apiKey.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-speech-card border-0 shadow-xl">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Zap className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">Enable AI Analysis</CardTitle>
          <p className="text-muted-foreground mt-2">
            To get real-time AI feedback on your speeches, please provide your OpenAI API key.
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">OpenAI API Key</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                type="password"
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setError("");
                }}
                className="pl-10"
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>

          <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
            <p className="font-medium mb-1">Your API key is safe:</p>
            <ul className="space-y-1">
              <li>• Stored locally in your browser</li>
              <li>• Never sent to our servers</li>
              <li>• Only used for OpenAI API calls</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSubmit} className="flex-1">
              Save & Continue
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Don't have an API key?{" "}
            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Get one from OpenAI
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};