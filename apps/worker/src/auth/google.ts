export interface GoogleUserProfile {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
}

export function getGoogleAuthorizeUrl(
  clientId: string,
  redirectUri: string,
  state?: string
): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "select_account",
  });
  if (state) {
    params.set("state", state);
  }
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeGoogleCode(params: {
  clientId: string;
  clientSecret: string;
  code: string;
  redirectUri: string;
}): Promise<string> {
  const bodyParams = new URLSearchParams({
    client_id: params.clientId,
    client_secret: params.clientSecret,
    code: params.code,
    grant_type: "authorization_code",
    redirect_uri: params.redirectUri,
  });

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: bodyParams.toString(),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Khong the doi code lay token tu Google (${res.status}): ${errorText}`);
  }

  const data = (await res.json()) as { access_token?: string; error_description?: string };
  if (!data.access_token) {
    throw new Error(data.error_description || "Khong nhan duoc access_token tu Google");
  }

  return data.access_token;
}

export async function fetchGoogleUserProfile(accessToken: string): Promise<GoogleUserProfile> {
  const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Khong the lay thong tin user tu Google (${res.status})`);
  }

  const userData = (await res.json()) as {
    sub: string;
    email: string;
    name?: string | null;
    picture?: string | null;
  };

  return {
    id: userData.sub,
    email: userData.email,
    name: userData.name ?? null,
    avatarUrl: userData.picture ?? null,
  };
}
