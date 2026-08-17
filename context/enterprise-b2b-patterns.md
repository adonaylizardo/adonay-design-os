# Enterprise B2B Design Patterns Reference

## Common User Types in Enterprise SaaS
- **Admin** — configures the system, rarely uses core flows, high-stakes actions
- **Power user** — daily heavy use, values speed and keyboard shortcuts
- **Casual user** — infrequent use, needs clear affordances and error recovery
- **Executive viewer** — reads dashboards, never inputs data, values clarity over density

## States That Always Get Missed
1. **Role-based empty state** — admin sees "no users yet, invite your team"; viewer sees "no data shared with you"
2. **Partial data state** — some records loaded, pagination in progress
3. **Stale data state** — cached data from N minutes ago, last-updated timestamp
4. **Multi-select state** — 0 selected vs 1 selected vs N selected all need distinct UI
5. **Bulk action confirmation** — "you're about to affect N records, confirm"
6. **Impersonation / view-as mode** — admin viewing as another user
7. **Trial vs paid state** — feature gating, upgrade prompts

## Common Edge Cases in Enterprise B2B
- User has multiple org memberships → which org context am I in?
- Data export in progress → what can I still do? Can I navigate away?
- Integration disconnected mid-flow → graceful degradation
- API rate limit hit → what does the UI show? Can user retry?
- Large dataset (10k+ rows) → does the UI still function?
- Internationalization → does layout break with longer strings?

## Analytics Events That Always Get Missed
- Feature first use (distinct from all subsequent uses)
- Error encountered + error type
- Empty state → first action taken
- Abandonment point in multi-step flows
- Help/tooltip triggered
- Export/share action (signals intent to show to others = high value signal)

## Business Assumptions to Always Surface
- "Users will find this feature without onboarding" → needs first-use state
- "Users understand the data model" → needs progressive disclosure
- "This flow will reduce support tickets" → needs error messages that are self-service
- "Power users will adopt keyboard shortcuts" → needs discoverability mechanism
