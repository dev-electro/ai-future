export default function handler(req, res) {
    // Vercel standard header for country code
    const country = req.headers["x-vercel-ip-country"] ||
        req.headers["cf-ipcountry"] ||
        req.headers["x-client-geo-location"] ||
        "US";

    res.status(200).json({ country: country.toUpperCase() });
}
