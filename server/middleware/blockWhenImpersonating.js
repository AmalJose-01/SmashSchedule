// Put AFTER `auth` on routes support staff must not touch while "inside" a
// club's account (payment wiring, account deletion, password changes).
const blockWhenImpersonating = (req, res, next) => {
  if (req.impersonatedBy) {
    return res.status(403).json({
      code: "BLOCKED_IN_SUPPORT_MODE",
      message: "This action isn't available in support mode. Ask the club admin to do it.",
    });
  }
  next();
};

module.exports = blockWhenImpersonating;
