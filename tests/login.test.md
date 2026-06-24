---
name: User can log in
url: /auth/login
tags: [auth, smoke]
---

1. Fill the Email field with "${HANDRAISE_EMAIL}"
2. Fill the Password field with "${HANDRAISE_PASSWORD}"
3. Click the "Sign In" button
4. Expect the page URL to contain "chat"
5. Expect the "Ask anything" message input to be visible
