import { test, expect, APIRequestContext } from '@playwright/test';

/**
 * End-to-end API flow for the Boards backend:
 *   1. Sign up a new user
 *   2. Log in as that user (token used for authenticated calls)
 *   3. Create a board
 *   4. Create lists in the board
 *   5. Delete a list
 *   6. Delete the board
 *   7. Delete the user (only the user's own token is allowed to do this)
 *
 * Tests run serially because each step depends on state (ids/tokens)
 * produced by the previous step.
 */

test.describe.serial('Board API flow', () => {
  // Unique email per run so re-running the suite doesn't collide with
  // a previous run's leftover user.
  const uniqueSuffix = Date.now();
  const email = `user_${uniqueSuffix}@abc.com`;
  const password = 'password';

  let token: string;
  let userId: number;
  let boardId: number;

  test('POST /api/signup - creates a new user', async ({ request }) => {
    const response = await request.post('/api/signup', {
      data: {
        email,
        password,
        welcomeEmail: false,
      },
    });

    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    // Some implementations return the token/user on signup itself.
    if (body.accessToken) token = body.accessToken;
    if (body.user?.id) userId = body.user.id;
    if (body.id) userId = body.id;
  });

  test('POST /api/login - authenticates and returns a token', async ({ request }) => {
    const response = await request.post('/api/login', {
      data: {
        email,
        password,
      },
    });

    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body.accessToken).toBeTruthy();
    token = body.accessToken;

    if (body.user?.id) userId = body.user.id;
    if (body.id) userId = body.id;
  });

  test('POST /api/login - rejects an incorrect password', async ({ request }) => {
    const response = await request.post('/api/login', {
      data: {
        email,
        password: 'wrong-password',
      },
    });

    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(response.status()).toBeLessThan(500);
  });

  test('POST /api/boards - creates a board', async ({ request }) => {
    const response = await request.post('/api/boards', {
      headers: authHeader(token),
      data: {
        name: 'Board x',
      },
    });

    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    boardId = body.id ?? body.board?.id;
    expect(boardId).toBeTruthy();
  });

  test('POST /api/lists - creates "List 3" in the board', async ({ request }) => {
    const response = await request.post('/api/lists', {
      headers: authHeader(token),
      data: {
        boardId,
        name: 'List 3',
        order: 0,
      },
    });

    expect(response.ok()).toBeTruthy();
  });

  test('POST /api/lists - creates "List 2" in the board (to be deleted next)', async ({ request }) => {
    const response = await request.post('/api/lists', {
      headers: authHeader(token),
      data: {
        boardId,
        name: 'List 2',
        order: 1,
      },
    });

    expect(response.ok()).toBeTruthy();
  });

  test('DELETE /api/lists - deletes "List 2" from the board', async ({ request }) => {
    const response = await request.delete('/api/lists', {
      headers: authHeader(token),
      data: {
        boardId,
        name: 'List 2',
      },
    });

    expect(response.ok()).toBeTruthy();
  });

  test('DELETE /api/boards/:id - deletes the board', async ({ request }) => {
    const response = await request.delete(`/api/boards/${boardId}`, {
      headers: authHeader(token),
    });

    expect(response.ok()).toBeTruthy();
  });

  test('DELETE /api/users/:id - rejects deletion without a matching bearer token', async ({ request }) => {
    const response = await request.delete(`/api/users/${userId}`, {
      headers: authHeader('not-a-real-token'),
    });

    expect(response.status()).toBeGreaterThanOrEqual(401);
    expect(response.status()).toBeLessThan(500);
  });

  test('DELETE /api/users/:id - deletes the user with their own token', async ({ request }) => {
    const response = await request.delete(`/api/users/${userId}`, {
      headers: authHeader(token),
    });

    expect(response.ok()).toBeTruthy();
  });
});

function authHeader(bearerToken: string) {
  return {
    Authorization: `Bearer ${bearerToken}`,
  };
}
