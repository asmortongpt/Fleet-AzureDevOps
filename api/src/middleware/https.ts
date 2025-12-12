
export function httpsRedirect(req, res, next) {
  if (process.env.NODE_ENV === 'production') {
    if (req.header('x-forwarded-proto') !== 'https') {
      return res.redirect(301, `https://${req.header('host')}${req.url}`);
    }
  }
  next();
}

// In server.ts
app.use(httpsRedirect);
