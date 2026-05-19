const jwt = require('jsonwebtoken')

const authMiddleware = (req, res, next) => {
  console.log('\n--- [authMiddleware] Process Started ---')
  let token

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1]
      console.log('✅ STEP 1: Token found in header.')

      // Verify JWT
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      // console.log('✅ STEP 2: Decoded token:', decoded);

      // Attach user info from token
      req.user = {
        id: decoded.id,
        role: decoded.role, // ✅ use role from token
        email: decoded.email,
        company: decoded.company,
        branch: decoded.branch,
      }

      // Check role exists
      if (!req.user.role) {
        console.error(
          '❌ STEP 3 FAILED: Role is MISSING from the decoded token.',
        )
        return res.status(401).json({
          message: 'Not authorized, role information missing from token',
        })
      }

      console.log(
        '✅ STEP 3: User with role attached to request. Proceeding to controller...',
      )
      next() // continue
    } catch (error) {
      console.error('❌❌❌ CRITICAL CRASH in authMiddleware ❌❌❌:', error)
      return res.status(401).json({ message: 'Not authorized, token failed' })
    }
  }

  if (!token) {
    console.error('❌ No token found in the request header.')
    return res.status(401).json({ message: 'Not authorized, no token' })
  }
}

module.exports = authMiddleware
