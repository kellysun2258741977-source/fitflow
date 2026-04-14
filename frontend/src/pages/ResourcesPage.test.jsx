import React, { act } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { createRoot } from 'react-dom/client';
import ResourcesPage from './ResourcesPage';

describe('ResourcesPage', () => {
  it('renders and switches tabs', async () => {
    vi.useFakeTimers();
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    await act(async () => {
      root.render(<ResourcesPage />);
    });

    expect(container.textContent).toContain('资源中心');

    const buttons = Array.from(container.querySelectorAll('button'));
    const nutrition = buttons.find((b) => b.textContent && b.textContent.includes('营养'));
    expect(nutrition).toBeTruthy();

    await act(async () => {
      nutrition.click();
    });

    expect(container.textContent).toContain('营养与食物');

    openSpy.mockRestore();
    await act(async () => {
      root.unmount();
    });
    container.remove();
    vi.clearAllTimers();
    vi.useRealTimers();
  });
});
