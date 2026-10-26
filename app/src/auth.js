import { createSigner, createVerifier } from 'fast-jwt';

export function createTokenService({ secret, expiresInMs, issuer }) {
  const sign = createSigner({
    key: secret,
    algorithm: 'HS256',
    expiresIn: expiresInMs,
    iss: issuer,
  });
  const verify = createVerifier({
    key: secret,
    algorithms: ['HS256'],
    allowedIss: issuer,
  });

  return {
    issue(user) {
      return sign({ sub: String(user.id), email: user.email });
    },
    verify(token) {
      return verify(token);
    },
  };
}

export function requireAuth(tokens) {
  return (req, res, next) => {
    const header = req.get('authorization') ?? '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ error: 'unauthorized' });
    }
    try {
      const claims = tokens.verify(token);
      req.user = { id: Number(claims.sub), email: claims.email };
      return next();
    } catch {
      return res.status(401).json({ error: 'unauthorized' });
    }
  };
}
