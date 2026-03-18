import pytest
from playwright.async_api import async_playwright

from common.config import Config
from common.login_helper import LoginHelper


async def create_authenticated_page(playwright):
    helper = LoginHelper()
    token = helper.login(username='admin', password='admin123')
    browser = await playwright.chromium.launch(headless=True)
    context = await browser.new_context(
        storage_state={
            'cookies': [
                {
                    'name': 'Admin-Token',
                    'value': token,
                    'domain': 'localhost',
                    'path': '/',
                    'httpOnly': False,
                    'secure': False,
                    'sameSite': 'Lax',
                }
            ],
            'origins': [],
        }
    )
    page = await context.new_page()
    return browser, context, page


@pytest.mark.asyncio
async def test_annotation_save_success_e2e() -> None:
    async with async_playwright() as p:
        browser, context, page = await create_authenticated_page(p)
        await page.goto(Config.frontend_url + '/annotator?projectId=1')
        await page.wait_for_selector('[data-testid="annotation-save-btn"]')
        await page.click('[data-testid="annotation-save-btn"]')
        await page.wait_for_selector('text=已保存')
        await context.close()
        await browser.close()


@pytest.mark.asyncio
async def test_annotation_save_failed_e2e() -> None:
    async with async_playwright() as p:
        browser, context, page = await create_authenticated_page(p)
        await page.add_init_script(
            """
            const originSetItem = window.localStorage.setItem.bind(window.localStorage);
            window.localStorage.setItem = function(key, value) {
              if (key === 'annotation-draft-v1') {
                throw new Error('mock save failed');
              }
              return originSetItem(key, value);
            };
            """
        )
        await page.goto(Config.frontend_url + '/annotator?projectId=1')
        await page.wait_for_selector('[data-testid="annotation-save-btn"]')
        await page.click('[data-testid="annotation-save-btn"]')
        await page.wait_for_selector('text=保存失败')
        await context.close()
        await browser.close()


@pytest.mark.asyncio
async def test_annotation_exit_cancel_e2e() -> None:
    async with async_playwright() as p:
        browser, context, page = await create_authenticated_page(p)
        await page.goto(Config.frontend_url + '/annotator?projectId=1')
        await page.wait_for_selector('[data-testid="annotation-exit-btn"]')
        await page.click('[data-testid="annotation-exit-btn"]')
        await page.wait_for_selector('text=未保存的更改将丢失')
        await page.click('[data-testid="annotation-exit-cancel-btn"]')
        assert '/annotator' in page.url
        await context.close()
        await browser.close()


@pytest.mark.asyncio
async def test_annotation_exit_confirm_e2e() -> None:
    async with async_playwright() as p:
        browser, context, page = await create_authenticated_page(p)
        await page.goto(Config.frontend_url + '/annotator?projectId=1')
        await page.wait_for_selector('[data-testid="annotation-exit-btn"]')
        await page.click('[data-testid="annotation-exit-btn"]')
        await page.wait_for_selector('text=未保存的更改将丢失')
        await page.click('[data-testid="annotation-exit-confirm-btn"]')
        await page.wait_for_url('**/projects**')
        await context.close()
        await browser.close()
