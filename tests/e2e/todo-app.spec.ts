import { test , expect } from '@playwright/test';


// Test user credentials
const TEST_USER = {
  email: 'test@example.com',
  password: 'password123',
  name: 'Test User'
};

test.describe('Todo Application', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test.describe('Authentication', () => {
    test('should show login form when not authenticated', async ({ page }) => {
      await expect(page.getByLabel('Email')).toBeVisible();
      await expect(page.getByLabel('Password')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
    });

    test('should login successfully', async ({ page }) => {
      await page.getByLabel('Email').fill(TEST_USER.email);
      await page.getByLabel('Password').fill(TEST_USER.password);
      await page.getByRole('button', { name: 'Sign In' }).click();

      // Verify successful login
      await expect(page.getByText(`To-Do-List by ${TEST_USER.name}`)).toBeVisible();
      await expect(page.getByRole('button', { name: 'Sign Out' })).toBeVisible();
    });

    test('should logout successfully', async ({ page }) => {
      // Login first
      await page.getByLabel('Email').fill(TEST_USER.email);
      await page.getByLabel('Password').fill(TEST_USER.password);
      await page.getByRole('button', { name: 'Sign In' }).click();

      // Perform logout
      await page.getByRole('button', { name: 'Sign Out' }).click();

      // Verify logout
      await expect(page.getByLabel('Email')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
    });
  });

  test.describe('Task Management', () => {
    test.beforeEach(async ({ page }) => {
      // Login before each test
      await page.getByLabel('Email').fill(TEST_USER.email);
      await page.getByLabel('Password').fill(TEST_USER.password);
      await page.getByRole('button', { name: 'Sign In' }).click();
    });

    test('should add a new task', async ({ page }) => {
      const taskName = 'Test Task';
      
      // Fill task details
      await page.getByLabel('Task').fill(taskName);
      
      // Open calendar and select date
      await page.getByRole('button', { name: 'Pick a date' }).click();
      await page.getByRole('button', { name: String(new Date().getDate()) }).click();
      
      // Submit task
      await page.getByRole('button', { name: 'Enter' }).click();

      // Verify task was added
      await expect(page.getByRole('cell', { name: taskName })).toBeVisible();
    });

    test('should delete a task', async ({ page }) => {
      const taskName = 'Task to Delete';
      
      // Add a task first
      await page.getByLabel('Task').fill(taskName);
      await page.getByRole('button', { name: 'Pick a date' }).click();
      await page.getByRole('button', { name: String(new Date().getDate()) }).click();
      await page.getByRole('button', { name: 'Enter' }).click();

      // Get the delete button for the task and click it
      const row = page.getByRole('row', { name: new RegExp(taskName) });
      await row.getByRole('button', { name: 'Delete' }).click();

      // Handle the confirmation dialog
      page.on('dialog', dialog => dialog.accept());

      // Verify task was deleted
      await expect(page.getByRole('cell', { name: taskName })).not.toBeVisible();
    });

    test('should cancel task creation', async ({ page }) => {
      const taskName = 'Cancelled Task';
      
      // Fill task details
      await page.getByLabel('Task').fill(taskName);
      
      // Click cancel button
      await page.getByRole('button', { name: 'Cancel' }).click();

      // Verify form was cleared
      await expect(page.getByLabel('Task')).toHaveValue('');
      await expect(page.getByRole('button', { name: 'Pick a date' })).toBeVisible();
    });

    test('should toggle task checkbox', async ({ page }) => {
      const taskName = 'Task to Toggle';
      
      // Add a task first
      await page.getByLabel('Task').fill(taskName);
      await page.getByRole('button', { name: 'Pick a date' }).click();
      await page.getByRole('button', { name: String(new Date().getDate()) }).click();
      await page.getByRole('button', { name: 'Enter' }).click();

      // Find and click the checkbox
      const checkbox = page.getByRole('checkbox').first();
      await checkbox.click();
      
      // Verify checkbox state
      await expect(checkbox).toBeChecked();
    });

    test('should validate required fields', async ({ page }) => {
      // Try to submit without task name
      await page.getByRole('button', { name: 'Enter' }).click();
      
      // Verify task wasn't added
      await expect(page.getByRole('table')).not.toContainText('undefined');
      
      // Try to submit without date
      await page.getByLabel('Task').fill('Task without date');
      await page.getByRole('button', { name: 'Enter' }).click();
      
      // Verify task wasn't added
      await expect(page.getByRole('cell', { name: 'Task without date' })).not.toBeVisible();
    });
  });
});

