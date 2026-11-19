const express = require('express');

const router = express.Router();

/** Public site settings (requires resolveWebsite). Slug from X-Website-Slug. */
router.get('/site-settings', (req, res) => {
  try {
    const site = req.website;
    if (!site || !site._id) {
      return res.status(200).json({
        success: true,
        data: {
          siteSlug: '',
          adsStaticEnabled: false,
          adsManagedEnabled: false,
        },
      });
    }
    return res.status(200).json({
      success: true,
      data: {
        siteSlug: String(site.slug || ''),
        adsStaticEnabled: Boolean(site.adsStaticEnabled),
        adsManagedEnabled: Boolean(site.adsManagedEnabled),
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Failed to load site settings' });
  }
});

module.exports = router;
