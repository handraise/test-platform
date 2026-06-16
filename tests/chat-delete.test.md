---
name: User can delete a chat
url: /auth/login
tags: [chat]
---

1. Fill the Email field with "${HANDRAISE_EMAIL}"
2. Fill the Password field with "${HANDRAISE_PASSWORD}"
3. Click the "Sign In" button
4. Expect the page URL to contain "discovery"
5. Click the "Chat" button in the left navigation
6. Fill the chat prompt input with "List all of available feeds"
7. Click the "Send message" button
8. Expect the text "feeds" to be visible in the chat response
9. Open the options menu for the most recent chat by clicking the first "More options" button in the chat history
10. Click the "Delete" menu item
11. Expect the text "Are you sure you want to delete" to be visible
12. Click the "Yes, delete" button
13. Expect the "New chat" button to be visible
