export interface GitHubUserProfile {
    id: string;
    login: string;
    email: string;
    name: string | null;
    avatarUrl: string | null;
}

export function getGitHubAuthorizeUrl(clientId: string, redirectUri?: string, state?: string): string {
    const params = new URLSearchParams({
        client_id: clientId,
        scope: 'read:user user:email',
    });
    if (redirectUri) {
        params.set('redirect_uri', redirectUri);
    }
    if (state) {
        params.set('state', state);
    }
    return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

export async function exchangeGitHubCode(params: {
    clientId: string;
    clientSecret: string;
    code: string;
    redirectUri?: string;
}): Promise<string> {
    const bodyData: Record<string, string> = {
        client_id: params.clientId,
        client_secret: params.clientSecret,
        code: params.code,
    };
    if (params.redirectUri) {
        bodyData.redirect_uri = params.redirectUri;
    }

    const res = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
        body: JSON.stringify(bodyData),
    });

    if (!res.ok) {
        throw new Error(`Khong the doi code lay token tu GitHub (${res.status})`);
    }

    const data = (await res.json()) as { access_token?: string; error_description?: string };
    if (!data.access_token) {
        throw new Error(data.error_description || 'Khong nhan duoc access_token tu GitHub');
    }

    return data.access_token;
}

export async function fetchGitHubUserProfile(accessToken: string): Promise<GitHubUserProfile> {
    const headers = {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'AI-Tech-Radar',
    };

    const userRes = await fetch('https://api.github.com/user', { headers });
    if (!userRes.ok) {
        throw new Error(`Khong the lay thong tin user tu GitHub (${userRes.status})`);
    }

    const userData = (await userRes.json()) as {
        id: number | string;
        login: string;
        name?: string | null;
        email?: string | null;
        avatar_url?: string | null;
    };

    let primaryEmail = userData.email;
    if (!primaryEmail) {
        const emailsRes = await fetch('https://api.github.com/user/emails', { headers });
        if (emailsRes.ok) {
            const emails = (await emailsRes.json()) as Array<{
                email: string;
                primary: boolean;
                verified: boolean;
            }>;
            const primary = emails.find((e) => e.primary && e.verified) ?? emails[0];
            if (primary) {
                primaryEmail = primary.email;
            }
        }
    }

    if (!primaryEmail) {
        primaryEmail = `${userData.login}@users.noreply.github.com`;
    }

    return {
        id: String(userData.id),
        login: userData.login,
        name: userData.name ?? userData.login,
        email: primaryEmail,
        avatarUrl: userData.avatar_url ?? null,
    };
}
