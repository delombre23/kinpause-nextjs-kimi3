import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function getOAuthUrl() {
  const kimiAuthUrl = import.meta.env.VITE_KIMI_AUTH_URL;
  const appID = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${kimiAuthUrl}/api/oauth/authorize`);
  url.searchParams.set("client_id", appID);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "profile");
  url.searchParams.set("state", state);

  return url.toString();
}

export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#121212]">
      <Card className="w-full max-w-sm border-white/15 bg-[#1A1A1A] text-white">
        <CardHeader className="text-center">
          <CardTitle className="font-display">Espace hôtelier KinPause</CardTitle>
          <p className="text-sm text-white/50">
            Connectez-vous pour gérer votre établissement.
          </p>
        </CardHeader>
        <CardContent>
          <Button
            className="w-full bg-white font-bold text-[#121212] hover:bg-white/90"
            size="lg"
            onClick={() => {
              window.location.href = getOAuthUrl();
            }}
          >
            Se connecter avec Kimi
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
