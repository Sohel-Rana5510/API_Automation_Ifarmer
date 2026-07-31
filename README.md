# Board API Automation (Playwright)

Playwright API test project that automates the Boards backend endpoints:

- `POST /api/signup`
- `POST /login`
- `POST /api/boards`
- `POST /api/lists`
- `DELETE /api/lists`
- `DELETE /api/boards/:id`
- `DELETE /api/users/:id`

## Playwright HTML Report 
<img width="1842" height="1029" alt="image" src="https://github.com/user-attachments/assets/3e0834ea-8a96-4654-9f7a-2ba1d2108f38" />


Tests run as one serial flow (`tests/api.spec.ts`) since each step depends on
data (tokens, board id) produced by the previous step: sign up → log in →
create board → create lists → delete a list → delete the board → delete the
user. A couple of negative checks (wrong password, mismatched token) are
included too.

## Setup

```bash
npm install
npx playwright install --with-deps chromium   # only needed for browser tests; harmless for API-only too
```

## Configure the target URL

Ports 3000 and 3001 are noted as already in use, so this project does **not**
hardcode them. Set the base URL via environment variable or `.env`:

```bash
cp .env.example .env
# edit .env and set BASE_URL to wherever your API is actually running, e.g.
# BASE_URL=http://localhost:3002
```

Or pass it inline for a single run:

```bash
BASE_URL=http://localhost:4000 npx playwright test
```

## Run the tests

```bash
npm test
```

## View the HTML report

An HTML report is generated automatically after every run in
`playwright-report/`. Open it with:

```bash
npm run report
```

or open `playwright-report/index.html` directly in a browser.

## Notes / assumptions

- The login endpoint is assumed to live at `/login` (not `/api/login`), per
  the endpoint list provided.
- `DELETE /api/lists` is called with a JSON body (`{ boardId, name }`)
  rather than a path/query parameter, matching the given spec.
- User id / token extraction from the signup and login responses is done
  defensively (`body.token`, `body.user?.id`, `body.id`) since the exact
  response shape wasn't specified — adjust the extraction in
  `tests/api.spec.ts` if your API's response shape differs.
- Each run generates a unique email (`user_<timestamp>@abc.com`) so the
  suite can be re-run without colliding with a previously created user.
