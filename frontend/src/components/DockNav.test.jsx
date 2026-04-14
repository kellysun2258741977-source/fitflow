import React from 'react';
import { describe, expect, it } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import DockNav from './DockNav';

describe('DockNav', () => {
  it('highlights active route', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/reports']}>
          <DockNav />
        </MemoryRouter>
      );
    });

    const current = container.querySelector('[aria-current="page"]');
    expect(current).toBeTruthy();
    expect(current.textContent).toContain('报表');

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });
});

